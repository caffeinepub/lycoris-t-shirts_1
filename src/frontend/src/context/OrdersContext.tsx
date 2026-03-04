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
  addOrder: (data: NewOrderData) => string;
  cancelOrder: (id: string, reason: string) => void;
  updateOrderStatus: (id: string, newStatus: OrderStatus) => void;
  requestReturn: (id: string, reason: string, description?: string) => void;
}

const STORAGE_KEY = "lycoris_orders";

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "LYC-";
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(loadOrders);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  const addOrder = useCallback((data: NewOrderData): string => {
    const id = generateOrderId();
    const newOrder: Order = { ...data, id, status: "Pending" };
    setOrders((prev) => [newOrder, ...prev]);
    return id;
  }, []);

  const cancelOrder = useCallback((id: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        if (o.status !== "Pending" && o.status !== "Confirmed") return o;
        return {
          ...o,
          status: "Cancelled" as OrderStatus,
          cancellationReason: reason,
        };
      }),
    );
  }, []);

  const updateOrderStatus = useCallback(
    (id: string, newStatus: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
      );
    },
    [],
  );

  const requestReturn = useCallback(
    (id: string, reason: string, description?: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          if (o.status !== "Delivered") return o;
          return {
            ...o,
            status: "Return Requested" as OrderStatus,
            returnReason: reason,
            returnDescription: description,
          };
        }),
      );
    },
    [],
  );

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        cancelOrder,
        updateOrderStatus,
        requestReturn,
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
