import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/backend/lib/auth";

// ─── requireAuth ──────────────────────────────────────────────────────────────

/**
 * Asserts an active session exists.
 * Redirects to /login if the user is not authenticated.
 *
 * Usage in Server Components or Route Handlers:
 * ```ts
 * const session = await requireAuth();
 * ```
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return session;
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────

/**
 * Asserts an active session with ADMIN role.
 * Redirects to /login if unauthenticated, or to / if the role is not ADMIN.
 *
 * Usage in Server Components or Route Handlers:
 * ```ts
 * const session = await requireAdmin();
 * ```
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  if (session.user?.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}
