import type { Product } from "@/data/products";
import { type ReactNode, createContext, useContext, useState } from "react";

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
  effectivePrice: number; // price at time of adding to cart (size-specific)
}

interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (product: Product, size: string, effectivePrice?: number) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (
    product: Product,
    size: string,
    effectivePrice?: number,
  ) => {
    const resolvedPrice =
      effectivePrice ?? product.sizePrices?.[size] ?? product.price;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size,
      );
      if (existingIndex >= 0) {
        return prev.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        { product, size, quantity: 1, effectivePrice: resolvedPrice },
      ];
    });
  };

  const removeFromCart = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(index);
      return;
    }
    setCartItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item)),
    );
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.effectivePrice * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
