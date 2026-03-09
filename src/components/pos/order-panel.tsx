"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { OrderItemPayload } from "./modifier-sheet";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);

export interface OrderItem extends OrderItemPayload {
  id: string; // unique identifier for this line item
}

interface OrderPanelProps {
  items: OrderItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearOrder: () => void;
  onSwitchUser: () => void;
}

export function OrderPanel({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onSwitchUser,
}: OrderPanelProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, orderItem) => {
    const modifierTotal = orderItem.selectedModifiers.reduce(
      (mSum, m) => mSum + Number(m.option.priceAdjustment),
      0
    );
    return sum + (Number(orderItem.item.price) + modifierTotal) * orderItem.quantity;
  }, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">Current Order</h2>
          <p className="text-xs text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onSwitchUser}>
          Switch User
        </Button>
      </div>

      {/* Order items */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center text-muted-foreground">
            <p>No items added</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
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
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {orderItem.item.name}
                      </p>
                    </div>
                    <p className="text-sm font-medium ml-2">
                      {formatPrice(lineTotal)}
                    </p>
                  </div>

                  {/* Modifiers */}
                  {orderItem.selectedModifiers.length > 0 && (
                    <div className="pl-2 space-y-0.5">
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
                    <p className="text-xs italic text-muted-foreground pl-2">
                      {orderItem.notes}
                    </p>
                  )}

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          onUpdateQuantity(
                            orderItem.id,
                            orderItem.quantity - 1
                          )
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">
                        {orderItem.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
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
                      className="h-7 w-7 text-destructive hover:text-destructive"
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
        <Separator />
        <div className="flex items-center justify-between">
          <span className="font-semibold">Subtotal</span>
          <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
        </div>

        <Button className="w-full h-11" disabled>
          Send to Kitchen
        </Button>

        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                className="w-full"
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
                onClick={() => setClearDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
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
