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
import type { OrderItemPayload } from "./modifier-sheet";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);

export interface OrderItem extends OrderItemPayload {
  id: string;
}

interface OrderPanelProps {
  items: OrderItem[];
  tableLabel?: string | null;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearOrder: () => void;
  onChangeTable?: () => void;
  onSwitchUser: () => void;
}

export function OrderPanel({
  items,
  tableLabel,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onChangeTable,
  onSwitchUser,
}: OrderPanelProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, orderItem) => {
    const modifierTotal = orderItem.selectedModifiers.reduce(
      (mSum, m) => mSum + Number(m.option.priceAdjustment),
      0
    );
    return (
      sum + (Number(orderItem.item.price) + modifierTotal) * orderItem.quantity
    );
  }, 0);

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
                {tableLabel ?? "Order"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
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
        {items.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 opacity-20" />
            <p className="text-sm">No items added</p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {items.map((orderItem) => {
              const modifierTotal = orderItem.selectedModifiers.reduce(
                (sum, m) => sum + Number(m.option.priceAdjustment),
                0
              );
              const lineTotal =
                (Number(orderItem.item.price) + modifierTotal) *
                orderItem.quantity;

              return (
                <div
                  key={orderItem.id}
                  className="rounded-xl bg-muted/40 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground line-clamp-1">
                        {orderItem.item.name}
                      </p>
                    </div>
                    <p className="text-sm font-semibold ml-2 text-foreground">
                      {formatPrice(lineTotal)}
                    </p>
                  </div>

                  {/* Modifiers */}
                  {orderItem.selectedModifiers.length > 0 && (
                    <div className="pl-1 space-y-0.5">
                      {orderItem.selectedModifiers.map((mod) => (
                        <p
                          key={mod.option.id}
                          className="text-xs text-muted-foreground"
                        >
                          + {mod.option.name}
                          {Number(mod.option.priceAdjustment) !== 0 &&
                            ` (${formatPrice(Number(mod.option.priceAdjustment))})`}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {orderItem.notes && (
                    <p className="text-xs italic text-muted-foreground pl-1">
                      {orderItem.notes}
                    </p>
                  )}

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg cursor-pointer"
                        onClick={() =>
                          onUpdateQuantity(
                            orderItem.id,
                            orderItem.quantity - 1
                          )
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center text-sm font-medium">
                        {orderItem.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg cursor-pointer"
                        onClick={() =>
                          onUpdateQuantity(
                            orderItem.id,
                            orderItem.quantity + 1
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => onRemoveItem(orderItem.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-xl font-bold text-foreground">
            {formatPrice(subtotal)}
          </span>
        </div>

        <Button
          className="w-full h-12 text-base font-semibold gap-2 rounded-xl cursor-pointer"
          disabled={items.length === 0}
        >
          <ChefHat className="h-5 w-5" />
          Send to Kitchen
        </Button>

        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                className="w-full text-muted-foreground cursor-pointer"
                disabled={items.length === 0}
              />
            }
          >
            Clear Order
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear Order?</DialogTitle>
              <DialogDescription>
                This will remove all items from the current order. This action
                cannot be undone.
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
                Clear Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
