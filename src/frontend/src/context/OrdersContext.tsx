import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// localStorage key
const LS_ORDERS = "lycoris_orders";

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

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LS_ORDERS);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]): void {
  localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load orders from localStorage on mount
  useEffect(() => {
    const stored = loadOrders();
    setOrders(stored);
    setIsLoading(false);
  }, []);

  const addOrder = useCallback(async (data: NewOrderData): Promise<string> => {
    const orderId = generateOrderId();
    const newOrder: Order = { ...data, id: orderId, status: "Pending" };

    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      saveOrders(updated);
      return updated;
    });

    return orderId;
  }, []);

  const cancelOrder = useCallback(
    async (id: string, reason: string): Promise<void> => {
      setOrders((prev) => {
        const updated = prev.map((o) => {
          if (o.id !== id) return o;
          if (o.status !== "Pending" && o.status !== "Confirmed") return o;
          return {
            ...o,
            status: "Cancelled" as OrderStatus,
            cancellationReason: reason,
          };
        });
        saveOrders(updated);
        return updated;
      });
    },
    [],
  );

  const updateOrderStatus = useCallback(
    async (id: string, newStatus: OrderStatus): Promise<void> => {
      setOrders((prev) => {
        const updated = prev.map((o) =>
          o.id === id ? { ...o, status: newStatus } : o,
        );
        saveOrders(updated);
        return updated;
      });
    },
    [],
  );

  const requestReturn = useCallback(
    async (id: string, reason: string, description?: string): Promise<void> => {
      setOrders((prev) => {
        const updated = prev.map((o) => {
          if (o.id !== id) return o;
          if (o.status !== "Delivered") return o;
          return {
            ...o,
            status: "Return Requested" as OrderStatus,
            returnReason: reason,
            returnDescription: description,
          };
        });
        saveOrders(updated);
        return updated;
      });
    },
    [],
  );

  const deleteOrder = useCallback(async (id: string): Promise<void> => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      saveOrders(updated);
      return updated;
    });
  }, []);

  const clearAllOrders = useCallback(async (): Promise<void> => {
    saveOrders([]);
    setOrders([]);
  }, []);

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
