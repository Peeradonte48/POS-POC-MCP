import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
} from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  address: text("address"),
  taxId: varchar("tax_id", { length: 50 }),
  serviceChargePct: decimal("service_charge_pct", {
    precision: 5,
    scale: 2,
  }).default("10.00"),
  vatPct: decimal("vat_pct", { precision: 5, scale: 2 }).default("7.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
