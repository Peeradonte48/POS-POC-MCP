"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CategorySidebar } from "@/components/pos/category-sidebar";
import { MenuGrid } from "@/components/pos/menu-grid";
import { ModifierSheet } from "@/components/pos/modifier-sheet";
import { OrderPanel } from "@/components/pos/order-panel";
import { useMenu } from "@/hooks/use-menu";
import type { MenuItem } from "@/hooks/use-menu";
import type { OrderItemPayload } from "@/components/pos/modifier-sheet";
import type { OrderItem } from "@/components/pos/order-panel";

export default function MenuPage() {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [modifierSheetOpen, setModifierSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const { categories, isLoading } = useMenu();

  // Filter items by selected category
  const displayItems = selectedCategoryId
    ? categories
        .filter((c) => c.id === selectedCategoryId)
        .flatMap((c) => c.items ?? [])
    : categories.flatMap((c) => c.items ?? []);

  const handleSelectItem = useCallback((item: MenuItem) => {
    if (item.modifierGroups.length > 0) {
      setSelectedItem(item);
      setModifierSheetOpen(true);
    } else {
      // No modifiers -- add directly with quantity 1
      const orderItem: OrderItem = {
        id: crypto.randomUUID(),
        item,
        quantity: 1,
        selectedModifiers: [],
        notes: "",
      };
      setOrderItems((prev) => [...prev, orderItem]);
    }
  }, []);

  const handleAddToOrder = useCallback((payload: OrderItemPayload) => {
    const orderItem: OrderItem = {
      id: crypto.randomUUID(),
      ...payload,
    };
    setOrderItems((prev) => [...prev, orderItem]);
  }, []);

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setOrderItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearOrder = useCallback(() => {
    setOrderItems([]);
  }, []);

  const handleSwitchUser = useCallback(() => {
    router.push("/login");
  }, [router]);

  return (
    <>
      {/* Column 1: Category sidebar */}
      <aside className="w-48 border-r bg-muted/30">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </aside>

      {/* Column 2: Item grid */}
      <main className="flex-1 overflow-y-auto">
        <MenuGrid
          items={displayItems}
          isLoading={isLoading}
          onSelectItem={handleSelectItem}
        />
      </main>

      {/* Column 3: Order panel */}
      <aside className="w-80 border-l bg-background">
        <OrderPanel
          items={orderItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearOrder={handleClearOrder}
          onSwitchUser={handleSwitchUser}
        />
      </aside>

      {/* Modifier bottom sheet */}
      <ModifierSheet
        item={selectedItem}
        open={modifierSheetOpen}
        onOpenChange={setModifierSheetOpen}
        onAddToOrder={handleAddToOrder}
      />
    </>
  );
}
