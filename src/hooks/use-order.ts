"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VoidReason } from "@/lib/void-schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderItemModifier {
  optionName: string;
  priceAdjustment: number;
}

export interface OrderWithItemsItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  roundNumber: number;
  sentAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  addedByUserId: string;
  modifiers: OrderItemModifier[];
}

export interface OrderWithItems {
  id: string;
  orderNumber: number;
  orderType: "table" | "counter" | "takeaway";
  tableNumber: number | null;
  status: "open" | "completed";
  openedAt: string;
  items: OrderWithItemsItem[];
}

export interface PendingItem {
  tempId: string; // crypto.randomUUID()
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  notes: string;
  selectedModifiers: Array<{
    modifierOptionId?: string;
    optionName: string;
    priceAdjustment: number;
  }>;
}

// ---------------------------------------------------------------------------
// Payload types for useSendToKitchen
// ---------------------------------------------------------------------------

export interface CreateOrderPayload {
  tableNumber?: number;
  orderType: "table" | "counter" | "takeaway";
  items: Array<{
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
  }>;
}

export interface AddRoundPayload {
  orderId: string;
  items: Array<{
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
  }>;
}

// ---------------------------------------------------------------------------
// useOrder — fetch a single order with all items and modifiers
// ---------------------------------------------------------------------------

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json() as Promise<OrderWithItems>;
    },
    enabled: !!orderId,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}

// ---------------------------------------------------------------------------
// useActiveTableOrder — find open order for a table (handles page refresh)
// ---------------------------------------------------------------------------

export function useActiveTableOrder(tableNumber: number | null) {
  return useQuery({
    queryKey: ["activeTableOrder", tableNumber],
    queryFn: async () => {
      if (!tableNumber) return null;
      const res = await fetch(`/api/orders/active?tableNumber=${tableNumber}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to check active order");
      return res.json() as Promise<{ orderId: string }>;
    },
    enabled: !!tableNumber,
    staleTime: 10 * 1000,
  });
}

// ---------------------------------------------------------------------------
// useSendToKitchen — create new order OR add a round to existing order
// ---------------------------------------------------------------------------

export function useSendToKitchen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload | AddRoundPayload) => {
      if ("orderId" in payload) {
        // Add items to existing order (round 2+)
        const res = await fetch(`/api/orders/${payload.orderId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payload.items }),
        });
        if (!res.ok) throw new Error("Failed to add items");
        return res.json();
      }
      // Create brand-new order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
    onSuccess: (data) => {
      // POST /api/orders returns { orderId, ... }, POST .../items returns { id, ... }
      const orderId = data.id ?? data.orderId;
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      }
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["activeTableOrder"] });
    },
  });
}

// ---------------------------------------------------------------------------
// useVoidItem — soft-delete a single sent order item
// ---------------------------------------------------------------------------

export function useVoidItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      itemId,
      reason,
      note,
      authorizedByUserId,
    }: {
      orderId: string;
      itemId: string;
      reason: VoidReason;
      note?: string;
      authorizedByUserId: string;
    }) => {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, note, authorizedByUserId }),
      });
      if (!res.ok) throw new Error("Void item failed");
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["order", vars.orderId] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

// ---------------------------------------------------------------------------
// useVoidOrder — void an entire open order
// ---------------------------------------------------------------------------

export function useVoidOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
      note,
      authorizedByUserId,
    }: {
      orderId: string;
      reason: VoidReason;
      note?: string;
      authorizedByUserId: string;
    }) => {
      const res = await fetch(`/api/orders/${orderId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, note, authorizedByUserId }),
      });
      if (!res.ok) throw new Error("Void order failed");
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["order", vars.orderId] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

// ---------------------------------------------------------------------------
// useTransferTable — move an open order to a different table
// ---------------------------------------------------------------------------

export function useTransferTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      tableNumber,
    }: {
      orderId: string;
      tableNumber: number;
    }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber }),
      });
      if (!res.ok) throw new Error("Transfer failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.setQueryData(["order", data.id], data);
    },
  });
}
