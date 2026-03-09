import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";

const updateLocationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const auth = await requireAuth(request, "locations", "read");
  if (auth.error) return auth.error;

  const { locationId } = await params;

  try {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch location" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const auth = await requireAuth(request, "locations", "update");
  if (auth.error) return auth.error;

  const { locationId } = await params;

  try {
    const body = await request.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(locations)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(locations.id, locationId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
