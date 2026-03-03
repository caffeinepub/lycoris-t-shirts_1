import type { Product } from "@/data/products";
import { useCallback, useEffect, useState } from "react";
import { useActor } from "./useActor";

// ── Backend shape (as returned by Motoko) ──────────────────────────────────
interface BackendProduct {
  id: bigint;
  name: string;
  description: string;
  price: bigint;
  sizes: string[];
  imageUrl: string;
  category: string;
  inStock: boolean;
}

// ── Encoding helpers ────────────────────────────────────────────────────────

/**
 * Encode a frontend Product into backend fields.
 *
 * description field: `<actual description>||SP||[{"size":"S","price":999},...]`
 * imageUrl field:    JSON `{"main":"url","all":["url1","url2"]}`
 *                   (falls back to plain URL if only one image)
 */
function encodeForBackend(
  description: string,
  sizePrices: Record<string, number>,
  sizes: string[],
  images: string[],
  imageUrl: string,
): {
  encodedDescription: string;
  encodedImageUrl: string;
  backendPrice: bigint;
  backendSizes: string[];
} {
  // Encode size prices into description suffix
  const spEntries = sizes.map((s) => ({ size: s, price: sizePrices[s] ?? 0 }));
  const encodedDescription = `${description}||SP||${JSON.stringify(spEntries)}`;

  // Encode images
  const allImages = images.length > 0 ? images : imageUrl ? [imageUrl] : [];
  const mainImage = allImages[0] || imageUrl || "";
  const encodedImageUrl =
    allImages.length > 1
      ? JSON.stringify({ main: mainImage, all: allImages })
      : mainImage;

  // Base price = first size price
  const backendPrice = BigInt(spEntries[0]?.price ?? 0);

  return {
    encodedDescription,
    encodedImageUrl,
    backendPrice,
    backendSizes: sizes,
  };
}

/**
 * Parse backend product into frontend Product type.
 */
function decodeFromBackend(bp: BackendProduct): Product {
  const id = Number(bp.id);

  // Parse sizePrices from description suffix
  let description = bp.description;
  const sizePrices: Record<string, number> = {};

  const spIdx = bp.description.indexOf("||SP||");
  if (spIdx !== -1) {
    description = bp.description.slice(0, spIdx);
    try {
      const spArr = JSON.parse(bp.description.slice(spIdx + 6)) as {
        size: string;
        price: number;
      }[];
      for (const entry of spArr) {
        sizePrices[entry.size] = entry.price;
      }
    } catch {
      // Ignore parse errors — fall back to uniform price
    }
  }

  // If no sizePrices parsed, create from sizes array with base price
  if (Object.keys(sizePrices).length === 0) {
    const basePrice = Number(bp.price);
    for (const size of bp.sizes) {
      sizePrices[size] = basePrice;
    }
  }

  // Parse imageUrl
  let imageUrl = bp.imageUrl;
  let images: string[] = [];
  try {
    const parsed = JSON.parse(bp.imageUrl) as {
      main: string;
      all: string[];
    };
    if (parsed?.main) {
      imageUrl = parsed.main;
      images = parsed.all || [parsed.main];
    }
  } catch {
    // Plain URL string — use as-is
    imageUrl = bp.imageUrl;
    images = bp.imageUrl ? [bp.imageUrl] : [];
  }

  const basePrice = Number(bp.price);
  const effectivePrice =
    Object.keys(sizePrices).length > 0
      ? Object.values(sizePrices)[0]
      : basePrice;

  return {
    id,
    name: bp.name,
    description,
    price: effectivePrice,
    sizes: bp.sizes,
    sizePrices: Object.keys(sizePrices).length > 0 ? sizePrices : undefined,
    imageUrl,
    images: images.length > 0 ? images : undefined,
    category: bp.category,
    inStock: bp.inStock,
  };
}

// ── Hook interface ──────────────────────────────────────────────────────────
interface AddProductData {
  name: string;
  description: string;
  category: string;
  sizes: string[];
  sizePrices: Record<string, number>;
  images: string[];
  imageUrl: string;
  inStock: boolean;
}

interface UpdateProductData extends AddProductData {
  // same fields
}

interface UseBackendProductsReturn {
  products: Product[];
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  addProduct: (data: AddProductData) => Promise<bigint>;
  updateProduct: (id: number, data: UpdateProductData) => Promise<boolean>;
  deleteProduct: (id: number) => Promise<boolean>;
}

// ── useBackendProducts hook ─────────────────────────────────────────────────
export function useBackendProducts(): UseBackendProductsReturn {
  const { actor, isFetching } = useActor();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (await (actor as any).getAllProducts()) as BackendProduct[];
      setProducts(raw.map(decodeFromBackend));
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  // Load on mount and when actor becomes available
  useEffect(() => {
    if (actor && !isFetching) {
      refreshProducts();
    }
  }, [actor, isFetching, refreshProducts]);

  const addProduct = useCallback(
    async (data: AddProductData): Promise<bigint> => {
      if (!actor) throw new Error("Actor not available");

      const {
        encodedDescription,
        encodedImageUrl,
        backendPrice,
        backendSizes,
      } = encodeForBackend(
        data.description,
        data.sizePrices,
        data.sizes,
        data.images,
        data.imageUrl,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newId = (await (actor as any).addProduct(
        data.name,
        encodedDescription,
        backendPrice,
        backendSizes,
        encodedImageUrl,
        data.category,
        data.inStock,
      )) as bigint;

      // Wait for IC replicas to propagate the update before querying
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await refreshProducts();
      return newId;
    },
    [actor, refreshProducts],
  );

  const updateProduct = useCallback(
    async (id: number, data: UpdateProductData): Promise<boolean> => {
      if (!actor) throw new Error("Actor not available");

      const {
        encodedDescription,
        encodedImageUrl,
        backendPrice,
        backendSizes,
      } = encodeForBackend(
        data.description,
        data.sizePrices,
        data.sizes,
        data.images,
        data.imageUrl,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await (actor as any).updateProduct(
        BigInt(id),
        data.name,
        encodedDescription,
        backendPrice,
        backendSizes,
        encodedImageUrl,
        data.category,
        data.inStock,
      )) as boolean;

      // Wait for IC replicas to propagate the update before querying
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await refreshProducts();
      return result;
    },
    [actor, refreshProducts],
  );

  const deleteProduct = useCallback(
    async (id: number): Promise<boolean> => {
      if (!actor) throw new Error("Actor not available");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await (actor as any).deleteProduct(
        BigInt(id),
      )) as boolean;

      // Wait for IC replicas to propagate the update before querying
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await refreshProducts();
      return result;
    },
    [actor, refreshProducts],
  );

  return {
    products,
    loading,
    isFetching,
    error,
    refreshProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
