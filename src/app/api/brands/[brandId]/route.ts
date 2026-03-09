import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, locations } from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";

const updateBrandSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  serviceChargePct: z.string().optional().nullable(),
  vatPct: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const auth = await requireAuth(request, "brands", "read");
  if (auth.error) return auth.error;

  const { brandId } = await params;

  try {
    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const brandLocations = await db
      .select()
      .from(locations)
      .where(eq(locations.brandId, brandId));

    return NextResponse.json({ ...brand, locations: brandLocations });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch brand" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const auth = await requireAuth(request, "brands", "update");
  if (auth.error) return auth.error;

  const { brandId } = await params;

  try {
    const body = await request.json();
    const parsed = updateBrandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(brands)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(brands.id, brandId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const auth = await requireAuth(request, "brands", "delete");
  if (auth.error) return auth.error;

  const { brandId } = await params;

  try {
    // Check for dependent locations
    const dependentLocations = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.brandId, brandId))
      .limit(1);

    if (dependentLocations.length > 0) {
      // Soft delete — has dependent data
      const [updated] = await db
        .update(brands)
        .set({ updatedAt: new Date() })
        .where(eq(brands.id, brandId))
        .returning();

      if (!updated) {
        return NextResponse.json(
          { error: "Brand not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: "Brand has dependent locations. Consider deactivating instead.",
        brand: updated,
      });
    }

    // Hard delete — no dependent data
    const [deleted] = await db
      .delete(brands)
      .where(eq(brands.id, brandId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Brand deleted", brand: deleted });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}
