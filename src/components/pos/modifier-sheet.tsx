"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem, ModifierGroup, ModifierOption } from "@/hooks/use-menu";

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  option: ModifierOption;
}

export interface OrderItemPayload {
  item: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  notes: string;
}

interface ModifierSheetProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToOrder: (payload: OrderItemPayload) => void;
}

const formatPrice = (price: string | number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(Number(price));

export function ModifierSheet({
  item,
  open,
  onOpenChange,
  onAddToOrder,
}: ModifierSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Map<string, SelectedModifier[]>
  >(new Map());
  const [notes, setNotes] = useState("");

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSelectedModifiers(new Map());
      setNotes("");
    }
  }, [item]);

  if (!item) return null;

  const handleSingleSelect = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedModifiers((prev) => {
      const next = new Map(prev);
      next.set(group.id, [
        { groupId: group.id, groupName: group.name, option },
      ]);
      return next;
    });
  };

  const handleMultiSelect = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedModifiers((prev) => {
      const next = new Map(prev);
      const current = next.get(group.id) ?? [];
      const exists = current.find((m) => m.option.id === option.id);

      if (exists) {
        next.set(
          group.id,
          current.filter((m) => m.option.id !== option.id)
        );
      } else {
        if (
          group.maxSelections &&
          current.length >= group.maxSelections
        ) {
          return prev;
        }
        next.set(group.id, [
          ...current,
          { groupId: group.id, groupName: group.name, option },
        ]);
      }
      return next;
    });
  };

  const isOptionSelected = (groupId: string, optionId: string) => {
    const groupSelections = selectedModifiers.get(groupId) ?? [];
    return groupSelections.some((m) => m.option.id === optionId);
  };

  // Calculate total price
  const modifierTotal = Array.from(selectedModifiers.values())
    .flat()
    .reduce((sum, m) => sum + Number(m.option.priceAdjustment), 0);
  const itemTotal = (Number(item.price) + modifierTotal) * quantity;

  const allModifiers = Array.from(selectedModifiers.values()).flat();

  const handleAdd = () => {
    onAddToOrder({
      item,
      quantity,
      selectedModifiers: allModifiers,
      notes: notes.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            <div className="flex items-start gap-4">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div>
                <DrawerTitle>{item.name}</DrawerTitle>
                <DrawerDescription>
                  {formatPrice(item.price)}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-6">
            {/* Quantity stepper */}
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-lg font-medium">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modifier groups */}
            {item.modifierGroups
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((group) => (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">
                      {group.name}
                    </Label>
                    <Badge variant={group.isRequired ? "default" : "secondary"}>
                      {group.isRequired ? "Required" : "Optional"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {group.options
                      .filter((o) => o.isActive)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((option) => {
                        const selected = isOptionSelected(group.id, option.id);
                        const isSingle =
                          group.modifierType === "single_select";

                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            )}
                            onClick={() =>
                              isSingle
                                ? handleSingleSelect(group, option)
                                : handleMultiSelect(group, option)
                            }
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center border-2 transition-colors",
                                  isSingle ? "rounded-full" : "rounded-sm",
                                  selected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/40"
                                )}
                              >
                                {selected && (
                                  <div
                                    className={cn(
                                      "bg-primary-foreground",
                                      isSingle
                                        ? "h-2 w-2 rounded-full"
                                        : "h-2.5 w-2.5 rounded-[1px]"
                                    )}
                                  />
                                )}
                              </div>
                              <span className="text-sm">{option.name}</span>
                            </div>
                            {Number(option.priceAdjustment) !== 0 && (
                              <span className="text-sm text-muted-foreground">
                                +{formatPrice(option.priceAdjustment)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}

            {/* Notes field */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-medium">
                Special Instructions
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button className="w-full h-12 text-base" onClick={handleAdd}>
            Add to Order - {formatPrice(itemTotal)}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
