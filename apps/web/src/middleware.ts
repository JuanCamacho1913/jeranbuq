import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/backend/lib/auth";

// ─── Core redirect logic (extracted for testability) ─────────────────────────

/**
 * 3-tier auth redirect chain:
 *  1. No session                       → /login
 *  2. Session + no onboarding          → /onboarding  (skip if already there)
 *  3. /admin/* + non-ADMIN role        → /
 *  4. Everything else                  → allow
 */
export function resolveRedirect(
  session: Session | null,
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
  const session = (req as any).auth as Session | null;

  const redirect = resolveRedirect(session, req.nextUrl.pathname, req.url);
  if (redirect) {
    return NextResponse.redirect(redirect);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /api/v1/* (API routes handle auth themselves via requireAuth)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico (static asset)
     * - /login (auth page — must be public)
     * - $ (root path — handled by page.tsx role redirect)
     *
     * /(admin)/*, /(auth)/*, /(protected)/*, /(client)/* ARE matched
     * so the middleware auth guard runs on them.
     */
    "/((?!api/v1|_next/static|_next/image|favicon.ico|login|$).*)",
  ],
};
