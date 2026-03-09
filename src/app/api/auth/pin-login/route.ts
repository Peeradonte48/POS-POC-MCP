import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { terminals } from "@/db/schema";
import { createSession } from "@/lib/auth";
import type { PinLoginRequest } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body: PinLoginRequest = await request.json();

    if (!body.pin || !body.terminalId) {
      return NextResponse.json(
        { error: "PIN and terminal ID are required" },
        { status: 400 }
      );
    }

    // Look up terminal to get brand and location context
    const [terminal] = await db
      .select()
      .from(terminals)
      .where(
        and(eq(terminals.id, body.terminalId), eq(terminals.isActive, true))
      )
      .limit(1);

    if (!terminal) {
      return NextResponse.json(
        { error: "Invalid terminal" },
        { status: 401 }
      );
    }

    // Find active users at this location who have a PIN
    const locationUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.locationId, terminal.locationId),
          eq(users.isActive, true)
        )
      );

    // Try to match PIN against each user at this location
    let matchedUser = null;
    for (const user of locationUsers) {
      if (user.pinHash) {
        const pinValid = await compare(body.pin, user.pinHash);
        if (pinValid) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession({
      userId: matchedUser.id,
      role: matchedUser.role,
      brandId: terminal.brandId,
      locationId: terminal.locationId,
      terminalId: terminal.id,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
