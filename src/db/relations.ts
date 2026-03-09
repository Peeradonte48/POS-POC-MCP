import { relations } from "drizzle-orm";
import { brands } from "./schema/brands";
import { locations } from "./schema/locations";
import { users } from "./schema/users";
import { terminals } from "./schema/terminals";
import {
  menuCategories,
  menuItems,
  modifierGroups,
  modifierOptions,
} from "./schema/menu";
import { syncLogs } from "./schema/sync-logs";

export const brandsRelations = relations(brands, ({ many }) => ({
  locations: many(locations),
  users: many(users),
  terminals: many(terminals),
  menuCategories: many(menuCategories),
  menuItems: many(menuItems),
  syncLogs: many(syncLogs),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  brand: one(brands, {
    fields: [locations.brandId],
    references: [brands.id],
  }),
  users: many(users),
  terminals: many(terminals),
}));

export const usersRelations = relations(users, ({ one }) => ({
  brand: one(brands, {
    fields: [users.brandId],
    references: [brands.id],
  }),
  location: one(locations, {
    fields: [users.locationId],
    references: [locations.id],
  }),
}));

export const terminalsRelations = relations(terminals, ({ one }) => ({
  brand: one(brands, {
    fields: [terminals.brandId],
    references: [brands.id],
  }),
  location: one(locations, {
    fields: [terminals.locationId],
    references: [locations.id],
  }),
}));

export const menuCategoriesRelations = relations(
  menuCategories,
  ({ one, many }) => ({
    brand: one(brands, {
      fields: [menuCategories.brandId],
      references: [brands.id],
    }),
    parent: one(menuCategories, {
      fields: [menuCategories.parentId],
      references: [menuCategories.id],
      relationName: "categoryHierarchy",
    }),
    children: many(menuCategories, {
      relationName: "categoryHierarchy",
    }),
    menuItems: many(menuItems),
  })
);

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  brand: one(brands, {
    fields: [menuItems.brandId],
    references: [brands.id],
  }),
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  modifierGroups: many(modifierGroups),
}));

export const modifierGroupsRelations = relations(
  modifierGroups,
  ({ one, many }) => ({
    menuItem: one(menuItems, {
      fields: [modifierGroups.menuItemId],
      references: [menuItems.id],
    }),
    options: many(modifierOptions),
  })
);

export const modifierOptionsRelations = relations(
  modifierOptions,
  ({ one }) => ({
    modifierGroup: one(modifierGroups, {
      fields: [modifierOptions.modifierGroupId],
      references: [modifierGroups.id],
    }),
  })
);

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  brand: one(brands, {
    fields: [syncLogs.brandId],
    references: [brands.id],
  }),
}));
