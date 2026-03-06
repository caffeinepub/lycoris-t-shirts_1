import type { Product } from "@/data/products";
import { PRODUCTS } from "@/data/products";
import { useActor } from "@/hooks/useActor";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// localStorage keys
const LS_PRODUCTS = "lycoris_products";
const LS_DELETED = "lycoris_products_deleted";

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

// Old backend interface — only getAllProducts is safe to call
interface OldBackendInterface {
  getAllProducts: () => Promise<OldBackendProduct[]>;
}

function loadLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LS_PRODUCTS);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

function saveLocalProducts(products: Product[]): void {
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
}

function loadDeletedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(LS_DELETED);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveDeletedIds(ids: Set<number>): void {
  localStorage.setItem(LS_DELETED, JSON.stringify(Array.from(ids)));
}

/** Map old backend product to frontend Product */
function mapOldBackendProduct(bp: OldBackendProduct): Product {
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

/** Generate next ID for locally-added products (always > 1000 to avoid collisions) */
function nextLocalId(existingProducts: Product[]): number {
  const localMax = existingProducts
    .filter((p) => p.id >= 1000)
    .reduce((max, p) => Math.max(max, p.id), 999);
  return localMax + 1;
}

interface ProductsContextValue {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching } = useActor();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Track whether we already attempted to load from backend
  const [backendLoaded, setBackendLoaded] = useState(false);

  const buildMergedProducts = useCallback(
    (seededProducts: Product[]): Product[] => {
      const deletedIds = loadDeletedIds();
      const localProducts = loadLocalProducts();

      // Start with seeded products (from backend or static fallback), filter deleted
      const filteredSeeded = seededProducts.filter(
        (p) => !deletedIds.has(p.id),
      );

      // Merge: local products override seeded ones by id, then append new ones
      const seededById = new Map(filteredSeeded.map((p) => [p.id, p]));

      // Apply local overrides
      for (const lp of localProducts) {
        seededById.set(lp.id, lp);
      }

      // Rebuild array: seeded (with overrides) first, then purely new local ones
      const seededIds = new Set(filteredSeeded.map((p) => p.id));
      const newLocalOnly = localProducts.filter((lp) => !seededIds.has(lp.id));

      return [
        ...Array.from(seededById.values()).filter((p) => seededIds.has(p.id)),
        ...newLocalOnly,
      ];
    },
    [],
  );

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    let seededProducts: Product[] = [];

    // Try to fetch from backend
    if (actor && !isFetching) {
      try {
        const oldActor = actor as unknown as OldBackendInterface;
        const backendProducts = await oldActor.getAllProducts();
        seededProducts = backendProducts.map(mapOldBackendProduct);
      } catch (err) {
        console.warn(
          "[ProductsContext] Could not fetch from backend, using static fallback:",
          err,
        );
        // Fall back to static products
        seededProducts = PRODUCTS;
      }
    } else {
      // Actor not ready — use static fallback
      seededProducts = PRODUCTS;
    }

    const merged = buildMergedProducts(seededProducts);
    setProducts(merged);
    setIsLoading(false);
    setBackendLoaded(true);
  }, [actor, isFetching, buildMergedProducts]);

  // Load on mount with static products immediately, then refresh when actor is ready
  useEffect(() => {
    if (!backendLoaded) {
      // Show static products immediately
      const merged = buildMergedProducts(PRODUCTS);
      setProducts(merged);
      setIsLoading(false);
    }
  }, [backendLoaded, buildMergedProducts]);

  useEffect(() => {
    if (actor && !isFetching) {
      fetchProducts();
    }
  }, [actor, isFetching, fetchProducts]);

  const addProduct = useCallback(
    async (productData: Omit<Product, "id">): Promise<Product> => {
      const allProducts = [...products, ...loadLocalProducts()];
      const id = nextLocalId(allProducts);
      const imageUrl =
        productData.images?.[0] || productData.imageUrl || getDefaultImage(id);

      const newProduct: Product = {
        ...productData,
        id,
        imageUrl,
      };

      // Save to localStorage
      const localProducts = loadLocalProducts();
      saveLocalProducts([newProduct, ...localProducts]);

      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    },
    [products],
  );

  const updateProduct = useCallback(async (product: Product): Promise<void> => {
    const imageUrl =
      product.images?.[0] || product.imageUrl || getDefaultImage(product.id);
    const updated = { ...product, imageUrl };

    // Save to localStorage (either add to local list or update existing)
    const localProducts = loadLocalProducts();
    const existingIdx = localProducts.findIndex((p) => p.id === product.id);
    if (existingIdx >= 0) {
      localProducts[existingIdx] = updated;
    } else {
      localProducts.push(updated);
    }
    saveLocalProducts(localProducts);

    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
  }, []);

  const deleteProduct = useCallback(async (id: number): Promise<void> => {
    // Add to deleted set (handles seeded products)
    const deletedIds = loadDeletedIds();
    deletedIds.add(id);
    saveDeletedIds(deletedIds);

    // Also remove from local products list if present
    const localProducts = loadLocalProducts().filter((p) => p.id !== id);
    saveLocalProducts(localProducts);

    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

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

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
