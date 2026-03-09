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
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:gap-4 md:p-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border bg-card"
          >
            <div className="aspect-square animate-pulse bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
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
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:gap-4 md:p-5 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <MenuItemCard key={item.id} item={item} onSelect={onSelectItem} />
      ))}
    </div>
  );
}
