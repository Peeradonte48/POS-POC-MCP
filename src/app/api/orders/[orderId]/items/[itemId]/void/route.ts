import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";
import { voidItemSchema } from "@/lib/void-schemas";

// ---------------------------------------------------------------------------
// POST /api/orders/:orderId/items/:itemId/void
// Soft-delete a single order item — requires manager-level auth.
// Sets voidedAt, voidReason, voidNote, voidedByUserId on the item.
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  const { session, error } = await requireAuth(request, "orders", "delete");
  if (error) return error;

  const { orderId, itemId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = voidItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { reason, note, authorizedByUserId } = parsed.data;

  try {
    // Verify the order belongs to this brand + location
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

    // Fetch the item and verify it belongs to this order
    const [item] = await db
      .select()
      .from(orderItems)
      .where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)));

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.voidedAt) {
      return NextResponse.json(
        { error: "Item is already voided" },
        { status: 400 }
      );
    }

    // Soft-delete the item
    const [updated] = await db
      .update(orderItems)
      .set({
        voidedAt: new Date(),
        voidReason: reason,
        voidNote: note ?? null,
        voidedByUserId: authorizedByUserId,
      })
      .where(eq(orderItems.id, itemId))
      .returning();

    return NextResponse.json({
      id: updated.id,
      orderId: updated.orderId,
      menuItemName: updated.menuItemName,
      quantity: updated.quantity,
      unitPrice: Number(updated.unitPrice),
      voidedAt: updated.voidedAt,
      voidReason: updated.voidReason,
      voidNote: updated.voidNote,
      voidedByUserId: updated.voidedByUserId,
    });
  } catch (err) {
    console.error("[POST /api/orders/:orderId/items/:itemId/void] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
