import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { brands } from "./brands";

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  settings: jsonb("settings").$type<{
    printerConfig?: { ip: string; port: number };
    tableCount?: number;
  }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
