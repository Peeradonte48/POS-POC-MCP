import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "orders", "read");
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    // Get today's date in Asia/Bangkok timezone (YYYY-MM-DD)
    const today = new Date().toLocaleString("en-CA", { timeZone: "Asia/Bangkok" }).split(",")[0];

    // Fetch completed orders for today (Bangkok time) for this location
    const completedOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        orderType: orders.orderType,
        tableNumber: orders.tableNumber,
        completedAt: orders.completedAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.locationId, session.locationId),
          eq(orders.brandId, session.brandId),
          eq(orders.status, "completed"),
          sql`DATE(${orders.completedAt} AT TIME ZONE 'Asia/Bangkok') = ${today}::date`
        )
      )
      .orderBy(desc(orders.completedAt));

    if (completedOrders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const orderIds = completedOrders.map((o) => o.id);

    // Fetch non-voided items for all these orders (single query)
    const allItems = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        unitPrice: orderItems.unitPrice,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(
        and(
          inArray(orderItems.orderId, orderIds),
          isNull(orderItems.voidedAt)
        )
      );

    // Aggregate item count and total per order
    const orderAgg = new Map<string, { itemCount: number; total: number }>();
    for (const item of allItems) {
      const existing = orderAgg.get(item.orderId) ?? { itemCount: 0, total: 0 };
      const unitPrice = parseFloat(item.unitPrice as unknown as string);
      existing.itemCount += item.quantity;
      existing.total += unitPrice * item.quantity;
      orderAgg.set(item.orderId, existing);
    }

    // Build response
    const result = completedOrders.map((order) => {
      const agg = orderAgg.get(order.id) ?? { itemCount: 0, total: 0 };

      let label: string;
      if (order.orderType === "table" && order.tableNumber !== null) {
        label = `Table ${order.tableNumber}`;
      } else if (order.orderType === "counter") {
        label = "Counter";
      } else {
        label = "Takeaway";
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        label,
        itemCount: agg.itemCount,
        total: Math.round(agg.total * 100) / 100,
        completedAt: order.completedAt?.toISOString() ?? new Date().toISOString(),
      };
    });

    return NextResponse.json({ orders: result });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
