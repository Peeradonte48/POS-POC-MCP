"use client";

import { useQuery } from "@tanstack/react-query";

export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  modifierType: "single_select" | "multi_select";
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  sortOrder: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string;
  modifierGroups: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  parentId: string | null;
  isActive: boolean;
  items: MenuItem[];
}

interface UseMenuReturn {
  categories: MenuCategory[];
  items: MenuItem[];
  isLoading: boolean;
  error: Error | null;
}

export function useMenu(categoryId?: string | null): UseMenuReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ["menu", categoryId ?? "all"],
    queryFn: async (): Promise<MenuCategory[]> => {
      const url = categoryId
        ? `/api/menu/${categoryId}`
        : "/api/menu";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch menu");
      }
      const json = await res.json();
      return json.categories;
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = data ?? [];
  const items = categories.flatMap((cat) => cat.items ?? []);

  return {
    categories,
    items,
    isLoading,
    error: error as Error | null,
  };
}
