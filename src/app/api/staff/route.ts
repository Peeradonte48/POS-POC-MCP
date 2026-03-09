import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuth, getSession } from "@/lib/api-utils";

const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  role: z.enum(["admin", "manager", "cashier"]),
  brandId: z.string().uuid("Invalid brand ID"),
  locationId: z.string().uuid("Invalid location ID").optional().nullable(),
  pin: z.string().min(4).max(6).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Manager sees only their location's staff
    if (session.role === "manager" && session.locationId) {
      const locationStaff = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          brandId: users.brandId,
          locationId: users.locationId,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.locationId, session.locationId));
      return NextResponse.json(locationStaff);
    }

    // Admin sees all staff
    const allStaff = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        brandId: users.brandId,
        locationId: users.locationId,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users);
    return NextResponse.json(allStaff);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "staff", "create");
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = createStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, role, brandId, locationId, pin, email, password } =
      parsed.data;

    // Admin/manager require email + password
    if ((role === "admin" || role === "manager") && (!email || !password)) {
      return NextResponse.json(
        { error: "Email and password are required for admin/manager roles" },
        { status: 400 }
      );
    }

    // Cashier requires PIN
    if (role === "cashier" && !pin) {
      return NextResponse.json(
        { error: "PIN is required for cashier role" },
        { status: 400 }
      );
    }

    const pinHash = pin ? await hash(pin, 10) : null;
    const passwordHash = password ? await hash(password, 10) : null;

    const [created] = await db
      .insert(users)
      .values({
        name,
        role,
        brandId,
        locationId: locationId ?? null,
        email: email?.toLowerCase() ?? null,
        pinHash,
        passwordHash,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        brandId: users.brandId,
        locationId: users.locationId,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
