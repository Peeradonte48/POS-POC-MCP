import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { requireAuth, getSession } from "@/lib/api-utils";

const createLocationSchema = z.object({
  brandId: z.string().uuid("Invalid brand ID"),
  name: z.string().min(1, "Name is required").max(255),
  address: z.string().optional().nullable(),
  settings: z
    .object({
      printerConfig: z
        .object({ ip: z.string(), port: z.number() })
        .optional(),
      tableCount: z.number().optional(),
    })
    .optional()
    .nullable(),
});

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Manager sees only their own location
    if (session.role === "manager" && session.locationId) {
      const managerLocations = await db
        .select()
        .from(locations)
        .where(eq(locations.id, session.locationId));
      return NextResponse.json(managerLocations);
    }

    // Admin sees all
    const allLocations = await db.select().from(locations);
    return NextResponse.json(allLocations);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "locations", "create");
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(locations)
      .values({
        brandId: parsed.data.brandId,
        name: parsed.data.name,
        address: parsed.data.address ?? null,
        settings: parsed.data.settings ?? null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
