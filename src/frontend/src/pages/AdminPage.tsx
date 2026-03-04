import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useHeroConfig } from "@/context/HeroConfigContext";
import {
  type Order,
  type OrderStatus,
  useOrders,
} from "@/context/OrdersContext";
import { useProducts } from "@/context/ProductsContext";
import { useReviews } from "@/context/ReviewsContext";
import { type Product, formatPrice } from "@/data/products";
import {
  ChevronDown,
  ChevronRight,
  ImagePlus,
  Layout,
  Lock,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "lycoris-admin";

interface AdminProduct extends Product {
  isNew?: boolean;
}

// ---- SizePriceRow interface ----
export interface SizePriceRow {
  id: number;
  size: string;
  price: string;
}

let sizePriceRowId = 0;
function newSizePriceRow(size = "", price = ""): SizePriceRow {
  return { id: ++sizePriceRowId, size, price };
}

interface EditForm {
  name: string;
  description: string;
  category: string;
  sizeRows: SizePriceRow[];
  images: string[];
  inStock: boolean;
  stockLimit: string; // stored as string for input, "" = unlimited
}

const defaultEditForm = (): EditForm => ({
  name: "",
  description: "",
  category: "",
  sizeRows: [newSizePriceRow()],
  images: [],
  inStock: true,
  stockLimit: "",
});

// Read files as base64 data URLs
function readFilesAsDataURLs(files: FileList): Promise<string[]> {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    ),
  );
}

// Read a single file as data URL
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---- ImageUploader component ----
interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  ocidPrefix: string;
}

function ImageUploader({ images, onChange, ocidPrefix }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImages = await readFilesAsDataURLs(files);
    onChange([...images, ...newImages]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-ocid={`${ocidPrefix}.dropzone`}
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary/50 rounded-sm p-5 transition-colors bg-background"
      >
        <ImagePlus className="h-6 w-6 text-muted-foreground" />
        <p className="font-body text-xs text-muted-foreground text-center">
          Drag images here, or click below
          <br />
          <span className="text-muted-foreground/60">
            JPG, PNG, WEBP supported — multiple allowed
          </span>
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-ocid={`${ocidPrefix}.upload_button`}
          className="mt-1 font-body text-xs border-border"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose Images
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((src, i) => (
            <div
              key={src.slice(-32)}
              className="relative group rounded overflow-hidden aspect-square bg-muted"
              data-ocid={`${ocidPrefix}.image.item.${i + 1}`}
            >
              <img
                src={src}
                alt={`View ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                data-ocid={`${ocidPrefix}.image.delete_button.${i + 1}`}
                className="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-white text-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove image ${i + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground font-body text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- SingleImageUploader ----
interface SingleImageUploaderProps {
  image: string;
  onChange: (image: string) => void;
  ocidPrefix: string;
  placeholder?: string;
}

function SingleImageUploader({
  image,
  onChange,
  ocidPrefix,
  placeholder = "Click or drag to upload image",
}: SingleImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const dataUrl = await readFileAsDataURL(files[0]);
    onChange(dataUrl);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-ocid={`${ocidPrefix}.dropzone`}
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary/50 rounded-sm p-4 transition-colors bg-background"
      >
        <ImagePlus className="h-5 w-5 text-muted-foreground" />
        <p className="font-body text-xs text-muted-foreground text-center">
          {placeholder}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-ocid={`${ocidPrefix}.upload_button`}
          className="mt-1 font-body text-xs border-border"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Choose Image
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {image && (
        <div className="relative group rounded overflow-hidden aspect-video bg-muted">
          <img
            src={image}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-background/80 hover:bg-destructive hover:text-white text-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---- SizePriceTable component ----
interface SizePriceTableProps {
  rows: SizePriceRow[];
  onChange: (rows: SizePriceRow[]) => void;
  ocidPrefix: string;
}

function SizePriceTable({ rows, onChange, ocidPrefix }: SizePriceTableProps) {
  const addRow = () => {
    onChange([...rows, newSizePriceRow()]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return; // keep at least 1
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateRow = (
    index: number,
    field: keyof SizePriceRow,
    value: string,
  ) => {
    onChange(
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
        <span className="font-body text-[10px] tracking-widest uppercase text-muted-foreground/70">
          Size
        </span>
        <span className="font-body text-[10px] tracking-widest uppercase text-muted-foreground/70">
          Price (Rs)
        </span>
        <span className="w-6" />
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
            data-ocid={`${ocidPrefix}.size_row.${index + 1}`}
          >
            <div className="relative">
              <Input
                value={row.size}
                onChange={(e) =>
                  updateRow(index, "size", e.target.value.toUpperCase())
                }
                placeholder={index === 0 ? "S" : "M"}
                className="bg-background border-border font-body text-sm h-8"
                data-ocid={`${ocidPrefix}.size_input.${index + 1}`}
              />
              {index === 0 && (
                <span className="absolute -top-2 right-1 text-[9px] font-body text-primary/70 tracking-wide uppercase bg-card px-1">
                  base
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2 text-xs font-body text-muted-foreground pointer-events-none">
                ₹
              </span>
              <Input
                type="number"
                min="0"
                step="1"
                value={row.price}
                onChange={(e) => updateRow(index, "price", e.target.value)}
                placeholder="999"
                className="bg-background border-border font-body text-sm h-8 pl-6"
                data-ocid={`${ocidPrefix}.price_input.${index + 1}`}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(index)}
              disabled={rows.length <= 1}
              data-ocid={`${ocidPrefix}.size_delete_button.${index + 1}`}
              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              aria-label={`Remove size row ${index + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        data-ocid={`${ocidPrefix}.add_size_button`}
        className="flex items-center gap-1.5 text-xs font-body text-primary/80 hover:text-primary transition-colors mt-1"
      >
        <Plus className="h-3 w-3" />
        Add Size
      </button>
    </div>
  );
}

// ---- Status badge ----
function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const colorMap: Record<OrderStatus, string> = {
    Pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    Confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Shipped: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    Delivered: "bg-green-500/15 text-green-400 border-green-500/30",
    Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    "Return Requested": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Returned: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-body font-semibold border ${colorMap[status]}`}
    >
      {status}
    </span>
  );
}

// ---- Orders Tab ----
function OrdersTab() {
  const {
    orders,
    cancelOrder,
    updateOrderStatus,
    deleteOrder,
    clearAllOrders,
  } = useOrders();
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (orderId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const sortedOrders = [...orders].sort((a, b) => b.timestamp - a.timestamp);

  const STATUS_OPTIONS: OrderStatus[] = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Return Requested",
    "Returned",
  ];

  const handleCancelConfirm = () => {
    if (!cancellingOrder) return;
    cancelOrder(cancellingOrder.id, cancelReason);
    setCancellingOrder(null);
    setCancelReason("");
    toast.success(`Order ${cancellingOrder.id} has been cancelled.`);
  };

  const handleDeleteConfirm = () => {
    if (!deletingOrder) return;
    deleteOrder(deletingOrder.id);
    setDeletingOrder(null);
    toast.success(`Order ${deletingOrder.id} deleted from history.`);
  };

  const handleClearAllConfirm = () => {
    clearAllOrders();
    setShowClearAllDialog(false);
    toast.success("All order history cleared.");
  };

  if (sortedOrders.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-4"
        data-ocid="admin.orders.empty_state"
      >
        <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center">
          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">
            No orders yet
          </h3>
          <p className="font-body text-sm text-muted-foreground">
            Orders from customers will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-body text-sm text-muted-foreground">
          {sortedOrders.length} order{sortedOrders.length !== 1 ? "s" : ""}{" "}
          total
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowClearAllDialog(true)}
          data-ocid="admin.orders.clear_all_button"
          className="border-destructive/40 text-destructive hover:bg-destructive/10 font-body text-xs gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear All History
        </Button>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-ocid="admin.orders.table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-8" />
                <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                  Order ID
                </TableHead>
                <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                  Customer
                </TableHead>
                <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground text-center">
                  Items
                </TableHead>
                <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground text-right">
                  Total
                </TableHead>
                <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                  Payment
                </TableHead>
                <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground text-right">
                  Actions
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order, index) => {
                const canCancel =
                  order.status !== "Shipped" &&
                  order.status !== "Delivered" &&
                  order.status !== "Cancelled" &&
                  order.status !== "Return Requested" &&
                  order.status !== "Returned";
                const isExpanded = expandedRows.has(order.id);

                return (
                  <>
                    <TableRow
                      key={order.id}
                      className={`border-border hover:bg-muted/20 ${isExpanded ? "bg-muted/10" : ""} ${order.status === "Return Requested" ? "border-l-2 border-l-amber-500/70 bg-amber-500/5" : ""}`}
                      data-ocid={`admin.orders.row.${index + 1}`}
                    >
                      {/* Expand toggle */}
                      <TableCell className="w-8 pr-0">
                        <button
                          type="button"
                          onClick={() => toggleRow(order.id)}
                          data-ocid={`admin.orders.expand_button.${index + 1}`}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors rounded"
                          aria-label={
                            isExpanded
                              ? `Collapse order ${order.id}`
                              : `Expand order ${order.id}`
                          }
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggleRow(order.id)}
                          className="text-left"
                        >
                          <span className="font-display font-bold text-primary text-sm hover:underline underline-offset-2 cursor-pointer">
                            {order.id}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-body text-sm font-medium text-foreground leading-tight">
                            {order.customerName}
                          </p>
                          <p className="font-body text-xs text-muted-foreground">
                            {order.customerMobile}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-body text-sm text-muted-foreground">
                          {order.items.reduce((s, i) => s + i.quantity, 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-display font-semibold text-foreground text-sm">
                          {formatPrice(order.totalPrice)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                          {order.paymentMethod === "cod" ? "COD" : "Online"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(val) =>
                            updateOrderStatus(order.id, val as OrderStatus)
                          }
                          disabled={order.status === "Cancelled"}
                        >
                          <SelectTrigger
                            className="h-8 w-32 border-border bg-background font-body text-xs"
                            data-ocid={`admin.orders.status_select.${index + 1}`}
                          >
                            <SelectValue>
                              <OrderStatusBadge status={order.status} />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem
                                key={s}
                                value={s}
                                className="font-body text-sm"
                              >
                                <OrderStatusBadge status={s} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className="font-body text-xs text-muted-foreground">
                          {new Date(order.timestamp).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          type="button"
                          disabled={!canCancel}
                          onClick={() => {
                            setCancellingOrder(order);
                            setCancelReason("");
                          }}
                          data-ocid={`admin.orders.cancel_button.${index + 1}`}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label={`Cancel order ${order.id}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setDeletingOrder(order)}
                          data-ocid={`admin.orders.delete_button.${index + 1}`}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                          aria-label={`Delete order ${order.id} from history`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <TableRow
                        key={`${order.id}-details`}
                        className="border-border bg-muted/5 hover:bg-muted/10"
                        data-ocid={`admin.orders.details_panel.${index + 1}`}
                      >
                        <TableCell colSpan={10} className="py-0">
                          <div className="px-4 py-4 space-y-4">
                            {/* Order items table */}
                            <div>
                              <p className="font-body text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold mb-2">
                                Order Items
                              </p>
                              <div className="border border-border/60 rounded-sm overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-border/60 bg-muted/30">
                                      <th className="font-body text-[10px] tracking-widest uppercase text-muted-foreground text-left px-3 py-2">
                                        Product
                                      </th>
                                      <th className="font-body text-[10px] tracking-widest uppercase text-muted-foreground text-center px-3 py-2">
                                        Size
                                      </th>
                                      <th className="font-body text-[10px] tracking-widest uppercase text-muted-foreground text-center px-3 py-2">
                                        Qty
                                      </th>
                                      <th className="font-body text-[10px] tracking-widest uppercase text-muted-foreground text-right px-3 py-2">
                                        Price Each
                                      </th>
                                      <th className="font-body text-[10px] tracking-widest uppercase text-muted-foreground text-right px-3 py-2">
                                        Line Total
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item, itemIndex) => (
                                      <tr
                                        key={`${item.productId}-${item.size}-${itemIndex}`}
                                        className={`border-b border-border/40 last:border-0 ${itemIndex % 2 === 0 ? "bg-background/60" : "bg-muted/10"}`}
                                      >
                                        <td className="px-3 py-2.5">
                                          <span className="font-body text-sm font-medium text-foreground">
                                            {item.productName}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                          <span className="font-body text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm font-semibold">
                                            {item.size}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                          <span className="font-body text-sm text-foreground font-medium">
                                            {item.quantity}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                          <span className="font-body text-sm text-muted-foreground">
                                            {formatPrice(item.priceEach)}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                          <span className="font-display font-semibold text-sm text-foreground">
                                            {formatPrice(
                                              item.priceEach * item.quantity,
                                            )}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t border-border bg-muted/20">
                                      <td
                                        colSpan={4}
                                        className="px-3 py-2 text-right"
                                      >
                                        <span className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                                          Order Total
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <span className="font-display font-bold text-primary text-sm">
                                          {formatPrice(order.totalPrice)}
                                        </span>
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>

                            {/* Delivery & contact info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Delivery address */}
                              <div className="bg-background/60 border border-border/60 rounded-sm p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <MapPin className="h-3.5 w-3.5 text-primary" />
                                  <p className="font-body text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
                                    Delivery Address
                                  </p>
                                </div>
                                <p className="font-body text-sm text-foreground leading-relaxed">
                                  {order.deliveryAddress}
                                </p>
                                <p className="font-body text-sm text-foreground">
                                  {[order.city, order.state, order.pincode]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              </div>

                              {/* Contact & order info */}
                              <div className="bg-background/60 border border-border/60 rounded-sm p-3 space-y-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Phone className="h-3.5 w-3.5 text-primary" />
                                  <p className="font-body text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
                                    Contact Details
                                  </p>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="font-body text-xs text-muted-foreground">
                                      Name
                                    </span>
                                    <span className="font-body text-sm text-foreground font-medium">
                                      {order.customerName}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-body text-xs text-muted-foreground">
                                      Mobile
                                    </span>
                                    <span className="font-body text-sm text-foreground font-medium">
                                      {order.customerMobile}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-body text-xs text-muted-foreground">
                                      Payment
                                    </span>
                                    <span className="font-body text-sm text-foreground uppercase font-semibold">
                                      {order.paymentMethod === "cod"
                                        ? "Cash on Delivery"
                                        : "Online Payment"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-body text-xs text-muted-foreground">
                                      Order Date
                                    </span>
                                    <span className="font-body text-sm text-foreground">
                                      {new Date(
                                        order.timestamp,
                                      ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Cancellation reason */}
                            {order.cancellationReason && (
                              <div className="bg-destructive/5 border border-destructive/20 rounded-sm p-3">
                                <p className="font-body text-[10px] tracking-[0.18em] uppercase text-destructive font-semibold mb-1">
                                  Cancellation Reason
                                </p>
                                <p className="font-body text-sm text-foreground/80">
                                  {order.cancellationReason}
                                </p>
                              </div>
                            )}

                            {/* Return reason */}
                            {order.returnReason && (
                              <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm p-3">
                                <p className="font-body text-[10px] tracking-[0.18em] uppercase text-amber-400 font-semibold mb-1">
                                  Return Reason
                                </p>
                                <p className="font-body text-sm text-foreground/80">
                                  {order.returnReason}
                                  {order.returnDescription && (
                                    <span className="block mt-1 text-muted-foreground/70 text-xs">
                                      {order.returnDescription}
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog
        open={cancellingOrder !== null}
        onOpenChange={(open) => {
          if (!open) setCancellingOrder(null);
        }}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="admin.orders.cancel.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold text-foreground">
              Cancel Order
            </DialogTitle>
            <DialogDescription className="font-body text-muted-foreground text-sm">
              Cancel order{" "}
              <span className="text-foreground font-semibold">
                {cancellingOrder?.id}
              </span>
              ? This will notify the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label
              htmlFor="admin-cancel-reason"
              className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-2 block"
            >
              Reason (optional)
            </Label>
            <Textarea
              id="admin-cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Out of stock, cannot fulfil order..."
              className="bg-background border-border font-body text-sm resize-none"
              data-ocid="admin.orders.cancel.reason_textarea"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancellingOrder(null)}
              data-ocid="admin.orders.cancel.cancel_button"
              className="border-border font-body text-sm"
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              data-ocid="admin.orders.cancel.confirm_button"
              className="font-body font-semibold text-sm"
            >
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <Dialog
        open={deletingOrder !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingOrder(null);
        }}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="admin.orders.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold text-foreground">
              Delete Order
            </DialogTitle>
            <DialogDescription className="font-body text-muted-foreground text-sm">
              Permanently remove order{" "}
              <span className="text-foreground font-semibold">
                {deletingOrder?.id}
              </span>{" "}
              from history? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingOrder(null)}
              data-ocid="admin.orders.delete.cancel_button"
              className="border-border font-body text-sm"
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              data-ocid="admin.orders.delete.confirm_button"
              className="font-body font-semibold text-sm"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All History Dialog */}
      <Dialog
        open={showClearAllDialog}
        onOpenChange={(open) => {
          if (!open) setShowClearAllDialog(false);
        }}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="admin.orders.clear_all.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold text-foreground">
              Clear All Order History
            </DialogTitle>
            <DialogDescription className="font-body text-muted-foreground text-sm">
              This will permanently delete all {sortedOrders.length} orders from
              history. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearAllDialog(false)}
              data-ocid="admin.orders.clear_all.cancel_button"
              className="border-border font-body text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllConfirm}
              data-ocid="admin.orders.clear_all.confirm_button"
              className="font-body font-semibold text-sm"
            >
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Storefront Tab ----
function StorefrontTab() {
  const { heroConfig, updateHeroConfig } = useHeroConfig();

  const [localConfig, setLocalConfig] = useState(heroConfig);
  const defaultLogoSrc =
    "/assets/uploads/WhatsApp-Image-2026-02-28-at-7.14.59-PM-1.JPG";

  const handleSave = () => {
    updateHeroConfig(localConfig);
    toast.success("Storefront settings saved!");
  };

  const handleResetLogo = () => {
    setLocalConfig((prev) => ({ ...prev, logoImage: "" }));
  };

  // Split title for preview
  const titleParts = localConfig.heroTitle.split("\n");
  const titleLine1 = titleParts[0] || "";
  const titleLine2 = titleParts[1] || "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Controls */}
      <div className="space-y-6">
        {/* Hero Banner Section */}
        <div className="bg-card border border-border rounded-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold text-foreground">
              Hero Banner
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="hero-badge"
                className="font-body text-xs tracking-widests uppercase text-muted-foreground mb-1.5 block"
              >
                Badge Text
              </Label>
              <Input
                id="hero-badge"
                value={localConfig.heroBadgeText}
                onChange={(e) =>
                  setLocalConfig((p) => ({
                    ...p,
                    heroBadgeText: e.target.value,
                  }))
                }
                placeholder="New Collection 2026"
                className="bg-background border-border font-body text-sm"
                data-ocid="admin.storefront.hero_badge_input"
              />
            </div>

            <div>
              <Label
                htmlFor="hero-title"
                className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
              >
                Hero Title{" "}
                <span className="normal-case font-normal text-muted-foreground/60">
                  (use \n for line break)
                </span>
              </Label>
              <Textarea
                id="hero-title"
                value={localConfig.heroTitle}
                onChange={(e) =>
                  setLocalConfig((p) => ({ ...p, heroTitle: e.target.value }))
                }
                placeholder={"Wear the\nBloom"}
                className="bg-background border-border font-body text-sm resize-none"
                data-ocid="admin.storefront.hero_title_textarea"
                rows={2}
              />
            </div>

            <div>
              <Label
                htmlFor="hero-subtitle"
                className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
              >
                Subtitle
              </Label>
              <Textarea
                id="hero-subtitle"
                value={localConfig.heroSubtitle}
                onChange={(e) =>
                  setLocalConfig((p) => ({
                    ...p,
                    heroSubtitle: e.target.value,
                  }))
                }
                placeholder="Premium tees inspired by..."
                className="bg-background border-border font-body text-sm resize-none"
                data-ocid="admin.storefront.hero_subtitle_textarea"
                rows={2}
              />
            </div>

            <div>
              <Label
                htmlFor="hero-cta"
                className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
              >
                CTA Button Label
              </Label>
              <Input
                id="hero-cta"
                value={localConfig.heroCtaLabel}
                onChange={(e) =>
                  setLocalConfig((p) => ({
                    ...p,
                    heroCtaLabel: e.target.value,
                  }))
                }
                placeholder="Shop Now"
                className="bg-background border-border font-body text-sm"
                data-ocid="admin.storefront.hero_cta_input"
              />
            </div>

            <div>
              <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block">
                Hero Background Image{" "}
                <span className="normal-case font-normal text-muted-foreground/60">
                  (optional)
                </span>
              </Label>
              <SingleImageUploader
                image={localConfig.heroBgImage}
                onChange={(img) =>
                  setLocalConfig((p) => ({ ...p, heroBgImage: img }))
                }
                ocidPrefix="admin.storefront.hero_bg"
                placeholder="Drag or click to upload hero background"
              />
            </div>
          </div>
        </div>

        {/* Logo Section */}
        <div className="bg-card border border-border rounded-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <Layout className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold text-foreground">
              Logo
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-2 block">
                Current Logo
              </Label>
              <div className="bg-background border border-border rounded-sm p-3 inline-block">
                <img
                  src={
                    localConfig.logoImage ||
                    heroConfig.logoImage ||
                    defaultLogoSrc
                  }
                  alt="Current Logo"
                  className="h-12 w-auto object-contain max-w-[200px]"
                />
              </div>
            </div>

            <div>
              <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block">
                Upload New Logo
              </Label>
              <SingleImageUploader
                image={localConfig.logoImage}
                onChange={(img) =>
                  setLocalConfig((p) => ({ ...p, logoImage: img }))
                }
                ocidPrefix="admin.storefront.logo"
                placeholder="Drag or click to upload logo"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetLogo}
              data-ocid="admin.storefront.reset_logo_button"
              className="border-border font-body text-xs gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset to Default Logo
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSave}
          data-ocid="admin.storefront.save_button"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wider uppercase rounded-none h-11"
        >
          Save Storefront Settings
        </Button>
      </div>

      {/* Right: Preview */}
      <div>
        <div className="bg-card border border-border rounded-sm p-5 sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <Layout className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold text-foreground">
              Hero Preview
            </h3>
          </div>

          {/* Hero Preview */}
          <div
            className="relative w-full rounded-sm overflow-hidden bg-muted"
            style={{ aspectRatio: "16/9" }}
          >
            {/* Background */}
            {localConfig.heroBgImage ? (
              <img
                src={localConfig.heroBgImage}
                alt="Hero background preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img
                src="/assets/generated/hero-banner.dim_1200x500.jpg"
                alt="Hero background preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-5 flex flex-col gap-1.5">
              {localConfig.heroBadgeText && (
                <span className="text-primary font-body text-[10px] tracking-[0.2em] uppercase font-semibold">
                  ✦ {localConfig.heroBadgeText}
                </span>
              )}
              <div className="font-display text-xl font-bold text-foreground leading-tight">
                {titleLine1}
                {titleLine2 && (
                  <>
                    <br />
                    <span className="text-primary italic">{titleLine2}</span>
                  </>
                )}
              </div>
              {localConfig.heroSubtitle && (
                <p className="font-body text-muted-foreground text-[11px] leading-relaxed max-w-[70%] line-clamp-2">
                  {localConfig.heroSubtitle}
                </p>
              )}
              {localConfig.heroCtaLabel && (
                <div className="mt-1">
                  <span className="bg-primary text-primary-foreground font-body text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 inline-block rounded-none">
                    {localConfig.heroCtaLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Logo Preview */}
          <div className="mt-4">
            <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-2">
              Logo Preview
            </p>
            <div className="bg-background border border-border rounded-sm px-4 py-3 flex items-center gap-3">
              <img
                src={
                  localConfig.logoImage ||
                  heroConfig.logoImage ||
                  defaultLogoSrc
                }
                alt="Logo preview"
                className="h-8 w-auto object-contain max-w-[160px]"
              />
              <span className="font-body text-xs text-muted-foreground">
                (as it appears in the navbar)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main AdminPage ----
export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { getReviews } = useReviews();

  // Add Product form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    sizeRows: [newSizePriceRow()] as SizePriceRow[],
    images: [] as string[],
    stockLimit: "",
  });

  // Edit dialog state
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [editForm, setEditForm] = useState<EditForm>(defaultEditForm());

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = form.sizeRows.filter(
      (r) => r.size.trim() && r.price.trim(),
    );
    if (!form.name || !form.category || validRows.length === 0) {
      toast.error(
        "Please fill in name, category, and at least one size with price.",
      );
      return;
    }

    const mainImage =
      form.images[0] || "/assets/generated/tshirt-black.dim_600x600.jpg";

    const sizePrices: Record<string, number> = {};
    for (const row of validRows) {
      sizePrices[row.size.trim().toUpperCase()] = Math.round(
        Number.parseInt(row.price, 10),
      );
    }

    const newProduct: AdminProduct = {
      id: Date.now(),
      name: form.name,
      description: form.description,
      price: Math.round(Number.parseInt(validRows[0].price, 10)),
      category: form.category,
      sizes: validRows.map((r) => r.size.trim().toUpperCase()),
      sizePrices,
      imageUrl: mainImage,
      images: form.images.length > 0 ? form.images : [mainImage],
      inStock: true,
      isNew: true,
      stockLimit:
        form.stockLimit.trim() !== ""
          ? Math.max(0, Number.parseInt(form.stockLimit, 10))
          : undefined,
    };

    addProduct(newProduct);
    setForm({
      name: "",
      description: "",
      category: "",
      sizeRows: [newSizePriceRow()],
      images: [],
      stockLimit: "",
    });
    toast.success(`"${newProduct.name}" added to catalog.`);
  };

  const handleDeleteProduct = (product: AdminProduct) => {
    deleteProduct(product.id);
    toast.success(`"${product.name}" deleted.`);
  };

  const openEditDialog = (product: AdminProduct) => {
    setEditingProduct(product);
    const existingImages = product.images?.length
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

    // Build sizeRows from sizePrices if available, else from sizes array with base price
    let sizeRows: SizePriceRow[];
    if (product.sizePrices && Object.keys(product.sizePrices).length > 0) {
      sizeRows = product.sizes.map((s) =>
        newSizePriceRow(s, String(product.sizePrices?.[s] ?? product.price)),
      );
    } else {
      sizeRows =
        product.sizes.length > 0
          ? product.sizes.map((s) => newSizePriceRow(s, String(product.price)))
          : [newSizePriceRow("", String(product.price))];
    }

    setEditForm({
      name: product.name,
      description: product.description,
      category: product.category,
      sizeRows,
      images: existingImages,
      inStock: product.inStock,
      stockLimit:
        product.stockLimit !== undefined ? String(product.stockLimit) : "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    const validRows = editForm.sizeRows.filter(
      (r) => r.size.trim() && r.price.trim(),
    );
    if (!editForm.name || !editForm.category || validRows.length === 0) {
      toast.error(
        "Please fill in name, category, and at least one size with price.",
      );
      return;
    }

    const mainImage = editForm.images[0] || editingProduct.imageUrl;

    const sizePrices: Record<string, number> = {};
    for (const row of validRows) {
      sizePrices[row.size.trim().toUpperCase()] = Math.round(
        Number.parseInt(row.price, 10),
      );
    }

    const updated: AdminProduct = {
      ...editingProduct,
      name: editForm.name,
      description: editForm.description,
      price: Math.round(Number.parseInt(validRows[0].price, 10)),
      category: editForm.category,
      sizes: validRows.map((r) => r.size.trim().toUpperCase()),
      sizePrices,
      imageUrl: mainImage,
      images:
        editForm.images.length > 0 ? editForm.images : editingProduct.images,
      inStock: editForm.inStock,
      stockLimit:
        editForm.stockLimit.trim() !== ""
          ? Math.max(0, Number.parseInt(editForm.stockLimit, 10))
          : undefined,
    };

    updateProduct(updated);
    setEditingProduct(null);
    toast.success(`"${updated.name}" updated.`);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center justify-center mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground text-center mb-1">
            Admin Access
          </h1>
          <p className="text-muted-foreground font-body text-sm text-center mb-8">
            Enter the password to access the admin panel.
          </p>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="admin-password"
                className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-2 block"
              >
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
                data-ocid="admin.password_input"
                className={`bg-card border-border font-body ${passwordError ? "border-destructive" : ""}`}
              />
              {passwordError && (
                <p className="text-destructive text-xs mt-1.5 font-body">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>
            <Button
              onClick={handleLogin}
              data-ocid="admin.login_button"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wider uppercase rounded-none h-11"
            >
              Sign In
            </Button>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-primary font-body text-xs tracking-[0.2em] uppercase font-semibold mb-1">
            Admin Panel
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Dashboard
          </h1>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="products" data-ocid="admin.tabs">
          <TabsList className="bg-card border border-border rounded-sm h-11 mb-8 gap-1 p-1">
            <TabsTrigger
              value="products"
              data-ocid="admin.products.tab"
              className="font-body text-sm tracking-wide gap-2 rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Package className="h-3.5 w-3.5" />
              Products
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              data-ocid="admin.orders.tab"
              className="font-body text-sm tracking-wide gap-2 rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="storefront"
              data-ocid="admin.storefront.tab"
              className="font-body text-sm tracking-wide gap-2 rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Layout className="h-3.5 w-3.5" />
              Storefront
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add Product Form */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="lg:col-span-1"
              >
                <div className="bg-card border border-border p-6 rounded-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Plus className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      Add New Product
                    </h2>
                  </div>

                  <form
                    onSubmit={handleAddProduct}
                    data-ocid="admin.product_form"
                    className="space-y-4"
                  >
                    <div>
                      <Label
                        htmlFor="product-name"
                        className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
                      >
                        Name *
                      </Label>
                      <Input
                        id="product-name"
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="Classic Black Tee"
                        className="bg-background border-border font-body text-sm"
                        data-ocid="admin.product.name_input"
                        required
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="product-desc"
                        className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
                      >
                        Description
                      </Label>
                      <Textarea
                        id="product-desc"
                        value={form.description}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Product description..."
                        className="bg-background border-border font-body text-sm resize-none"
                        data-ocid="admin.product.description_textarea"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="product-category"
                        className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
                      >
                        Category *
                      </Label>
                      <Input
                        id="product-category"
                        value={form.category}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category: e.target.value }))
                        }
                        placeholder="Basics, Graphic, Vintage..."
                        className="bg-background border-border font-body text-sm"
                        data-ocid="admin.product.category_input"
                        required
                      />
                    </div>

                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-2 block">
                        Sizes & Prices *
                      </Label>
                      <div className="bg-background border border-border rounded-sm p-3">
                        <SizePriceTable
                          rows={form.sizeRows}
                          onChange={(sizeRows) =>
                            setForm((f) => ({ ...f, sizeRows }))
                          }
                          ocidPrefix="admin.product"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block">
                        Product Images
                      </Label>
                      <ImageUploader
                        images={form.images}
                        onChange={(images) =>
                          setForm((f) => ({ ...f, images }))
                        }
                        ocidPrefix="admin.product"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="product-stock-limit"
                        className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
                      >
                        Stock Limit{" "}
                        <span className="normal-case font-normal text-muted-foreground/60">
                          (leave blank for unlimited)
                        </span>
                      </Label>
                      <Input
                        id="product-stock-limit"
                        type="number"
                        min="0"
                        step="1"
                        value={form.stockLimit}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, stockLimit: e.target.value }))
                        }
                        placeholder="e.g. 50"
                        className="bg-background border-border font-body text-sm"
                        data-ocid="admin.product.stock_limit_input"
                      />
                    </div>

                    <Button
                      type="submit"
                      data-ocid="admin.add_product_button"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wider uppercase rounded-none h-11 gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  </form>
                </div>
              </motion.div>

              {/* Product List */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="lg:col-span-2"
              >
                <div className="bg-card border border-border rounded-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
                    <Package className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      Product Catalog
                    </h2>
                    <span className="ml-auto text-xs text-muted-foreground font-body">
                      {products.length} items
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                            Product
                          </TableHead>
                          <TableHead className="font-body text-xs tracking-widests uppercase text-muted-foreground">
                            Category
                          </TableHead>
                          <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground text-right">
                            Price
                          </TableHead>
                          <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                            Status
                          </TableHead>
                          <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground text-center">
                            Rating
                          </TableHead>
                          <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product, index) => {
                          const displayImage =
                            product.images?.[0] || product.imageUrl;
                          const imageCount = product.images?.length ?? 1;
                          const productReviews = getReviews(product.id);
                          const avgRating =
                            productReviews.length > 0
                              ? productReviews.reduce(
                                  (sum, r) => sum + r.rating,
                                  0,
                                ) / productReviews.length
                              : null;
                          return (
                            <TableRow
                              key={product.id}
                              className="border-border hover:bg-muted/30"
                              data-ocid={`admin.product.row.${index + 1}`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                                    <img
                                      src={displayImage}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                    {imageCount > 1 && (
                                      <span className="absolute bottom-0 right-0 bg-black/60 text-white font-body text-[8px] px-1 leading-4">
                                        +{imageCount - 1}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-body text-sm font-semibold text-foreground leading-tight">
                                      {product.name}
                                    </p>
                                    <p className="font-body text-xs text-muted-foreground">
                                      {product.sizes.join(", ")}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-body text-xs text-muted-foreground tracking-wide">
                                  {product.category}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-display font-semibold text-primary text-sm">
                                  {product.sizePrices &&
                                  Object.keys(product.sizePrices).length > 1
                                    ? `from ${formatPrice(Math.min(...Object.values(product.sizePrices)))}`
                                    : formatPrice(product.price)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <span
                                    className={`text-xs font-body ${
                                      product.inStock
                                        ? "text-green-400"
                                        : "text-destructive"
                                    }`}
                                  >
                                    {product.inStock
                                      ? "In Stock"
                                      : "Out of Stock"}
                                  </span>
                                  {product.stockLimit !== undefined && (
                                    <p className="text-[10px] font-body text-muted-foreground">
                                      Limit: {product.stockLimit}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {avgRating !== null ? (
                                  <div className="inline-flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                                    <span className="font-body text-xs font-semibold text-foreground">
                                      {(
                                        Math.round(avgRating * 10) / 10
                                      ).toFixed(1)}
                                    </span>
                                    <span className="font-body text-[10px] text-muted-foreground">
                                      ({productReviews.length})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-body text-xs text-muted-foreground/50">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditDialog(product)}
                                    data-ocid={`admin.product.edit_button.${index + 1}`}
                                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                                    aria-label={`Edit ${product.name}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(product)}
                                    data-ocid={`admin.product.delete_button.${index + 1}`}
                                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                                    aria-label={`Delete ${product.name}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <OrdersTab />
            </motion.div>
          </TabsContent>

          {/* Storefront Tab */}
          <TabsContent value="storefront">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StorefrontTab />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Product Dialog */}
      <Dialog
        open={editingProduct !== null}
        onOpenChange={(open) => {
          if (!open) setEditingProduct(null);
        }}
      >
        <DialogContent
          className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="admin.edit_product.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold text-foreground">
              Edit Product
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label
                htmlFor="edit-name"
                className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
              >
                Name *
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                className="bg-background border-border font-body text-sm"
                data-ocid="admin.edit_product.name_input"
              />
            </div>

            <div>
              <Label
                htmlFor="edit-desc"
                className="font-body text-xs tracking-widests uppercase text-muted-foreground mb-1.5 block"
              >
                Description
              </Label>
              <Textarea
                id="edit-desc"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-background border-border font-body text-sm resize-none"
                data-ocid="admin.edit_product.description_textarea"
                rows={3}
              />
            </div>

            <div>
              <Label
                htmlFor="edit-category"
                className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
              >
                Category *
              </Label>
              <Input
                id="edit-category"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, category: e.target.value }))
                }
                className="bg-background border-border font-body text-sm"
                data-ocid="admin.edit_product.category_input"
              />
            </div>

            <div>
              <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-2 block">
                Sizes & Prices *
              </Label>
              <div className="bg-background border border-border rounded-sm p-3">
                <SizePriceTable
                  rows={editForm.sizeRows}
                  onChange={(sizeRows) =>
                    setEditForm((f) => ({ ...f, sizeRows }))
                  }
                  ocidPrefix="admin.edit_product"
                />
              </div>
            </div>

            <div>
              <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block">
                Product Images
              </Label>
              <ImageUploader
                images={editForm.images}
                onChange={(images) => setEditForm((f) => ({ ...f, images }))}
                ocidPrefix="admin.edit_product"
              />
            </div>

            <div>
              <Label
                htmlFor="edit-stock-limit"
                className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
              >
                Stock Limit{" "}
                <span className="normal-case font-normal text-muted-foreground/60">
                  (leave blank for unlimited)
                </span>
              </Label>
              <Input
                id="edit-stock-limit"
                type="number"
                min="0"
                step="1"
                value={editForm.stockLimit}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, stockLimit: e.target.value }))
                }
                placeholder="e.g. 50"
                className="bg-background border-border font-body text-sm"
                data-ocid="admin.edit_product.stock_limit_input"
              />
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="edit-instock"
                checked={editForm.inStock}
                onCheckedChange={(checked) =>
                  setEditForm((f) => ({ ...f, inStock: checked === true }))
                }
                data-ocid="admin.edit_product.instock_checkbox"
              />
              <Label
                htmlFor="edit-instock"
                className="font-body text-sm text-foreground cursor-pointer"
              >
                In Stock
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingProduct(null)}
              data-ocid="admin.edit_product.cancel_button"
              className="border-border font-body text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              data-ocid="admin.edit_product.save_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border mt-10">
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
