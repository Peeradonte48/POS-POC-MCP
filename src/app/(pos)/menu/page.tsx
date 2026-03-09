"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategorySidebar } from "@/components/pos/category-sidebar";
import { MenuGrid } from "@/components/pos/menu-grid";
import { ModifierSheet } from "@/components/pos/modifier-sheet";
import { OrderPanel } from "@/components/pos/order-panel";
import { useMenu } from "@/hooks/use-menu";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X } from "lucide-react";
import type { MenuItem } from "@/hooks/use-menu";
import type { OrderItemPayload } from "@/components/pos/modifier-sheet";
import type { OrderItem } from "@/components/pos/order-panel";

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  const tableLabel =
    tableParam === "takeaway"
      ? "Takeaway"
      : tableParam
        ? `Table ${tableParam}`
        : null;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [modifierSheetOpen, setModifierSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);

  const { categories, isLoading } = useMenu();

  const displayItems = selectedCategoryId
    ? categories
        .filter((c) => c.id === selectedCategoryId)
        .flatMap((c) => c.items ?? [])
    : categories.flatMap((c) => c.items ?? []);

  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectItem = useCallback((item: MenuItem) => {
    if (item.modifierGroups.length > 0) {
      setSelectedItem(item);
      setModifierSheetOpen(true);
    } else {
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

  const handleChangeTable = useCallback(() => {
    router.push("/tables");
  }, [router]);

  const handleSwitchUser = useCallback(() => {
    router.push("/login");
  }, [router]);

  return (
    <>
      {/* Column 1: Category sidebar — hidden on small tablets, visible on larger screens */}
      <aside className="hidden md:block w-44 lg:w-52 border-r bg-card flex-shrink-0">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </aside>

      {/* Column 2: Item grid — full width on small tablets */}
      <main className="flex-1 overflow-y-auto bg-background flex flex-col min-w-0">
        {/* Mobile/small-tablet category bar */}
        <div className="md:hidden overflow-x-auto border-b bg-card">
          <div className="flex gap-1.5 p-2">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                selectedCategoryId === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent"
              }`}
            >
              All
            </button>
            {categories
              .filter((c) => !c.parentId && c.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategoryId === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-accent"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <MenuGrid
            items={displayItems}
            isLoading={isLoading}
            onSelectItem={handleSelectItem}
          />
        </div>
      </main>

      {/* Column 3: Order panel — always visible on large screens, slide-over on tablets */}

      {/* Desktop/large tablet: inline panel */}
      <aside className="hidden lg:block w-72 xl:w-80 border-l bg-card flex-shrink-0">
        <OrderPanel
          items={orderItems}
          tableLabel={tableLabel}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearOrder={handleClearOrder}
          onChangeTable={handleChangeTable}
          onSwitchUser={handleSwitchUser}
        />
      </aside>

      {/* Small/medium tablet: floating cart button + slide-over */}
      <div className="lg:hidden">
        {/* Floating cart button */}
        {!orderPanelOpen && (
          <button
            onClick={() => setOrderPanelOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="font-semibold">
              {tableLabel ?? "Order"}
            </span>
            {itemCount > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold">
                {itemCount}
              </span>
            )}
          </button>
        )}

        {/* Overlay */}
        {orderPanelOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOrderPanelOpen(false)}
          />
        )}

        {/* Slide-over panel */}
        <div
          className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-card border-l shadow-xl transition-transform duration-200 ${
            orderPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 cursor-pointer"
            onClick={() => setOrderPanelOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <OrderPanel
            items={orderItems}
            tableLabel={tableLabel}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearOrder={handleClearOrder}
            onChangeTable={handleChangeTable}
            onSwitchUser={handleSwitchUser}
          />
        </div>
      </div>

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

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
