import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { CheckCircle, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } =
    useCart();

  const handlePlaceOrder = () => {
    clearCart();
    onOpenChange(false);
    toast.success("Order placed successfully!", {
      description:
        "Thank you for shopping with Lycoris. Your order is confirmed.",
      icon: <CheckCircle className="h-4 w-4 text-green-400" />,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col bg-card border-border p-0"
        data-ocid="cart.sheet"
      >
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Your Cart
            {cartItems.length > 0 && (
              <span className="text-sm font-body font-normal text-muted-foreground">
                ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center font-body">
              Your cart is empty. Add some pieces to get started.
            </p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="px-6 py-4 space-y-4">
                <AnimatePresence initial={false}>
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={`${item.product.id}-${item.size}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      data-ocid={`cart.item.${index + 1}`}
                      className="flex gap-3"
                    >
                      <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-body font-semibold text-sm text-foreground leading-tight truncate">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Size: {item.size}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(index)}
                            data-ocid={`cart.remove_button.${index + 1}`}
                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-0.5"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-muted rounded">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(index, item.quantity - 1)
                              }
                              className="p-1.5 hover:text-primary transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(index, item.quantity + 1)
                              }
                              className="p-1.5 hover:text-primary transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <div className="px-6 py-5 border-t border-border space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between font-display text-lg font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wide h-12"
                onClick={handlePlaceOrder}
                data-ocid="cart.place_order_button"
              >
                Place Order
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
