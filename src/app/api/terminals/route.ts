import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { terminals, brands, locations } from "@/db/schema";

export async function GET() {
  try {
    const result = await db
      .select({
        id: terminals.id,
        name: terminals.name,
        brandId: terminals.brandId,
        brandName: brands.name,
        locationId: terminals.locationId,
        locationName: locations.name,
      })
      .from(terminals)
      .innerJoin(brands, eq(terminals.brandId, brands.id))
      .innerJoin(locations, eq(terminals.locationId, locations.id))
      .where(eq(terminals.isActive, true));

    return NextResponse.json({ terminals: result });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
