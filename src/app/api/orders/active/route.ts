import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";

// ---------------------------------------------------------------------------
// GET /api/orders/active?tableNumber=N
// Returns { orderId: string } if an open order exists for that table, else 404.
// Used by the menu page to recover the current orderId after a page refresh.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth(request, "orders", "read");
  if (error) return error;

  const tableNumberStr = new URL(request.url).searchParams.get("tableNumber");
  const tableNumber = Number(tableNumberStr);

  if (!tableNumberStr || isNaN(tableNumber) || tableNumber <= 0) {
    return NextResponse.json(
      { error: "Invalid tableNumber" },
      { status: 400 }
    );
  }

  try {
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.brandId, session.brandId),
          eq(orders.locationId, session.locationId),
          eq(orders.tableNumber, tableNumber),
          eq(orders.status, "open")
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error("[GET /api/orders/active] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
