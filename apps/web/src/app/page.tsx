import { redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";

/**
 * Root page — role-based redirect.
 *
 * ADMIN  → /admin (dashboard)
 * CLIENT → placeholder (client home deferred to Fase 3)
 *
 * Note: unauthenticated users never reach this page — the middleware
 * redirects them to /login before the request hits Next.js routing.
 */
export default async function HomePage() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  // CLIENT placeholder — client booking home is deferred to Fase 3
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">Barbería Jeranbuq</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Tu espacio de confianza. Próximamente.
      </p>
    </main>
  );
}
