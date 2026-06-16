import { redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";

/**
 * Root page — role-based redirect.
 *
 * ADMIN  → /admin (dashboard)
 * CLIENT → /inicio (client booking home)
 *
 * Note: unauthenticated users never reach this page — the middleware
 * redirects them to /login before the request hits Next.js routing.
 */
export default async function HomePage() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  // CLIENT → service catalog home
  redirect("/inicio");
}
