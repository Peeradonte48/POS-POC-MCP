export type Role = "admin" | "manager" | "cashier";
export type Resource =
  | "brands"
  | "locations"
  | "staff"
  | "menu"
  | "settings"
  | "reports"
  | "orders"
  | "sync";
export type Action = "read" | "create" | "update" | "delete" | "sync";

const PERMISSIONS: Record<Role, Partial<Record<Resource, Action[]>>> = {
  admin: {
    brands: ["read", "create", "update", "delete"],
    locations: ["read", "create", "update", "delete"],
    staff: ["read", "create", "update", "delete"],
    menu: ["read", "sync"],
    settings: ["read", "update"],
    reports: ["read"],
    orders: ["read", "create", "update", "delete"],
    sync: ["read", "sync"],
  },
  manager: {
    locations: ["read"],
    staff: ["read"],
    menu: ["read"],
    reports: ["read"],
    orders: ["create", "update", "delete"],
  },
  cashier: {
    menu: ["read"],
    orders: ["create", "update"],
  },
};

export function hasPermission(
  role: Role,
  resource: Resource,
  action: Action
): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}

export function requirePermission(
  role: Role,
  resource: Resource,
  action: Action
): void {
  if (!hasPermission(role, resource, action)) {
    throw new Error(
      `Role "${role}" lacks "${action}" permission on "${resource}"`
    );
  }
}
