// Shared backend type definitions used across the app.
// These mirror the types in backend.d.ts but are importable at runtime.

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
