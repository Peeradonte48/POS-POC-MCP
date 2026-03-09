import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const publicRoutes = ["/login", "/admin/login"];

function isPublicRoute(pathname: string): boolean {
  return (
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/api/auth/")
  );
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and auth API endpoints
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    const loginUrl = isAdminRoute(pathname) ? "/admin/login" : "/login";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  try {
    const session = await verifySession(token);

    // Cashiers cannot access admin routes
    if (isAdminRoute(pathname) && session.role === "cashier") {
      return NextResponse.redirect(new URL("/menu", request.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token - redirect to login
    const loginUrl = isAdminRoute(pathname) ? "/admin/login" : "/login";
    const response = NextResponse.redirect(new URL(loginUrl, request.url));
    // Clear the invalid session cookie
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
