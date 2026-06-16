import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockRequireAuth, mockGetAvailableSlots } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockGetAvailableSlots: vi.fn(),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/backend/lib/guards", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("@/backend/services/slots.service", () => ({
  getAvailableSlots: mockGetAvailableSlots,
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { GET } from "../route";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/v1/availability");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url.toString());
}

// ─── Test data ────────────────────────────────────────────────────────────────

const mockSession = {
  user: { id: "user-client-001", role: "CLIENT", name: "Test Client" },
  expires: "2099-01-01",
};

const mockSlots = [
  {
    startTime: "09:00",
    endTime: "10:00",
    startAtUTC: "2026-06-20T14:00:00.000Z",
    available: true,
  },
  {
    startTime: "10:00",
    endTime: "11:00",
    startAtUTC: "2026-06-20T15:00:00.000Z",
    available: false,
  },
];

const validDate = "2026-06-20";
const validServiceId = "cmc0000000000000000000002";

// ─── GET handler tests ────────────────────────────────────────────────────────

describe("GET /api/v1/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockSession);
  });

  it("valid request returns 200 with { ok: true, data: { date, slots } }", async () => {
    mockGetAvailableSlots.mockResolvedValueOnce({
      ok: true,
      data: { date: validDate, slots: mockSlots },
    });

    const request = makeRequest({ date: validDate, serviceId: validServiceId });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { date: validDate, slots: mockSlots },
    });
    expect(mockGetAvailableSlots).toHaveBeenCalledWith(validServiceId, validDate);
  });

  it("missing date param returns 400 with { ok: false, error: 'INVALID_PARAMS' }", async () => {
    const request = makeRequest({ serviceId: validServiceId });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ ok: false, error: "INVALID_PARAMS" });
    expect(mockGetAvailableSlots).not.toHaveBeenCalled();
  });

  it("missing serviceId param returns 400 with { ok: false, error: 'INVALID_PARAMS' }", async () => {
    const request = makeRequest({ date: validDate });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ ok: false, error: "INVALID_PARAMS" });
    expect(mockGetAvailableSlots).not.toHaveBeenCalled();
  });

  it("invalid date format returns 400 with { ok: false, error: 'INVALID_PARAMS' }", async () => {
    const request = makeRequest({ date: "20260620", serviceId: validServiceId });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ ok: false, error: "INVALID_PARAMS" });
    expect(mockGetAvailableSlots).not.toHaveBeenCalled();
  });

  it("unauthenticated request returns 401", async () => {
    mockRequireAuth.mockImplementationOnce(() => {
      // requireAuth redirects unauthenticated users; in route handler context
      // we treat the thrown redirect as an unauthenticated signal — but here
      // we simulate the handler checking auth() directly returning null.
      throw new Error("NEXT_REDIRECT");
    });

    const request = makeRequest({ date: validDate, serviceId: validServiceId });

    // When requireAuth throws a redirect error, the route re-throws it.
    // In the actual handler we check auth() and return 401 directly.
    // The mock simulates the redirect being thrown as per requireAuth contract.
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("response includes Cache-Control: no-store header", async () => {
    mockGetAvailableSlots.mockResolvedValueOnce({
      ok: true,
      data: { date: validDate, slots: mockSlots },
    });

    const request = makeRequest({ date: validDate, serviceId: validServiceId });
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
