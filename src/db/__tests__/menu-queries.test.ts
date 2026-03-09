import { describe, it, expect } from "vitest";
import {
  menuCategories,
  menuItems,
  modifierGroups,
  modifierOptions,
} from "@/db/schema/menu";
import { getTableName } from "drizzle-orm";

describe("menu schema", () => {
  describe("categories", () => {
    it("should have table name 'menu_categories'", () => {
      expect(getTableName(menuCategories)).toBe("menu_categories");
    });

    it("should have all required columns", () => {
      const columns = Object.keys(menuCategories);
      expect(columns).toContain("id");
      expect(columns).toContain("brandId");
      expect(columns).toContain("parentId");
      expect(columns).toContain("name");
      expect(columns).toContain("sortOrder");
      expect(columns).toContain("imageUrl");
      expect(columns).toContain("isActive");
      expect(columns).toContain("erpId");
    });

    it("should have parentId for hierarchical subcategories", () => {
      const columns = menuCategories as Record<string, unknown>;
      expect(columns.parentId).toBeDefined();
    });

    it("should be scoped by brandId", () => {
      const columns = menuCategories as Record<string, unknown>;
      expect(columns.brandId).toBeDefined();
    });
  });

  describe("items", () => {
    it("should have table name 'menu_items'", () => {
      expect(getTableName(menuItems)).toBe("menu_items");
    });

    it("should have all required columns", () => {
      const columns = Object.keys(menuItems);
      expect(columns).toContain("id");
      expect(columns).toContain("brandId");
      expect(columns).toContain("categoryId");
      expect(columns).toContain("name");
      expect(columns).toContain("description");
      expect(columns).toContain("price");
      expect(columns).toContain("imageUrl");
      expect(columns).toContain("isActive");
      expect(columns).toContain("erpId");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });

    it("should be scoped by brandId", () => {
      const columns = menuItems as Record<string, unknown>;
      expect(columns.brandId).toBeDefined();
    });
  });

  describe("modifiers", () => {
    it("should have table name 'modifier_groups'", () => {
      expect(getTableName(modifierGroups)).toBe("modifier_groups");
    });

    it("should have modifier type (single_select/multi_select)", () => {
      const columns = Object.keys(modifierGroups);
      expect(columns).toContain("modifierType");
      expect(columns).toContain("isRequired");
      expect(columns).toContain("minSelections");
      expect(columns).toContain("maxSelections");
    });

    it("should have modifier options with price adjustments", () => {
      expect(getTableName(modifierOptions)).toBe("modifier_options");
      const columns = Object.keys(modifierOptions);
      expect(columns).toContain("priceAdjustment");
      expect(columns).toContain("isDefault");
      expect(columns).toContain("isActive");
      expect(columns).toContain("sortOrder");
    });
  });

  describe("brand scope", () => {
    it("should have brandId on menu_categories for brand isolation", () => {
      const columns = Object.keys(menuCategories);
      expect(columns).toContain("brandId");
    });

    it("should have brandId on menu_items for brand isolation", () => {
      const columns = Object.keys(menuItems);
      expect(columns).toContain("brandId");
    });
  });
});
