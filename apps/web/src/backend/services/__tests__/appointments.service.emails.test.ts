import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AppointmentStatus } from "@barberia-jeranbuq/database";

// ─── Mock sendEmail ───────────────────────────────────────────────────────────
// Must be declared before vi.mock hoisting.

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
}));

vi.mock("../../lib/email", () => ({
  sendEmail: mockSendEmail,
}));

// ─── Mock Prisma client ───────────────────────────────────────────────────────

const { mockPrismaAppointment, mockPrismaTransaction } = vi.hoisted(() => {
  const mockPrismaTransaction = vi.fn();
  return {
    mockPrismaAppointment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mockPrismaTransaction,
  };
});

vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {
    service: { findUnique: vi.fn() },
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

// ─── Mock React Email templates ───────────────────────────────────────────────
// Prevents JSX resolution issues in unit tests.

vi.mock("../../emails", () => ({
  BookingCreated: vi.fn(() => null),
  AdminNewBooking: vi.fn(() => null),
  AppointmentConfirmed: vi.fn(() => null),
  AppointmentCancelled: vi.fn(() => null),
}));

// ─── Import under test ────────────────────────────────────────────────────────

import {
  createAppointment,
  updateStatus,
  cancelAppointment,
  cancelAppointmentAdmin,
} from "../appointments.service";

// ─── Test Helpers ─────────────────────────────────────────────────────────────

const USER_ID = "user-email-test-0000001";
const SERVICE_ID = "svc-email-test-00000001";
const APPOINTMENT_ID = "appt-email-test-000001";

const mockUser = {
  id: USER_ID,
  name: "Ana García",
  email: "ana@example.com",
};

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

const START_AT = new Date("2026-06-20T15:00:00.000Z");
const END_AT = new Date("2026-06-20T16:00:00.000Z");

function makeAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: APPOINTMENT_ID,
    userId: USER_ID,
    serviceId: SERVICE_ID,
    startAt: START_AT,
    endAt: END_AT,
    status: "PENDING" as AppointmentStatus,
    notes: null,
    cancellationReason: null,
    reminderSentAt: null,
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
    ...overrides,
  };
}

function makeAppointmentWithRelations(overrides: Record<string, unknown> = {}) {
  return {
    ...makeAppointment(),
    user: mockUser,
    service: mockService,
    ...overrides,
  };
}

// ─── createAppointment email integration ──────────────────────────────────────

describe("createAppointment — email integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendEmail twice after successful appointment creation (client + admin)", async () => {
    const created = makeAppointment();
    const withRelations = makeAppointmentWithRelations();

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

    // Post-transaction fetch with relations
    mockPrismaAppointment.findUnique.mockResolvedValueOnce(withRelations);

    // Allow fire-and-forget to resolve
    mockSendEmail.mockResolvedValue(undefined);

    const result = await createAppointment(USER_ID, SERVICE_ID, START_AT);

    expect(result.ok).toBe(true);

    // Wait for microtasks so void sendEmail calls complete
    await vi.waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });
  });

  it("does NOT throw if sendEmail rejects — appointment still created", async () => {
    const created = makeAppointment();
    const withRelations = makeAppointmentWithRelations();

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

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(withRelations);

    // sendEmail wrapper never rethrows — it catches internally
    mockSendEmail.mockRejectedValue(new Error("Resend timeout"));

    await expect(
      createAppointment(USER_ID, SERVICE_ID, START_AT)
    ).resolves.toEqual({ ok: true, data: created });
  });
});

// ─── updateStatus — CONFIRMED email integration ───────────────────────────────

describe("updateStatus — email integration (CONFIRMED)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendEmail once (to client) when status transitions to CONFIRMED", async () => {
    const appt = makeAppointment({ status: "PENDING" as AppointmentStatus });
    const updated = makeAppointment({ status: "CONFIRMED" as AppointmentStatus });
    const withRelations = makeAppointmentWithRelations({
      status: "CONFIRMED" as AppointmentStatus,
    });

    mockPrismaAppointment.findUnique
      .mockResolvedValueOnce(appt)      // first call: status check
      .mockResolvedValueOnce(withRelations); // second call: fetch with relations

    mockPrismaAppointment.update.mockResolvedValueOnce(updated);
    mockSendEmail.mockResolvedValue(undefined);

    const result = await updateStatus(APPOINTMENT_ID, "CONFIRMED" as AppointmentStatus);

    expect(result.ok).toBe(true);

    await vi.waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });
  });

  it("does NOT call sendEmail when status transitions to COMPLETED", async () => {
    const appt = makeAppointment({ status: "CONFIRMED" as AppointmentStatus });
    const updated = makeAppointment({ status: "COMPLETED" as AppointmentStatus });

    mockPrismaAppointment.findUnique.mockResolvedValueOnce(appt);
    mockPrismaAppointment.update.mockResolvedValueOnce(updated);

    await updateStatus(APPOINTMENT_ID, "COMPLETED" as AppointmentStatus);

    // Yield microtasks
    await Promise.resolve();

    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});

// ─── cancelAppointment — email integration (client cancels) ──────────────────

describe("cancelAppointment — email integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendEmail once (to admin) when client cancels appointment", async () => {
    const futureStartAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const appt = makeAppointment({ startAt: futureStartAt });
    const cancelled = makeAppointment({
      startAt: futureStartAt,
      status: "CANCELLED" as AppointmentStatus,
    });
    const withRelations = makeAppointmentWithRelations({
      startAt: futureStartAt,
      status: "CANCELLED" as AppointmentStatus,
    });

    mockPrismaAppointment.findUnique
      .mockResolvedValueOnce(appt)         // first call: ownership/status check
      .mockResolvedValueOnce(withRelations); // second call: fetch with relations

    mockPrismaAppointment.update.mockResolvedValueOnce(cancelled);
    mockSendEmail.mockResolvedValue(undefined);

    const result = await cancelAppointment(APPOINTMENT_ID, USER_ID);

    expect(result.ok).toBe(true);

    await vi.waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });
  });
});

// ─── cancelAppointmentAdmin — email integration (admin cancels) ───────────────

describe("cancelAppointmentAdmin — email integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendEmail once (to client) when admin cancels appointment", async () => {
    const appt = makeAppointment();
    const cancelled = makeAppointment({ status: "CANCELLED" as AppointmentStatus });
    const withRelations = makeAppointmentWithRelations({
      status: "CANCELLED" as AppointmentStatus,
    });

    mockPrismaAppointment.findUnique
      .mockResolvedValueOnce(appt)         // first call: status check
      .mockResolvedValueOnce(withRelations); // second call: fetch with relations

    mockPrismaAppointment.update.mockResolvedValueOnce(cancelled);
    mockSendEmail.mockResolvedValue(undefined);

    const result = await cancelAppointmentAdmin(APPOINTMENT_ID);

    expect(result.ok).toBe(true);

    await vi.waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });
  });
});
