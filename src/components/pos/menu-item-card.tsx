"use client";

import { Card } from "@/components/ui/card";
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
  }).format(Number(price));

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const isOutOfStock = !item.isActive;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md active:shadow-sm select-none p-0 gap-0",
        isOutOfStock && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => {
        if (!isOutOfStock) onSelect(item);
      }}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-2xl">
            {item.name.charAt(0)}
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
      <div className="p-3">
        <p className="font-medium text-sm leading-tight truncate">
          {item.name}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {formatPrice(item.price)}
        </p>
      </div>
    </Card>
  );
}

export { formatPrice };
