import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSignInIntent } from "../auth";

// ─── Mock next/headers ────────────────────────────────────────────────────────
// next/headers cannot run outside Next.js runtime; we mock it at the module level.
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
  prisma: {},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCookieStore(intentValue?: string) {
  const cookieStore = {
    get: vi.fn((name: string) => {
      if (name === "x-auth-intent" && intentValue !== undefined) {
        return { value: intentValue };
      }
      return undefined;
    }),
    delete: vi.fn(),
  };
  return cookieStore;
}

/**
 * @param existingRole - Pass "CLIENT" or "ADMIN" to simulate an existing user,
 *                       or null to simulate a user record not found in DB.
 */
function makeDb(existingRole: "CLIENT" | "ADMIN" | null) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(
        existingRole !== null ? { role: existingRole } : null
      ),
      update: vi.fn().mockResolvedValue(undefined),
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("handleSignInIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("promotes to ADMIN when x-auth-intent=ADMIN cookie is present and user is CLIENT", async () => {
    const cookieStore = makeCookieStore("ADMIN");
    const db = makeDb("CLIENT");

    await handleSignInIntent({
      userId: "user-1",
      provider: "google",
      cookieStore: cookieStore as never,
      db: db as never,
    });

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { role: "ADMIN" },
    });
    expect(cookieStore.delete).toHaveBeenCalledWith("x-auth-intent");
  });

  it("promotes to ADMIN when user does not yet exist in DB (first sign-in)", async () => {
    const cookieStore = makeCookieStore("ADMIN");
    const db = makeDb(null);

    await handleSignInIntent({
      userId: "new-user",
      provider: "google",
      cookieStore: cookieStore as never,
      db: db as never,
    });

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "new-user" },
      data: { role: "ADMIN" },
    });
    expect(cookieStore.delete).toHaveBeenCalledWith("x-auth-intent");
  });

  it("does NOT change role when cookie is absent (CLIENT login)", async () => {
    const cookieStore = makeCookieStore(undefined);
    const db = makeDb("CLIENT");

    await handleSignInIntent({
      userId: "user-2",
      provider: "google",
      cookieStore: cookieStore as never,
      db: db as never,
    });

    expect(db.user.update).not.toHaveBeenCalled();
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("does NOT downgrade an existing ADMIN when cookie is present (first-login wins)", async () => {
    // Edge case: x-auth-intent present but user is already ADMIN — no update
    const cookieStore = makeCookieStore("ADMIN");
    const db = makeDb("ADMIN");

    await handleSignInIntent({
      userId: "admin-user",
      provider: "google",
      cookieStore: cookieStore as never,
      db: db as never,
    });

    // Should NOT call update since role is already ADMIN
    expect(db.user.update).not.toHaveBeenCalled();
    // Should still delete the cookie
    expect(cookieStore.delete).toHaveBeenCalledWith("x-auth-intent");
  });

  it("does nothing for non-google providers", async () => {
    const cookieStore = makeCookieStore("ADMIN");
    const db = makeDb("CLIENT");

    await handleSignInIntent({
      userId: "user-3",
      provider: "github",
      cookieStore: cookieStore as never,
      db: db as never,
    });

    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});
