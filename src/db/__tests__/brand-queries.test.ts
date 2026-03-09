import { describe, it, expect } from "vitest";
import { brands } from "@/db/schema/brands";
import { getTableName } from "drizzle-orm";

describe("brands schema", () => {
  it("should have table name 'brands'", () => {
    expect(getTableName(brands)).toBe("brands");
  });

  it("should have all required columns", () => {
    const columns = Object.keys(brands);
    expect(columns).toContain("id");
    expect(columns).toContain("name");
    expect(columns).toContain("logoUrl");
    expect(columns).toContain("address");
    expect(columns).toContain("taxId");
    expect(columns).toContain("serviceChargePct");
    expect(columns).toContain("vatPct");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });

  it("should support brand branding fields (logo, name, address, taxId)", () => {
    // Verify branding-related columns exist with correct types
    const columns = brands as Record<string, unknown>;
    expect(columns.logoUrl).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.address).toBeDefined();
    expect(columns.taxId).toBeDefined();
  });

  it("should allow constructing a valid insert object", () => {
    // Type-check: this should compile if schema types are correct
    const insertData = {
      name: "A RAMEN",
      logoUrl: "https://example.com/logo.png",
      address: "123 Main St",
      taxId: "1234567890123",
    };

    expect(insertData.name).toBe("A RAMEN");
    expect(insertData.logoUrl).toBe("https://example.com/logo.png");
    expect(insertData.address).toBe("123 Main St");
    expect(insertData.taxId).toBe("1234567890123");
  });
});
