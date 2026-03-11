import { useActor } from "@/hooks/useActor";
import type { BackendOrder, BackendOrderItem } from "@/types/backend-types";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface OrderItem {
  productId: number;
  productName: string;
  size: string;
  quantity: number;
  priceEach: number;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Return Requested"
  | "Returned";

export interface Order {
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
  status: OrderStatus;
  timestamp: number;
  cancellationReason?: string;
  returnReason?: string;
  returnDescription?: string;
}

type NewOrderData = Omit<Order, "id" | "status">;

interface OrdersContextValue {
  orders: Order[];
  isLoading: boolean;
  addOrder: (data: NewOrderData) => Promise<string>;
  cancelOrder: (id: string, reason: string) => Promise<void>;
  updateOrderStatus: (id: string, newStatus: OrderStatus) => Promise<void>;
  requestReturn: (
    id: string,
    reason: string,
    description?: string,
  ) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  clearAllOrders: () => Promise<void>;
}

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "LYC-";
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function mapBackendOrder(o: BackendOrder): Order {
  return {
    id: o.id,
    customerName: o.customerName,
    customerMobile: o.customerMobile,
    deliveryAddress: o.deliveryAddress,
    city: o.city,
    state: o.state,
    pincode: o.pincode,
    items: o.items.map((item) => ({
      productId: Number(item.productId),
      productName: item.productName,
      size: item.size,
      quantity: Number(item.quantity),
      priceEach: Number(item.priceEach),
    })),
    totalPrice: Number(o.totalPrice),
    paymentMethod: o.paymentMethod as "cod" | "online",
    status: o.status as OrderStatus,
    timestamp: Number(o.timestamp),
    cancellationReason: o.cancellationReason || undefined,
    returnReason: o.returnReason || undefined,
    returnDescription: o.returnDescription || undefined,
  };
}

type BackendActor = {
  placeOrder: (
    id: string,
    customerName: string,
    customerMobile: string,
    deliveryAddress: string,
    city: string,
    state: string,
    pincode: string,
    items: BackendOrderItem[],
    totalPrice: bigint,
    paymentMethod: string,
    timestamp: bigint,
  ) => Promise<string>;
  getAllOrders: () => Promise<BackendOrder[]>;
  updateOrderStatus: (id: string, newStatus: string) => Promise<boolean>;
  cancelOrder: (id: string, reason: string) => Promise<boolean>;
  requestReturn: (
    id: string,
    reason: string,
    description: string,
  ) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  clearAllOrders: () => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useActor();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!actor) return;
    try {
      const backendActor = actor as unknown as BackendActor;
      const raw = await backendActor.getAllOrders();
      const mapped = raw.map(mapBackendOrder);
      mapped.sort((a, b) => b.timestamp - a.timestamp);
      setOrders(mapped);
    } catch (err) {
      console.warn("[OrdersContext] fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    fetchOrders();
  }, [actor, isFetching, fetchOrders]);

  const addOrder = useCallback(
    async (data: NewOrderData): Promise<string> => {
      if (!actor) throw new Error("Backend not ready");
      const orderId = generateOrderId();
      const backendActor = actor as unknown as BackendActor;
      const backendItems: BackendOrderItem[] = data.items.map((item) => ({
        productId: BigInt(item.productId),
        productName: item.productName,
        size: item.size,
        quantity: BigInt(item.quantity),
        priceEach: BigInt(Math.round(item.priceEach)),
      }));
      await backendActor.placeOrder(
        orderId,
        data.customerName,
        data.customerMobile,
        data.deliveryAddress,
        data.city,
        data.state,
        data.pincode,
        backendItems,
        BigInt(Math.round(data.totalPrice)),
        data.paymentMethod,
        BigInt(data.timestamp),
      );
      await fetchOrders();
      return orderId;
    },
    [actor, fetchOrders],
  );

  const cancelOrder = useCallback(
    async (id: string, reason: string): Promise<void> => {
      if (!actor) return;
      const backendActor = actor as unknown as BackendActor;
      await backendActor.cancelOrder(id, reason);
      await fetchOrders();
    },
    [actor, fetchOrders],
  );

  const updateOrderStatus = useCallback(
    async (id: string, newStatus: OrderStatus): Promise<void> => {
      if (!actor) return;
      const backendActor = actor as unknown as BackendActor;
      await backendActor.updateOrderStatus(id, newStatus);
      await fetchOrders();
    },
    [actor, fetchOrders],
  );

  const requestReturn = useCallback(
    async (id: string, reason: string, description?: string): Promise<void> => {
      if (!actor) return;
      const backendActor = actor as unknown as BackendActor;
      await backendActor.requestReturn(id, reason, description ?? "");
      await fetchOrders();
    },
    [actor, fetchOrders],
  );

  const deleteOrder = useCallback(
    async (id: string): Promise<void> => {
      if (!actor) return;
      const backendActor = actor as unknown as BackendActor;
      await backendActor.deleteOrder(id);
      await fetchOrders();
    },
    [actor, fetchOrders],
  );

  const clearAllOrders = useCallback(async (): Promise<void> => {
    if (!actor) return;
    const backendActor = actor as unknown as BackendActor;
    await backendActor.clearAllOrders();
    setOrders([]);
  }, [actor]);

  return (
    <OrdersContext.Provider
      value={{
        orders,
        isLoading,
        addOrder,
        cancelOrder,
        updateOrderStatus,
        requestReturn,
        deleteOrder,
        clearAllOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
