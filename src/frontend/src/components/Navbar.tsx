import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Menu, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type View = "home" | "shop" | "product" | "admin";

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onCartOpen: () => void;
}

export function Navbar({ currentView, onNavigate, onCartOpen }: NavbarProps) {
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <img
            src="/assets/uploads/WhatsApp-Image-2026-02-28-at-7.14.59-PM-1.JPG"
            alt="Lycoris T-Shirts"
            className="h-10 w-auto object-contain"
          />
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            data-ocid="nav.home_link"
            className={`font-body text-sm tracking-wider uppercase transition-colors ${
              currentView === "home"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate("shop")}
            data-ocid="nav.shop_link"
            className={`font-body text-sm tracking-wider uppercase transition-colors ${
              currentView === "shop" || currentView === "product"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Shop
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCartOpen}
            data-ocid="nav.cart_button"
            className="relative text-foreground hover:text-primary"
            aria-label={`Open cart (${cartCount} items)`}
          >
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.div
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge className="h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold bg-primary text-primary-foreground rounded-full border-0">
                    {cartCount > 9 ? "9+" : cartCount}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-card overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  onNavigate("home");
                  setMobileMenuOpen(false);
                }}
                data-ocid="nav.home_link"
                className={`font-body text-sm tracking-wider uppercase text-left py-2 transition-colors ${
                  currentView === "home"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate("shop");
                  setMobileMenuOpen(false);
                }}
                data-ocid="nav.shop_link"
                className={`font-body text-sm tracking-wider uppercase text-left py-2 transition-colors ${
                  currentView === "shop" || currentView === "product"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Shop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
