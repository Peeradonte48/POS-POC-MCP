import { db } from "@/db";
import {
  menuCategories,
  menuItems,
  modifierGroups,
  modifierOptions,
} from "@/db/schema";
import { syncLogs } from "@/db/schema/sync-logs";
import { eq, and } from "drizzle-orm";
import type {
  ERPSyncResponse,
  ERPCategory,
  ERPMenuItem,
  SyncResult,
} from "@/types/erp";

/**
 * Fetch menu data from ERP. This is the adapter layer that will be swapped
 * for real ERP integration later. Currently returns mock data.
 */
export async function fetchERPMenu(brandId: string): Promise<ERPSyncResponse> {
  // Look up brand to determine which mock data to return
  const { brands } = await import("@/db/schema");
  const [brand] = await db
    .select({ name: brands.name })
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);

  if (!brand) {
    throw new Error(`Brand not found: ${brandId}`);
  }

  const brandName = brand.name.toLowerCase();

  if (brandName.includes("ramen") || brandName.includes("a ramen")) {
    return getMockRamenMenu();
  } else if (brandName.includes("burger")) {
    return getMockBurgerMenu();
  }

  // Default: return ramen menu for unknown brands
  return getMockRamenMenu();
}

function getMockRamenMenu(): ERPSyncResponse {
  const categories: ERPCategory[] = [
    { erpId: "cat-ramen-01", name: "Signature Ramen", sortOrder: 1, imageUrl: "/images/ramen.jpg" },
    { erpId: "cat-ramen-02", name: "Side Dishes", sortOrder: 2, imageUrl: "/images/sides.jpg" },
    { erpId: "cat-ramen-03", name: "Rice Bowls", sortOrder: 3 },
    { erpId: "cat-ramen-04", name: "Beverages", sortOrder: 4 },
    { erpId: "cat-ramen-05", name: "Desserts", sortOrder: 5 },
  ];

  const items: ERPMenuItem[] = [
    {
      erpId: "item-r-01", categoryErpId: "cat-ramen-01", name: "Tonkotsu Ramen",
      description: "Rich pork bone broth with chashu, egg, nori, green onion", price: 290,
      imageUrl: "/images/tonkotsu.jpg",
      modifierGroups: [
        {
          name: "Broth Intensity", type: "single_select", isRequired: true, minSelections: 1, maxSelections: 1,
          options: [
            { name: "Light (Assari)", priceAdjustment: 0, isDefault: true },
            { name: "Regular (Futsu)", priceAdjustment: 0 },
            { name: "Rich (Kotteri)", priceAdjustment: 0 },
          ],
        },
        {
          name: "Noodle Firmness", type: "single_select", isRequired: true, minSelections: 1, maxSelections: 1,
          options: [
            { name: "Soft (Yawa)", priceAdjustment: 0 },
            { name: "Medium (Futsu)", priceAdjustment: 0, isDefault: true },
            { name: "Firm (Kata)", priceAdjustment: 0 },
            { name: "Extra Firm (Bari-kata)", priceAdjustment: 0 },
          ],
        },
        {
          name: "Extra Toppings", type: "multi_select", isRequired: false, minSelections: 0, maxSelections: 5,
          options: [
            { name: "Extra Chashu", priceAdjustment: 60 },
            { name: "Extra Egg", priceAdjustment: 30 },
            { name: "Extra Nori", priceAdjustment: 20 },
            { name: "Corn", priceAdjustment: 20 },
            { name: "Bamboo Shoots", priceAdjustment: 20 },
          ],
        },
      ],
    },
    {
      erpId: "item-r-02", categoryErpId: "cat-ramen-01", name: "Shoyu Ramen",
      description: "Soy sauce based broth with chicken chashu", price: 260,
      imageUrl: "/images/shoyu.jpg",
      modifierGroups: [
        {
          name: "Noodle Firmness", type: "single_select", isRequired: true, minSelections: 1, maxSelections: 1,
          options: [
            { name: "Soft", priceAdjustment: 0 },
            { name: "Medium", priceAdjustment: 0, isDefault: true },
            { name: "Firm", priceAdjustment: 0 },
          ],
        },
      ],
    },
    {
      erpId: "item-r-03", categoryErpId: "cat-ramen-01", name: "Miso Ramen",
      description: "Hokkaido-style miso broth with butter and corn", price: 280,
    },
    {
      erpId: "item-r-04", categoryErpId: "cat-ramen-01", name: "Spicy Tantanmen",
      description: "Sesame and chili broth with ground pork", price: 300,
    },
    {
      erpId: "item-r-05", categoryErpId: "cat-ramen-02", name: "Gyoza (6 pcs)",
      description: "Pan-fried pork dumplings", price: 120,
    },
    {
      erpId: "item-r-06", categoryErpId: "cat-ramen-02", name: "Karaage",
      description: "Japanese fried chicken with mayo", price: 140,
    },
    {
      erpId: "item-r-07", categoryErpId: "cat-ramen-02", name: "Edamame",
      description: "Salted steamed soybeans", price: 80,
    },
    {
      erpId: "item-r-08", categoryErpId: "cat-ramen-03", name: "Chashu Don",
      description: "Rice bowl topped with sliced chashu and egg", price: 180,
    },
    {
      erpId: "item-r-09", categoryErpId: "cat-ramen-03", name: "Curry Rice",
      description: "Japanese curry with rice and pickles", price: 160,
    },
    {
      erpId: "item-r-10", categoryErpId: "cat-ramen-04", name: "Iced Green Tea",
      description: "Japanese green tea served cold", price: 60,
    },
    {
      erpId: "item-r-11", categoryErpId: "cat-ramen-04", name: "Ramune Soda",
      description: "Classic Japanese marble soda", price: 70,
    },
    {
      erpId: "item-r-12", categoryErpId: "cat-ramen-04", name: "Asahi Draft Beer",
      description: "Japanese draft beer 330ml", price: 150,
    },
    {
      erpId: "item-r-13", categoryErpId: "cat-ramen-05", name: "Matcha Ice Cream",
      description: "Green tea ice cream", price: 90,
    },
    {
      erpId: "item-r-14", categoryErpId: "cat-ramen-05", name: "Mochi (3 pcs)",
      description: "Assorted rice cake desserts", price: 100,
    },
    {
      erpId: "item-r-15", categoryErpId: "cat-ramen-01", name: "Tsukemen",
      description: "Dipping noodles with rich tonkotsu broth on the side", price: 310,
    },
  ];

  return { categories, items };
}

function getMockBurgerMenu(): ERPSyncResponse {
  const categories: ERPCategory[] = [
    { erpId: "cat-burger-01", name: "Classic Burgers", sortOrder: 1 },
    { erpId: "cat-burger-02", name: "Premium Burgers", sortOrder: 2 },
    { erpId: "cat-burger-03", name: "Sides", sortOrder: 3 },
    { erpId: "cat-burger-04", name: "Drinks", sortOrder: 4 },
    { erpId: "cat-burger-05", name: "Desserts", sortOrder: 5 },
  ];

  const items: ERPMenuItem[] = [
    {
      erpId: "item-b-01", categoryErpId: "cat-burger-01", name: "Classic Cheeseburger",
      description: "Beef patty with cheddar, lettuce, tomato, pickles", price: 220,
      modifierGroups: [
        {
          name: "Patty Size", type: "single_select", isRequired: true, minSelections: 1, maxSelections: 1,
          options: [
            { name: "Single", priceAdjustment: 0, isDefault: true },
            { name: "Double", priceAdjustment: 80 },
            { name: "Triple", priceAdjustment: 160 },
          ],
        },
        {
          name: "Add-ons", type: "multi_select", isRequired: false, minSelections: 0, maxSelections: 5,
          options: [
            { name: "Extra Cheese", priceAdjustment: 30 },
            { name: "Bacon", priceAdjustment: 40 },
            { name: "Fried Egg", priceAdjustment: 25 },
            { name: "Jalapenos", priceAdjustment: 15 },
          ],
        },
      ],
    },
    { erpId: "item-b-02", categoryErpId: "cat-burger-01", name: "Chicken Burger", description: "Grilled chicken breast with mayo", price: 200 },
    { erpId: "item-b-03", categoryErpId: "cat-burger-02", name: "Wagyu Burger", description: "Premium wagyu beef patty with truffle aioli", price: 450 },
    { erpId: "item-b-04", categoryErpId: "cat-burger-02", name: "BBQ Bacon Burger", description: "Double patty with BBQ sauce and crispy bacon", price: 320 },
    { erpId: "item-b-05", categoryErpId: "cat-burger-03", name: "French Fries", description: "Crispy golden fries", price: 90 },
    { erpId: "item-b-06", categoryErpId: "cat-burger-03", name: "Onion Rings", description: "Battered and fried onion rings", price: 100 },
    { erpId: "item-b-07", categoryErpId: "cat-burger-03", name: "Coleslaw", description: "Creamy coleslaw", price: 60 },
    { erpId: "item-b-08", categoryErpId: "cat-burger-04", name: "Coca-Cola", description: "330ml can", price: 50 },
    { erpId: "item-b-09", categoryErpId: "cat-burger-04", name: "Milkshake", description: "Vanilla, chocolate, or strawberry", price: 120 },
    { erpId: "item-b-10", categoryErpId: "cat-burger-04", name: "Craft Beer", description: "Local craft beer 330ml", price: 160 },
    { erpId: "item-b-11", categoryErpId: "cat-burger-05", name: "Brownie Sundae", description: "Warm brownie with ice cream", price: 140 },
    { erpId: "item-b-12", categoryErpId: "cat-burger-05", name: "Churros", description: "Cinnamon sugar churros with chocolate dip", price: 100 },
  ];

  return { categories, items };
}

/**
 * Sync menu from ERP for a specific brand. Wraps all operations in a
 * database transaction to prevent partial failures.
 */
export async function syncMenuFromERP(brandId: string): Promise<SyncResult> {
  // Create sync log entry
  const [logEntry] = await db
    .insert(syncLogs)
    .values({
      brandId,
      status: "in_progress",
      startedAt: new Date(),
    })
    .returning();

  try {
    const erpData = await fetchERPMenu(brandId);
    const errors: string[] = [];
    let categoriesSynced = 0;
    let itemsSynced = 0;

    await db.transaction(async (tx) => {
      // Map erpId -> db id for categories
      const categoryMap = new Map<string, string>();

      // Upsert categories
      for (const cat of erpData.categories) {
        const existing = await tx
          .select({ id: menuCategories.id })
          .from(menuCategories)
          .where(
            and(
              eq(menuCategories.erpId, cat.erpId),
              eq(menuCategories.brandId, brandId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await tx
            .update(menuCategories)
            .set({
              name: cat.name,
              sortOrder: cat.sortOrder,
              imageUrl: cat.imageUrl ?? null,
              isActive: true,
            })
            .where(eq(menuCategories.id, existing[0].id));
          categoryMap.set(cat.erpId, existing[0].id);
        } else {
          const [inserted] = await tx
            .insert(menuCategories)
            .values({
              brandId,
              erpId: cat.erpId,
              name: cat.name,
              sortOrder: cat.sortOrder,
              imageUrl: cat.imageUrl ?? null,
              isActive: true,
            })
            .returning({ id: menuCategories.id });
          categoryMap.set(cat.erpId, inserted.id);
        }
        categoriesSynced++;
      }

      // Upsert items
      for (const item of erpData.items) {
        const categoryId = categoryMap.get(item.categoryErpId);
        if (!categoryId) {
          errors.push(`Category not found for item ${item.name} (categoryErpId: ${item.categoryErpId})`);
          continue;
        }

        const existingItem = await tx
          .select({ id: menuItems.id })
          .from(menuItems)
          .where(
            and(
              eq(menuItems.erpId, item.erpId),
              eq(menuItems.brandId, brandId)
            )
          )
          .limit(1);

        let menuItemId: string;

        if (existingItem.length > 0) {
          await tx
            .update(menuItems)
            .set({
              categoryId,
              name: item.name,
              description: item.description ?? null,
              price: item.price.toString(),
              imageUrl: item.imageUrl ?? null,
              isActive: true,
              updatedAt: new Date(),
            })
            .where(eq(menuItems.id, existingItem[0].id));
          menuItemId = existingItem[0].id;
        } else {
          const [inserted] = await tx
            .insert(menuItems)
            .values({
              brandId,
              categoryId,
              erpId: item.erpId,
              name: item.name,
              description: item.description ?? null,
              price: item.price.toString(),
              imageUrl: item.imageUrl ?? null,
              isActive: true,
            })
            .returning({ id: menuItems.id });
          menuItemId = inserted.id;
        }

        // Sync modifier groups for this item
        if (item.modifierGroups) {
          // Delete existing modifier options and groups for this item, then re-insert
          const existingGroups = await tx
            .select({ id: modifierGroups.id })
            .from(modifierGroups)
            .where(eq(modifierGroups.menuItemId, menuItemId));

          for (const group of existingGroups) {
            await tx
              .delete(modifierOptions)
              .where(eq(modifierOptions.modifierGroupId, group.id));
          }
          if (existingGroups.length > 0) {
            await tx
              .delete(modifierGroups)
              .where(eq(modifierGroups.menuItemId, menuItemId));
          }

          // Insert new modifier groups and options
          for (let gi = 0; gi < item.modifierGroups.length; gi++) {
            const mg = item.modifierGroups[gi];
            const [insertedGroup] = await tx
              .insert(modifierGroups)
              .values({
                menuItemId,
                name: mg.name,
                modifierType: mg.type,
                isRequired: mg.isRequired,
                minSelections: mg.minSelections,
                maxSelections: mg.maxSelections ?? null,
                sortOrder: gi,
              })
              .returning({ id: modifierGroups.id });

            for (let oi = 0; oi < mg.options.length; oi++) {
              const opt = mg.options[oi];
              await tx.insert(modifierOptions).values({
                modifierGroupId: insertedGroup.id,
                name: opt.name,
                priceAdjustment: opt.priceAdjustment.toString(),
                isDefault: opt.isDefault ?? false,
                isActive: true,
                sortOrder: oi,
              });
            }
          }
        }

        itemsSynced++;
      }
    });

    // Update sync log
    await db
      .update(syncLogs)
      .set({
        status: "success",
        itemsSynced,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, logEntry.id));

    return {
      success: true,
      itemsSynced,
      categoriesSynced,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await db
      .update(syncLogs)
      .set({
        status: "error",
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, logEntry.id));

    return {
      success: false,
      itemsSynced: 0,
      categoriesSynced: 0,
      errors: [errorMessage],
    };
  }
}
