import { describe, it, expect } from "vitest";
import { z } from "zod";
import { hasPermission } from "@/lib/permissions";
import {
  voidItemSchema,
  voidOrderSchema,
  verifyPinSchema,
} from "@/lib/void-schemas";

// ---------------------------------------------------------------------------
// Zod schemas (mirroring what the API routes will define)
// ---------------------------------------------------------------------------

const voidReasonEnum = z.enum([
  "customer_changed_mind",
  "wrong_item",
  "food_quality",
  "staff_error",
  "other",
]);

const createOrderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  notes: z.string().optional(),
  modifiers: z
    .array(
      z.object({
        modifierOptionId: z.string().uuid().nullable().optional(),
        optionName: z.string().min(1),
        priceAdjustment: z.number(),
      })
    )
    .optional(),
});

// ORDR-01: Create order — requires tableNumber OR orderType counter/takeaway
const createOrderSchema = z
  .object({
    tableNumber: z.number().int().positive().nullable().optional(),
    orderType: z.enum(["table", "counter", "takeaway"]).default("table"),
    items: z.array(createOrderItemSchema).min(1),
  })
  .refine(
    (data) => {
      if (data.orderType === "table") {
        return data.tableNumber != null && data.tableNumber > 0;
      }
      return true;
    },
    {
      message: "tableNumber is required for table orders",
      path: ["tableNumber"],
    }
  );

// ORDR-04: Table transfer schema
const tableTransferSchema = z.object({
  tableNumber: z.number().int().positive(),
});

// ORDR-06: Void schema
const voidOrderItemSchema = z.object({
  voidReason: voidReasonEnum,
  voidNote: z.string().optional(),
  authorizedByUserId: z.string().uuid().optional(),
});

// Sent-item edit schema (ORDR-02): changing quantity on a sent item
const updateOrderItemSchema = z
  .object({
    quantity: z.number().int().min(1).optional(),
    notes: z.string().optional(),
    isSent: z.boolean(), // flag indicating if item was already sent to kitchen
  })
  .refine(
    (data) => {
      if (data.isSent && data.quantity !== undefined) {
        return false; // cannot change quantity of sent items
      }
      return true;
    },
    {
      message: "Cannot change quantity of a sent item",
      path: ["quantity"],
    }
  );

// ---------------------------------------------------------------------------
// ORDR-01: Order creation schema validation
// ---------------------------------------------------------------------------

describe("ORDR-01: Order creation schema validation", () => {
  it("should accept a valid table order with tableNumber and items", () => {
    const result = createOrderSchema.safeParse({
      tableNumber: 5,
      orderType: "table",
      items: [
        {
          menuItemId: "00000000-0000-0000-0000-000000000001",
          quantity: 2,
          unitPrice: 150,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should reject a table order missing tableNumber", () => {
    const result = createOrderSchema.safeParse({
      orderType: "table",
      items: [
        {
          menuItemId: "00000000-0000-0000-0000-000000000001",
          quantity: 1,
          unitPrice: 100,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("should reject an order with empty items array", () => {
    const result = createOrderSchema.safeParse({
      tableNumber: 3,
      orderType: "table",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject an item with quantity less than 1", () => {
    const result = createOrderSchema.safeParse({
      tableNumber: 1,
      orderType: "table",
      items: [
        {
          menuItemId: "00000000-0000-0000-0000-000000000001",
          quantity: 0,
          unitPrice: 100,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("should reject an item with negative unitPrice", () => {
    const result = createOrderSchema.safeParse({
      tableNumber: 1,
      orderType: "table",
      items: [
        {
          menuItemId: "00000000-0000-0000-0000-000000000001",
          quantity: 1,
          unitPrice: -10,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ORDR-02: Sent item edit rejection
// ---------------------------------------------------------------------------

describe("ORDR-02: Sent item quantity change rejection", () => {
  it("should allow quantity change on unsent item", () => {
    const result = updateOrderItemSchema.safeParse({
      quantity: 3,
      isSent: false,
    });
    expect(result.success).toBe(true);
  });

  it("should reject quantity change on a sent item", () => {
    const result = updateOrderItemSchema.safeParse({
      quantity: 3,
      isSent: true,
    });
    expect(result.success).toBe(false);
  });

  it("should allow notes change on a sent item (quantity untouched)", () => {
    const result = updateOrderItemSchema.safeParse({
      notes: "extra spicy",
      isSent: true,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ORDR-04: Table transfer schema
// ---------------------------------------------------------------------------

describe("ORDR-04: Table transfer schema", () => {
  it("should accept a positive integer tableNumber", () => {
    const result = tableTransferSchema.safeParse({ tableNumber: 7 });
    expect(result.success).toBe(true);
  });

  it("should reject tableNumber of 0", () => {
    const result = tableTransferSchema.safeParse({ tableNumber: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative tableNumber", () => {
    const result = tableTransferSchema.safeParse({ tableNumber: -3 });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer tableNumber", () => {
    const result = tableTransferSchema.safeParse({ tableNumber: 1.5 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ORDR-05: Counter order type
// ---------------------------------------------------------------------------

describe("ORDR-05: Counter order allows null tableNumber", () => {
  it("should accept counter order with null tableNumber", () => {
    const result = createOrderSchema.safeParse({
      tableNumber: null,
      orderType: "counter",
      items: [
        {
          menuItemId: "00000000-0000-0000-0000-000000000001",
          quantity: 1,
          unitPrice: 80,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should accept takeaway order with no tableNumber", () => {
    const result = createOrderSchema.safeParse({
      orderType: "takeaway",
      items: [
        {
          menuItemId: "00000000-0000-0000-0000-000000000001",
          quantity: 2,
          unitPrice: 120,
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ORDR-06: Void schema
// ---------------------------------------------------------------------------

describe("ORDR-06: Void order item schema", () => {
  it("should accept a valid void with required voidReason", () => {
    const result = voidOrderItemSchema.safeParse({
      voidReason: "wrong_item",
      authorizedByUserId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.success).toBe(true);
  });

  it("should accept void with optional voidNote", () => {
    const result = voidOrderItemSchema.safeParse({
      voidReason: "food_quality",
      voidNote: "Soup was cold",
      authorizedByUserId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.success).toBe(true);
  });

  it("should reject void with invalid voidReason value", () => {
    const result = voidOrderItemSchema.safeParse({
      voidReason: "bad_mood",
    });
    expect(result.success).toBe(false);
  });

  it("should reject void with missing voidReason", () => {
    const result = voidOrderItemSchema.safeParse({
      voidNote: "Forgot to add",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Permissions: cashier, manager, admin roles for orders resource
// ---------------------------------------------------------------------------

describe("Permissions: orders resource RBAC", () => {
  it("cashier can create orders", () => {
    expect(hasPermission("cashier", "orders", "create")).toBe(true);
  });

  it("cashier can update orders", () => {
    expect(hasPermission("cashier", "orders", "update")).toBe(true);
  });

  it("cashier cannot delete (void) orders", () => {
    expect(hasPermission("cashier", "orders", "delete")).toBe(false);
  });

  it("manager can create orders", () => {
    expect(hasPermission("manager", "orders", "create")).toBe(true);
  });

  it("manager can update orders", () => {
    expect(hasPermission("manager", "orders", "update")).toBe(true);
  });

  it("manager can delete (void) orders", () => {
    expect(hasPermission("manager", "orders", "delete")).toBe(true);
  });

  it("admin has all order permissions", () => {
    expect(hasPermission("admin", "orders", "create")).toBe(true);
    expect(hasPermission("admin", "orders", "update")).toBe(true);
    expect(hasPermission("admin", "orders", "delete")).toBe(true);
    expect(hasPermission("admin", "orders", "read")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// verify-pin schema (from void-schemas.ts)
// ---------------------------------------------------------------------------

describe("verify-pin schema", () => {
  it("should accept valid pin and requiredRole=manager", () => {
    const result = verifyPinSchema.safeParse({
      pin: "1234",
      requiredRole: "manager",
    });
    expect(result.success).toBe(true);
  });

  it("should accept requiredRole=admin", () => {
    const result = verifyPinSchema.safeParse({
      pin: "5678",
      requiredRole: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing pin", () => {
    const result = verifyPinSchema.safeParse({ requiredRole: "manager" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid requiredRole", () => {
    const result = verifyPinSchema.safeParse({ pin: "1234", requiredRole: "cashier" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// voidItemSchema — item-level void request body
// ---------------------------------------------------------------------------

describe("voidItemSchema", () => {
  it("should accept valid reason and authorizedByUserId", () => {
    const result = voidItemSchema.safeParse({
      reason: "wrong_item",
      authorizedByUserId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(true);
  });

  it("should accept with optional note", () => {
    const result = voidItemSchema.safeParse({
      reason: "food_quality",
      note: "Was cold",
      authorizedByUserId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid reason", () => {
    const result = voidItemSchema.safeParse({
      reason: "bad_mood",
      authorizedByUserId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing authorizedByUserId", () => {
    const result = voidItemSchema.safeParse({ reason: "wrong_item" });
    expect(result.success).toBe(false);
  });

  it("should reject non-uuid authorizedByUserId", () => {
    const result = voidItemSchema.safeParse({
      reason: "wrong_item",
      authorizedByUserId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// voidOrderSchema — order-level void request body
// ---------------------------------------------------------------------------

describe("voidOrderSchema", () => {
  it("should accept valid reason and authorizedByUserId", () => {
    const result = voidOrderSchema.safeParse({
      reason: "staff_error",
      authorizedByUserId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(true);
  });

  it("should accept with optional note", () => {
    const result = voidOrderSchema.safeParse({
      reason: "other",
      note: "Test void",
      authorizedByUserId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid reason", () => {
    const result = voidOrderSchema.safeParse({
      reason: "invalid_reason",
      authorizedByUserId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing authorizedByUserId", () => {
    const result = voidOrderSchema.safeParse({ reason: "staff_error" });
    expect(result.success).toBe(false);
  });
});
