import { describe, it, expect } from "vitest";
import { locations } from "@/db/schema/locations";
import { getTableName } from "drizzle-orm";

describe("locations schema", () => {
  it("should have table name 'locations'", () => {
    expect(getTableName(locations)).toBe("locations");
  });

  it("should have all required columns", () => {
    const columns = Object.keys(locations);
    expect(columns).toContain("id");
    expect(columns).toContain("brandId");
    expect(columns).toContain("name");
    expect(columns).toContain("address");
    expect(columns).toContain("settings");
    expect(columns).toContain("isActive");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });

  it("should have brandId for multi-brand scoping", () => {
    const columns = locations as Record<string, unknown>;
    expect(columns.brandId).toBeDefined();
  });

  it("should have settings column for location-level configuration", () => {
    const columns = locations as Record<string, unknown>;
    expect(columns.settings).toBeDefined();
  });

  it("should allow constructing a valid insert object with settings JSON", () => {
    const insertData = {
      brandId: "uuid-here",
      name: "Central World Branch",
      address: "999/9 Rama I Rd",
      settings: {
        printerConfig: { ip: "192.168.1.100", port: 9100 },
        tableCount: 20,
      },
    };

    expect(insertData.settings.printerConfig.ip).toBe("192.168.1.100");
    expect(insertData.settings.tableCount).toBe(20);
  });
});
