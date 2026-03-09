import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { syncLogs } from "@/db/schema/sync-logs";
import { syncMenuFromERP } from "@/lib/erp-sync";
import { requireAuth, getSession } from "@/lib/api-utils";

const syncRequestSchema = z.object({
  brandId: z.string().uuid("Invalid brand ID"),
});

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");

  if (!brandId) {
    return NextResponse.json(
      { error: "brandId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const logs = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.brandId, brandId))
      .orderBy(desc(syncLogs.startedAt))
      .limit(10);

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sync logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "sync", "sync");
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = syncRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await syncMenuFromERP(parsed.data.brandId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
