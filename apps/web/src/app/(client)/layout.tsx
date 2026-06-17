import { requireAuth } from "@/backend/lib/guards";
import { ClientHeader } from "@/frontend/components/client/client-header";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#050505]">
      <ClientHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
