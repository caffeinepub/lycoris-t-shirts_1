import { Badge } from "@/components/ui/badge";
import { type Product, formatPrice } from "@/data/products";
import { ShoppingBag } from "lucide-react";
import { motion } from "motion/react";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  index?: number;
}

export function ProductCard({ product, onClick, index = 0 }: ProductCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Image container */}
      <div className="relative overflow-hidden rounded-sm bg-muted aspect-square mb-3">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className="text-[10px] tracking-widest uppercase bg-background/80 backdrop-blur-sm text-muted-foreground border-0 font-body"
          >
            {product.category}
          </Badge>
        </div>

        {/* Quick add hint */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-primary/95 backdrop-blur-sm py-3 flex items-center justify-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary-foreground" />
          <span className="text-xs font-body font-semibold tracking-widest uppercase text-primary-foreground">
            View Details
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="font-body font-semibold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="font-display text-base font-semibold text-primary">
          {formatPrice(product.price)}
        </p>
      </div>
    </motion.article>
  );
}
