import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  orderItemModifiers,
} from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";
import { addRoundSchema } from "@/lib/order-schemas";

// ---------------------------------------------------------------------------
// POST /api/orders/:orderId/items — Add a new round of items to an open order
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { session, error } = await requireAuth(request, "orders", "update");
  if (error) return error;

  const { orderId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = addRoundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items } = parsed.data;

  try {
    // Verify order exists, belongs to this brand + location, and is open
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.brandId, session.brandId),
          eq(orders.locationId, session.locationId)
        )
      );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "open") {
      return NextResponse.json(
        { error: "Cannot add items to a non-open order" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // Determine next round number
      const [{ maxRound }] = await tx
        .select({ maxRound: sql<number>`MAX(round_number)` })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const nextRound = (maxRound ?? 0) + 1;
      const now = new Date();
      const insertedItems = [];

      for (const item of items) {
        const [newItem] = await tx
          .insert(orderItems)
          .values({
            orderId,
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemId, // snapshot; client provides name or resolved server-side
            unitPrice: String(item.unitPrice),
            quantity: item.quantity,
            notes: item.notes ?? null,
            roundNumber: nextRound,
            sentAt: now,
            addedByUserId: item.addedByUserId,
          })
          .returning();

        // Insert modifiers for this item
        const insertedModifiers = [];
        for (const mod of item.selectedModifiers) {
          const [newMod] = await tx
            .insert(orderItemModifiers)
            .values({
              orderItemId: newItem.id,
              modifierOptionId: mod.modifierOptionId ?? null,
              optionName: mod.optionName,
              priceAdjustment: String(mod.priceAdjustment),
            })
            .returning();
          insertedModifiers.push({
            id: newMod.id,
            optionName: newMod.optionName,
            priceAdjustment: Number(newMod.priceAdjustment),
          });
        }

        insertedItems.push({
          id: newItem.id,
          menuItemId: newItem.menuItemId,
          menuItemName: newItem.menuItemName,
          quantity: newItem.quantity,
          unitPrice: Number(newItem.unitPrice),
          notes: newItem.notes,
          roundNumber: newItem.roundNumber,
          sentAt: newItem.sentAt,
          modifiers: insertedModifiers,
        });
      }

      return { roundNumber: nextRound, items: insertedItems };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders/:orderId/items] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
