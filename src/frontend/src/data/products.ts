export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // cents
  sizes: string[];
  imageUrl: string;
  category: string;
  inStock: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Classic Black Tee",
    description:
      "A timeless black t-shirt crafted from premium 100% cotton. Comfortable for everyday wear.",
    price: 2999,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    imageUrl: "/assets/generated/tshirt-black.dim_600x600.jpg",
    category: "Basics",
    inStock: true,
  },
  {
    id: 2,
    name: "Lycoris Bloom Graphic Tee",
    description:
      "Featuring a hand-drawn lycoris flower print on a soft white background. A statement piece.",
    price: 3499,
    sizes: ["S", "M", "L", "XL"],
    imageUrl: "/assets/generated/tshirt-lycoris.dim_600x600.jpg",
    category: "Graphic",
    inStock: true,
  },
  {
    id: 3,
    name: "Vintage Washed Crew",
    description:
      "Stone-washed for a lived-in feel. Relaxed fit with a slightly oversized silhouette.",
    price: 3999,
    sizes: ["XS", "S", "M", "L", "XL"],
    imageUrl: "/assets/generated/tshirt-vintage.dim_600x600.jpg",
    category: "Vintage",
    inStock: true,
  },
  {
    id: 4,
    name: "Midnight Navy Essential",
    description:
      "A deep navy essential tee with a clean minimal look. Made from soft jersey fabric.",
    price: 2799,
    sizes: ["S", "M", "L", "XL", "XXL"],
    imageUrl: "/assets/generated/tshirt-navy.dim_600x600.jpg",
    category: "Basics",
    inStock: true,
  },
];

export const CATEGORIES = [
  "All",
  ...Array.from(new Set(PRODUCTS.map((p) => p.category))),
];

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
