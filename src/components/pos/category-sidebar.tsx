"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/hooks/use-menu";

interface CategorySidebarProps {
  categories: MenuCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySidebarProps) {
  const parentCategories = categories.filter((c) => !c.parentId);
  const childCategories = categories.filter((c) => c.parentId);

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-3">
        {/* All items */}
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium transition-all cursor-pointer",
            selectedCategoryId === null
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground hover:bg-accent active:scale-[0.98]"
          )}
        >
          All Items
        </button>

        {/* Parent categories with optional children */}
        {parentCategories
          .filter((c) => c.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((category) => {
            const children = childCategories
              .filter((c) => c.parentId === category.id && c.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder);

            return (
              <div key={category.id}>
                <button
                  onClick={() => onSelectCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-3 w-full text-sm font-medium transition-all cursor-pointer text-left",
                    selectedCategoryId === category.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-accent active:scale-[0.98]"
                  )}
                >
                  {category.imageUrl && (
                    <img
                      src={category.imageUrl}
                      alt=""
                      className="h-7 w-7 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <span className="truncate">{category.name}</span>
                </button>

                {/* Child categories */}
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onSelectCategory(child.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl pl-7 pr-3 py-2.5 w-full text-sm transition-all cursor-pointer text-left",
                      selectedCategoryId === child.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground active:scale-[0.98]"
                    )}
                  >
                    {child.imageUrl && (
                      <img
                        src={child.imageUrl}
                        alt=""
                        className="h-5 w-5 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <span className="truncate">{child.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
      </div>
    </ScrollArea>
  );
}
