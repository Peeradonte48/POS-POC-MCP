import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  menuCategories,
  menuItems,
  modifierGroups,
  modifierOptions,
} from "@/db/schema";
import { verifySession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    const brandId = session.brandId;

    // Verify category belongs to this brand
    const [category] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.id, categoryId),
          eq(menuCategories.brandId, brandId)
        )
      )
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Fetch items for this category (brand-scoped via category ownership)
    const items = await db
      .select()
      .from(menuItems)
      .where(
        and(
          eq(menuItems.categoryId, categoryId),
          eq(menuItems.brandId, brandId)
        )
      )
      .orderBy(asc(menuItems.name));

    // Fetch modifier groups for these items
    const itemIds = items.map((i) => i.id);
    let groups: (typeof modifierGroups.$inferSelect)[] = [];
    let options: (typeof modifierOptions.$inferSelect)[] = [];

    if (itemIds.length > 0) {
      groups = await db
        .select()
        .from(modifierGroups)
        .orderBy(asc(modifierGroups.sortOrder));

      options = await db
        .select()
        .from(modifierOptions)
        .orderBy(asc(modifierOptions.sortOrder));
    }

    // Build modifier groups with options
    const optionsByGroup = new Map<string, typeof options>();
    for (const opt of options) {
      const existing = optionsByGroup.get(opt.modifierGroupId) ?? [];
      existing.push(opt);
      optionsByGroup.set(opt.modifierGroupId, existing);
    }

    const itemIdSet = new Set(itemIds);
    const itemsWithModifiers = items.map((item) => {
      const itemGroups = groups
        .filter((g) => g.menuItemId === item.id && itemIdSet.has(item.id))
        .map((g) => ({
          ...g,
          options: optionsByGroup.get(g.id) ?? [],
        }));
      return { ...item, modifierGroups: itemGroups };
    });

    // Return as single-category response in same format
    const categoriesWithItems = [
      {
        ...category,
        items: itemsWithModifiers,
      },
    ];

    return NextResponse.json({ categories: categoriesWithItems });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
