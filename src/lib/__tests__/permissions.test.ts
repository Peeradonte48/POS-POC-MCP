import { describe, it, expect } from "vitest";
import { hasPermission, requirePermission } from "../permissions";

describe("RBAC Permissions", () => {
  describe("admin role", () => {
    it("has full access to brands", () => {
      expect(hasPermission("admin", "brands", "read")).toBe(true);
      expect(hasPermission("admin", "brands", "create")).toBe(true);
      expect(hasPermission("admin", "brands", "update")).toBe(true);
      expect(hasPermission("admin", "brands", "delete")).toBe(true);
    });

    it("has full access to locations", () => {
      expect(hasPermission("admin", "locations", "read")).toBe(true);
      expect(hasPermission("admin", "locations", "create")).toBe(true);
      expect(hasPermission("admin", "locations", "update")).toBe(true);
      expect(hasPermission("admin", "locations", "delete")).toBe(true);
    });

    it("has full access to staff", () => {
      expect(hasPermission("admin", "staff", "read")).toBe(true);
      expect(hasPermission("admin", "staff", "create")).toBe(true);
      expect(hasPermission("admin", "staff", "update")).toBe(true);
      expect(hasPermission("admin", "staff", "delete")).toBe(true);
    });

    it("can read and sync menu", () => {
      expect(hasPermission("admin", "menu", "read")).toBe(true);
      expect(hasPermission("admin", "menu", "sync")).toBe(true);
    });

    it("can read and update settings", () => {
      expect(hasPermission("admin", "settings", "read")).toBe(true);
      expect(hasPermission("admin", "settings", "update")).toBe(true);
    });

    it("can read reports", () => {
      expect(hasPermission("admin", "reports", "read")).toBe(true);
    });

    it("has full access to orders", () => {
      expect(hasPermission("admin", "orders", "read")).toBe(true);
      expect(hasPermission("admin", "orders", "create")).toBe(true);
      expect(hasPermission("admin", "orders", "update")).toBe(true);
      expect(hasPermission("admin", "orders", "delete")).toBe(true);
    });

    it("can sync", () => {
      expect(hasPermission("admin", "sync", "read")).toBe(true);
      expect(hasPermission("admin", "sync", "sync")).toBe(true);
    });
  });

  describe("manager role", () => {
    it("can read locations (own)", () => {
      expect(hasPermission("manager", "locations", "read")).toBe(true);
    });

    it("cannot create, update, or delete locations", () => {
      expect(hasPermission("manager", "locations", "create")).toBe(false);
      expect(hasPermission("manager", "locations", "update")).toBe(false);
      expect(hasPermission("manager", "locations", "delete")).toBe(false);
    });

    it("can read staff (own)", () => {
      expect(hasPermission("manager", "staff", "read")).toBe(true);
    });

    it("cannot modify staff", () => {
      expect(hasPermission("manager", "staff", "create")).toBe(false);
      expect(hasPermission("manager", "staff", "update")).toBe(false);
      expect(hasPermission("manager", "staff", "delete")).toBe(false);
    });

    it("can read menu", () => {
      expect(hasPermission("manager", "menu", "read")).toBe(true);
    });

    it("cannot modify menu", () => {
      expect(hasPermission("manager", "menu", "create")).toBe(false);
      expect(hasPermission("manager", "menu", "sync")).toBe(false);
    });

    it("can read reports (own)", () => {
      expect(hasPermission("manager", "reports", "read")).toBe(true);
    });

    it("cannot manage brands", () => {
      expect(hasPermission("manager", "brands", "read")).toBe(false);
      expect(hasPermission("manager", "brands", "create")).toBe(false);
      expect(hasPermission("manager", "brands", "update")).toBe(false);
      expect(hasPermission("manager", "brands", "delete")).toBe(false);
    });

    it("cannot modify settings", () => {
      expect(hasPermission("manager", "settings", "read")).toBe(false);
      expect(hasPermission("manager", "settings", "update")).toBe(false);
    });
  });

  describe("cashier role", () => {
    it("can read menu", () => {
      expect(hasPermission("cashier", "menu", "read")).toBe(true);
    });

    it("cannot modify menu", () => {
      expect(hasPermission("cashier", "menu", "create")).toBe(false);
      expect(hasPermission("cashier", "menu", "update")).toBe(false);
      expect(hasPermission("cashier", "menu", "delete")).toBe(false);
    });

    it("cannot access brands", () => {
      expect(hasPermission("cashier", "brands", "read")).toBe(false);
      expect(hasPermission("cashier", "brands", "create")).toBe(false);
    });

    it("cannot access locations", () => {
      expect(hasPermission("cashier", "locations", "read")).toBe(false);
    });

    it("cannot access staff", () => {
      expect(hasPermission("cashier", "staff", "read")).toBe(false);
    });

    it("cannot access settings", () => {
      expect(hasPermission("cashier", "settings", "read")).toBe(false);
    });

    it("cannot access reports", () => {
      expect(hasPermission("cashier", "reports", "read")).toBe(false);
    });
  });

  describe("requirePermission", () => {
    it("does not throw for allowed actions", () => {
      expect(() => requirePermission("admin", "brands", "create")).not.toThrow();
      expect(() => requirePermission("cashier", "menu", "read")).not.toThrow();
      expect(() => requirePermission("manager", "reports", "read")).not.toThrow();
    });

    it("throws for denied actions", () => {
      expect(() => requirePermission("cashier", "brands", "create")).toThrow();
      expect(() => requirePermission("manager", "brands", "delete")).toThrow();
      expect(() => requirePermission("cashier", "settings", "update")).toThrow();
    });

    it("throws with descriptive error message", () => {
      expect(() => requirePermission("cashier", "brands", "create")).toThrow(
        'Role "cashier" lacks "create" permission on "brands"'
      );
    });
  });

  describe("edge cases", () => {
    it("returns false for unknown resource", () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(hasPermission("admin", "nonexistent", "read")).toBe(false);
    });

    it("returns false for unknown action on valid resource", () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(hasPermission("admin", "brands", "nonexistent")).toBe(false);
    });
  });
});
