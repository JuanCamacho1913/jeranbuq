import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma client ───────────────────────────────────────────────────────
// vi.hoisted ensures the object is defined before vi.mock hoisting runs.

const { mockPrismaAppointment, mockPrismaRecurringTimeBlock } = vi.hoisted(
  () => ({
    mockPrismaAppointment: {
      findMany: vi.fn(),
    },
    mockPrismaRecurringTimeBlock: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  })
);

vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {
    appointment: mockPrismaAppointment,
    recurringTimeBlock: mockPrismaRecurringTimeBlock,
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  findConflictingAppointments,
  createRecurringTimeBlock,
  listRecurringTimeBlocks,
  updateRecurringTimeBlock,
  setRecurringTimeBlockActive,
  deleteRecurringTimeBlock,
} from "../recurring-time-block.service";

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockAppointment = (overrides = {}) => ({
  id: "appt-001",
  userId: "user-1",
  serviceId: "svc-1",
  startAt: new Date("2026-06-15T18:00:00.000Z"), // Monday 13:00 Bogota
  endAt: new Date("2026-06-15T18:45:00.000Z"), // Monday 13:45 Bogota
  status: "CONFIRMED",
  notes: null,
  cancellationReason: null,
  reminderSentAt: null,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
  ...overrides,
});

// ─── findConflictingAppointments ───────────────────────────────────────────────

describe("findConflictingAppointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the appointment when its Bogota weekday and time overlap the rule", async () => {
    // Appointment: Monday 13:00-13:45 Bogota (18:00-18:45 UTC)
    mockPrismaAppointment.findMany.mockResolvedValueOnce([mockAppointment()]);

    const result = await findConflictingAppointments({
      dayOfWeek: 1, // Monday
      startTime: "13:00",
      endTime: "14:00",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "appt-001",
      date: "2026-06-15",
      startTime: "13:00",
      endTime: "13:45",
    });
  });

  it("returns empty when the appointment weekday does not match the rule", async () => {
    // Appointment on Monday, rule targets Tuesday
    mockPrismaAppointment.findMany.mockResolvedValueOnce([mockAppointment()]);

    const result = await findConflictingAppointments({
      dayOfWeek: 2, // Tuesday
      startTime: "13:00",
      endTime: "14:00",
    });

    expect(result).toHaveLength(0);
  });

  it("does NOT flag a conflict when the appointment only touches the rule's boundary", async () => {
    // Appointment Monday 14:00-15:00 Bogota; rule Monday 13:00-14:00 (touching, not overlapping)
    mockPrismaAppointment.findMany.mockResolvedValueOnce([
      mockAppointment({
        startAt: new Date("2026-06-15T19:00:00.000Z"), // 14:00 Bogota
        endAt: new Date("2026-06-15T20:00:00.000Z"), // 15:00 Bogota
      }),
    ]);

    const result = await findConflictingAppointments({
      dayOfWeek: 1,
      startTime: "13:00",
      endTime: "14:00",
    });

    expect(result).toHaveLength(0);
  });

  it("queries only PENDING/CONFIRMED future appointments", async () => {
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);
    const now = new Date("2026-06-10T00:00:00.000Z");

    await findConflictingAppointments(
      { dayOfWeek: 1, startTime: "13:00", endTime: "14:00" },
      now
    );

    expect(mockPrismaAppointment.findMany).toHaveBeenCalledWith({
      where: {
        startAt: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
  });

  it("rolls the weekday back to the previous Bogota calendar day across UTC midnight", async () => {
    // 2026-06-15 (Monday UTC) 02:00 UTC = 2026-06-14 (Sunday) 21:00 Bogota
    mockPrismaAppointment.findMany.mockResolvedValueOnce([
      mockAppointment({
        startAt: new Date("2026-06-15T02:00:00.000Z"),
        endAt: new Date("2026-06-15T02:30:00.000Z"),
      }),
    ]);

    const result = await findConflictingAppointments({
      dayOfWeek: 0, // Sunday
      startTime: "21:00",
      endTime: "22:00",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: "2026-06-14",
      startTime: "21:00",
      endTime: "21:30",
    });
  });
});

// ─── createRecurringTimeBlock ──────────────────────────────────────────────────

describe("createRecurringTimeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRule = {
    id: "rtb-001",
    dayOfWeek: 1,
    startTime: "13:00",
    endTime: "14:00",
    reason: "Almuerzo semanal",
    active: true,
    createdBy: "user-1",
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
  };

  it("valid insert returns ok with the created rule", async () => {
    mockPrismaRecurringTimeBlock.create.mockResolvedValueOnce(mockRule);

    const result = await createRecurringTimeBlock(
      { dayOfWeek: 1, startTime: "13:00", endTime: "14:00", reason: "Almuerzo semanal" },
      "user-1"
    );

    expect(result).toEqual({ ok: true, data: mockRule });
    expect(mockPrismaRecurringTimeBlock.create).toHaveBeenCalledWith({
      data: {
        dayOfWeek: 1,
        startTime: "13:00",
        endTime: "14:00",
        reason: "Almuerzo semanal",
        createdBy: "user-1",
      },
    });
  });

  it("endTime <= startTime returns { ok: false, error: 'INVALID_BLOCK_RANGE' }", async () => {
    const result = await createRecurringTimeBlock(
      { dayOfWeek: 1, startTime: "14:00", endTime: "13:00" },
      "user-1"
    );

    expect(result).toEqual({ ok: false, error: "INVALID_BLOCK_RANGE" });
    expect(mockPrismaRecurringTimeBlock.create).not.toHaveBeenCalled();
  });

  it("equal startTime and endTime returns { ok: false, error: 'INVALID_BLOCK_RANGE' }", async () => {
    const result = await createRecurringTimeBlock(
      { dayOfWeek: 1, startTime: "13:00", endTime: "13:00" },
      "user-1"
    );

    expect(result).toEqual({ ok: false, error: "INVALID_BLOCK_RANGE" });
    expect(mockPrismaRecurringTimeBlock.create).not.toHaveBeenCalled();
  });
});

// ─── listRecurringTimeBlocks ───────────────────────────────────────────────────

describe("listRecurringTimeBlocks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns rules sorted by dayOfWeek then startTime via the query", async () => {
    const rows = [
      { id: "rtb-2", dayOfWeek: 1, startTime: "09:00" },
      { id: "rtb-1", dayOfWeek: 1, startTime: "13:00" },
    ];
    mockPrismaRecurringTimeBlock.findMany.mockResolvedValueOnce(rows);

    const result = await listRecurringTimeBlocks();

    expect(result).toEqual({ ok: true, data: rows });
    expect(mockPrismaRecurringTimeBlock.findMany).toHaveBeenCalledWith({
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  });

  it("returns an empty array when no rules exist", async () => {
    mockPrismaRecurringTimeBlock.findMany.mockResolvedValueOnce([]);

    const result = await listRecurringTimeBlocks();

    expect(result).toEqual({ ok: true, data: [] });
  });
});

// ─── updateRecurringTimeBlock ──────────────────────────────────────────────────

describe("updateRecurringTimeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const existingRule = {
    id: "rtb-001",
    dayOfWeek: 1,
    startTime: "13:00",
    endTime: "14:00",
    reason: "Almuerzo",
    active: true,
    createdBy: "user-1",
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
  };

  it("updates an existing rule and returns ok", async () => {
    mockPrismaRecurringTimeBlock.findUnique.mockResolvedValueOnce(existingRule);
    const updated = { ...existingRule, startTime: "15:00", endTime: "16:00" };
    mockPrismaRecurringTimeBlock.update.mockResolvedValueOnce(updated);

    const result = await updateRecurringTimeBlock("rtb-001", {
      dayOfWeek: 1,
      startTime: "15:00",
      endTime: "16:00",
      reason: "Almuerzo",
    });

    expect(result).toEqual({ ok: true, data: updated });
    expect(mockPrismaRecurringTimeBlock.update).toHaveBeenCalledWith({
      where: { id: "rtb-001" },
      data: {
        dayOfWeek: 1,
        startTime: "15:00",
        endTime: "16:00",
        reason: "Almuerzo",
        active: undefined,
      },
    });
  });

  it("non-existent id returns { ok: false, error: 'RECURRING_BLOCK_NOT_FOUND' }", async () => {
    mockPrismaRecurringTimeBlock.findUnique.mockResolvedValueOnce(null);

    const result = await updateRecurringTimeBlock("missing-id", {
      dayOfWeek: 1,
      startTime: "15:00",
      endTime: "16:00",
    });

    expect(result).toEqual({ ok: false, error: "RECURRING_BLOCK_NOT_FOUND" });
    expect(mockPrismaRecurringTimeBlock.update).not.toHaveBeenCalled();
  });
});

// ─── setRecurringTimeBlockActive ───────────────────────────────────────────────

describe("setRecurringTimeBlockActive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const existingRule = {
    id: "rtb-001",
    dayOfWeek: 1,
    startTime: "13:00",
    endTime: "14:00",
    reason: "Almuerzo",
    active: true,
    createdBy: "user-1",
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
  };

  it("deactivates an active rule (true -> false)", async () => {
    mockPrismaRecurringTimeBlock.findUnique.mockResolvedValueOnce(existingRule);
    const deactivated = { ...existingRule, active: false };
    mockPrismaRecurringTimeBlock.update.mockResolvedValueOnce(deactivated);

    const result = await setRecurringTimeBlockActive("rtb-001", false);

    expect(result).toEqual({ ok: true, data: deactivated });
    expect(mockPrismaRecurringTimeBlock.update).toHaveBeenCalledWith({
      where: { id: "rtb-001" },
      data: { active: false },
    });
  });

  it("reactivates an inactive rule (false -> true)", async () => {
    mockPrismaRecurringTimeBlock.findUnique.mockResolvedValueOnce({
      ...existingRule,
      active: false,
    });
    const reactivated = { ...existingRule, active: true };
    mockPrismaRecurringTimeBlock.update.mockResolvedValueOnce(reactivated);

    const result = await setRecurringTimeBlockActive("rtb-001", true);

    expect(result).toEqual({ ok: true, data: reactivated });
    expect(mockPrismaRecurringTimeBlock.update).toHaveBeenCalledWith({
      where: { id: "rtb-001" },
      data: { active: true },
    });
  });

  it("non-existent id returns { ok: false, error: 'RECURRING_BLOCK_NOT_FOUND' }", async () => {
    mockPrismaRecurringTimeBlock.findUnique.mockResolvedValueOnce(null);

    const result = await setRecurringTimeBlockActive("missing-id", true);

    expect(result).toEqual({ ok: false, error: "RECURRING_BLOCK_NOT_FOUND" });
    expect(mockPrismaRecurringTimeBlock.update).not.toHaveBeenCalled();
  });
});

// ─── deleteRecurringTimeBlock ──────────────────────────────────────────────────

describe("deleteRecurringTimeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const existingRule = {
    id: "rtb-001",
    dayOfWeek: 1,
    startTime: "13:00",
    endTime: "14:00",
    reason: "Almuerzo",
    active: true,
    createdBy: "user-1",
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
  };

  it("deletes the row and returns ok", async () => {
    mockPrismaRecurringTimeBlock.findUnique.mockResolvedValueOnce(existingRule);
    mockPrismaRecurringTimeBlock.delete.mockResolvedValueOnce(existingRule);

    const result = await deleteRecurringTimeBlock("rtb-001");

    expect(result).toEqual({ ok: true, data: existingRule });
    expect(mockPrismaRecurringTimeBlock.delete).toHaveBeenCalledWith({
      where: { id: "rtb-001" },
    });
  });

  it("non-existent id returns { ok: false, error: 'RECURRING_BLOCK_NOT_FOUND' }", async () => {
    mockPrismaRecurringTimeBlock.findUnique.mockResolvedValueOnce(null);

    const result = await deleteRecurringTimeBlock("missing-id");

    expect(result).toEqual({ ok: false, error: "RECURRING_BLOCK_NOT_FOUND" });
    expect(mockPrismaRecurringTimeBlock.delete).not.toHaveBeenCalled();
  });
});
