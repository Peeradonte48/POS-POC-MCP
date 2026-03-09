import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { hasPermission, type Role, type Resource, type Action } from "@/lib/permissions";
import type { SessionPayload } from "@/types/auth";

/**
 * Extract and verify session from request cookie.
 * Returns null if no valid session.
 */
export async function getSession(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

/**
 * Require auth and permission check. Returns error response or session.
 */
export async function requireAuth(
  request: NextRequest,
  resource: Resource,
  action: Action
): Promise<
  | { session: SessionPayload; error?: never }
  | { session?: never; error: NextResponse }
> {
  const session = await getSession(request);

  if (!session) {
    return {
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  if (!hasPermission(session.role as Role, resource, action)) {
    return {
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { session };
}
