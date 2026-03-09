import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql, count } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  orderItemModifiers,
} from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";
import { createOrderSchema } from "@/lib/order-schemas";

// ---------------------------------------------------------------------------
// POST /api/orders — Create a new order with items and modifiers
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth(request, "orders", "create");
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tableNumber, orderType, items } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      // Compute daily order number scoped to location + Bangkok timezone date
      const today = new Date()
        .toLocaleString("en-CA", { timeZone: "Asia/Bangkok" })
        .split(",")[0];

      const [{ orderCount }] = await tx
        .select({ orderCount: sql<number>`count(*)` })
        .from(orders)
        .where(
          and(
            eq(orders.locationId, session.locationId),
            sql`DATE(opened_at AT TIME ZONE 'Asia/Bangkok') = ${today}`
          )
        );

      const orderNumber = Number(orderCount) + 1;
      const now = new Date();

      // Insert the order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          brandId: session.brandId,
          locationId: session.locationId,
          tableNumber: tableNumber ?? null,
          orderType,
          status: "open",
          orderNumber,
          openedAt: now,
          createdByUserId: session.userId,
        })
        .returning();

      // Insert order items and modifiers
      const insertedItems = [];

      for (const item of items) {
        const [newItem] = await tx
          .insert(orderItems)
          .values({
            orderId: newOrder.id,
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            unitPrice: String(item.unitPrice),
            quantity: item.quantity,
            notes: item.notes ?? null,
            roundNumber: 1,
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

      return {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        orderType: newOrder.orderType,
        tableNumber: newOrder.tableNumber,
        status: newOrder.status,
        openedAt: newOrder.openedAt,
        items: insertedItems,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders — List open orders for the current location
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth(request, "orders", "read");
  if (error) return error;

  try {
    // Fetch open orders with item count subquery
    const openOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        tableNumber: orders.tableNumber,
        orderType: orders.orderType,
        status: orders.status,
        openedAt: orders.openedAt,
        itemCount: sql<number>`(
          SELECT COUNT(*) FROM order_items
          WHERE order_items.order_id = ${orders.id}
            AND order_items.voided_at IS NULL
        )`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.brandId, session.brandId),
          eq(orders.locationId, session.locationId),
          eq(orders.status, "open")
        )
      )
      .orderBy(orders.openedAt);

    return NextResponse.json(openOrders);
  } catch (err) {
    console.error("[GET /api/orders] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
