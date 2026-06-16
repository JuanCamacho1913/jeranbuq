import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppointmentStatus } from "@barberia-jeranbuq/database";

// ─── Mock Prisma client ───────────────────────────────────────────────────────
// vi.hoisted ensures the object is defined before vi.mock hoisting runs.

const { mockPrismaService, mockPrismaAppointment, mockPrismaTransaction } =
  vi.hoisted(() => {
    const mockPrismaTransaction = vi.fn();
    return {
      mockPrismaService: {
        findUnique: vi.fn(),
      },
      mockPrismaAppointment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      mockPrismaTransaction,
    };
  });

vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {
    service: mockPrismaService,
    appointment: mockPrismaAppointment,
    $transaction: mockPrismaTransaction,
  },
  AppointmentStatus: {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
    NO_SHOW: "NO_SHOW",
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  createAppointment,
  cancelAppointment,
  cancelAppointmentAdmin,
  updateStatus,
  getAppointments,
  getMyAppointments,
} from "../appointments.service";

// ─── Test Helpers ─────────────────────────────────────────────────────────────

const USER_ID = "user-0000000000000000000001";
const SERVICE_ID = "svc-00000000000000000000001";
const APPOINTMENT_ID = "appt-0000000000000000000001";

const mockService = {
  id: SERVICE_ID,
  name: "Corte Clásico",
  description: null,
  durationMin: 60,
  price: 25000,
  active: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// startAt: 2026-06-20T15:00:00Z (10:00 Bogota)
const START_AT = new Date("2026-06-20T15:00:00.000Z");
// endAt: startAt + 60min = 16:00 UTC
const END_AT = new Date("2026-06-20T16:00:00.000Z");

function makePendingAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: APPOINTMENT_ID,
    userId: USER_ID,
    serviceId: SERVICE_ID,
    startAt: START_AT,
    endAt: END_AT,
    status: "PENDING" as AppointmentStatus,
    notes: null,
    cancellationReason: null,
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
    ...overrides,
  };
}

// ─── createAppointment ────────────────────────────────────────────────────────

describe("createAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-1: Happy path — creates appointment with PENDING status and correct endAt
  it("creates appointment with PENDING status and endAt = startAt + durationMin", async () => {
    const created = makePendingAppointment();

    // Simulate $transaction: callback receives a tx client, no overlaps found
    mockPrismaTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          service: { findUnique: vi.fn().mockResolvedValueOnce(mockService) },
          appointment: {
            findFirst: vi.fn().mockResolvedValueOnce(null), // no conflict
            create: vi.fn().mockResolvedValueOnce(created),
          },
        };
        return cb(tx);
      }
    );

    const result = await createAppointment(USER_ID, SERVICE_ID, START_AT);

    expect(result).toEqual({ ok: true, data: created });
  });

  // TC-2: Slot conflict — returns SLOT_UNAVAILABLE when overlap exists
  it("returns SLOT_UNAVAILABLE when an overlapping PENDING/CONFIRMED appointment exists", async () => {
    const overlapping = makePendingAppointment();

    mockPrismaTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          service: { findUnique: vi.fn().mockResolvedValueOnce(mockService) },
          appointment: {
            findFirst: vi.fn().mockResolvedValueOnce(overlapping), // conflict!
            create: vi.fn(),
          },
        };
        return cb(tx);
      }
    );

    const result = await createAppointment(USER_ID, SERVICE_ID, START_AT);

    expect(result).toEqual({ ok: false, error: "SLOT_UNAVAILABLE" });
  });

  // TC-3: Service not found — returns error
  it("returns SERVICE_NOT_FOUND when service does not exist", async () => {
    mockPrismaTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          service: { findUnique: vi.fn().mockResolvedValueOnce(null) },
          appointment: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
        };
        return cb(tx);
      }
    );

    const result = await createAppointment(USER_ID, SERVICE_ID, START_AT);

    expect(result).toEqual({ ok: false, error: "SERVICE_NOT_FOUND" });
  });

  // TC-4: Service inactive — returns error
  it("returns SERVICE_NOT_FOUND when service is inactive", async () => {
    const inactiveService = { ...mockService, active: false };

    mockPrismaTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          service: { findUnique: vi.fn().mockResolvedValueOnce(inactiveService) },
          appointment: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
        };
        return cb(tx);
      }
    );

    const result = await createAppointment(USER_ID, SERVICE_ID, START_AT);

    expect(result).toEqual({ ok: false, error: "SERVICE_NOT_FOUND" });
  });

  // TC-5: Uses prisma.$transaction for atomicity
  it("executes inside prisma.$transaction", async () => {
    const created = makePendingAppointment();

    mockPrismaTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          service: { findUnique: vi.fn().mockResolvedValueOnce(mockService) },
          appointment: {
            findFirst: vi.fn().mockResolvedValueOnce(null),
            create: vi.fn().mockResolvedValueOnce(created),
          },
        };
        return cb(tx);
      }
    );

    await createAppointment(USER_ID, SERVICE_ID, START_AT);

    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
  });
});

// ─── cancelAppointment ────────────────────────────────────────────────────────

describe("cancelAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-6: Happy path — PENDING appointment cancelled successfully
  it("cancels a PENDING appointment when called by the owner", async () => {
    // startAt is 3 hours in the future
    const futureStartAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const appt = makePendingAppointment({ startAt: futureStartAt });
    const cancelled = { ...appt, status: "CANCELLED" as AppointmentStatus };

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);
    mockPrismaAppointment.update.mockResolvedValueOnce(cancelled);

    const result = await cancelAppointment(APPOINTMENT_ID, USER_ID);

    expect(result).toEqual({ ok: true, data: cancelled });
    expect(mockPrismaAppointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: APPOINTMENT_ID },
        data: expect.objectContaining({ status: "CANCELLED" }),
      })
    );
  });

  // TC-7: Happy path — CONFIRMED appointment cancelled when > 2h before startAt
  it("cancels a CONFIRMED appointment when more than 2h before startAt", async () => {
    const futureStartAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const appt = makePendingAppointment({
      startAt: futureStartAt,
      status: "CONFIRMED" as AppointmentStatus,
    });
    const cancelled = { ...appt, status: "CANCELLED" as AppointmentStatus };

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);
    mockPrismaAppointment.update.mockResolvedValueOnce(cancelled);

    const result = await cancelAppointment(APPOINTMENT_ID, USER_ID);

    expect(result).toEqual({ ok: true, data: cancelled });
  });

  // TC-8: Cancellation blocked — within 2h window
  it("returns CANCELLATION_WINDOW_EXPIRED when startAt is within 2h", async () => {
    // startAt is 1h in the future (within 2h window)
    const nearStartAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
    const appt = makePendingAppointment({
      startAt: nearStartAt,
      status: "CONFIRMED" as AppointmentStatus,
    });

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);

    const result = await cancelAppointment(APPOINTMENT_ID, USER_ID);

    expect(result).toEqual({ ok: false, error: "CANCELLATION_WINDOW_EXPIRED" });
    expect(mockPrismaAppointment.update).not.toHaveBeenCalled();
  });

  // TC-9: Wrong user — returns FORBIDDEN
  it("returns FORBIDDEN when appointmentId belongs to another user", async () => {
    const appt = makePendingAppointment({ userId: "other-user-id" });

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);

    const result = await cancelAppointment(APPOINTMENT_ID, USER_ID);

    expect(result).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(mockPrismaAppointment.update).not.toHaveBeenCalled();
  });

  // TC-10: Invalid status (COMPLETED) — returns INVALID_STATUS_TRANSITION
  it("returns INVALID_STATUS_TRANSITION when appointment is COMPLETED", async () => {
    const futureStartAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const appt = makePendingAppointment({
      startAt: futureStartAt,
      status: "COMPLETED" as AppointmentStatus,
    });

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);

    const result = await cancelAppointment(APPOINTMENT_ID, USER_ID);

    expect(result).toEqual({ ok: false, error: "INVALID_STATUS_TRANSITION" });
    expect(mockPrismaAppointment.update).not.toHaveBeenCalled();
  });

  // TC-11: Invalid status (NO_SHOW) — returns INVALID_STATUS_TRANSITION
  it("returns INVALID_STATUS_TRANSITION when appointment is NO_SHOW", async () => {
    const futureStartAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const appt = makePendingAppointment({
      startAt: futureStartAt,
      status: "NO_SHOW" as AppointmentStatus,
    });

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);

    const result = await cancelAppointment(APPOINTMENT_ID, USER_ID);

    expect(result).toEqual({ ok: false, error: "INVALID_STATUS_TRANSITION" });
  });

  // TC-12: Appointment not found — returns APPOINTMENT_NOT_FOUND
  it("returns APPOINTMENT_NOT_FOUND when appointment does not exist", async () => {
    mockPrismaAppointment.findUnique.mockResolvedValueOnce(null);

    const result = await cancelAppointment(APPOINTMENT_ID, USER_ID);

    expect(result).toEqual({ ok: false, error: "APPOINTMENT_NOT_FOUND" });
  });
});

// ─── cancelAppointmentAdmin ───────────────────────────────────────────────────

describe("cancelAppointmentAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-13: Happy path — admin cancels any PENDING appointment (no time restriction)
  it("cancels a PENDING appointment without time restriction", async () => {
    // startAt is in the past (1h ago) — admin ignores time restriction
    const pastStartAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const appt = makePendingAppointment({ startAt: pastStartAt });
    const cancelled = { ...appt, status: "CANCELLED" as AppointmentStatus };

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);
    mockPrismaAppointment.update.mockResolvedValueOnce(cancelled);

    const result = await cancelAppointmentAdmin(APPOINTMENT_ID);

    expect(result).toEqual({ ok: true, data: cancelled });
  });

  // TC-14: With cancellationReason — reason is persisted
  it("persists cancellationReason when provided", async () => {
    const appt = makePendingAppointment();
    const reason = "Client no-showed pre-cancellation";
    const cancelled = {
      ...appt,
      status: "CANCELLED" as AppointmentStatus,
      cancellationReason: reason,
    };

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);
    mockPrismaAppointment.update.mockResolvedValueOnce(cancelled);

    const result = await cancelAppointmentAdmin(APPOINTMENT_ID, reason);

    expect(result).toEqual({ ok: true, data: cancelled });
    expect(mockPrismaAppointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CANCELLED",
          cancellationReason: reason,
        }),
      })
    );
  });

  // TC-15: Without cancellationReason — works fine (optional)
  it("cancels successfully without a cancellationReason", async () => {
    const appt = makePendingAppointment({ status: "CONFIRMED" as AppointmentStatus });
    const cancelled = { ...appt, status: "CANCELLED" as AppointmentStatus };

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);
    mockPrismaAppointment.update.mockResolvedValueOnce(cancelled);

    const result = await cancelAppointmentAdmin(APPOINTMENT_ID);

    expect(result.ok).toBe(true);
    expect(mockPrismaAppointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELLED" }),
      })
    );
  });

  // TC-16: Invalid status (COMPLETED) — returns INVALID_STATUS_TRANSITION
  it("returns INVALID_STATUS_TRANSITION when appointment is COMPLETED", async () => {
    const appt = makePendingAppointment({ status: "COMPLETED" as AppointmentStatus });

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);

    const result = await cancelAppointmentAdmin(APPOINTMENT_ID);

    expect(result).toEqual({ ok: false, error: "INVALID_STATUS_TRANSITION" });
    expect(mockPrismaAppointment.update).not.toHaveBeenCalled();
  });

  // TC-17: Appointment not found
  it("returns APPOINTMENT_NOT_FOUND when appointment does not exist", async () => {
    mockPrismaAppointment.findUnique.mockResolvedValueOnce(null);

    const result = await cancelAppointmentAdmin(APPOINTMENT_ID);

    expect(result).toEqual({ ok: false, error: "APPOINTMENT_NOT_FOUND" });
  });
});

// ─── updateStatus ─────────────────────────────────────────────────────────────

describe("updateStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-18: PENDING → CONFIRMED: success
  it("transitions PENDING → CONFIRMED successfully", async () => {
    const appt = makePendingAppointment({ status: "PENDING" as AppointmentStatus });
    const updated = { ...appt, status: "CONFIRMED" as AppointmentStatus };

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);
    mockPrismaAppointment.update.mockResolvedValueOnce(updated);

    const result = await updateStatus(APPOINTMENT_ID, "CONFIRMED" as AppointmentStatus);

    expect(result).toEqual({ ok: true, data: updated });
  });

  // TC-19: CONFIRMED → COMPLETED: success
  it("transitions CONFIRMED → COMPLETED successfully", async () => {
    const appt = makePendingAppointment({ status: "CONFIRMED" as AppointmentStatus });
    const updated = { ...appt, status: "COMPLETED" as AppointmentStatus };

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);
    mockPrismaAppointment.update.mockResolvedValueOnce(updated);

    const result = await updateStatus(APPOINTMENT_ID, "COMPLETED" as AppointmentStatus);

    expect(result).toEqual({ ok: true, data: updated });
  });

  // TC-20: CONFIRMED → NO_SHOW: success
  it("transitions CONFIRMED → NO_SHOW successfully", async () => {
    const appt = makePendingAppointment({ status: "CONFIRMED" as AppointmentStatus });
    const updated = { ...appt, status: "NO_SHOW" as AppointmentStatus };

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);
    mockPrismaAppointment.update.mockResolvedValueOnce(updated);

    const result = await updateStatus(APPOINTMENT_ID, "NO_SHOW" as AppointmentStatus);

    expect(result).toEqual({ ok: true, data: updated });
  });

  // TC-21: Invalid transition (COMPLETED → PENDING): returns INVALID_STATUS_TRANSITION
  it("returns INVALID_STATUS_TRANSITION for COMPLETED → PENDING", async () => {
    const appt = makePendingAppointment({ status: "COMPLETED" as AppointmentStatus });

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);

    const result = await updateStatus(APPOINTMENT_ID, "PENDING" as AppointmentStatus);

    expect(result).toEqual({ ok: false, error: "INVALID_STATUS_TRANSITION" });
    expect(mockPrismaAppointment.update).not.toHaveBeenCalled();
  });

  // TC-22: Invalid transition (CANCELLED → CONFIRMED): returns INVALID_STATUS_TRANSITION
  it("returns INVALID_STATUS_TRANSITION for CANCELLED → CONFIRMED", async () => {
    const appt = makePendingAppointment({ status: "CANCELLED" as AppointmentStatus });

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);

    const result = await updateStatus(APPOINTMENT_ID, "CONFIRMED" as AppointmentStatus);

    expect(result).toEqual({ ok: false, error: "INVALID_STATUS_TRANSITION" });
  });

  // TC-23: Appointment not found
  it("returns APPOINTMENT_NOT_FOUND when appointment does not exist", async () => {
    mockPrismaAppointment.findUnique.mockResolvedValueOnce(null);

    const result = await updateStatus(APPOINTMENT_ID, "CONFIRMED" as AppointmentStatus);

    expect(result).toEqual({ ok: false, error: "APPOINTMENT_NOT_FOUND" });
  });
});

// ─── getAppointments ──────────────────────────────────────────────────────────

describe("getAppointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-24: Returns appointments for given Bogota date with user and service, ordered by startAt ASC
  it("returns appointments for Bogota date including user and service relations, ordered by startAt ASC", async () => {
    const appt1 = {
      ...makePendingAppointment(),
      user: { id: USER_ID, name: "Juan", email: "juan@example.com" },
      service: mockService,
    };

    mockPrismaAppointment.findMany.mockResolvedValueOnce([appt1]);

    const result = await getAppointments("2026-06-20");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      user: expect.objectContaining({ name: "Juan" }),
      service: expect.objectContaining({ name: "Corte Clásico" }),
    });
  });

  // TC-25: Queries by correct UTC day boundaries for Bogota date
  it("queries appointments using UTC boundaries derived from Bogota date", async () => {
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    await getAppointments("2026-06-20");

    // 2026-06-20 Bogota midnight = 2026-06-20T05:00:00Z
    // 2026-06-20 23:59:59.999 Bogota = 2026-06-21T04:59:59.999Z
    expect(mockPrismaAppointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startAt: expect.objectContaining({
            gte: new Date("2026-06-20T05:00:00.000Z"),
            lt: new Date("2026-06-21T05:00:00.000Z"),
          }),
        }),
        orderBy: { startAt: "asc" },
        include: expect.objectContaining({
          user: true,
          service: true,
        }),
      })
    );
  });
});

// ─── getMyAppointments ────────────────────────────────────────────────────────

describe("getMyAppointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-26: Returns all appointments for user ordered by startAt DESC, includes service
  it("returns all appointments for userId ordered by startAt DESC including service", async () => {
    const appt = {
      ...makePendingAppointment(),
      service: mockService,
    };

    mockPrismaAppointment.findMany.mockResolvedValueOnce([appt]);

    const result = await getMyAppointments(USER_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      service: expect.objectContaining({ name: "Corte Clásico" }),
    });

    expect(mockPrismaAppointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID },
        orderBy: { startAt: "desc" },
        include: expect.objectContaining({ service: true }),
      })
    );
  });

  // TC-27: Returns empty array when user has no appointments
  it("returns empty array when user has no appointments", async () => {
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    const result = await getMyAppointments(USER_ID);

    expect(result).toEqual({ ok: true, data: [] });
  });
});
