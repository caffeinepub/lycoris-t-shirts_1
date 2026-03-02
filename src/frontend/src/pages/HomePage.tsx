import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/data/products";
import type { Product } from "@/data/products";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface HomePageProps {
  onNavigate: (view: "shop") => void;
  onProductSelect: (product: Product) => void;
}

export function HomePage({ onNavigate, onProductSelect }: HomePageProps) {
  const featured = PRODUCTS.slice(0, 4);

  return (
    <main>
      {/* Hero Banner */}
      <section
        className="relative min-h-[500px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url('/assets/generated/hero-banner.dim_1200x500.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-2 mb-4"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary font-body text-xs tracking-[0.2em] uppercase font-semibold">
                New Collection 2026
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-foreground leading-[0.95] tracking-tight mb-6"
            >
              Wear the
              <br />
              <span className="text-primary italic">Bloom</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="font-body text-muted-foreground text-lg mb-8 leading-relaxed max-w-sm"
            >
              Premium tees inspired by the ephemeral beauty of the lycoris
              flower.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Button
                onClick={() => onNavigate("shop")}
                data-ocid="home.shop_now_button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-body font-semibold tracking-wider uppercase text-sm gap-2 group rounded-none"
              >
                Shop Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-primary font-body text-xs tracking-[0.2em] uppercase font-semibold mb-2">
              Curated Picks
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Featured Pieces
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("shop")}
            className="hidden sm:flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-primary transition-colors group"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onProductSelect(product)}
              index={i}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Button
            variant="outline"
            onClick={() => onNavigate("shop")}
            className="border-border text-foreground hover:border-primary hover:text-primary rounded-none font-body tracking-wider uppercase text-sm"
          >
            View All
          </Button>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="border-y border-border py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.blockquote
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground italic leading-relaxed"
          >
            "Every thread tells a story of the{" "}
            <span className="text-primary not-italic font-bold">lycoris</span> —
            resilient, radiant, unforgettable."
          </motion.blockquote>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-muted-foreground font-body text-sm tracking-widest uppercase"
          >
            — Lycoris Studio, Est. 2024
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img
            src="/assets/generated/lycoris-logo-transparent.dim_300x100.png"
            alt="Lycoris"
            className="h-8 w-auto object-contain opacity-70"
          />
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
          <nav className="flex gap-6 text-xs font-body text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-default">
              Privacy
            </span>
            <span className="hover:text-foreground transition-colors cursor-default">
              Terms
            </span>
          </nav>
        </div>
      </footer>
    </main>
  );
}
