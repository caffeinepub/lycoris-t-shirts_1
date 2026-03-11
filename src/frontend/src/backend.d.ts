// Auto-generated stub — replaced by bindgen in full build pipeline

export type BackendProduct = {
  id: bigint;
  name: string;
  description: string;
  price: bigint;
  sizes: string[];
  sizePricesJson: string;
  imageUrl: string;
  images: string[];
  category: string;
  inStock: boolean;
  stockLimit: [bigint] | [];
};

export type BackendOrderItem = {
  productId: bigint;
  productName: string;
  size: string;
  quantity: bigint;
  priceEach: bigint;
};

export type BackendOrder = {
  id: string;
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
};

export type BackendHeroConfig = {
  heroBadgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroBgImage: string;
  logoImage: string;
};

export type backendInterface = {
  // Products
  getAllProducts: () => Promise<BackendProduct[]>;
  getProduct: (id: bigint) => Promise<[BackendProduct] | []>;
  addProduct: (
    name: string,
    description: string,
    price: bigint,
    sizes: string[],
    sizePricesJson: string,
    imageUrl: string,
    images: string[],
    category: string,
    inStock: boolean,
    stockLimit: [bigint] | [],
  ) => Promise<bigint>;
  updateProduct: (
    id: bigint,
    name: string,
    description: string,
    price: bigint,
    sizes: string[],
    sizePricesJson: string,
    imageUrl: string,
    images: string[],
    category: string,
    inStock: boolean,
    stockLimit: [bigint] | [],
  ) => Promise<boolean>;
  deleteProduct: (id: bigint) => Promise<boolean>;
  // Orders
  placeOrder: (
    id: string,
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
  ) => Promise<string>;
  getAllOrders: () => Promise<BackendOrder[]>;
  updateOrderStatus: (id: string, newStatus: string) => Promise<boolean>;
  cancelOrder: (id: string, reason: string) => Promise<boolean>;
  requestReturn: (id: string, reason: string, description: string) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  clearAllOrders: () => Promise<void>;
  // HeroConfig
  getHeroConfig: () => Promise<BackendHeroConfig>;
  setHeroConfig: (
    heroBadgeText: string,
    heroTitle: string,
    heroSubtitle: string,
    heroCtaLabel: string,
    heroBgImage: string,
    logoImage: string,
  ) => Promise<void>;
};

export type CreateActorOptions = {
  agentOptions?: Record<string, unknown>;
  agent?: unknown;
  processError?: (e: unknown) => never;
};

export declare class ExternalBlob {
  static fromURL(url: string): ExternalBlob;
  getBytes(): Promise<Uint8Array>;
  onProgress?: (progress: number) => void;
}

export declare function createActor(
  canisterId: string,
  uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): Promise<backendInterface>;
