/**
 * Order API Routes — Schema Tests (TDD)
 *
 * Tests for the Zod schemas defined in src/lib/order-schemas.ts
 * that are used by the three order API route files.
 *
 * These tests FAIL until order-schemas.ts is created.
 */
import { describe, it, expect } from "vitest";
import {
  modifierSchema,
  itemSchema,
  createOrderSchema,
  addRoundSchema,
  tableTransferSchema as routeTableTransferSchema,
} from "@/lib/order-schemas";

// ---------------------------------------------------------------------------
// modifierSchema
// ---------------------------------------------------------------------------

describe("modifierSchema", () => {
  it("accepts a modifier with optionName and priceAdjustment", () => {
    const result = modifierSchema.safeParse({
      optionName: "Extra Spicy",
      priceAdjustment: 20,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a modifier with optional modifierOptionId", () => {
    const result = modifierSchema.safeParse({
      modifierOptionId: "00000000-0000-0000-0000-000000000001",
      optionName: "No MSG",
      priceAdjustment: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a modifier with invalid modifierOptionId (not UUID)", () => {
    const result = modifierSchema.safeParse({
      modifierOptionId: "not-a-uuid",
      optionName: "No MSG",
      priceAdjustment: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a modifier missing optionName", () => {
    const result = modifierSchema.safeParse({
      priceAdjustment: 20,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// itemSchema
// ---------------------------------------------------------------------------

describe("itemSchema", () => {
  it("accepts a valid item with all required fields", () => {
    const result = itemSchema.safeParse({
      menuItemId: "00000000-0000-0000-0000-000000000001",
      menuItemName: "Tonkotsu Ramen",
      quantity: 2,
      unitPrice: 150,
      addedByUserId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid item with notes and selectedModifiers", () => {
    const result = itemSchema.safeParse({
      menuItemId: "00000000-0000-0000-0000-000000000001",
      menuItemName: "Tonkotsu Ramen",
      quantity: 1,
      unitPrice: 180,
      notes: "Extra spicy please",
      selectedModifiers: [
        { optionName: "Extra Chili", priceAdjustment: 10 },
      ],
      addedByUserId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.success).toBe(true);
  });

  it("defaults selectedModifiers to empty array when omitted", () => {
    const result = itemSchema.safeParse({
      menuItemId: "00000000-0000-0000-0000-000000000001",
      menuItemName: "Tonkotsu Ramen",
      quantity: 1,
      unitPrice: 100,
      addedByUserId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.selectedModifiers).toEqual([]);
    }
  });

  it("rejects an item with quantity less than 1", () => {
    const result = itemSchema.safeParse({
      menuItemId: "00000000-0000-0000-0000-000000000001",
      menuItemName: "Tonkotsu Ramen",
      quantity: 0,
      unitPrice: 100,
      addedByUserId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an item with negative unitPrice", () => {
    const result = itemSchema.safeParse({
      menuItemId: "00000000-0000-0000-0000-000000000001",
      menuItemName: "Tonkotsu Ramen",
      quantity: 1,
      unitPrice: -5,
      addedByUserId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an item missing addedByUserId", () => {
    const result = itemSchema.safeParse({
      menuItemId: "00000000-0000-0000-0000-000000000001",
      menuItemName: "Tonkotsu Ramen",
      quantity: 1,
      unitPrice: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an item missing menuItemName", () => {
    const result = itemSchema.safeParse({
      menuItemId: "00000000-0000-0000-0000-000000000001",
      quantity: 1,
      unitPrice: 100,
      addedByUserId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an item with invalid menuItemId (not UUID)", () => {
    const result = itemSchema.safeParse({
      menuItemId: "not-a-uuid",
      menuItemName: "Tonkotsu Ramen",
      quantity: 1,
      unitPrice: 100,
      addedByUserId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createOrderSchema (full order with items)
// ---------------------------------------------------------------------------

describe("createOrderSchema", () => {
  const validItem = {
    menuItemId: "00000000-0000-0000-0000-000000000001",
    menuItemName: "Tonkotsu Ramen",
    quantity: 2,
    unitPrice: 150,
    addedByUserId: "00000000-0000-0000-0000-000000000099",
  };

  it("accepts a valid table order", () => {
    const result = createOrderSchema.safeParse({
      tableNumber: 5,
      orderType: "table",
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a counter order with no tableNumber", () => {
    const result = createOrderSchema.safeParse({
      orderType: "counter",
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a takeaway order with no tableNumber", () => {
    const result = createOrderSchema.safeParse({
      orderType: "takeaway",
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty items array", () => {
    const result = createOrderSchema.safeParse({
      tableNumber: 3,
      orderType: "table",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an item missing addedByUserId", () => {
    const result = createOrderSchema.safeParse({
      tableNumber: 3,
      orderType: "table",
      items: [
        {
          menuItemId: "00000000-0000-0000-0000-000000000001",
          menuItemName: "Tonkotsu Ramen",
          quantity: 1,
          unitPrice: 100,
          // missing addedByUserId
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addRoundSchema (POST /api/orders/:id/items)
// ---------------------------------------------------------------------------

describe("addRoundSchema", () => {
  const validItem = {
    menuItemId: "00000000-0000-0000-0000-000000000001",
    menuItemName: "Tonkotsu Ramen",
    quantity: 1,
    unitPrice: 150,
    addedByUserId: "00000000-0000-0000-0000-000000000099",
  };

  it("accepts a valid array of items", () => {
    const result = addRoundSchema.safeParse({ items: [validItem] });
    expect(result.success).toBe(true);
  });

  it("rejects an empty items array", () => {
    const result = addRoundSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a missing items field", () => {
    const result = addRoundSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts multiple items with modifiers", () => {
    const result = addRoundSchema.safeParse({
      items: [
        validItem,
        {
          menuItemId: "00000000-0000-0000-0000-000000000002",
          menuItemName: "Shoyu Ramen",
          quantity: 2,
          unitPrice: 200,
          addedByUserId: "00000000-0000-0000-0000-000000000099",
          selectedModifiers: [
            { optionName: "Large", priceAdjustment: 50 },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// tableTransferSchema (from route — must also be exported from order-schemas)
// ---------------------------------------------------------------------------

describe("routeTableTransferSchema (from order-schemas)", () => {
  it("accepts a positive integer tableNumber", () => {
    const result = routeTableTransferSchema.safeParse({ tableNumber: 7 });
    expect(result.success).toBe(true);
  });

  it("rejects tableNumber of 0", () => {
    const result = routeTableTransferSchema.safeParse({ tableNumber: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative tableNumber", () => {
    const result = routeTableTransferSchema.safeParse({ tableNumber: -3 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer tableNumber", () => {
    const result = routeTableTransferSchema.safeParse({ tableNumber: 2.5 });
    expect(result.success).toBe(false);
  });
});
