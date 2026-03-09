import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { brands } from "./brands";

export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id),
  parentId: uuid("parent_id"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  erpId: varchar("erp_id", { length: 100 }),
});

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => menuCategories.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  erpId: varchar("erp_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const modifierTypeEnum = pgEnum("modifier_type", [
  "single_select",
  "multi_select",
]);

export const modifierGroups = pgTable("modifier_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  name: varchar("name", { length: 255 }).notNull(),
  modifierType: modifierTypeEnum("modifier_type").notNull(),
  isRequired: boolean("is_required").default(false),
  minSelections: integer("min_selections").default(0),
  maxSelections: integer("max_selections"),
  sortOrder: integer("sort_order").default(0),
});

export const modifierOptions = pgTable("modifier_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  modifierGroupId: uuid("modifier_group_id")
    .notNull()
    .references(() => modifierGroups.id),
  name: varchar("name", { length: 255 }).notNull(),
  priceAdjustment: decimal("price_adjustment", {
    precision: 10,
    scale: 2,
  }).default("0"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});
