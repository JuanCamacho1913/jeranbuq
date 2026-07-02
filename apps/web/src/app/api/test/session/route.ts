import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@barberia-jeranbuq/database";

// ─── GET /api/test/session?role=CLIENT|ADMIN ──────────────────────────────────
//
// Test-only endpoint that mints a real Auth.js JWT cookie for E2E tests.
// Returns 404 in any environment other than `test`.
//
// Usage: GET /api/test/session?role=CLIENT  →  Set-Cookie: authjs.session-token=<jwt>

const COOKIE_NAME = "authjs.session-token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

const FIXTURE_USERS = {
  CLIENT: { email: "test-client@e2e.test", name: "Test Client" },
  ADMIN: { email: "test-admin@e2e.test", name: "Test Admin" },
} as const;

type Role = keyof typeof FIXTURE_USERS;

export async function GET(request: Request): Promise<NextResponse> {
  // ── Environment guard ───────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "test") {
    return NextResponse.json({}, { status: 404 });
  }

  // ── Role validation ─────────────────────────────────────────────────────────
  const url = new URL(request.url);
  const roleParam = url.searchParams.get("role");

  if (!roleParam || !(roleParam in FIXTURE_USERS)) {
    return NextResponse.json(
      { error: "INVALID_ROLE", message: "role must be CLIENT or ADMIN" },
      { status: 400 }
    );
  }

  const role = roleParam as Role;
  const fixture = FIXTURE_USERS[role];

  // ── Upsert test user ────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: fixture.email },
    update: {},
    create: {
      email: fixture.email,
      name: fixture.name,
      role,
    },
  });

  // ── Build JWT token payload (matches auth.ts jwt callback shape) ────────────
  const tokenPayload = {
    id: user.id,
    sub: user.id,
    name: user.name,
    email: user.email,
    role,
    phone: null,
    onboardingCompletedAt: null,
  };

  // ── Encode JWT using next-auth/jwt (Auth.js v5) ─────────────────────────────
  const jwt = await encode({
    token: tokenPayload,
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE_NAME,
    maxAge: MAX_AGE,
  });

  // ── Set cookie and return ───────────────────────────────────────────────────
  const cookieValue = [
    `${COOKIE_NAME}=${jwt}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE}`,
  ].join("; ");

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "Set-Cookie": cookieValue,
      },
    }
  );
}
