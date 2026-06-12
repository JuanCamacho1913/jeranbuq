import { describe, it, expect, vi } from "vitest";

// Mock next-auth and next/server before importing middleware
vi.mock("@/backend/lib/auth", () => ({
  auth: vi.fn((fn: unknown) => fn),
}));
vi.mock("next/server", () => ({
  NextResponse: {
    redirect: vi.fn((url: URL) => ({ type: "redirect", url })),
    next: vi.fn(() => ({ type: "next" })),
  },
}));

import { resolveRedirect } from "./middleware";
import type { AuthSession } from "./middleware";

const BASE_URL = "https://barberia.app";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clientSession(onboardingCompletedAt: string | null = "2024-01-01T00:00:00.000Z"): AuthSession {
  return { user: { role: "CLIENT", onboardingCompletedAt } };
}

function adminSession(onboardingCompletedAt: string | null = "2024-01-01T00:00:00.000Z"): AuthSession {
  return { user: { role: "ADMIN", onboardingCompletedAt } };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("resolveRedirect (middleware logic)", () => {
  // Tier 1: unauthenticated
  describe("unauthenticated requests", () => {
    it("redirects to /login when session is null", () => {
      const redirect = resolveRedirect(null, "/dashboard", BASE_URL);
      expect(redirect?.pathname).toBe("/login");
    });

    it("redirects to /login for /admin/* when session is null", () => {
      const redirect = resolveRedirect(null, "/admin/settings", BASE_URL);
      expect(redirect?.pathname).toBe("/login");
    });
  });

  // Tier 2: authenticated but onboarding not done
  describe("authenticated users without onboarding", () => {
    it("redirects to /onboarding when onboardingCompletedAt is null", () => {
      const session = clientSession(null);
      const redirect = resolveRedirect(session, "/dashboard", BASE_URL);
      expect(redirect?.pathname).toBe("/onboarding");
    });

    it("does NOT redirect when already on /onboarding (prevents redirect loop)", () => {
      const session = clientSession(null);
      const redirect = resolveRedirect(session, "/onboarding", BASE_URL);
      expect(redirect).toBeNull();
    });

    it("redirects to /onboarding even for /admin/* paths when onboarding is missing", () => {
      const session = clientSession(null);
      const redirect = resolveRedirect(session, "/admin/dashboard", BASE_URL);
      expect(redirect?.pathname).toBe("/onboarding");
    });
  });

  // Tier 3: admin route access control
  describe("admin route protection", () => {
    it("redirects CLIENT to / when accessing /admin/*", () => {
      const session = clientSession();
      const redirect = resolveRedirect(session, "/admin/settings", BASE_URL);
      expect(redirect?.pathname).toBe("/");
    });

    it("redirects CLIENT to / when accessing /admin (exact)", () => {
      const session = clientSession();
      const redirect = resolveRedirect(session, "/admin", BASE_URL);
      expect(redirect?.pathname).toBe("/");
    });

    it("allows ADMIN to access /admin/*", () => {
      const session = adminSession();
      const redirect = resolveRedirect(session, "/admin/settings", BASE_URL);
      expect(redirect).toBeNull();
    });

    it("allows ADMIN to access /admin (exact)", () => {
      const session = adminSession();
      const redirect = resolveRedirect(session, "/admin", BASE_URL);
      expect(redirect).toBeNull();
    });
  });

  // Allowed through (no redirect)
  describe("requests that should be allowed through", () => {
    it("allows authenticated CLIENT on non-admin routes", () => {
      const session = clientSession();
      const redirect = resolveRedirect(session, "/dashboard", BASE_URL);
      expect(redirect).toBeNull();
    });

    it("allows authenticated ADMIN on non-admin routes", () => {
      const session = adminSession();
      const redirect = resolveRedirect(session, "/dashboard", BASE_URL);
      expect(redirect).toBeNull();
    });

    it("allows authenticated user on /onboarding when already completed", () => {
      const session = clientSession();
      const redirect = resolveRedirect(session, "/onboarding", BASE_URL);
      expect(redirect).toBeNull();
    });
  });
});
