import { z } from "zod";

/**
 * Shared Zod schemas for void API routes.
 * Imported by:
 *   - src/app/api/auth/verify-pin/route.ts
 *   - src/app/api/orders/[orderId]/items/[itemId]/void/route.ts
 *   - src/app/api/orders/[orderId]/void/route.ts
 *   - src/app/api/__tests__/orders.test.ts
 */

export const voidReasonValues = [
  "customer_changed_mind",
  "wrong_item",
  "food_quality",
  "staff_error",
  "other",
] as const;

export type VoidReason = (typeof voidReasonValues)[number];

export const voidReasonSchema = z.enum(voidReasonValues);

// POST /api/auth/verify-pin body
export const verifyPinSchema = z.object({
  pin: z.string().min(1),
  requiredRole: z.enum(["manager", "admin"]),
});

export type VerifyPinInput = z.infer<typeof verifyPinSchema>;

// POST /api/orders/:orderId/items/:itemId/void body
export const voidItemSchema = z.object({
  reason: voidReasonSchema,
  note: z.string().optional(),
  authorizedByUserId: z.string().uuid(),
});

export type VoidItemInput = z.infer<typeof voidItemSchema>;

// POST /api/orders/:orderId/void body
export const voidOrderSchema = z.object({
  reason: voidReasonSchema,
  note: z.string().optional(),
  authorizedByUserId: z.string().uuid(),
});

export type VoidOrderInput = z.infer<typeof voidOrderSchema>;
