"use client";

import { MenuItemCard } from "./menu-item-card";
import type { MenuItem } from "@/hooks/use-menu";

interface MenuGridProps {
  items: MenuItem[];
  isLoading: boolean;
  onSelectItem: (item: MenuItem) => void;
}

export function MenuGrid({ items, isLoading, onSelectItem }: MenuGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 p-4 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No items in this category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4 xl:grid-cols-4">
      {items.map((item) => (
        <MenuItemCard key={item.id} item={item} onSelect={onSelectItem} />
      ))}
    </div>
  );
}
