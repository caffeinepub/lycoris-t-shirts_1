import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type Order,
  type OrderStatus,
  useOrders,
} from "@/context/OrdersContext";
import { formatPrice } from "@/data/products";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  RotateCcw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface MyOrdersPageProps {
  onBack: () => void;
}

function statusColor(status: OrderStatus): string {
  switch (status) {
    case "Pending":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case "Confirmed":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "Shipped":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "Delivered":
      return "bg-green-500/15 text-green-400 border-green-500/30";
    case "Cancelled":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "Return Requested":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "Returned":
      return "bg-teal-500/15 text-teal-400 border-teal-500/30";
  }
}

function statusIcon(status: OrderStatus) {
  switch (status) {
    case "Pending":
      return <Package className="h-3.5 w-3.5" />;
    case "Confirmed":
      return <Package className="h-3.5 w-3.5" />;
    case "Shipped":
      return <Truck className="h-3.5 w-3.5" />;
    case "Delivered":
      return <Package className="h-3.5 w-3.5" />;
    case "Cancelled":
      return <XCircle className="h-3.5 w-3.5" />;
    case "Return Requested":
      return <RotateCcw className="h-3.5 w-3.5" />;
    case "Returned":
      return <RotateCcw className="h-3.5 w-3.5" />;
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface CancelDialogProps {
  order: Order;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

function CancelDialog({ order, onConfirm, onClose }: CancelDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="bg-card border-border max-w-md"
        data-ocid="orders.cancel.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold text-foreground">
            Cancel Order
          </DialogTitle>
          <DialogDescription className="font-body text-muted-foreground text-sm">
            Are you sure you want to cancel order{" "}
            <span className="text-foreground font-semibold">{order.id}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label
            htmlFor="cancel-reason"
            className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2"
          >
            Reason for Cancellation (optional)
          </label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Changed my mind, ordered by mistake..."
            className="bg-background border-border font-body text-sm resize-none"
            data-ocid="orders.cancel.reason_textarea"
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="orders.cancel.cancel_button"
            className="border-border font-body text-sm"
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            data-ocid="orders.cancel.confirm_button"
            className="font-body font-semibold text-sm"
          >
            Yes, Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const RETURN_REASONS = [
  "Wrong size",
  "Damaged product",
  "Not as described",
  "Changed mind",
  "Other",
];

interface ReturnDialogProps {
  order: Order;
  onConfirm: (reason: string, description: string) => void;
  onClose: () => void;
}

function ReturnDialog({ order, onConfirm, onClose }: ReturnDialogProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="bg-card border-border max-w-md"
        data-ocid="orders.return.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold text-foreground">
            Request Return
          </DialogTitle>
          <DialogDescription className="font-body text-muted-foreground text-sm">
            Submit a return request for order{" "}
            <span className="text-foreground font-semibold">{order.id}</span>.
            Returns are accepted within 7 days of delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div>
            <label
              htmlFor="return-reason"
              className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2"
            >
              Reason for Return *
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger
                id="return-reason"
                className="bg-background border-border font-body text-sm"
                data-ocid="orders.return.reason_select"
              >
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {RETURN_REASONS.map((r) => (
                  <SelectItem key={r} value={r} className="font-body text-sm">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="return-description"
              className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2"
            >
              Additional Details{" "}
              <span className="normal-case font-normal text-muted-foreground/60">
                (optional)
              </span>
            </label>
            <Textarea
              id="return-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail..."
              className="bg-background border-border font-body text-sm resize-none"
              data-ocid="orders.return.description_textarea"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="orders.return.cancel_button"
            className="border-border font-body text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!reason) return;
              onConfirm(reason, description);
            }}
            disabled={!reason}
            data-ocid="orders.return.confirm_button"
            className="bg-amber-600 hover:bg-amber-700 text-white font-body font-semibold text-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Submit Return Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MyOrdersPage({ onBack }: MyOrdersPageProps) {
  const { orders, cancelOrder, requestReturn } = useOrders();
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);

  const sortedOrders = [...orders].sort((a, b) => b.timestamp - a.timestamp);

  const handleCancelConfirm = async (reason: string) => {
    if (!cancellingOrder) return;
    const orderId = cancellingOrder.id;
    try {
      await cancelOrder(orderId, reason);
      setCancellingOrder(null);
    } catch (err) {
      console.error("[MyOrders] Failed to cancel order:", err);
    }
  };

  const handleReturnConfirm = async (reason: string, description: string) => {
    if (!returningOrder) return;
    const orderId = returningOrder.id;
    try {
      await requestReturn(orderId, reason, description);
      setReturningOrder(null);
    } catch (err) {
      console.error("[MyOrders] Failed to request return:", err);
    }
  };

  return (
    <main className="min-h-screen bg-background" data-ocid="orders.page">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            data-ocid="orders.back_button"
            className="flex items-center gap-1.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <h1 className="font-display text-lg font-semibold text-foreground">
              My Orders
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {sortedOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
            data-ocid="orders.empty_state"
          >
            <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                No orders yet
              </h2>
              <p className="font-body text-muted-foreground text-sm">
                Once you place an order, you'll see it here.
              </p>
            </div>
            <Button
              onClick={onBack}
              data-ocid="orders.start_shopping_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wider uppercase text-sm h-10 px-8 rounded-sm mt-2"
            >
              Start Shopping
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4" data-ocid="orders.list">
            <p className="font-body text-sm text-muted-foreground mb-2">
              {sortedOrders.length} order{sortedOrders.length !== 1 ? "s" : ""}{" "}
              found
            </p>

            {sortedOrders.map((order, index) => {
              const canCancel =
                order.status === "Pending" || order.status === "Confirmed";
              const canReturn = order.status === "Delivered";
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-sm overflow-hidden"
                  data-ocid={`orders.item.${index + 1}`}
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border bg-muted/20">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">
                          Order ID
                        </p>
                        <p className="font-display font-bold text-foreground text-sm">
                          {order.id}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(order.timestamp)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                        {order.paymentMethod === "cod" ? (
                          <>
                            <Truck className="h-3.5 w-3.5" />
                            Cash on Delivery
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-3.5 w-3.5" />
                            Online Payment
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-semibold border ${statusColor(order.status)}`}
                      >
                        {statusIcon(order.status)}
                        {order.status}
                      </span>

                      {canCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancellingOrder(order)}
                          data-ocid={`orders.cancel_button.${index + 1}`}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive font-body text-xs h-8 px-3 rounded-sm"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {canReturn && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReturningOrder(order)}
                          data-ocid={`orders.return_button.${index + 1}`}
                          className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500 font-body text-xs h-8 px-3 rounded-sm"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Return
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-border/50">
                    {order.items.map((item, itemIdx) => (
                      <div
                        key={`${item.productId}-${item.size}-${itemIdx}`}
                        className="flex items-center justify-between gap-4 px-5 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-sm bg-muted border border-border flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-body text-sm font-medium text-foreground truncate">
                              {item.productName}
                            </p>
                            <p className="font-body text-xs text-muted-foreground">
                              Size: {item.size} · Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-body font-semibold text-sm text-foreground flex-shrink-0">
                          {formatPrice(item.priceEach * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-border bg-muted/10">
                    <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">
                        {order.deliveryAddress}, {order.city}, {order.state} —{" "}
                        {order.pincode}
                      </span>
                    </div>
                    <div className="font-display font-bold text-foreground">
                      Total:{" "}
                      <span className="text-primary">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Cancellation reason */}
                  {order.status === "Cancelled" && order.cancellationReason && (
                    <div className="px-5 py-3 bg-destructive/5 border-t border-destructive/20">
                      <p className="font-body text-xs text-muted-foreground">
                        <span className="text-destructive font-semibold">
                          Cancellation reason:
                        </span>{" "}
                        {order.cancellationReason}
                      </p>
                    </div>
                  )}

                  {/* Return info */}
                  {(order.status === "Return Requested" ||
                    order.status === "Returned") &&
                    order.returnReason && (
                      <div className="px-5 py-3 bg-amber-500/5 border-t border-amber-500/20">
                        <p className="font-body text-xs text-muted-foreground">
                          <span className="text-amber-400 font-semibold">
                            Return reason:
                          </span>{" "}
                          {order.returnReason}
                          {order.returnDescription && (
                            <span className="block mt-0.5 text-muted-foreground/70">
                              {order.returnDescription}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      {cancellingOrder && (
        <CancelDialog
          order={cancellingOrder}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancellingOrder(null)}
        />
      )}

      {/* Return Dialog */}
      {returningOrder && (
        <ReturnDialog
          order={returningOrder}
          onConfirm={handleReturnConfirm}
          onClose={() => setReturningOrder(null)}
        />
      )}
    </main>
  );
}
