import { jwtDecrypt } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

// ─── Core redirect logic (extracted for testability) ─────────────────────────

/**
 * 4-tier auth redirect chain:
 *  0. No session + pathname="/"        → /inicio  (public landing)
 *  1. No session + any other path      → /login?callbackUrl={pathname}
 *  2. Session + no onboarding          → /onboarding  (skip if already there)
 *  3. /admin/* + non-ADMIN role        → /
 *  4. Everything else                  → allow
 */
export function resolveRedirect(
  session: Session | null,
  pathname: string,
  baseUrl: string
): URL | null {
  // Tier 0: unauthenticated root → public landing
  if (!session && pathname === "/") {
    return new URL("/inicio", baseUrl);
  }

  // Tier 1: unauthenticated non-root → login with callbackUrl
  if (!session) {
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return loginUrl;
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

// ─── Auth.js v5 JWT decoding (Web Crypto + jose — no next-auth bundle in edge) ──

// Derives the AES-256-GCM encryption key using HKDF via the native Web Crypto API.
// auth.js v5 removed hkdf from the public jose API; Web Crypto is available in Edge.
async function deriveEncryptionKey(
  secret: string,
  cookieName: string
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "HKDF",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode(cookieName),
      info: enc.encode(`Auth.js Generated Encryption Key (${cookieName})`),
    },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

async function decodeAuthToken(
  req: NextRequest
): Promise<Record<string, unknown> | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const isSecure = req.url.startsWith("https://");
  // auth.js v5 cookie names
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const raw = req.cookies.get(cookieName)?.value;
  if (!raw) return null;

  try {
    const encKey = await deriveEncryptionKey(secret, cookieName);
    const { payload } = await jwtDecrypt(raw, encKey, { clockTolerance: 15 });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Next.js middleware export ────────────────────────────────────────────────

export default async function middleware(req: NextRequest) {
  const token = await decodeAuthToken(req);

  const session: Session | null = token
    ? ({
        user: {
          id: token.id as string,
          role: (token.role as string) ?? null,
          phone: (token.phone as string) ?? null,
          onboardingCompletedAt: (token.onboardingCompletedAt as string) ?? null,
        },
        expires: new Date((token.exp as number) * 1000).toISOString(),
      } as Session)
    : null;

  const redirect = resolveRedirect(session, req.nextUrl.pathname, req.url);
  if (redirect) {
    return NextResponse.redirect(redirect);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /api/auth/* (NextAuth internal routes — must never be guarded)
     * - /api/v1/* (API routes handle auth themselves via requireAuth)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico (static asset)
     * - /login (auth page — must be public)
     * - /inicio (public landing — must be accessible without session)
     * - *.* (static public assets — any path with a file extension, e.g. /logo.png)
     *
     * / (root) IS matched so Tier 0 redirect (/ → /inicio) fires for guests.
     * /(admin)/*, /(auth)/*, /(protected)/*, /(client)/* ARE matched
     * so the middleware auth guard runs on them.
     */
    "/((?!api/auth|api/v1|_next/static|_next/image|favicon.ico|login|inicio|.*\\..*).*)",
  ],
};
