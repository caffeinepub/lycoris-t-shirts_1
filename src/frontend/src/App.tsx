import { CartSheet } from "@/components/CartSheet";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/CartContext";
import { HeroConfigProvider } from "@/context/HeroConfigContext";
import { OrdersProvider } from "@/context/OrdersContext";
import type { Product } from "@/data/products";
import { AdminPage } from "@/pages/AdminPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { HomePage } from "@/pages/HomePage";
import { MyOrdersPage } from "@/pages/MyOrdersPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { ShopPage } from "@/pages/ShopPage";
import { useState } from "react";

type View = "home" | "shop" | "product" | "admin" | "checkout" | "orders";

function AppContent() {
  const [view, setView] = useState<View>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const handleNavigate = (nextView: View) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setView("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToShop = () => {
    setView("shop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {view !== "checkout" && (
        <Navbar
          currentView={view}
          onNavigate={handleNavigate}
          onCartOpen={() => setCartOpen(true)}
        />
      )}

      {view === "home" && (
        <HomePage
          onNavigate={(v) => handleNavigate(v)}
          onProductSelect={handleProductSelect}
        />
      )}

      {view === "shop" && <ShopPage onProductSelect={handleProductSelect} />}

      {view === "product" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          onBack={handleBackToShop}
          onCartOpen={() => setCartOpen(true)}
        />
      )}

      {view === "admin" && <AdminPage />}

      {view === "checkout" && (
        <CheckoutPage
          onBack={() => handleNavigate("shop")}
          onOrderSuccess={() => handleNavigate("home")}
          onViewMyOrders={() => handleNavigate("orders")}
        />
      )}

      {view === "orders" && (
        <MyOrdersPage onBack={() => handleNavigate("shop")} />
      )}

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        onCheckout={() => {
          setCartOpen(false);
          handleNavigate("checkout");
        }}
      />

      {/* Admin link — subtle, in the lower-right corner */}
      <button
        type="button"
        onClick={() => handleNavigate("admin")}
        className="fixed bottom-4 right-4 z-30 text-[10px] font-body tracking-widest uppercase text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        aria-label="Admin access"
      >
        Admin
      </button>

      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "bg-card border border-border text-foreground font-body",
            title: "text-foreground font-semibold",
            description: "text-muted-foreground",
            actionButton:
              "bg-primary text-primary-foreground font-body text-xs",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <HeroConfigProvider>
      <OrdersProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </OrdersProvider>
    </HeroConfigProvider>
  );
}
