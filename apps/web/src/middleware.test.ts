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
import type { Session } from "next-auth";

const BASE_URL = "https://barberia.app";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clientSession(onboardingCompletedAt: string | null = "2024-01-01T00:00:00.000Z"): Session {
  return { user: { role: "CLIENT", onboardingCompletedAt } } as Session;
}

function adminSession(onboardingCompletedAt: string | null = "2024-01-01T00:00:00.000Z"): Session {
  return { user: { role: "ADMIN", onboardingCompletedAt } } as Session;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("resolveRedirect (middleware logic)", () => {
  // Tier 0: unauthenticated root → /inicio
  describe("Tier 0 — unauthenticated root redirect", () => {
    it("redirects to /inicio when session is null and pathname is /", () => {
      const result = resolveRedirect(null, "/", BASE_URL);
      expect(result?.pathname).toBe("/inicio");
    });
  });

  // Tier 1: unauthenticated (non-root)
  describe("unauthenticated requests", () => {
    it("redirects to /login with callbackUrl when session is null", () => {
      const result = resolveRedirect(null, "/dashboard", BASE_URL);
      expect(result?.pathname).toBe("/login");
      expect(result?.searchParams.get("callbackUrl")).toBe("/dashboard");
    });

    it("redirects to /login with callbackUrl for /admin/* when session is null", () => {
      const result = resolveRedirect(null, "/admin/settings", BASE_URL);
      expect(result?.pathname).toBe("/login");
      expect(result?.searchParams.get("callbackUrl")).toBe("/admin/settings");
    });

    it("redirects /mis-citas to /login?callbackUrl=%2Fmis-citas when unauthenticated", () => {
      const result = resolveRedirect(null, "/mis-citas", BASE_URL);
      expect(result?.pathname).toBe("/login");
      expect(result?.searchParams.get("callbackUrl")).toBe("/mis-citas");
    });

    it("redirects /agendar/abc to /login?callbackUrl=%2Fagendar%2Fabc when unauthenticated", () => {
      const result = resolveRedirect(null, "/agendar/abc", BASE_URL);
      expect(result?.pathname).toBe("/login");
      expect(result?.searchParams.get("callbackUrl")).toBe("/agendar/abc");
    });

    it("callbackUrl is a relative path only (no scheme, no host)", () => {
      const result = resolveRedirect(null, "/some/path", BASE_URL);
      const callbackUrl = result?.searchParams.get("callbackUrl") ?? "";
      expect(callbackUrl.startsWith("/")).toBe(true);
      expect(callbackUrl).not.toContain("://");
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
