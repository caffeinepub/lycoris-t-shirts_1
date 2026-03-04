import { ReviewSection } from "@/components/ReviewSection";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { type Product, formatPrice } from "@/data/products";
import { ArrowLeft, Check, ShoppingBag, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onCartOpen: () => void;
  onBuyNow: () => void;
}

export function ProductDetailPage({
  product,
  onBack,
  onCartOpen,
  onBuyNow,
}: ProductDetailPageProps) {
  const allImages = product.images?.length
    ? product.images
    : [product.imageUrl];
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const effectivePrice = product.sizePrices?.[selectedSize] ?? product.price;
    addToCart(product, selectedSize, effectivePrice);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    toast.success(`${product.name} added to cart`, {
      description: `Size: ${selectedSize}`,
      action: {
        label: "View Cart",
        onClick: onCartOpen,
      },
    });
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const effectivePrice = product.sizePrices?.[selectedSize] ?? product.price;
    addToCart(product, selectedSize, effectivePrice);
    onBuyNow();
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-body text-sm group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Shop
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            <div className="aspect-square rounded-sm overflow-hidden bg-muted">
              <img
                src={allImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-200"
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {allImages.map((src, i) => (
                  <button
                    key={src.slice(-32)}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    data-ocid={`product.thumbnail.${i + 1}`}
                    className={`w-16 h-16 rounded-sm overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      activeImage === i
                        ? "border-primary"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    aria-label={`View photo ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} view ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col"
          >
            <div className="mb-2">
              <span className="text-primary font-body text-xs tracking-[0.2em] uppercase font-semibold">
                {product.category}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-3">
              {product.name}
            </h1>

            <p className="font-display text-2xl font-semibold text-primary mb-6">
              {selectedSize && product.sizePrices?.[selectedSize]
                ? formatPrice(product.sizePrices[selectedSize])
                : product.sizePrices
                  ? `from ${formatPrice(Math.min(...Object.values(product.sizePrices)))}`
                  : formatPrice(product.price)}
            </p>

            <p className="font-body text-muted-foreground leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm font-semibold text-foreground tracking-wide uppercase text-xs">
                  Select Size
                </span>
                {sizeError && (
                  <span className="text-xs text-destructive font-body">
                    Please select a size
                  </span>
                )}
              </div>
              <fieldset
                className="flex flex-wrap gap-2 border-0 p-0 m-0"
                data-ocid="product.size_select"
                aria-label="Select size"
              >
                {product.sizes.map((size) => (
                  <button
                    type="button"
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={`h-10 min-w-[2.75rem] px-3 font-body text-sm font-medium border transition-all duration-150 ${
                      selectedSize === size
                        ? "bg-primary border-primary text-primary-foreground"
                        : sizeError
                          ? "border-destructive text-muted-foreground hover:border-foreground hover:text-foreground"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </fieldset>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              data-ocid="product.add_to_cart_button"
              className={`h-14 font-body font-semibold tracking-widest uppercase text-sm gap-2 rounded-none transition-all duration-300 ${
                justAdded
                  ? "bg-green-700 hover:bg-green-700 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Add to Cart
                </>
              )}
            </Button>

            {/* Place Order (Buy Now) */}
            <Button
              onClick={handleBuyNow}
              data-ocid="product.buy_now_button"
              variant="outline"
              className="h-14 font-body font-semibold tracking-widest uppercase text-sm gap-2 rounded-none border-primary text-primary hover:bg-primary/10 transition-all duration-300 mt-2"
            >
              <Zap className="h-4 w-4" />
              Place Order
            </Button>

            {/* Details */}
            <div className="mt-10 pt-8 border-t border-border space-y-3">
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Material</span>
                <span className="text-foreground">100% Premium Cotton</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Fit</span>
                <span className="text-foreground">Regular</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Care</span>
                <span className="text-foreground">Machine wash cold</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Availability</span>
                <span
                  className={
                    product.inStock ? "text-green-400" : "text-destructive"
                  }
                >
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection productId={product.id} />

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border mt-0">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground font-body text-xs">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
