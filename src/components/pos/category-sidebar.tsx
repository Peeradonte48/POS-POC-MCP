"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
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
  // Separate parent (top-level) and child categories
  const parentCategories = categories.filter((c) => !c.parentId);
  const childCategories = categories.filter((c) => c.parentId);

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-2">
        {/* All items */}
        <Button
          variant={selectedCategoryId === null ? "default" : "ghost"}
          className="justify-start h-10"
          onClick={() => onSelectCategory(null)}
        >
          All
        </Button>

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
                <Button
                  variant={
                    selectedCategoryId === category.id ? "default" : "ghost"
                  }
                  className="justify-start h-10 w-full gap-2"
                  onClick={() => onSelectCategory(category.id)}
                >
                  {category.imageUrl && (
                    <img
                      src={category.imageUrl}
                      alt=""
                      className="h-6 w-6 rounded object-cover"
                    />
                  )}
                  <span className="truncate">{category.name}</span>
                </Button>

                {/* Child categories */}
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={
                      selectedCategoryId === child.id ? "default" : "ghost"
                    }
                    className={cn(
                      "justify-start h-9 w-full pl-6 text-sm gap-2"
                    )}
                    onClick={() => onSelectCategory(child.id)}
                  >
                    {child.imageUrl && (
                      <img
                        src={child.imageUrl}
                        alt=""
                        className="h-5 w-5 rounded object-cover"
                      />
                    )}
                    <span className="truncate">{child.name}</span>
                  </Button>
                ))}
              </div>
            );
          })}
      </div>
    </ScrollArea>
  );
}
