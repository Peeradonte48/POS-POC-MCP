import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test the zod schemas used in the brand API routes
const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  logoUrl: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  serviceChargePct: z.string().optional().nullable(),
  vatPct: z.string().optional().nullable(),
});

const updateBrandSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  serviceChargePct: z.string().optional().nullable(),
  vatPct: z.string().optional().nullable(),
});

describe("Brand API Validation", () => {
  describe("Create Brand", () => {
    it("should accept valid brand data", () => {
      const result = createBrandSchema.safeParse({
        name: "A RAMEN",
        logoUrl: "https://example.com/logo.png",
        address: "123 Main St",
        taxId: "1234567890",
        serviceChargePct: "10.00",
        vatPct: "7.00",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("A RAMEN");
      }
    });

    it("should accept minimal brand data (name only)", () => {
      const result = createBrandSchema.safeParse({
        name: "Burger Lab",
      });

      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = createBrandSchema.safeParse({
        name: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const result = createBrandSchema.safeParse({
        address: "123 Main St",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid logo URL", () => {
      const result = createBrandSchema.safeParse({
        name: "Test Brand",
        logoUrl: "not-a-url",
      });

      expect(result.success).toBe(false);
    });

    it("should accept null optional fields", () => {
      const result = createBrandSchema.safeParse({
        name: "Test Brand",
        logoUrl: null,
        address: null,
        taxId: null,
      });

      expect(result.success).toBe(true);
    });

    it("should reject name longer than 255 characters", () => {
      const result = createBrandSchema.safeParse({
        name: "x".repeat(256),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Update Brand", () => {
    it("should accept partial update", () => {
      const result = updateBrandSchema.safeParse({
        name: "Updated Name",
      });

      expect(result.success).toBe(true);
    });

    it("should accept empty object (no fields to update)", () => {
      const result = updateBrandSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("should accept all fields", () => {
      const result = updateBrandSchema.safeParse({
        name: "Updated",
        logoUrl: "https://example.com/new.png",
        address: "456 New St",
        taxId: "9876543210",
        serviceChargePct: "12.00",
        vatPct: "7.00",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid logo URL in update", () => {
      const result = updateBrandSchema.safeParse({
        logoUrl: "not-valid",
      });

      expect(result.success).toBe(false);
    });
  });
});
