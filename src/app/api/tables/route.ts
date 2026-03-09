import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { locations, orders, orderItems, orderItemModifiers } from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "orders", "read");
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, session.locationId))
      .limit(1);

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const tableCount =
      (location.settings as { tableCount?: number })?.tableCount ?? 0;

    // 1. Fetch all open table orders for this location (single query)
    const openOrders = await db
      .select({
        id: orders.id,
        tableNumber: orders.tableNumber,
        openedAt: orders.openedAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.locationId, session.locationId),
          eq(orders.brandId, session.brandId),
          eq(orders.status, "open")
        )
      );

    const tableOrders = openOrders.filter((o) => o.tableNumber !== null);

    if (tableOrders.length > 0) {
      const orderIds = tableOrders.map((o) => o.id);

      // 2. Fetch all non-voided items for these orders (single query)
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

      // 3. Fetch all modifiers for those items (single query)
      const itemIds = allItems.map((i) => i.id);
      const allModifiers =
        itemIds.length > 0
          ? await db
              .select({
                orderItemId: orderItemModifiers.orderItemId,
                priceAdjustment: orderItemModifiers.priceAdjustment,
              })
              .from(orderItemModifiers)
              .where(inArray(orderItemModifiers.orderItemId, itemIds))
          : [];

      // 4. Aggregate modifiers by item
      const modifiersByItem = new Map<string, number>();
      for (const mod of allModifiers) {
        const existing = modifiersByItem.get(mod.orderItemId) ?? 0;
        modifiersByItem.set(
          mod.orderItemId,
          existing + parseFloat(mod.priceAdjustment as unknown as string)
        );
      }

      // 5. Aggregate order totals by orderId
      const orderTotals = new Map<string, number>();
      for (const item of allItems) {
        const unitPrice = parseFloat(item.unitPrice as unknown as string);
        const modifierSum = modifiersByItem.get(item.id) ?? 0;
        const itemTotal = (unitPrice + modifierSum) * item.quantity;
        orderTotals.set(item.orderId, (orderTotals.get(item.orderId) ?? 0) + itemTotal);
      }

      // 6. Build tableNumber -> order map
      const now = Date.now();
      const NEEDS_ATTENTION_MS = 90 * 60 * 1000;

      const tableOrderMap = new Map<
        number,
        { orderId: string; openedAt: Date; orderTotal: number; status: "occupied" | "needs_attention" }
      >();

      for (const order of tableOrders) {
        const total = orderTotals.get(order.id) ?? 0;
        const elapsed = now - order.openedAt.getTime();
        const status = elapsed >= NEEDS_ATTENTION_MS ? "needs_attention" as const : "occupied" as const;
        tableOrderMap.set(order.tableNumber!, {
          orderId: order.id,
          openedAt: order.openedAt,
          orderTotal: Math.round(total * 100) / 100,
          status,
        });
      }

      // 7. Generate table list
      const tables = Array.from({ length: tableCount }, (_, i) => {
        const num = i + 1;
        const info = tableOrderMap.get(num);

        if (!info) {
          return {
            number: num,
            label: `Table ${num}`,
            status: "free" as const,
            orderId: null,
            orderTotal: null,
            openedAt: null,
          };
        }

        return {
          number: num,
          label: `Table ${num}`,
          status: info.status,
          orderId: info.orderId,
          orderTotal: info.orderTotal,
          openedAt: info.openedAt.toISOString(),
        };
      });

      return NextResponse.json({ tables, locationName: location.name });
    }

    // No open orders — all tables are free
    const tables = Array.from({ length: tableCount }, (_, i) => ({
      number: i + 1,
      label: `Table ${i + 1}`,
      status: "free" as const,
      orderId: null,
      orderTotal: null,
      openedAt: null,
    }));

    return NextResponse.json({ tables, locationName: location.name });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
