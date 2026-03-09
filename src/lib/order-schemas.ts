import { z } from "zod";

/**
 * Shared Zod schemas for order API routes.
 * Imported by:
 *   - src/app/api/orders/route.ts
 *   - src/app/api/orders/[orderId]/route.ts
 *   - src/app/api/orders/[orderId]/items/route.ts
 */

export const modifierSchema = z.object({
  modifierOptionId: z.string().uuid().optional(),
  optionName: z.string().min(1),
  priceAdjustment: z.number(),
});

export const itemSchema = z.object({
  menuItemId: z.string().uuid(),
  menuItemName: z.string().min(1), // snapshot: name at time of ordering
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  notes: z.string().optional(),
  selectedModifiers: z.array(modifierSchema).default([]),
  addedByUserId: z.string().uuid(),
});

export const createOrderSchema = z.object({
  tableNumber: z.number().int().positive().optional(),
  orderType: z.enum(["table", "counter", "takeaway"]),
  items: z.array(itemSchema).min(1),
});

export const addRoundSchema = z.object({
  items: z.array(itemSchema).min(1),
});

export const tableTransferSchema = z.object({
  tableNumber: z.number().int().positive(),
});

export type ModifierInput = z.infer<typeof modifierSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddRoundInput = z.infer<typeof addRoundSchema>;
export type TableTransferInput = z.infer<typeof tableTransferSchema>;
