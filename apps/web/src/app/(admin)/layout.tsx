import { requireAdmin } from "@/backend/lib/guards";
import { AdminSidebar } from "@/frontend/components/admin/admin-sidebar";

/**
 * Admin route group layout.
 * Guards every /admin/* route: redirects non-ADMIN users before rendering.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
