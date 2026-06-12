import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/backend/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthSession = {
  user?: {
    role?: string | null;
    onboardingCompletedAt?: string | null;
  };
} | null;

// ─── Core redirect logic (extracted for testability) ─────────────────────────

/**
 * 3-tier auth redirect chain:
 *  1. No session                       → /login
 *  2. Session + no onboarding          → /onboarding  (skip if already there)
 *  3. /admin/* + non-ADMIN role        → /
 *  4. Everything else                  → allow
 */
export function resolveRedirect(
  session: AuthSession,
  pathname: string,
  baseUrl: string
): URL | null {
  // Tier 1: unauthenticated
  if (!session) {
    return new URL("/login", baseUrl);
  }

  // Tier 2: authenticated but onboarding not completed
  if (!session.user?.onboardingCompletedAt && pathname !== "/onboarding") {
    return new URL("/onboarding", baseUrl);
  }

  // Tier 3: admin route without ADMIN role
  if (pathname.startsWith("/admin") && session.user?.role !== "ADMIN") {
    return new URL("/", baseUrl);
  }

  return null;
}

// ─── Next.js middleware export ────────────────────────────────────────────────

export default auth(function middleware(req: NextRequest) {
  // auth() injects the session token into req.auth (next-auth v5)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (req as any).auth as AuthSession;

  const redirect = resolveRedirect(session, req.nextUrl.pathname, req.url);
  if (redirect) {
    return NextResponse.redirect(redirect);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|$).*)",
  ],
};
