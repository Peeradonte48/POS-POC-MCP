import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/api-utils";
import { verifyPinSchema } from "@/lib/void-schemas";

// ---------------------------------------------------------------------------
// POST /api/auth/verify-pin
// Verify a PIN against users at the current location with the required role.
// Returns { valid: true, userId: string } or { valid: false, userId: null }.
// Always returns 200 — the caller handles the invalid PIN UI, not HTTP error.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Require a valid session (any role can call this — cashier triggers manager PIN)
  const { session, error } = await requireAuth(request, "orders", "read");
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = verifyPinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { pin, requiredRole } = parsed.data;

  try {
    // Find all active users at this location with the required role (or admin)
    const eligible = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.locationId, session.locationId),
          inArray(users.role, requiredRole === "admin" ? ["admin"] : ["manager", "admin"]),
          eq(users.isActive, true)
        )
      );

    // Check PIN against each eligible user
    for (const user of eligible) {
      if (!user.pinHash) continue;
      const match = await bcrypt.compare(pin, user.pinHash);
      if (match) {
        return NextResponse.json({ valid: true, userId: user.id });
      }
    }

    // No match found
    return NextResponse.json({ valid: false, userId: null });
  } catch (err) {
    console.error("[POST /api/auth/verify-pin] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
