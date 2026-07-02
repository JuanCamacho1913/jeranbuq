import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUpsert, mockEncode } = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
  mockEncode: vi.fn().mockResolvedValue("mock-jwt-token"),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {
    user: {
      upsert: mockUpsert,
    },
  },
}));

vi.mock("next-auth/jwt", () => ({
  encode: mockEncode,
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { GET } from "../route";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(role?: string): NextRequest {
  const url = new URL("http://localhost/api/test/session");
  if (role !== undefined) {
    url.searchParams.set("role", role);
  }
  return new NextRequest(url.toString());
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/test/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AUTH_SECRET", "test-auth-secret-32-characters-ok");

    mockUpsert.mockResolvedValue({
      id: "test-user-id",
      email: "test-client@e2e.test",
      name: "Test Client",
      role: "CLIENT",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // 1. Returns 404 when NODE_ENV !== 'test'
  it("returns 404 when NODE_ENV is not 'test'", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const request = makeRequest("CLIENT");
    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockEncode).not.toHaveBeenCalled();
  });

  // 2. Returns 400 when role is missing
  it("returns 400 when role query param is missing", async () => {
    const request = makeRequest();
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  // 3. Returns 400 when role is invalid
  it("returns 400 when role query param is invalid", async () => {
    const request = makeRequest("SUPERUSER");
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  // 4. Returns 200 with Set-Cookie for CLIENT
  it("returns 200 with Set-Cookie header when role=CLIENT", async () => {
    const request = makeRequest("CLIENT");
    const response = await GET(request);

    expect(response.status).toBe(200);

    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toBeTruthy();
    expect(
      setCookie?.startsWith("authjs.session-token=") ||
        setCookie?.startsWith("__Secure-authjs.session-token=")
    ).toBe(true);
  });

  // 5. Returns 200 with Set-Cookie for ADMIN
  it("returns 200 with Set-Cookie header when role=ADMIN", async () => {
    mockUpsert.mockResolvedValue({
      id: "test-admin-id",
      email: "test-admin@e2e.test",
      name: "Test Admin",
      role: "ADMIN",
    });

    const request = makeRequest("ADMIN");
    const response = await GET(request);

    expect(response.status).toBe(200);

    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toBeTruthy();
    expect(
      setCookie?.startsWith("authjs.session-token=") ||
        setCookie?.startsWith("__Secure-authjs.session-token=")
    ).toBe(true);
  });

  // 6. Calls prisma.user.upsert with CLIENT email
  it("calls prisma.user.upsert with correct email for CLIENT", async () => {
    const request = makeRequest("CLIENT");
    await GET(request);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "test-client@e2e.test" },
        create: expect.objectContaining({
          email: "test-client@e2e.test",
          name: "Test Client",
          role: "CLIENT",
        }),
      })
    );
  });

  // 7. Calls prisma.user.upsert with ADMIN email
  it("calls prisma.user.upsert with correct email for ADMIN", async () => {
    mockUpsert.mockResolvedValue({
      id: "test-admin-id",
      email: "test-admin@e2e.test",
      name: "Test Admin",
      role: "ADMIN",
    });

    const request = makeRequest("ADMIN");
    await GET(request);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "test-admin@e2e.test" },
        create: expect.objectContaining({
          email: "test-admin@e2e.test",
          name: "Test Admin",
          role: "ADMIN",
        }),
      })
    );
  });

  // 8. Response body contains { ok: true }
  it("returns { ok: true } in the response body on success", async () => {
    const request = makeRequest("CLIENT");
    const response = await GET(request);
    const body = await response.json();

    expect(body).toEqual({ ok: true });
  });
});
