import { requireAdmin } from "@/backend/lib/guards";
import { AdminSidebar } from "@/frontend/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="fixed inset-0 flex bg-[#050505]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
