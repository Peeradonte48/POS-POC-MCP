"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CategorySidebar } from "@/components/pos/category-sidebar";
import { MenuGrid } from "@/components/pos/menu-grid";
import { ModifierSheet } from "@/components/pos/modifier-sheet";
import { OrderPanel } from "@/components/pos/order-panel";
import { useMenu } from "@/hooks/use-menu";
import { useSession } from "@/hooks/use-session";
import {
  useOrder,
  useActiveTableOrder,
  useSendToKitchen,
} from "@/hooks/use-order";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X } from "lucide-react";
import type { MenuItem } from "@/hooks/use-menu";
import type { OrderItemPayload } from "@/components/pos/modifier-sheet";
import type { PendingItem } from "@/hooks/use-order";

// ---------------------------------------------------------------------------
// Convert a PendingItem to the shape the API expects (items array element)
// ---------------------------------------------------------------------------

function toApiItem(
  item: PendingItem,
  addedByUserId: string
): {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  selectedModifiers: Array<{
    modifierOptionId?: string;
    optionName: string;
    priceAdjustment: number;
  }>;
  addedByUserId: string;
} {
  return {
    menuItemId: item.menuItemId,
    menuItemName: item.menuItemName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    notes: item.notes || undefined,
    selectedModifiers: item.selectedModifiers,
    addedByUserId,
  };
}

// ---------------------------------------------------------------------------
// MenuContent — inner component (has access to useSearchParams)
// ---------------------------------------------------------------------------

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const tableParamRaw = searchParams.get("table");
  const tableParam = tableParamRaw ? Number(tableParamRaw) : null;
  const orderIdParam = searchParams.get("orderId");
  const typeParam = searchParams.get("type");

  const isValidTable = tableParam !== null && !isNaN(tableParam) && tableParam > 0;
  const tableNumber = isValidTable ? tableParam : null;

  // Determine order type from URL
  const orderType: "table" | "counter" | "takeaway" =
    typeParam === "takeaway"
      ? "takeaway"
      : tableNumber !== null
        ? "table"
        : "counter";

  const tableLabel =
    typeParam === "takeaway"
      ? "Takeaway"
      : tableNumber !== null
        ? `Table ${tableNumber}`
        : null;

  // Session for addedByUserId
  const { user } = useSession();

  // Track resolved orderId in state — may be set from URL param, active lookup, or after first send
  const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(
    orderIdParam ?? null
  );

  // If no orderId in URL, look up an open order for this table (handles page refresh)
  const { data: activeTableOrder } = useActiveTableOrder(
    resolvedOrderId ? null : tableNumber
  );

  // Effective order ID: URL param → active lookup → state after send
  const effectiveOrderId =
    resolvedOrderId ?? activeTableOrder?.orderId ?? null;

  // Load existing order from server
  const { data: serverOrder } = useOrder(effectiveOrderId);

  // Client-side pending items (not yet sent to kitchen)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  // UI state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modifierSheetOpen, setModifierSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);

  const { categories, isLoading } = useMenu();
  const sendToKitchen = useSendToKitchen();

  const displayItems = selectedCategoryId
    ? categories
        .filter((c) => c.id === selectedCategoryId)
        .flatMap((c) => c.items ?? [])
    : categories.flatMap((c) => c.items ?? []);

  const pendingCount = pendingItems.reduce((sum, item) => sum + item.quantity, 0);

  // Build a PendingItem from a MenuItem (no modifiers)
  const buildPendingItem = useCallback((menuItem: MenuItem): PendingItem => {
    return {
      tempId: crypto.randomUUID(),
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      quantity: 1,
      unitPrice: Number(menuItem.price),
      notes: "",
      selectedModifiers: [],
    };
  }, []);

  const handleSelectItem = useCallback(
    (item: MenuItem) => {
      if (item.modifierGroups.length > 0) {
        setSelectedItem(item);
        setModifierSheetOpen(true);
      } else {
        const pendingItem = buildPendingItem(item);
        setPendingItems((prev) => [...prev, pendingItem]);
      }
    },
    [buildPendingItem]
  );

  // Called by ModifierSheet after user configures modifiers
  const handleAddToOrder = useCallback((payload: OrderItemPayload) => {
    const pendingItem: PendingItem = {
      tempId: crypto.randomUUID(),
      menuItemId: payload.item.id,
      menuItemName: payload.item.name,
      quantity: payload.quantity,
      unitPrice: Number(payload.item.price),
      notes: payload.notes,
      selectedModifiers: payload.selectedModifiers.map((mod) => ({
        modifierOptionId: mod.option.id,
        optionName: mod.option.name,
        priceAdjustment: Number(mod.option.priceAdjustment),
      })),
    };
    setPendingItems((prev) => [...prev, pendingItem]);
  }, []);

  const handleUpdateQuantity = useCallback((tempId: string, quantity: number) => {
    if (quantity <= 0) {
      setPendingItems((prev) => prev.filter((item) => item.tempId !== tempId));
    } else {
      setPendingItems((prev) =>
        prev.map((item) =>
          item.tempId === tempId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const handleRemoveItem = useCallback((tempId: string) => {
    setPendingItems((prev) => prev.filter((item) => item.tempId !== tempId));
  }, []);

  const handleClearOrder = useCallback(() => {
    setPendingItems([]);
  }, []);

  const handleChangeTable = useCallback(() => {
    router.push("/tables");
  }, [router]);

  const handleSwitchUser = useCallback(() => {
    router.push("/login");
  }, [router]);

  const handleSendToKitchen = useCallback(() => {
    if (pendingItems.length === 0) return;
    if (!user?.userId) {
      toast.error("Session expired. Please sign in again.");
      return;
    }

    const apiItems = pendingItems.map((item) =>
      toApiItem(item, user.userId)
    );

    const payload = effectiveOrderId
      ? { orderId: effectiveOrderId, items: apiItems }
      : { tableNumber: tableNumber ?? undefined, orderType, items: apiItems };

    sendToKitchen.mutate(payload, {
      onSuccess: (data) => {
        setPendingItems([]);
        const newOrderId = data.id ?? data.orderId;
        if (newOrderId) {
          setResolvedOrderId(newOrderId);
        }
        const orderNum = data.orderNumber ?? data.order?.orderNumber ?? "";
        toast.success(
          orderNum
            ? `Order #${orderNum} sent to kitchen`
            : "Sent to kitchen"
        );
      },
      onError: () => {
        toast.error("Failed to send. Please try again.");
      },
    });
  }, [
    pendingItems,
    user,
    effectiveOrderId,
    tableNumber,
    orderType,
    sendToKitchen,
  ]);

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
          serverOrder={serverOrder ?? null}
          pendingItems={pendingItems}
          tableLabel={tableLabel}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearOrder={handleClearOrder}
          onChangeTable={handleChangeTable}
          onSwitchUser={handleSwitchUser}
          onSend={handleSendToKitchen}
          isSending={sendToKitchen.isPending}
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
            {pendingCount > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold">
                {pendingCount}
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
            serverOrder={serverOrder ?? null}
            pendingItems={pendingItems}
            tableLabel={tableLabel}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearOrder={handleClearOrder}
            onChangeTable={handleChangeTable}
            onSwitchUser={handleSwitchUser}
            onSend={handleSendToKitchen}
            isSending={sendToKitchen.isPending}
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
