import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";

const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  logoUrl: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  serviceChargePct: z.string().optional().nullable(),
  vatPct: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "brands", "read");
  if (auth.error) return auth.error;

  try {
    const allBrands = await db.select().from(brands);
    return NextResponse.json(allBrands);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "brands", "create");
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = createBrandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(brands)
      .values({
        name: parsed.data.name,
        logoUrl: parsed.data.logoUrl ?? null,
        address: parsed.data.address ?? null,
        taxId: parsed.data.taxId ?? null,
        serviceChargePct: parsed.data.serviceChargePct ?? "10.00",
        vatPct: parsed.data.vatPct ?? "7.00",
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
}
