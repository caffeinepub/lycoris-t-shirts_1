import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCTS, type Product, formatPrice } from "@/data/products";
import { Lock, Package, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "lycoris-admin";

interface AdminProduct extends Product {
  isNew?: boolean;
}

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>(PRODUCTS);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    sizes: "",
  });

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
    if (!form.name || !form.price || !form.category) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const newProduct: AdminProduct = {
      id: Date.now(),
      name: form.name,
      description: form.description,
      price: Math.round(Number.parseFloat(form.price) * 100),
      category: form.category,
      sizes: form.sizes
        ? form.sizes
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean)
        : ["S", "M", "L"],
      imageUrl: "/assets/generated/tshirt-black.dim_600x600.jpg",
      inStock: true,
      isNew: true,
    };

    setProducts((prev) => [newProduct, ...prev]);
    setForm({ name: "", description: "", price: "", category: "", sizes: "" });
    toast.success(`"${newProduct.name}" added to catalog.`);
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
          className="mb-10"
        >
          <p className="text-primary font-body text-xs tracking-[0.2em] uppercase font-semibold mb-1">
            Admin Panel
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Product Management
          </h1>
        </motion.div>

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
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Product description..."
                    className="bg-background border-border font-body text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="product-price"
                    className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
                  >
                    Price (USD) *
                  </Label>
                  <Input
                    id="product-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="29.99"
                    className="bg-background border-border font-body text-sm"
                    required
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
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="product-sizes"
                    className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1.5 block"
                  >
                    Sizes (comma-separated)
                  </Label>
                  <Input
                    id="product-sizes"
                    value={form.sizes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sizes: e.target.value }))
                    }
                    placeholder="XS, S, M, L, XL"
                    className="bg-background border-border font-body text-sm"
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
                      <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                        Category
                      </TableHead>
                      <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground text-right">
                        Price
                      </TableHead>
                      <TableHead className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => (
                      <TableRow
                        key={product.id}
                        className="border-border hover:bg-muted/30"
                        data-ocid={`admin.product_form.row.${index + 1}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
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
                            {formatPrice(product.price)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs font-body ${
                              product.inStock
                                ? "text-green-400"
                                : "text-destructive"
                            }`}
                          >
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

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
