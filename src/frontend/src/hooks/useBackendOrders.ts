import type { Order, OrderItem } from "@/context/OrdersContext";
import { useCallback } from "react";
import { useActor } from "./useActor";

// ── Backend shape ───────────────────────────────────────────────────────────
interface BackendOrderItem {
  productId: bigint;
  productName: string;
  size: string;
  quantity: bigint;
  price: bigint;
}

interface BackendOrder {
  id: bigint;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  items: BackendOrderItem[];
  totalPrice: bigint;
  paymentMethod: string;
  status: string;
  note: string;
  timestamp: bigint;
}

function formatOrderId(id: bigint): string {
  return `LYC-${String(id).padStart(5, "0")}`;
}

// ── Admin order shape (decoded from backend) ───────────────────────────────
export interface AdminOrder {
  id: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: "cod" | "online";
  timestamp: number;
  status: Order["status"];
}

interface PlaceOrderInput {
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: "cod" | "online";
  items: OrderItem[];
  totalPrice: number;
  timestamp: number;
}

interface UseBackendOrdersReturn {
  placeOrder: (data: PlaceOrderInput) => Promise<string>;
  getAllAdminOrders: () => Promise<AdminOrder[]>;
}

// ── useBackendOrders hook ───────────────────────────────────────────────────
export function useBackendOrders(): UseBackendOrdersReturn {
  const { actor } = useActor();

  const placeOrder = useCallback(
    async (data: PlaceOrderInput): Promise<string> => {
      if (!actor) throw new Error("Actor not available");

      const customerAddress = `${data.deliveryAddress}, ${data.city}, ${data.state} - ${data.pincode}`;

      const backendItems = data.items.map((item) => ({
        productId: BigInt(item.productId),
        productName: item.productName,
        size: item.size,
        quantity: BigInt(item.quantity),
        price: BigInt(item.priceEach),
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderId = (await (actor as any).placeOrder(
        data.customerName,
        data.customerMobile,
        customerAddress,
        backendItems,
        BigInt(data.totalPrice),
        data.paymentMethod,
        "",
        BigInt(data.timestamp),
      )) as bigint;

      return formatOrderId(orderId);
    },
    [actor],
  );

  const getAllAdminOrders = useCallback(async (): Promise<AdminOrder[]> => {
    if (!actor) return [];

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (await (actor as any).getAllOrders()) as BackendOrder[];

      return raw.map((bo) => {
        const orderId = formatOrderId(bo.id);

        // Map backend items to OrderItem
        const items: OrderItem[] = bo.items.map((item) => ({
          productId: Number(item.productId),
          productName: item.productName,
          size: item.size,
          quantity: Number(item.quantity),
          priceEach: Number(item.price),
        }));

        // Normalize payment method
        const paymentMethod: "cod" | "online" =
          bo.paymentMethod === "online" ? "online" : "cod";

        // Normalize status
        const validStatuses = [
          "Pending",
          "Confirmed",
          "Shipped",
          "Delivered",
          "Cancelled",
        ] as const;
        type ValidStatus = (typeof validStatuses)[number];
        const status: ValidStatus = (
          validStatuses as readonly string[]
        ).includes(bo.status)
          ? (bo.status as ValidStatus)
          : "Pending";

        return {
          id: orderId,
          customerName: bo.customerName,
          customerMobile: bo.customerMobile,
          // Put full address in deliveryAddress for display; leave city/state/pincode as empty strings
          deliveryAddress: bo.customerAddress,
          city: "",
          state: "",
          pincode: "",
          items,
          totalPrice: Number(bo.totalPrice),
          paymentMethod,
          timestamp: Number(bo.timestamp),
          status,
        } satisfies AdminOrder;
      });
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      return [];
    }
  }, [actor]);

  return { placeOrder, getAllAdminOrders };
}
