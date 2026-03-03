import { ProductCard } from "@/components/ProductCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCTS } from "@/data/products";
import type { Product } from "@/data/products";
import { useBackendProducts } from "@/hooks/useBackendProducts";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

interface ShopPageProps {
  onProductSelect: (product: Product) => void;
}

export function ShopPage({ onProductSelect }: ShopPageProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const { products: backendProducts, loading } = useBackendProducts();

  // Use backend products if loaded, otherwise fall back to static seed data
  const products =
    backendProducts.length > 0 ? backendProducts : !loading ? PRODUCTS : [];

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...cats];
  }, [products]);

  const filtered =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <main className="min-h-screen">
      {/* Page Header */}
      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-primary font-body text-xs tracking-[0.2em] uppercase font-semibold mb-2">
              Collection
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              All Pieces
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="bg-card border border-border rounded-none h-auto p-0 gap-0 flex-wrap">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  data-ocid="shop.category_filter.tab"
                  className="font-body text-xs tracking-widest uppercase rounded-none border-r border-border last:border-r-0 px-5 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none text-muted-foreground"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div
            className="flex items-center justify-center py-24 gap-3 text-muted-foreground font-body text-sm"
            data-ocid="shop.products.loading_state"
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading catalog…
          </div>
        )}

        {/* Count */}
        {!loading && (
          <p className="text-muted-foreground font-body text-xs mb-6 tracking-wide">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </p>
        )}

        {/* Grid */}
        {!loading && filtered.length === 0 ? (
          <div
            className="py-24 text-center text-muted-foreground font-body"
            data-ocid="shop.products.empty_state"
          >
            No products in this category.
          </div>
        ) : !loading ? (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductSelect(product)}
                index={i}
              />
            ))}
          </motion.div>
        ) : null}
      </section>

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
