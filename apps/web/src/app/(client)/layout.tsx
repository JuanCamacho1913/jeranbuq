import { requireAuth } from "@/backend/lib/guards";
import { ClientHeader } from "@/frontend/components/client/client-header";

/**
 * Client route group layout.
 * Guards every /(client)/* route: redirects unauthenticated users to /login.
 * Any authenticated role (CLIENT or ADMIN) may access client-facing pages.
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <ClientHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
