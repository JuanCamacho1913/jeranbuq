import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockSendEmail, mockFindMany, mockUpdate } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/backend/lib/email", () => ({
  sendEmail: mockSendEmail,
}));

vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {
    appointment: {
      findMany: mockFindMany,
      update: mockUpdate,
    },
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { GET } from "../route";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CRON_SECRET = "test-cron-secret";

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) {
    headers["authorization"] = authHeader;
  }
  return new NextRequest("http://localhost/api/cron/send-reminders", {
    headers,
  });
}

function makeAppointment(id: string) {
  return {
    id,
    startAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
    status: "CONFIRMED",
    reminderSentAt: null,
    user: {
      id: "user-001",
      name: "Test Client",
      email: "client@test.com",
    },
    service: {
      id: "service-001",
      name: "Corte de cabello",
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/cron/send-reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
  });

  // 1. Auth — missing secret
  it("returns 401 when Authorization header is missing", async () => {
    const request = makeRequest();
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  // 2. Auth — wrong secret
  it("returns 401 when Authorization header has wrong token", async () => {
    const request = makeRequest("Bearer wrong-secret");
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  // 3. Auth — valid secret proceeds to query
  it("proceeds to DB query when Authorization header is valid", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    const request = makeRequest(`Bearer ${CRON_SECRET}`);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledOnce();
  });

  // 4. No appointments in window
  it("returns { sent: 0 } and does not call sendEmail when no appointments found", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    const request = makeRequest(`Bearer ${CRON_SECRET}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ sent: 0 });
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // 5. Appointments found — sendEmail and update called for each
  it("calls sendEmail and update reminderSentAt for each appointment found", async () => {
    const appt1 = makeAppointment("appt-001");
    const appt2 = makeAppointment("appt-002");
    mockFindMany.mockResolvedValueOnce([appt1, appt2]);
    mockSendEmail.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue({});

    const request = makeRequest(`Bearer ${CRON_SECRET}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ sent: 2 });
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "appt-001" },
      data: { reminderSentAt: expect.any(Date) },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "appt-002" },
      data: { reminderSentAt: expect.any(Date) },
    });
  });

  // 6. Idempotency — WHERE clause includes reminderSentAt: null
  it("queries with reminderSentAt: null to ensure idempotency", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    const request = makeRequest(`Bearer ${CRON_SECRET}`);
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reminderSentAt: null,
        }),
      })
    );
  });

  // 7. sendEmail failure — reminderSentAt NOT stamped, others processed
  it("skips reminderSentAt update when sendEmail throws, continues with remaining appointments", async () => {
    const appt1 = makeAppointment("appt-001");
    const appt2 = makeAppointment("appt-002");
    mockFindMany.mockResolvedValueOnce([appt1, appt2]);

    // First call throws, second succeeds
    mockSendEmail
      .mockRejectedValueOnce(new Error("Resend error"))
      .mockResolvedValueOnce(undefined);
    mockUpdate.mockResolvedValue({});

    const request = makeRequest(`Bearer ${CRON_SECRET}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    // Only 1 successful send
    expect(body).toEqual({ sent: 1 });
    // update only called once (for the successful one)
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "appt-002" },
      data: { reminderSentAt: expect.any(Date) },
    });
  });
});
