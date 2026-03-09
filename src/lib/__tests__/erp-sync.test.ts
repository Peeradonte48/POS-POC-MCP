import { describe, it, expect } from "vitest";
import type { ERPSyncResponse, SyncResult, ERPCategory, ERPMenuItem } from "@/types/erp";

describe("ERP Sync Types", () => {
  it("should have valid ERPCategory shape", () => {
    const category: ERPCategory = {
      erpId: "cat-01",
      name: "Ramen",
      sortOrder: 1,
      imageUrl: "/images/ramen.jpg",
    };

    expect(category.erpId).toBe("cat-01");
    expect(category.name).toBe("Ramen");
    expect(category.sortOrder).toBe(1);
    expect(category.imageUrl).toBe("/images/ramen.jpg");
  });

  it("should allow optional parentErpId on category", () => {
    const child: ERPCategory = {
      erpId: "cat-02",
      name: "Sub Ramen",
      parentErpId: "cat-01",
      sortOrder: 1,
    };

    expect(child.parentErpId).toBe("cat-01");
  });

  it("should have valid ERPMenuItem shape", () => {
    const item: ERPMenuItem = {
      erpId: "item-01",
      categoryErpId: "cat-01",
      name: "Tonkotsu Ramen",
      description: "Rich pork bone broth",
      price: 290,
      imageUrl: "/images/tonkotsu.jpg",
    };

    expect(item.erpId).toBe("item-01");
    expect(item.categoryErpId).toBe("cat-01");
    expect(item.name).toBe("Tonkotsu Ramen");
    expect(item.price).toBe(290);
  });

  it("should have valid ERPMenuItem with modifier groups", () => {
    const item: ERPMenuItem = {
      erpId: "item-01",
      categoryErpId: "cat-01",
      name: "Tonkotsu Ramen",
      price: 290,
      modifierGroups: [
        {
          name: "Noodle Firmness",
          type: "single_select",
          isRequired: true,
          minSelections: 1,
          maxSelections: 1,
          options: [
            { name: "Soft", priceAdjustment: 0 },
            { name: "Medium", priceAdjustment: 0, isDefault: true },
            { name: "Firm", priceAdjustment: 0 },
          ],
        },
        {
          name: "Extra Toppings",
          type: "multi_select",
          isRequired: false,
          minSelections: 0,
          maxSelections: 5,
          options: [
            { name: "Extra Chashu", priceAdjustment: 60 },
            { name: "Extra Egg", priceAdjustment: 30 },
          ],
        },
      ],
    };

    expect(item.modifierGroups).toHaveLength(2);
    expect(item.modifierGroups![0].type).toBe("single_select");
    expect(item.modifierGroups![0].options).toHaveLength(3);
    expect(item.modifierGroups![1].type).toBe("multi_select");
    expect(item.modifierGroups![1].options[0].priceAdjustment).toBe(60);
  });

  it("should have valid ERPSyncResponse shape", () => {
    const response: ERPSyncResponse = {
      categories: [
        { erpId: "cat-01", name: "Ramen", sortOrder: 1 },
        { erpId: "cat-02", name: "Sides", sortOrder: 2 },
      ],
      items: [
        {
          erpId: "item-01",
          categoryErpId: "cat-01",
          name: "Tonkotsu",
          price: 290,
        },
      ],
    };

    expect(response.categories).toHaveLength(2);
    expect(response.items).toHaveLength(1);
  });

  it("should have valid SyncResult for success", () => {
    const result: SyncResult = {
      success: true,
      itemsSynced: 15,
      categoriesSynced: 5,
    };

    expect(result.success).toBe(true);
    expect(result.itemsSynced).toBe(15);
    expect(result.categoriesSynced).toBe(5);
    expect(result.errors).toBeUndefined();
  });

  it("should have valid SyncResult for failure", () => {
    const result: SyncResult = {
      success: false,
      itemsSynced: 0,
      categoriesSynced: 0,
      errors: ["Connection timeout", "Invalid data format"],
    };

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors![0]).toBe("Connection timeout");
  });
});
