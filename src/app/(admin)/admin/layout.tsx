import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  let session;
  try {
    session = await verifySession(token);
  } catch {
    redirect("/admin/login");
  }

  // Only admin and manager can access admin panel
  if (session.role !== "admin" && session.role !== "manager") {
    redirect("/");
  }

  // Look up user name from DB for sidebar display
  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const userName = user?.name ?? "Unknown User";

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar userName={userName} userRole={session.role} />
      <main className="md:ml-64">
        <div className="p-6 pt-20 md:pt-6">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
