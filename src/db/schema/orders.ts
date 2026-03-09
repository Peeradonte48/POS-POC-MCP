import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  decimal,
  timestamp,
  text,
} from "drizzle-orm/pg-core";
import { brands } from "./brands";
import { locations } from "./locations";
import { users } from "./users";
import { menuItems } from "./menu";
import { modifierOptions } from "./menu";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const orderStatusEnum = pgEnum("order_status", ["open", "completed"]);

export const orderTypeEnum = pgEnum("order_type", [
  "table",
  "counter",
  "takeaway",
]);

export const voidReasonEnum = pgEnum("void_reason", [
  "customer_changed_mind",
  "wrong_item",
  "food_quality",
  "staff_error",
  "other",
]);

// ---------------------------------------------------------------------------
// orders table
// ---------------------------------------------------------------------------

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id),
  tableNumber: integer("table_number"),
  orderType: orderTypeEnum("order_type").notNull().default("table"),
  status: orderStatusEnum("status").notNull().default("open"),
  orderNumber: integer("order_number").notNull(),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// order_items table
// ---------------------------------------------------------------------------

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  menuItemId: uuid("menu_item_id").references(() => menuItems.id),
  menuItemName: varchar("menu_item_name", { length: 255 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  roundNumber: integer("round_number").default(1),
  sentAt: timestamp("sent_at"),
  voidedAt: timestamp("voided_at"),
  voidReason: voidReasonEnum("void_reason"),
  voidNote: text("void_note"),
  voidedByUserId: uuid("voided_by_user_id").references(() => users.id),
  addedByUserId: uuid("added_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// order_item_modifiers table
// ---------------------------------------------------------------------------

export const orderItemModifiers = pgTable("order_item_modifiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderItemId: uuid("order_item_id")
    .notNull()
    .references(() => orderItems.id),
  modifierOptionId: uuid("modifier_option_id").references(
    () => modifierOptions.id
  ),
  optionName: varchar("option_name", { length: 255 }).notNull(),
  priceAdjustment: decimal("price_adjustment", {
    precision: 10,
    scale: 2,
  }).notNull(),
});
