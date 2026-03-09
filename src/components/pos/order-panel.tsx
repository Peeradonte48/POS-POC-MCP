"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Minus, Plus, Trash2, ShoppingBag, ChefHat } from "lucide-react";
import type { OrderWithItems, PendingItem } from "@/hooks/use-order";
import { VoidReasonDialog } from "@/components/pos/void-reason-dialog";

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OrderPanelProps {
  serverOrder: OrderWithItems | null;
  pendingItems: PendingItem[];
  tableLabel?: string | null;
  onUpdateQuantity: (tempId: string, quantity: number) => void;
  onRemoveItem: (tempId: string) => void;
  onClearOrder: () => void;
  onChangeTable?: () => void;
  onSwitchUser: () => void;
  onSend: () => void;
  isSending?: boolean;
}

// ---------------------------------------------------------------------------
// OrderPanel
// ---------------------------------------------------------------------------

export function OrderPanel({
  serverOrder,
  pendingItems,
  tableLabel,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onChangeTable,
  onSwitchUser,
  onSend,
  isSending = false,
}: OrderPanelProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [voidDialogState, setVoidDialogState] = useState<{
    open: boolean;
    mode: "item" | "order";
    itemId?: string;
  }>({ open: false, mode: "item" });

  // Group sent items by round number
  const sentItems = (serverOrder?.items ?? []).filter(
    (item) => item.voidedAt === null
  );
  const voidedItems = (serverOrder?.items ?? []).filter(
    (item) => item.voidedAt !== null
  );

  const roundNumbers = Array.from(
    new Set(sentItems.map((item) => item.roundNumber))
  ).sort((a, b) => a - b);

  // Calculate subtotals
  const sentSubtotal = sentItems.reduce((sum, item) => {
    const modTotal = item.modifiers.reduce(
      (mSum, m) => mSum + m.priceAdjustment,
      0
    );
    return sum + (item.unitPrice + modTotal) * item.quantity;
  }, 0);

  const pendingSubtotal = pendingItems.reduce((sum, item) => {
    const modTotal = item.selectedModifiers.reduce(
      (mSum, m) => mSum + m.priceAdjustment,
      0
    );
    return sum + (item.unitPrice + modTotal) * item.quantity;
  }, 0);

  const grandTotal = sentSubtotal + pendingSubtotal;

  const pendingCount = pendingItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasSentItems = sentItems.length > 0 || voidedItems.length > 0;
  const hasAnyItems = hasSentItems || pendingItems.length > 0;

  const sendLabel =
    pendingItems.length > 0
      ? `Send ${pendingItems.length} item${pendingItems.length > 1 ? "s" : ""}`
      : "Send to Kitchen";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">
                {serverOrder
                  ? `#${serverOrder.orderNumber} — ${tableLabel ?? "Order"}`
                  : (tableLabel ?? "Order")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {pendingCount} unsent{" "}
                {hasSentItems && `· ${sentItems.length} sent`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs cursor-pointer"
            onClick={onSwitchUser}
          >
            Switch User
          </Button>
        </div>
        {onChangeTable && (
          <button
            onClick={onChangeTable}
            className="text-xs text-primary/70 hover:text-primary transition-colors cursor-pointer"
          >
            Change table
          </button>
        )}
      </div>

      {/* Order items */}
      <ScrollArea className="flex-1">
        {!hasAnyItems ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 opacity-20" />
            <p className="text-sm">No items added</p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {/* Sent items grouped by round */}
            {roundNumbers.map((round) => {
              const roundItems = sentItems.filter(
                (item) => item.roundNumber === round
              );
              return (
                <div key={round} className="space-y-1">
                  {/* Round label */}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 pt-1">
                    Round {round}
                  </p>
                  {roundItems.map((item) => {
                    const modTotal = item.modifiers.reduce(
                      (sum, m) => sum + m.priceAdjustment,
                      0
                    );
                    const lineTotal =
                      (item.unitPrice + modTotal) * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl bg-muted/20 p-3 space-y-1 opacity-60"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {item.quantity} × {item.menuItemName}
                            </p>
                            {item.modifiers.map((mod, i) => (
                              <p
                                key={i}
                                className="text-xs text-muted-foreground/70 pl-1"
                              >
                                + {mod.optionName}
                              </p>
                            ))}
                            {item.notes && (
                              <p className="text-xs italic text-muted-foreground/70 pl-1">
                                {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 ml-2">
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(lineTotal)}
                            </p>
                            <span className="text-[10px] font-medium bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                              Sent
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive cursor-pointer"
                              onClick={() =>
                                setVoidDialogState({
                                  open: true,
                                  mode: "item",
                                  itemId: item.id,
                                })
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Voided items */}
            {voidedItems.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 px-1 pt-1">
                  Voided
                </p>
                {voidedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-muted/10 p-3 opacity-40"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-muted-foreground line-through line-clamp-1">
                        {item.quantity} × {item.menuItemName}
                      </p>
                      {item.voidReason && (
                        <p className="text-xs text-muted-foreground/60 ml-2">
                          {item.voidReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending items — not yet sent */}
            {pendingItems.length > 0 && (
              <div className="space-y-1">
                {hasSentItems && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 px-1 pt-2">
                    New items
                  </p>
                )}
                {pendingItems.map((item) => {
                  const modTotal = item.selectedModifiers.reduce(
                    (sum, m) => sum + m.priceAdjustment,
                    0
                  );
                  const lineTotal =
                    (item.unitPrice + modTotal) * item.quantity;

                  return (
                    <div
                      key={item.tempId}
                      className="rounded-xl bg-muted/40 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground line-clamp-1">
                            {item.menuItemName}
                          </p>
                          {item.selectedModifiers.map((mod, i) => (
                            <p
                              key={i}
                              className="text-xs text-muted-foreground pl-1"
                            >
                              + {mod.optionName}
                              {mod.priceAdjustment !== 0 &&
                                ` (${formatPrice(mod.priceAdjustment)})`}
                            </p>
                          ))}
                          {item.notes && (
                            <p className="text-xs italic text-muted-foreground pl-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold ml-2 text-foreground">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg cursor-pointer"
                            onClick={() =>
                              onUpdateQuantity(item.tempId, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg cursor-pointer"
                            onClick={() =>
                              onUpdateQuantity(item.tempId, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                          onClick={() => onRemoveItem(item.tempId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {hasSentItems && pendingItems.length > 0 ? "Total" : "Subtotal"}
          </span>
          <span className="text-xl font-bold text-foreground">
            {formatPrice(grandTotal)}
          </span>
        </div>

        <Button
          className="w-full h-12 text-base font-semibold gap-2 rounded-xl cursor-pointer"
          disabled={pendingItems.length === 0 || isSending}
          onClick={onSend}
        >
          <ChefHat className="h-5 w-5" />
          {isSending ? "Sending..." : sendLabel}
        </Button>

        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                className="w-full text-muted-foreground cursor-pointer"
                disabled={pendingItems.length === 0}
              />
            }
          >
            Clear New Items
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear New Items?</DialogTitle>
              <DialogDescription>
                This will remove all unsent items. Already-sent items will not
                be affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setClearDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={() => {
                  onClearOrder();
                  setClearDialogOpen(false);
                }}
              >
                Clear Items
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Void Order button — visible only when there is an open server order */}
        {serverOrder && serverOrder.status === "open" && (
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive cursor-pointer"
            onClick={() =>
              setVoidDialogState({ open: true, mode: "order" })
            }
          >
            Void Order
          </Button>
        )}
      </div>

      {/* Void reason dialog */}
      {serverOrder && (
        <VoidReasonDialog
          open={voidDialogState.open}
          onOpenChange={(open) =>
            setVoidDialogState((prev) => ({ ...prev, open }))
          }
          mode={voidDialogState.mode}
          orderId={serverOrder.id}
          itemId={voidDialogState.itemId}
          onSuccess={() => {
            setVoidDialogState({ open: false, mode: "item" });
          }}
        />
      )}
    </div>
  );
}
