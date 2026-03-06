import { useActor } from "./useActor";

/**
 * Typed wrapper around useActor that provides a fully-typed backend actor.
 * Since backend.d.ts only contains the base auth interface, we cast to the
 * extended interface that the rewritten Motoko canister actually exposes.
 */

export interface BackendOrderItem {
  productId: bigint;
  productName: string;
  size: string;
  quantity: bigint;
  priceEach: bigint;
}

export interface BackendOrder {
  orderId: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  city: string;
  state: string;
  pincode: string;
  items: BackendOrderItem[];
  totalPrice: bigint;
  paymentMethod: string;
  status: string;
  timestamp: bigint;
  cancellationReason: string;
  returnReason: string;
  returnDescription: string;
}

export interface BackendProduct {
  id: bigint;
  name: string;
  description: string;
  category: string;
  sizes: string[];
  sizePricesKeys: string[];
  sizePricesVals: bigint[];
  images: string[];
  inStock: boolean;
  stockLimit: [] | [bigint];
}

export interface BackendStorefrontConfig {
  heroBadgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroBgImage: string;
  logoImage: string;
}

export interface ExtendedBackendInterface {
  _initializeAccessControlWithSecret: (secret: string) => Promise<void>;

  // Products
  getAllProducts: () => Promise<BackendProduct[]>;
  getProduct: (id: bigint) => Promise<[] | [BackendProduct]>;
  addProduct: (
    name: string,
    description: string,
    category: string,
    sizes: string[],
    sizePricesKeys: string[],
    sizePricesVals: bigint[],
    images: string[],
    inStock: boolean,
    stockLimit: [] | [bigint],
  ) => Promise<bigint>;
  updateProduct: (
    id: bigint,
    name: string,
    description: string,
    category: string,
    sizes: string[],
    sizePricesKeys: string[],
    sizePricesVals: bigint[],
    images: string[],
    inStock: boolean,
    stockLimit: [] | [bigint],
  ) => Promise<boolean>;
  deleteProduct: (id: bigint) => Promise<boolean>;

  // Orders
  placeOrder: (
    orderId: string,
    customerName: string,
    customerMobile: string,
    deliveryAddress: string,
    city: string,
    state: string,
    pincode: string,
    items: BackendOrderItem[],
    totalPrice: bigint,
    paymentMethod: string,
    timestamp: bigint,
  ) => Promise<boolean>;
  getAllOrders: () => Promise<BackendOrder[]>;
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>;
  cancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  requestReturn: (
    orderId: string,
    reason: string,
    description: string,
  ) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;
  clearAllOrders: () => Promise<void>;

  // Storefront
  getStorefrontConfig: () => Promise<BackendStorefrontConfig>;
  updateStorefrontConfig: (
    heroBadgeText: string,
    heroTitle: string,
    heroSubtitle: string,
    heroCtaLabel: string,
    heroBgImage: string,
    logoImage: string,
  ) => Promise<void>;
}

export function useBackend() {
  const { actor, isFetching } = useActor();
  return {
    actor: actor as ExtendedBackendInterface | null,
    isFetching,
    isReady: !!actor && !isFetching,
  };
}
