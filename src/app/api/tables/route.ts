import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySession(token);

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

    // Generate table list from count
    const tables = Array.from({ length: tableCount }, (_, i) => ({
      number: i + 1,
      label: `Table ${i + 1}`,
    }));

    return NextResponse.json({
      tables,
      locationName: location.name,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
