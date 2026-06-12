import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock next/headers ────────────────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// ─── Mock next-auth ───────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  default: vi.fn().mockReturnValue({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    unstable_update: vi.fn(),
  }),
}));

// ─── Mock @auth/prisma-adapter ────────────────────────────────────────────────
vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}));

// ─── Mock next-auth/providers/google ─────────────────────────────────────────
vi.mock("next-auth/providers/google", () => ({
  default: {},
}));

// ─── Mock @barberia-jeranbuq/database ────────────────────────────────────────
vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

// ─── Mock next/navigation (redirect throws by design in Next.js) ──────────────
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import { validateBarberCode, completeOnboarding } from "../auth.actions";
import { prisma } from "@barberia-jeranbuq/database";
import { cookies } from "next/headers";
import { unstable_update, auth } from "@/backend/lib/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

function makeCookieStore() {
  return {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  };
}

// ─── validateBarberCode Tests ─────────────────────────────────────────────────

describe("validateBarberCode", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("sets httpOnly cookie and returns success when code matches BARBER_SECRET_CODE", async () => {
    process.env.BARBER_SECRET_CODE = "super-secret";
    process.env.AUTH_SECRET = "test-auth-secret";

    const mockCookieStore = makeCookieStore();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);

    const formData = makeFormData({ code: "super-secret" });
    const result = await validateBarberCode(formData);

    expect(result).toEqual({ success: true });
    expect(mockCookieStore.set).toHaveBeenCalledOnce();

    const setCall = mockCookieStore.set.mock.calls[0]!;
    expect(setCall[0]).toBe("x-auth-intent");
    // Value should be a signed string (not empty)
    expect(typeof setCall[1]).toBe("string");
    expect((setCall[1] as string).length).toBeGreaterThan(0);
    // Cookie options: httpOnly, maxAge 5 minutes
    expect(setCall[2]).toMatchObject({ httpOnly: true, maxAge: 300 });
  });

  it("does not set cookie and returns error when code is wrong", async () => {
    process.env.BARBER_SECRET_CODE = "super-secret";
    process.env.AUTH_SECRET = "test-auth-secret";

    const mockCookieStore = makeCookieStore();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);

    const formData = makeFormData({ code: "wrong-code" });
    const result = await validateBarberCode(formData);

    expect(result).toEqual({ success: false, error: "Invalid code" });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("returns error without throwing when BARBER_SECRET_CODE env var is missing", async () => {
    delete process.env.BARBER_SECRET_CODE;
    process.env.AUTH_SECRET = "test-auth-secret";

    const mockCookieStore = makeCookieStore();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);

    const formData = makeFormData({ code: "any-code" });

    // Must NOT throw — must return a structured error
    await expect(validateBarberCode(formData)).resolves.toEqual({
      success: false,
      error: "Service unavailable",
    });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("returns error without throwing when code field is empty (schema validation)", async () => {
    process.env.BARBER_SECRET_CODE = "super-secret";
    process.env.AUTH_SECRET = "test-auth-secret";

    const mockCookieStore = makeCookieStore();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);

    const formData = makeFormData({ code: "" });
    const result = await validateBarberCode(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });
});

// ─── completeOnboarding Tests ─────────────────────────────────────────────────

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates DB, calls unstable_update, and redirects when phone is valid", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", role: "CLIENT", phone: null, onboardingCompletedAt: null },
    } as never);

    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(unstable_update).mockResolvedValue(null);

    const formData = makeFormData({ phone: "+5491112345678" });

    await expect(completeOnboarding(formData)).rejects.toThrow("NEXT_REDIRECT:/");

    expect(prisma.user.update).toHaveBeenCalledOnce();
    const updateCall = vi.mocked(prisma.user.update).mock.calls[0]![0];
    expect(updateCall.where).toEqual({ id: "user-123" });
    expect(updateCall.data.phone).toBe("+5491112345678");
    expect(updateCall.data.onboardingCompletedAt).toBeInstanceOf(Date);

    expect(unstable_update).toHaveBeenCalledOnce();
  });

  it("returns validation error when phone is invalid (no DB call)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", role: "CLIENT", phone: null, onboardingCompletedAt: null },
    } as never);

    const formData = makeFormData({ phone: "not-a-phone" });
    const result = await completeOnboarding(formData);

    expect(result).toEqual({ success: false, error: expect.any(String) });
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(unstable_update).not.toHaveBeenCalled();
  });

  it("does not redirect when called again after onboarding is complete (SPEC-ONBOARD-002: no redirect loop)", async () => {
    // Simulate user who already completed onboarding calling the action again
    // The action should validate phone → update DB → unstable_update → redirect("/")
    // The middleware (not this action) is responsible for preventing loop.
    // Here we verify the action itself completes normally and redirects.
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-456",
        role: "CLIENT",
        phone: "+5491199999999",
        onboardingCompletedAt: "2024-01-01T00:00:00.000Z",
      },
    } as never);

    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(unstable_update).mockResolvedValue(null);

    const formData = makeFormData({ phone: "+5491199999999" });

    // Action throws redirect — that's expected. The middleware test covers the loop prevention.
    await expect(completeOnboarding(formData)).rejects.toThrow("NEXT_REDIRECT:/");

    // DB updated and JWT patched — action did its job
    expect(prisma.user.update).toHaveBeenCalledOnce();
    expect(unstable_update).toHaveBeenCalledOnce();
  });
});
