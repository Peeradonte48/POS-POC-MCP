import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  orderItemModifiers,
} from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";
import { tableTransferSchema } from "@/lib/order-schemas";

// ---------------------------------------------------------------------------
// GET /api/orders/:orderId — Fetch full order with items and modifiers
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { session, error } = await requireAuth(request, "orders", "read");
  if (error) return error;

  const { orderId } = await params;

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

    // Fetch items sorted by roundNumber ASC, createdAt ASC
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.roundNumber), asc(orderItems.createdAt));

    // Fetch all modifiers for all items in this order
    const itemIds = items.map((i) => i.id);
    let modifiers: (typeof orderItemModifiers.$inferSelect)[] = [];

    if (itemIds.length > 0) {
      // Fetch modifiers for each item (batch by orderId join)
      const allModifiers = await db
        .select({
          id: orderItemModifiers.id,
          orderItemId: orderItemModifiers.orderItemId,
          modifierOptionId: orderItemModifiers.modifierOptionId,
          optionName: orderItemModifiers.optionName,
          priceAdjustment: orderItemModifiers.priceAdjustment,
        })
        .from(orderItemModifiers)
        .innerJoin(orderItems, eq(orderItemModifiers.orderItemId, orderItems.id))
        .where(eq(orderItems.orderId, orderId));

      modifiers = allModifiers;
    }

    // Group modifiers by orderItemId
    const modifiersByItemId = new Map<string, typeof modifiers>();
    for (const mod of modifiers) {
      const existing = modifiersByItemId.get(mod.orderItemId) ?? [];
      existing.push(mod);
      modifiersByItemId.set(mod.orderItemId, existing);
    }

    // Build response shape
    const itemsWithModifiers = items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      notes: item.notes,
      roundNumber: item.roundNumber,
      sentAt: item.sentAt,
      voidedAt: item.voidedAt,
      voidReason: item.voidReason,
      addedByUserId: item.addedByUserId,
      modifiers: (modifiersByItemId.get(item.id) ?? []).map((m) => ({
        id: m.id,
        optionName: m.optionName,
        priceAdjustment: Number(m.priceAdjustment),
      })),
    }));

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      status: order.status,
      openedAt: order.openedAt,
      completedAt: order.completedAt,
      createdByUserId: order.createdByUserId,
      items: itemsWithModifiers,
    });
  } catch (err) {
    console.error("[GET /api/orders/:orderId] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/orders/:orderId — Transfer order to a different table
// ---------------------------------------------------------------------------

export async function PATCH(
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

  const parsed = tableTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tableNumber } = parsed.data;

  try {
    // Verify order exists and belongs to this brand + location
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

    if (order.status === "completed") {
      return NextResponse.json(
        { error: "Cannot transfer a completed order" },
        { status: 400 }
      );
    }

    // Update table number
    await db
      .update(orders)
      .set({ tableNumber, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Return full updated order (re-use GET logic)
    const updatedGetRequest = new NextRequest(request.url, {
      headers: request.headers,
    });

    return GET(updatedGetRequest, { params: Promise.resolve({ orderId }) });
  } catch (err) {
    console.error("[PATCH /api/orders/:orderId] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
