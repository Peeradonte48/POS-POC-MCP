import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  menuCategories,
  menuItems,
  modifierGroups,
  modifierOptions,
} from "@/db/schema";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    const brandId = session.brandId;

    // Fetch categories for this brand
    const categories = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.brandId, brandId))
      .orderBy(asc(menuCategories.sortOrder));

    // Fetch items for this brand with modifier groups and options
    const items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.brandId, brandId))
      .orderBy(asc(menuItems.name));

    const groups = await db
      .select()
      .from(modifierGroups)
      .orderBy(asc(modifierGroups.sortOrder));

    const options = await db
      .select()
      .from(modifierOptions)
      .orderBy(asc(modifierOptions.sortOrder));

    // Build modifier groups with options map
    const optionsByGroup = new Map<string, typeof options>();
    for (const opt of options) {
      const existing = optionsByGroup.get(opt.modifierGroupId) ?? [];
      existing.push(opt);
      optionsByGroup.set(opt.modifierGroupId, existing);
    }

    // Build items with modifier groups
    const itemGroupMap = new Map<string, (typeof groups[0] & { options: typeof options })[]>();
    for (const group of groups) {
      const groupWithOptions = {
        ...group,
        options: optionsByGroup.get(group.id) ?? [],
      };
      const existing = itemGroupMap.get(group.menuItemId) ?? [];
      existing.push(groupWithOptions);
      itemGroupMap.set(group.menuItemId, existing);
    }

    // Filter items to only those belonging to this brand and attach modifiers
    const brandItemIds = new Set(items.map((i) => i.id));
    const itemsWithModifiers = items.map((item) => ({
      ...item,
      modifierGroups: (itemGroupMap.get(item.id) ?? []).filter(() =>
        brandItemIds.has(item.id)
      ),
    }));

    // Build categories with nested items
    const categoriesWithItems = categories.map((cat) => ({
      ...cat,
      items: itemsWithModifiers.filter((item) => item.categoryId === cat.id),
    }));

    return NextResponse.json({ categories: categoriesWithItems });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
