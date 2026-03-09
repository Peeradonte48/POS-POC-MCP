import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";
import { voidOrderSchema } from "@/lib/void-schemas";

// ---------------------------------------------------------------------------
// POST /api/orders/:orderId/void
// Void an entire open order — requires manager-level auth.
// Sets voidedAt on the order and all non-voided items.
// Sets status="completed", completedAt=now on the order.
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { session, error } = await requireAuth(request, "orders", "delete");
  if (error) return error;

  const { orderId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = voidOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { reason: _reason, note, authorizedByUserId } = parsed.data;

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

    if (order.status !== "open") {
      return NextResponse.json(
        { error: "Only open orders can be voided" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Run in a transaction: void the order and all non-voided items
    const updatedOrder = await db.transaction(async (tx) => {
      // Void all non-voided items
      await tx
        .update(orderItems)
        .set({ voidedAt: now })
        .where(
          and(eq(orderItems.orderId, orderId), isNull(orderItems.voidedAt))
        );

      // Mark the order as completed + voided
      const [updated] = await tx
        .update(orders)
        .set({
          status: "completed",
          completedAt: now,
          voidedAt: now,
          voidedByUserId: authorizedByUserId,
          voidNote: note ?? null,
          updatedAt: now,
        })
        .where(eq(orders.id, orderId))
        .returning();

      return updated;
    });

    return NextResponse.json({
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      voidedAt: updatedOrder.voidedAt,
      voidedByUserId: updatedOrder.voidedByUserId,
      voidNote: updatedOrder.voidNote,
      completedAt: updatedOrder.completedAt,
    });
  } catch (err) {
    console.error("[POST /api/orders/:orderId/void] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
