import type { Product } from "@/data/products";
import { useActor } from "@/hooks/useActor";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { BackendProduct } from "@/types/backend-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const DEFAULT_IMAGE = "/assets/generated/tshirt-black.dim_600x600.jpg";

const DEFAULT_IMAGE_MAP: Record<number, string> = {
  1: "/assets/generated/tshirt-black.dim_600x600.jpg",
  2: "/assets/generated/tshirt-lycoris.dim_600x600.jpg",
  3: "/assets/generated/tshirt-vintage.dim_600x600.jpg",
  4: "/assets/generated/tshirt-navy.dim_600x600.jpg",
};

function getDefaultImage(id: number): string {
  return DEFAULT_IMAGE_MAP[id] ?? DEFAULT_IMAGE;
}

function safeImageUrl(url: string): string {
  if (!url || url.startsWith("data:")) return DEFAULT_IMAGE;
  return url;
}

function safeImages(uploaded: string[], fallback: string): string[] {
  const safe = uploaded.filter((u) => !u.startsWith("data:"));
  return safe.length > 0 ? safe : [fallback];
}

function mapBackendProduct(bp: BackendProduct): Product {
  const id = Number(bp.id);
  const price = Number(bp.price);
  const imageUrl =
    bp.imageUrl && bp.imageUrl !== "" ? bp.imageUrl : getDefaultImage(id);
  const images = bp.images && bp.images.length > 0 ? bp.images : undefined;
  let sizePrices: Record<string, number> | undefined;
  try {
    if (bp.sizePricesJson && bp.sizePricesJson !== "{}") {
      const parsed = JSON.parse(bp.sizePricesJson) as Record<string, number>;
      if (Object.keys(parsed).length > 0) sizePrices = parsed;
    }
  } catch {
    /* ignore */
  }
  const stockLimit =
    bp.stockLimit.length > 0 ? Number(bp.stockLimit[0]) : undefined;
  return {
    id,
    name: bp.name,
    description: bp.description,
    price,
    sizes: bp.sizes,
    sizePrices,
    imageUrl,
    images,
    category: bp.category,
    inStock: bp.inStock,
    stockLimit,
  };
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
  const { uploadImages } = useImageUpload();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!actor) return;
    try {
      setIsLoading(true);
      const backendProducts = await (
        actor as unknown as { getAllProducts: () => Promise<BackendProduct[]> }
      ).getAllProducts();
      const mapped = backendProducts.map(mapBackendProduct);
      setProducts(mapped);
    } catch (err) {
      console.warn("[ProductsContext] Backend fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    fetchProducts();
  }, [actor, isFetching, fetchProducts]);

  const addProduct = useCallback(
    async (productData: Omit<Product, "id">): Promise<Product> => {
      if (!actor) throw new Error("Backend not ready");

      // Upload any base64 images to blob storage first
      const rawImages = productData.images ?? [];
      const uploadedImages = await uploadImages(rawImages);
      const imageUrl = safeImageUrl(
        uploadedImages[0] || productData.imageUrl || "",
      );
      const finalImages = safeImages(uploadedImages, imageUrl);

      const sizePricesJson = productData.sizePrices
        ? JSON.stringify(productData.sizePrices)
        : "{}";
      const price = BigInt(Math.round(productData.price));
      const stockLimit: [bigint] | [] =
        productData.stockLimit != null ? [BigInt(productData.stockLimit)] : [];

      const backendActor = actor as unknown as {
        addProduct: (
          name: string,
          desc: string,
          price: bigint,
          sizes: string[],
          sizePricesJson: string,
          imageUrl: string,
          images: string[],
          category: string,
          inStock: boolean,
          stockLimit: [bigint] | [],
        ) => Promise<bigint>;
        getAllProducts: () => Promise<BackendProduct[]>;
      };

      const newId = await backendActor.addProduct(
        productData.name,
        productData.description,
        price,
        productData.sizes,
        sizePricesJson,
        imageUrl,
        finalImages,
        productData.category,
        productData.inStock,
        stockLimit,
      );

      const newProduct: Product = {
        ...productData,
        id: Number(newId),
        imageUrl,
        images: finalImages,
      };
      await fetchProducts();
      return newProduct;
    },
    [actor, fetchProducts, uploadImages],
  );

  const updateProduct = useCallback(
    async (product: Product): Promise<void> => {
      if (!actor) throw new Error("Backend not ready");

      // Upload any base64 images to blob storage first
      const rawImages = product.images ?? [];
      const uploadedImages = await uploadImages(rawImages);
      const imageUrl = safeImageUrl(
        uploadedImages[0] || product.imageUrl || "",
      );
      const finalImages = safeImages(uploadedImages, imageUrl);

      const sizePricesJson = product.sizePrices
        ? JSON.stringify(product.sizePrices)
        : "{}";
      const price = BigInt(Math.round(product.price));
      const stockLimit: [bigint] | [] =
        product.stockLimit != null ? [BigInt(product.stockLimit)] : [];

      const backendActor = actor as unknown as {
        updateProduct: (
          id: bigint,
          name: string,
          desc: string,
          price: bigint,
          sizes: string[],
          sizePricesJson: string,
          imageUrl: string,
          images: string[],
          category: string,
          inStock: boolean,
          stockLimit: [bigint] | [],
        ) => Promise<boolean>;
      };

      await backendActor.updateProduct(
        BigInt(product.id),
        product.name,
        product.description,
        price,
        product.sizes,
        sizePricesJson,
        imageUrl,
        finalImages,
        product.category,
        product.inStock,
        stockLimit,
      );
      await fetchProducts();
    },
    [actor, fetchProducts, uploadImages],
  );

  const deleteProduct = useCallback(
    async (id: number): Promise<void> => {
      if (!actor) throw new Error("Backend not ready");
      const backendActor = actor as unknown as {
        deleteProduct: (id: bigint) => Promise<boolean>;
      };
      await backendActor.deleteProduct(BigInt(id));
      await fetchProducts();
    },
    [actor, fetchProducts],
  );

  const refreshProducts = useCallback(async (): Promise<void> => {
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
