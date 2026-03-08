/**
 * ProductsContext
 *
 * Data strategy:
 * - Single localStorage key `lycoris_products_v2` stores the FULL product list as JSON.
 * - On mount, static PRODUCTS are shown immediately (instant, no flicker).
 * - When the backend actor becomes available, getAllProducts() is called once.
 *   - If localStorage already has a product list, we keep it (user has customized products).
 *   - If localStorage is empty (first ever visit), we seed from backend products.
 * - addProduct / updateProduct / deleteProduct: update localStorage + React state.
 *
 * NOTE: Full cross-device sync (admin changes on Device A appear on Device B)
 * requires the backend to be rebuilt with open (unauthenticated) mutations.
 * The current backend blocks addProduct/updateProduct/deleteProduct with auth checks.
 * Until that's fixed, all mutations are stored in this device's localStorage only.
 */

import type { Product } from "@/data/products";
import { PRODUCTS } from "@/data/products";
import { useActor } from "@/hooks/useActor";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Single localStorage key — stores the full product list
const LS_KEY = "lycoris_products_v2";

// Default image fallback map by seed product id
const DEFAULT_IMAGE_MAP: Record<number, string> = {
  1: "/assets/generated/tshirt-black.dim_600x600.jpg",
  2: "/assets/generated/tshirt-lycoris.dim_600x600.jpg",
  3: "/assets/generated/tshirt-vintage.dim_600x600.jpg",
  4: "/assets/generated/tshirt-navy.dim_600x600.jpg",
};

function getDefaultImage(id: number): string {
  return (
    DEFAULT_IMAGE_MAP[id] ?? "/assets/generated/tshirt-black.dim_600x600.jpg"
  );
}

// Old backend Product schema (what getAllProducts() actually returns)
interface OldBackendProduct {
  id: bigint;
  name: string;
  description: string;
  price: bigint;
  sizes: string[];
  imageUrl: string;
  category: string;
  inStock: boolean;
}

// Old backend interface — only getAllProducts is safe to call (mutations are auth-blocked)
interface OldBackendInterface {
  getAllProducts: () => Promise<OldBackendProduct[]>;
}

// ─── localStorage helpers ──────────────────────────────────────────────────

function loadLocalProducts(): Product[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : null;
  } catch {
    return null;
  }
}

function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(products));
  } catch {
    // Storage quota exceeded or private browsing restriction
    console.warn("[ProductsContext] Could not save products to localStorage");
  }
}

// ─── Backend → frontend type mapping ─────────────────────────────────────

function mapBackendProduct(bp: OldBackendProduct): Product {
  const id = Number(bp.id);
  const price = Number(bp.price);
  const imageUrl = bp.imageUrl || getDefaultImage(id);

  // Build sizePrices: same price for all sizes
  const sizePrices: Record<string, number> = {};
  for (const s of bp.sizes) {
    sizePrices[s] = price;
  }

  return {
    id,
    name: bp.name,
    description: bp.description,
    category: bp.category,
    sizes: bp.sizes,
    sizePrices: Object.keys(sizePrices).length > 0 ? sizePrices : undefined,
    price,
    imageUrl,
    images: bp.imageUrl ? [bp.imageUrl] : undefined,
    inStock: bp.inStock,
    stockLimit: undefined,
  };
}

// ─── ID generation for locally-added products ─────────────────────────────

/** New product IDs always start at 1000 to avoid collisions with backend seed IDs */
function nextLocalId(existingProducts: Product[]): number {
  const localMax = existingProducts
    .filter((p) => p.id >= 1000)
    .reduce((max, p) => Math.max(max, p.id), 999);
  return localMax + 1;
}

// ─── Context definition ────────────────────────────────────────────────────

interface ProductsContextValue {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching } = useActor();
  const [products, setProducts] = useState<Product[]>(() => {
    // Initialise synchronously from localStorage so the UI never flickers
    return loadLocalProducts() ?? PRODUCTS;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Guard: only seed from backend once
  const backendSeeded = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || backendSeeded.current) return;
    backendSeeded.current = true;

    // Only seed from backend when localStorage is empty (first ever visit)
    const stored = loadLocalProducts();
    if (stored !== null) {
      // User already has a product list — do not overwrite with backend data
      return;
    }

    // First-ever visit: fetch backend seed products and store them
    const oldActor = actor as unknown as OldBackendInterface;
    oldActor
      .getAllProducts()
      .then((backendProducts) => {
        const mapped = backendProducts.map(mapBackendProduct);
        const seeded = mapped.length > 0 ? mapped : PRODUCTS;
        saveLocalProducts(seeded);
        setProducts(seeded);
      })
      .catch((err) => {
        console.warn(
          "[ProductsContext] Backend fetch failed, using static seed:",
          err,
        );
        // Seed localStorage with static products so next load is fast
        saveLocalProducts(PRODUCTS);
        setProducts(PRODUCTS);
      });
  }, [actor, isFetching]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const addProduct = useCallback(
    async (productData: Omit<Product, "id">): Promise<Product> => {
      const id = nextLocalId(products);
      const imageUrl =
        productData.images?.[0] || productData.imageUrl || getDefaultImage(id);

      const newProduct: Product = { ...productData, id, imageUrl };

      setProducts((prev) => {
        const updated = [newProduct, ...prev];
        saveLocalProducts(updated);
        return updated;
      });

      return newProduct;
    },
    [products],
  );

  const updateProduct = useCallback(async (product: Product): Promise<void> => {
    const imageUrl =
      product.images?.[0] || product.imageUrl || getDefaultImage(product.id);
    const updated = { ...product, imageUrl };

    setProducts((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      saveLocalProducts(next);
      return next;
    });
  }, []);

  const deleteProduct = useCallback(async (id: number): Promise<void> => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveLocalProducts(next);
      return next;
    });
  }, []);

  const refreshProducts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const stored = loadLocalProducts();
    if (stored !== null) {
      setProducts(stored);
    }
    setIsLoading(false);
  }, []);

  return (
    <ProductsContext.Provider
      value={{
        products,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
