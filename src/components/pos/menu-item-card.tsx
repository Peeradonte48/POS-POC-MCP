"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/hooks/use-menu";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

const formatPrice = (price: string) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(Number(price));

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const isOutOfStock = !item.isActive;

  return (
    <button
      type="button"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all cursor-pointer",
        "hover:shadow-lg hover:border-primary/20 active:scale-[0.97]",
        isOutOfStock && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      onClick={() => {
        if (!isOutOfStock) onSelect(item);
      }}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent">
            <span className="text-3xl font-bold text-muted-foreground/40">
              {item.name.charAt(0)}
            </span>
          </div>
        )}
        {isOutOfStock && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 text-xs"
          >
            Out of Stock
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <p className="font-medium text-sm leading-tight line-clamp-2 text-card-foreground">
          {item.name}
        </p>
        <p className="text-sm font-semibold text-primary mt-1.5">
          {formatPrice(item.price)}
        </p>
      </div>
    </button>
  );
}

export { formatPrice };
