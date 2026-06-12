import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock next-auth (NextAuth instance wiring) ────────────────────────────────
vi.mock("next-auth", () => ({
  default: vi.fn().mockReturnValue({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    unstable_update: vi.fn(),
  }),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}));

vi.mock("next-auth/providers/google", () => ({
  default: {},
}));

vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {},
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// ─── Mock next/navigation (redirect throws in Next.js) ───────────────────────
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import { requireAuth, requireAdmin } from "../guards";
import { auth } from "@/backend/lib/auth";

// ─── requireAuth Tests ────────────────────────────────────────────────────────

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("returns the session when user is authenticated", async () => {
    const session = {
      user: { id: "user-1", role: "CLIENT", phone: null, onboardingCompletedAt: null },
    };
    vi.mocked(auth).mockResolvedValue(session as never);

    const result = await requireAuth();
    expect(result).toBe(session);
  });

  it("returns the session when user is ADMIN", async () => {
    const session = {
      user: { id: "admin-1", role: "ADMIN", phone: "+1234567890", onboardingCompletedAt: "2024-01-01T00:00:00.000Z" },
    };
    vi.mocked(auth).mockResolvedValue(session as never);

    const result = await requireAuth();
    expect(result).toBe(session);
  });
});

// ─── requireAdmin Tests ───────────────────────────────────────────────────────

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to / when user is CLIENT role", async () => {
    const session = {
      user: { id: "user-1", role: "CLIENT", phone: null, onboardingCompletedAt: null },
    };
    vi.mocked(auth).mockResolvedValue(session as never);

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("redirects to /login when there is no session (unauthenticated)", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("returns the session when user is ADMIN role", async () => {
    const session = {
      user: { id: "admin-1", role: "ADMIN", phone: "+1234567890", onboardingCompletedAt: "2024-01-01T00:00:00.000Z" },
    };
    vi.mocked(auth).mockResolvedValue(session as never);

    const result = await requireAdmin();
    expect(result).toBe(session);
  });
});
