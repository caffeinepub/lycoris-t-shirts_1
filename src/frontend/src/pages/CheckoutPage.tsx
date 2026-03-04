import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrdersContext";
import { formatPrice } from "@/data/products";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface CheckoutPageProps {
  onBack: () => void;
  onOrderSuccess: () => void;
  onViewMyOrders: () => void;
}

type Step = 1 | 2 | 3 | 4;
type PaymentMethod = "cod" | "online";

interface AddressForm {
  fullName: string;
  mobile: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
}

interface AddressErrors {
  fullName?: string;
  mobile?: string;
  address1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const STEPS = [
  { id: 1, label: "Delivery Address", icon: MapPin },
  { id: 2, label: "Order Summary", icon: Package },
  { id: 3, label: "Payment", icon: CreditCard },
] as const;

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
];

export function CheckoutPage({
  onBack,
  onOrderSuccess,
  onViewMyOrders,
}: CheckoutPageProps) {
  const { cartItems, clearCart, cartTotal } = useCart();
  const { addOrder } = useOrders();
  const deliveryCharge = cartTotal >= 499 ? 0 : 49;
  const orderTotal = cartTotal + deliveryCharge;
  const [step, setStep] = useState<Step>(1);
  const [placedOrderId, setPlacedOrderId] = useState<string>("");

  const [address, setAddress] = useState<AddressForm>({
    fullName: "",
    mobile: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<AddressErrors>({});

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const validateAddress = (): boolean => {
    const newErrors: AddressErrors = {};
    if (!address.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!address.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(address.mobile.replace(/\s/g, ""))) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    }
    if (!address.address1.trim()) newErrors.address1 = "Address is required";
    if (!address.city.trim()) newErrors.city = "City is required";
    if (!address.state.trim()) newErrors.state = "State is required";
    if (!address.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(address.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit pincode";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Continue = () => {
    if (validateAddress()) setStep(2);
  };

  const handleStep2Continue = () => {
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    await new Promise((r) => setTimeout(r, 900));

    // Build order data
    const orderId = addOrder({
      customerName: address.fullName,
      customerMobile: address.mobile,
      deliveryAddress: `${address.address1}${address.address2 ? `, ${address.address2}` : ""}`,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        size: item.size,
        quantity: item.quantity,
        priceEach: item.effectivePrice,
      })),
      totalPrice: orderTotal,
      paymentMethod,
      timestamp: Date.now(),
    });

    clearCart();
    setIsPlacingOrder(false);
    setPlacedOrderId(orderId);
    setStep(4);
  };

  const updateField = (field: keyof AddressForm, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof AddressErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCardNumber = (val: string) =>
    val
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  // Step 4: Order success screen
  if (step === 4) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center px-4 py-12"
        data-ocid="checkout.success.page"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-9 w-9 text-green-400" />
          </motion.div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Order Placed!
          </h1>
          <p className="font-body text-muted-foreground text-sm mb-6">
            Thank you for your order. We'll confirm it shortly.
          </p>

          {/* Order ID */}
          <div className="bg-card border border-border rounded-sm px-5 py-4 mb-6 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                Order ID
              </span>
              <span className="font-display font-bold text-primary text-base">
                {placedOrderId}
              </span>
            </div>
            <Separator className="bg-border" />
            <div className="flex justify-between items-center">
              <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                Payment
              </span>
              <span className="font-body text-sm text-foreground font-medium">
                {paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : "Online Payment"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                Deliver to
              </span>
              <span className="font-body text-sm text-foreground font-medium text-right max-w-[200px]">
                {address.city}, {address.state}
              </span>
            </div>
          </div>

          {/* Estimated delivery */}
          <div className="flex items-center justify-center gap-2 mb-8 text-xs font-body text-muted-foreground bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
            <Truck className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              Expected delivery in{" "}
              <strong className="text-foreground">5–7 business days</strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onViewMyOrders}
              data-ocid="checkout.success.view_orders_button"
              variant="outline"
              className="flex-1 border-border font-body font-semibold tracking-wider uppercase text-sm h-11 rounded-sm"
            >
              View My Orders
            </Button>
            <Button
              onClick={onOrderSuccess}
              data-ocid="checkout.success.continue_button"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wider uppercase text-sm h-11 rounded-sm"
            >
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-ocid="checkout.page">
      {/* Top bar */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            data-ocid="checkout.back_button"
            className="flex items-center gap-1.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/lycoris-logo-transparent.dim_300x100.png"
              alt="Lycoris"
              className="h-7 w-auto object-contain opacity-80"
            />
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs font-body text-muted-foreground">
            <Lock className="h-3 w-3" />
            Secure Checkout
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border mx-8" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 mx-8"
              style={{
                width:
                  (step as number) === 1
                    ? "0%"
                    : (step as number) === 2
                      ? "50%"
                      : "100%",
              }}
            />

            {STEPS.map((s) => {
              const isCompleted = step > s.id;
              const isActive = step === s.id;
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  data-ocid={`checkout.step_${s.id}_button`}
                  className="relative flex flex-col items-center gap-1.5 z-10"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-body font-bold text-sm border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isActive
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-body font-medium hidden sm:block ${
                      isActive
                        ? "text-primary"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Step Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Delivery Address ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-card border border-border rounded-sm overflow-hidden"
                  data-ocid="checkout.address.card"
                >
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-primary/5">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground font-body">
                        1
                      </span>
                    </div>
                    <h2 className="font-body font-semibold text-foreground text-base tracking-wide">
                      Delivery Address
                    </h2>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Full Name + Mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                        >
                          Full Name *
                        </label>
                        <Input
                          id="fullName"
                          value={address.fullName}
                          onChange={(e) =>
                            updateField("fullName", e.target.value)
                          }
                          placeholder="Rahul Sharma"
                          className={`font-body text-sm bg-background ${errors.fullName ? "border-destructive" : "border-input"}`}
                          data-ocid="checkout.name_input"
                          autoComplete="name"
                        />
                        {errors.fullName && (
                          <p
                            className="text-[11px] text-destructive mt-1 font-body"
                            data-ocid="checkout.name_error"
                          >
                            {errors.fullName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="mobile"
                          className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                        >
                          Mobile Number *
                        </label>
                        <Input
                          id="mobile"
                          value={address.mobile}
                          onChange={(e) =>
                            updateField("mobile", e.target.value)
                          }
                          placeholder="9876543210"
                          type="tel"
                          maxLength={10}
                          className={`font-body text-sm bg-background ${errors.mobile ? "border-destructive" : "border-input"}`}
                          data-ocid="checkout.phone_input"
                          autoComplete="tel"
                        />
                        {errors.mobile && (
                          <p
                            className="text-[11px] text-destructive mt-1 font-body"
                            data-ocid="checkout.phone_error"
                          >
                            {errors.mobile}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Address Line 1 */}
                    <div>
                      <label
                        htmlFor="address1"
                        className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                      >
                        Address Line 1 *
                      </label>
                      <Input
                        id="address1"
                        value={address.address1}
                        onChange={(e) =>
                          updateField("address1", e.target.value)
                        }
                        placeholder="House/Flat No., Building Name, Street"
                        className={`font-body text-sm bg-background ${errors.address1 ? "border-destructive" : "border-input"}`}
                        data-ocid="checkout.address1_input"
                        autoComplete="address-line1"
                      />
                      {errors.address1 && (
                        <p
                          className="text-[11px] text-destructive mt-1 font-body"
                          data-ocid="checkout.address1_error"
                        >
                          {errors.address1}
                        </p>
                      )}
                    </div>

                    {/* Address Line 2 */}
                    <div>
                      <label
                        htmlFor="address2"
                        className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                      >
                        Address Line 2{" "}
                        <span className="normal-case font-normal text-muted-foreground/60">
                          (optional)
                        </span>
                      </label>
                      <Input
                        id="address2"
                        value={address.address2}
                        onChange={(e) =>
                          updateField("address2", e.target.value)
                        }
                        placeholder="Landmark, Area (optional)"
                        className="font-body text-sm bg-background border-input"
                        autoComplete="address-line2"
                      />
                    </div>

                    {/* City + State + Pincode */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                        >
                          City *
                        </label>
                        <Input
                          id="city"
                          value={address.city}
                          onChange={(e) => updateField("city", e.target.value)}
                          placeholder="Mumbai"
                          className={`font-body text-sm bg-background ${errors.city ? "border-destructive" : "border-input"}`}
                          data-ocid="checkout.city_input"
                          autoComplete="address-level2"
                        />
                        {errors.city && (
                          <p className="text-[11px] text-destructive mt-1 font-body">
                            {errors.city}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="state"
                          className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                        >
                          State *
                        </label>
                        <select
                          id="state"
                          value={address.state}
                          onChange={(e) => updateField("state", e.target.value)}
                          data-ocid="checkout.state_input"
                          autoComplete="address-level1"
                          className={`w-full h-9 px-3 py-1 text-sm font-body bg-background rounded-md border transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${
                            errors.state ? "border-destructive" : "border-input"
                          } text-${address.state ? "foreground" : "muted-foreground"}`}
                        >
                          <option value="" disabled>
                            Select State
                          </option>
                          {INDIAN_STATES.map((s) => (
                            <option
                              key={s}
                              value={s}
                              className="bg-card text-foreground"
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                        {errors.state && (
                          <p className="text-[11px] text-destructive mt-1 font-body">
                            {errors.state}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="pincode"
                          className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                        >
                          Pincode *
                        </label>
                        <Input
                          id="pincode"
                          value={address.pincode}
                          onChange={(e) =>
                            updateField(
                              "pincode",
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                          placeholder="400001"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className={`font-body text-sm bg-background ${errors.pincode ? "border-destructive" : "border-input"}`}
                          data-ocid="checkout.pincode_input"
                          autoComplete="postal-code"
                        />
                        {errors.pincode && (
                          <p className="text-[11px] text-destructive mt-1 font-body">
                            {errors.pincode}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delivery info banner */}
                    <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-sm px-4 py-3 mt-2">
                      <Truck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-body text-muted-foreground leading-relaxed">
                        <span className="text-foreground font-semibold">
                          Free delivery on orders above Rs 499.
                        </span>{" "}
                        Orders below Rs 499 have a Rs 49 delivery charge.
                        Expected delivery in 5–7 business days.
                      </p>
                    </div>

                    <Button
                      onClick={handleStep1Continue}
                      data-ocid="checkout.continue_button"
                      className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wider uppercase text-sm h-11 px-10 rounded-sm mt-2"
                    >
                      Continue to Order Summary
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Order Summary ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-card border border-border rounded-sm overflow-hidden"
                  data-ocid="checkout.summary.card"
                >
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-primary/5">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground font-body">
                        2
                      </span>
                    </div>
                    <h2 className="font-body font-semibold text-foreground text-base tracking-wide">
                      Order Summary
                    </h2>
                  </div>

                  <div className="divide-y divide-border">
                    {cartItems.map((item, index) => (
                      <div
                        key={`${item.product.id}-${item.size}`}
                        data-ocid={`checkout.item.${index + 1}`}
                        className="flex gap-4 px-5 py-4"
                      >
                        <div className="w-20 h-20 rounded-sm overflow-hidden flex-shrink-0 bg-muted border border-border">
                          <img
                            src={
                              item.product.images?.[0] ?? item.product.imageUrl
                            }
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-foreground text-sm leading-tight">
                            {item.product.name}
                          </p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs font-body text-muted-foreground">
                              Size:{" "}
                              <span className="text-foreground font-medium">
                                {item.size}
                              </span>
                            </span>
                            <span className="text-xs font-body text-muted-foreground">
                              Qty:{" "}
                              <span className="text-foreground font-medium">
                                {item.quantity}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-body font-bold text-foreground">
                              {formatPrice(item.effectivePrice * item.quantity)}
                            </span>
                            <span className="text-xs font-body text-muted-foreground">
                              {formatPrice(item.effectivePrice)} each
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-4 border-t border-border bg-muted/30 space-y-2">
                    <div className="flex justify-between text-sm font-body text-muted-foreground">
                      <span>
                        Subtotal (
                        {cartItems.reduce((s, i) => s + i.quantity, 0)} items)
                      </span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-muted-foreground">
                        Delivery Charges
                      </span>
                      {deliveryCharge === 0 ? (
                        <span className="text-green-400 font-semibold">
                          FREE
                        </span>
                      ) : (
                        <span className="text-foreground font-semibold">
                          {formatPrice(deliveryCharge)}
                        </span>
                      )}
                    </div>
                    <Separator className="bg-border my-1" />
                    <div className="flex justify-between font-body font-bold text-foreground text-base">
                      <span>Total Amount</span>
                      <span className="text-primary text-lg">
                        {formatPrice(orderTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-4 flex items-center gap-3 flex-wrap border-t border-border">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Edit Address
                    </button>
                    <Button
                      onClick={handleStep2Continue}
                      data-ocid="checkout.continue_button"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wider uppercase text-sm h-11 px-10 rounded-sm"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Payment ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-card border border-border rounded-sm overflow-hidden"
                  data-ocid="checkout.payment.card"
                >
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-primary/5">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground font-body">
                        3
                      </span>
                    </div>
                    <h2 className="font-body font-semibold text-foreground text-base tracking-wide">
                      Payment Method
                    </h2>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Payment Options */}
                    <div className="space-y-3">
                      {/* Cash on Delivery */}
                      <label
                        htmlFor="pay-cod"
                        data-ocid="checkout.cod_toggle"
                        className={`flex items-start gap-4 p-4 rounded-sm border-2 cursor-pointer transition-all ${
                          paymentMethod === "cod"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-border/80"
                        }`}
                      >
                        <div className="relative mt-0.5">
                          <input
                            type="radio"
                            id="pay-cod"
                            name="paymentMethod"
                            value="cod"
                            checked={paymentMethod === "cod"}
                            onChange={() => setPaymentMethod("cod")}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "cod"
                                ? "border-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {paymentMethod === "cod" && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-primary" />
                            <span className="font-body font-semibold text-foreground text-sm">
                              Cash on Delivery
                            </span>
                          </div>
                          <p className="text-xs font-body text-muted-foreground mt-1">
                            Pay in cash when your order is delivered to your
                            doorstep.
                          </p>
                        </div>
                      </label>

                      {/* Online Payment */}
                      <label
                        htmlFor="pay-online"
                        data-ocid="checkout.online_payment_toggle"
                        className={`flex items-start gap-4 p-4 rounded-sm border-2 cursor-pointer transition-all ${
                          paymentMethod === "online"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-border/80"
                        }`}
                      >
                        <div className="relative mt-0.5">
                          <input
                            type="radio"
                            id="pay-online"
                            name="paymentMethod"
                            value="online"
                            checked={paymentMethod === "online"}
                            onChange={() => setPaymentMethod("online")}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "online"
                                ? "border-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {paymentMethod === "online" && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span className="font-body font-semibold text-foreground text-sm">
                              Online Payment
                            </span>
                            <span className="text-[10px] font-body bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm font-semibold tracking-wider uppercase">
                              Secure
                            </span>
                          </div>
                          <p className="text-xs font-body text-muted-foreground mt-1">
                            Pay now using Debit/Credit card. 100% secure &
                            encrypted.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Card fields when online is selected */}
                    <AnimatePresence>
                      {paymentMethod === "online" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-muted/30 border border-border rounded-sm p-4 space-y-3">
                            <p className="text-xs font-body text-muted-foreground flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                              Your payment info is encrypted and secure
                            </p>
                            <div>
                              <label
                                htmlFor="card-number"
                                className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                              >
                                Card Number
                              </label>
                              <Input
                                id="card-number"
                                value={cardNumber}
                                onChange={(e) =>
                                  setCardNumber(
                                    formatCardNumber(e.target.value),
                                  )
                                }
                                placeholder="1234 5678 9012 3456"
                                className="font-body text-sm bg-background border-input"
                                maxLength={19}
                                data-ocid="checkout.card_number_input"
                                autoComplete="cc-number"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label
                                  htmlFor="card-expiry"
                                  className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                                >
                                  Expiry (MM/YY)
                                </label>
                                <Input
                                  id="card-expiry"
                                  value={expiry}
                                  onChange={(e) =>
                                    setExpiry(formatExpiry(e.target.value))
                                  }
                                  placeholder="MM/YY"
                                  className="font-body text-sm bg-background border-input"
                                  maxLength={5}
                                  data-ocid="checkout.card_expiry_input"
                                  autoComplete="cc-exp"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="card-cvv"
                                  className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
                                >
                                  CVV
                                </label>
                                <Input
                                  id="card-cvv"
                                  value={cvv}
                                  onChange={(e) =>
                                    setCvv(
                                      e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 4),
                                    )
                                  }
                                  placeholder="•••"
                                  type="password"
                                  className="font-body text-sm bg-background border-input"
                                  maxLength={4}
                                  data-ocid="checkout.card_cvv_input"
                                  autoComplete="cc-csc"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Back + Place Order */}
                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Edit Order
                      </button>
                      <Button
                        onClick={handlePlaceOrder}
                        disabled={isPlacingOrder}
                        data-ocid="checkout.place_order_button"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wider uppercase text-sm h-11 px-10 rounded-sm disabled:opacity-60"
                      >
                        {isPlacingOrder ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                            Placing Order...
                          </span>
                        ) : (
                          `Place Order · ${formatPrice(orderTotal)}`
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Order Summary Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card border border-border rounded-sm overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="font-body font-semibold text-foreground text-sm tracking-wide uppercase">
                  Price Details
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="flex justify-between text-xs font-body text-muted-foreground"
                  >
                    <span className="truncate pr-2 max-w-[140px]">
                      {item.product.name}{" "}
                      <span className="text-muted-foreground/60">
                        ×{item.quantity}
                      </span>
                    </span>
                    <span className="flex-shrink-0">
                      {formatPrice(item.effectivePrice * item.quantity)}
                    </span>
                  </div>
                ))}
                <Separator className="bg-border" />
                <div className="flex justify-between text-sm font-body text-muted-foreground">
                  <span>Delivery</span>
                  {deliveryCharge === 0 ? (
                    <span className="text-green-400 font-semibold">FREE</span>
                  ) : (
                    <span className="text-foreground font-semibold">
                      {formatPrice(deliveryCharge)}
                    </span>
                  )}
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between font-body font-bold text-foreground">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatPrice(orderTotal)}
                  </span>
                </div>
                {deliveryCharge === 0 && cartTotal > 0 && (
                  <p className="text-xs font-body text-green-400">
                    You get free delivery on this order!
                  </p>
                )}
              </div>

              {/* Trust badges */}
              <div className="px-4 pb-4 space-y-2">
                <Separator className="bg-border mb-3" />
                <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  <span>100% Secure Payments</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                  <Package className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span>Easy 7-Day Returns</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                  <Truck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span>Free Delivery on Orders Above Rs 499</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
