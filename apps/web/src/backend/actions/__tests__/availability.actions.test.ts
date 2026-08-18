import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockRequireAdmin, mockAvailabilityLayer, mockRecurringBlockLayer } =
  vi.hoisted(() => ({
    mockRequireAdmin: vi.fn(),
    mockAvailabilityLayer: {
      getSchedule: vi.fn(),
      upsertSchedule: vi.fn(),
      createTimeBlock: vi.fn(),
      deleteTimeBlock: vi.fn(),
      repeatTimeBlockForWeekdays: vi.fn(),
    },
    mockRecurringBlockLayer: {
      createRecurringTimeBlock: vi.fn(),
      listRecurringTimeBlocks: vi.fn(),
      updateRecurringTimeBlock: vi.fn(),
      setRecurringTimeBlockActive: vi.fn(),
      deleteRecurringTimeBlock: vi.fn(),
      findConflictingAppointments: vi.fn(),
      findRuleById: vi.fn(),
    },
  }));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/backend/lib/guards", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/backend/services/availability.service", () => mockAvailabilityLayer);

vi.mock(
  "@/backend/services/recurring-time-block.service",
  () => mockRecurringBlockLayer
);

// next/cache revalidatePath is a server-only API — stub it out
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  getScheduleAction,
  updateScheduleAction,
  createTimeBlockAction,
  deleteTimeBlockAction,
  repeatTimeBlockForWeekdaysAction,
  createRecurringTimeBlockAction,
  updateRecurringTimeBlockAction,
  toggleRecurringTimeBlockActiveAction,
  deleteRecurringTimeBlockAction,
} from "../availability.actions";

// ─── Test data ────────────────────────────────────────────────────────────────

const mockSession = {
  user: { id: "user-1", role: "ADMIN", name: "Admin User" },
  expires: "2099-01-01",
};

const mockAvailabilityRow = (dayOfWeek: number) => ({
  id: `avail-${dayOfWeek}`,
  dayOfWeek,
  startTime: "07:00",
  endTime: "19:00",
  slotMinutes: 30,
  active: dayOfWeek !== 0,
});

const mockSchedule = Array.from({ length: 7 }, (_, i) =>
  mockAvailabilityRow(i)
);

const mockTimeBlock = {
  id: "tb-001",
  date: new Date("2026-06-16"),
  startTime: "12:00",
  endTime: "13:00",
  reason: "Almuerzo",
  createdBy: "user-1",
  createdAt: new Date("2026-06-12"),
  updatedAt: new Date("2026-06-12"),
};

const validDays = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  startTime: "07:00",
  endTime: "19:00",
  slotMinutes: 30,
  active: i !== 0,
}));

const validTimeBlockInput = {
  date: "2026-06-16",
  startTime: "12:00",
  endTime: "13:00",
  reason: "Almuerzo",
};

const mockRecurringBlock = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "rtb-001",
  dayOfWeek: 1,
  startTime: "13:00",
  endTime: "14:00",
  reason: "Weekly maintenance",
  active: true,
  createdBy: "user-1",
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
  ...overrides,
});

const validCreateRecurringInput = {
  dayOfWeek: 1,
  startTime: "13:00",
  endTime: "14:00",
  reason: "Weekly maintenance",
};

const mockConflicts = [
  {
    id: "appt-1",
    startAt: new Date("2026-06-22T18:30:00.000Z"),
    endAt: new Date("2026-06-22T18:45:00.000Z"),
    date: "2026-06-22",
    startTime: "13:30",
    endTime: "13:45",
  },
];

// ─── getScheduleAction ────────────────────────────────────────────────────────

describe("getScheduleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockAvailabilityLayer.getSchedule.mockResolvedValueOnce({
      ok: true,
      data: mockSchedule,
    });

    await getScheduleAction();

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("delegates to service layer and returns result", async () => {
    const serviceResult = { ok: true, data: mockSchedule };
    mockAvailabilityLayer.getSchedule.mockResolvedValueOnce(serviceResult);

    const result = await getScheduleAction();

    expect(mockAvailabilityLayer.getSchedule).toHaveBeenCalledOnce();
    expect(result).toEqual(serviceResult);
  });
});

// ─── updateScheduleAction ─────────────────────────────────────────────────────

describe("updateScheduleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockAvailabilityLayer.upsertSchedule.mockResolvedValueOnce({
      ok: true,
      data: mockSchedule,
    });

    await updateScheduleAction(validDays);

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("valid input delegates to service layer and returns result", async () => {
    const serviceResult = { ok: true, data: mockSchedule };
    mockAvailabilityLayer.upsertSchedule.mockResolvedValueOnce(serviceResult);

    const result = await updateScheduleAction(validDays);

    expect(mockAvailabilityLayer.upsertSchedule).toHaveBeenCalledWith(
      validDays
    );
    expect(result).toEqual(serviceResult);
  });

  it("Zod parse failure returns { ok: false, error: 'VALIDATION_ERROR' } without reaching service", async () => {
    // Fewer than 7 days triggers Zod .length(7) failure
    const result = await updateScheduleAction([]);

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockAvailabilityLayer.upsertSchedule).not.toHaveBeenCalled();
  });
});

// ─── createTimeBlockAction ────────────────────────────────────────────────────

describe("createTimeBlockAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockAvailabilityLayer.createTimeBlock.mockResolvedValueOnce({
      ok: true,
      data: mockTimeBlock,
    });

    await createTimeBlockAction(validTimeBlockInput);

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("valid input delegates to service layer with userId and returns result", async () => {
    const serviceResult = { ok: true, data: mockTimeBlock };
    mockAvailabilityLayer.createTimeBlock.mockResolvedValueOnce(serviceResult);

    const result = await createTimeBlockAction(validTimeBlockInput);

    expect(mockAvailabilityLayer.createTimeBlock).toHaveBeenCalledWith(
      validTimeBlockInput,
      mockSession.user.id
    );
    expect(result).toEqual(serviceResult);
  });

  it("Zod parse failure returns { ok: false, error: 'VALIDATION_ERROR' } without reaching service", async () => {
    // Missing date triggers Zod failure
    const result = await createTimeBlockAction({
      startTime: "12:00",
      endTime: "13:00",
    } as never);

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockAvailabilityLayer.createTimeBlock).not.toHaveBeenCalled();
  });
});

// ─── deleteTimeBlockAction ────────────────────────────────────────────────────

describe("deleteTimeBlockAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockAvailabilityLayer.deleteTimeBlock.mockResolvedValueOnce({
      ok: true,
      data: mockTimeBlock,
    });

    await deleteTimeBlockAction("tb-001");

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("valid id delegates to service layer and returns result", async () => {
    const serviceResult = { ok: true, data: mockTimeBlock };
    mockAvailabilityLayer.deleteTimeBlock.mockResolvedValueOnce(serviceResult);

    const result = await deleteTimeBlockAction("tb-001");

    expect(mockAvailabilityLayer.deleteTimeBlock).toHaveBeenCalledWith(
      "tb-001"
    );
    expect(result).toEqual(serviceResult);
  });
});

// ─── repeatTimeBlockForWeekdaysAction ─────────────────────────────────────────

describe("repeatTimeBlockForWeekdaysAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockAvailabilityLayer.repeatTimeBlockForWeekdays.mockResolvedValueOnce({
      ok: true,
      data: [mockTimeBlock],
    });

    await repeatTimeBlockForWeekdaysAction(validTimeBlockInput);

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("valid input delegates to service layer with userId and returns result", async () => {
    const serviceResult = { ok: true, data: [mockTimeBlock] };
    mockAvailabilityLayer.repeatTimeBlockForWeekdays.mockResolvedValueOnce(
      serviceResult
    );

    const result = await repeatTimeBlockForWeekdaysAction(validTimeBlockInput);

    expect(
      mockAvailabilityLayer.repeatTimeBlockForWeekdays
    ).toHaveBeenCalledWith(validTimeBlockInput, mockSession.user.id);
    expect(result).toEqual(serviceResult);
  });

  it("Zod parse failure returns { ok: false, error: 'VALIDATION_ERROR' } without reaching service", async () => {
    // Missing date triggers Zod failure
    const result = await repeatTimeBlockForWeekdaysAction({
      startTime: "12:00",
      endTime: "13:00",
    } as never);

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(
      mockAvailabilityLayer.repeatTimeBlockForWeekdays
    ).not.toHaveBeenCalled();
  });
});

// ─── createRecurringTimeBlockAction ───────────────────────────────────────────

describe("createRecurringTimeBlockAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockRecurringBlockLayer.findConflictingAppointments.mockResolvedValueOnce([]);
    mockRecurringBlockLayer.createRecurringTimeBlock.mockResolvedValueOnce({
      ok: true,
      data: mockRecurringBlock(),
    });

    await createRecurringTimeBlockAction(validCreateRecurringInput);

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("valid input with no conflicts delegates to service layer with userId and returns result", async () => {
    mockRecurringBlockLayer.findConflictingAppointments.mockResolvedValueOnce([]);
    const serviceResult = { ok: true, data: mockRecurringBlock() };
    mockRecurringBlockLayer.createRecurringTimeBlock.mockResolvedValueOnce(
      serviceResult
    );

    const result = await createRecurringTimeBlockAction(
      validCreateRecurringInput
    );

    expect(mockRecurringBlockLayer.findConflictingAppointments).toHaveBeenCalledWith(
      {
        dayOfWeek: 1,
        startTime: "13:00",
        endTime: "14:00",
      }
    );
    expect(mockRecurringBlockLayer.createRecurringTimeBlock).toHaveBeenCalledWith(
      validCreateRecurringInput,
      mockSession.user.id
    );
    expect(result).toEqual(serviceResult);
  });

  it("returns APPOINTMENT_CONFLICTS without persisting when conflicts exist and confirm is not true", async () => {
    mockRecurringBlockLayer.findConflictingAppointments.mockResolvedValueOnce(
      mockConflicts
    );

    const result = await createRecurringTimeBlockAction(
      validCreateRecurringInput
    );

    expect(result).toEqual({
      ok: false,
      error: "APPOINTMENT_CONFLICTS",
      conflicts: mockConflicts,
    });
    expect(mockRecurringBlockLayer.createRecurringTimeBlock).not.toHaveBeenCalled();
  });

  it("confirm:true skips the conflict scan and persists despite conflicts", async () => {
    const serviceResult = { ok: true, data: mockRecurringBlock() };
    mockRecurringBlockLayer.createRecurringTimeBlock.mockResolvedValueOnce(
      serviceResult
    );

    const result = await createRecurringTimeBlockAction(
      validCreateRecurringInput,
      true
    );

    expect(mockRecurringBlockLayer.findConflictingAppointments).not.toHaveBeenCalled();
    expect(mockRecurringBlockLayer.createRecurringTimeBlock).toHaveBeenCalledWith(
      validCreateRecurringInput,
      mockSession.user.id
    );
    expect(result).toEqual(serviceResult);
  });

  it("Zod parse failure returns { ok: false, error: 'VALIDATION_ERROR' } without reaching requireAdmin or service", async () => {
    const result = await createRecurringTimeBlockAction({
      startTime: "13:00",
    } as never);

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockRequireAdmin).not.toHaveBeenCalled();
    expect(mockRecurringBlockLayer.createRecurringTimeBlock).not.toHaveBeenCalled();
  });
});

// ─── updateRecurringTimeBlockAction ───────────────────────────────────────────

describe("updateRecurringTimeBlockAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    const stored = mockRecurringBlock();
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(stored);
    mockRecurringBlockLayer.updateRecurringTimeBlock.mockResolvedValueOnce({
      ok: true,
      data: stored,
    });

    await updateRecurringTimeBlockAction("rtb-001", {
      dayOfWeek: stored.dayOfWeek,
      startTime: stored.startTime,
      endTime: stored.endTime,
      reason: "New reason",
    });

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("startTime/endTime change triggers the conflict gate and blocks without persisting", async () => {
    const stored = mockRecurringBlock({ startTime: "13:00", endTime: "14:00" });
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(stored);
    mockRecurringBlockLayer.findConflictingAppointments.mockResolvedValueOnce(
      mockConflicts
    );

    const input = {
      dayOfWeek: stored.dayOfWeek,
      startTime: "13:00",
      endTime: "15:00",
      reason: stored.reason,
    };

    const result = await updateRecurringTimeBlockAction("rtb-001", input);

    expect(mockRecurringBlockLayer.findConflictingAppointments).toHaveBeenCalledWith(
      { dayOfWeek: input.dayOfWeek, startTime: input.startTime, endTime: input.endTime }
    );
    expect(result).toEqual({
      ok: false,
      error: "APPOINTMENT_CONFLICTS",
      conflicts: mockConflicts,
    });
    expect(mockRecurringBlockLayer.updateRecurringTimeBlock).not.toHaveBeenCalled();
  });

  it("dayOfWeek change also triggers the conflict gate", async () => {
    const stored = mockRecurringBlock({ dayOfWeek: 1 });
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(stored);
    mockRecurringBlockLayer.findConflictingAppointments.mockResolvedValueOnce(
      mockConflicts
    );

    const input = {
      dayOfWeek: 2,
      startTime: stored.startTime,
      endTime: stored.endTime,
      reason: stored.reason,
    };

    const result = await updateRecurringTimeBlockAction("rtb-001", input);

    expect(mockRecurringBlockLayer.findConflictingAppointments).toHaveBeenCalledOnce();
    expect(result).toEqual({
      ok: false,
      error: "APPOINTMENT_CONFLICTS",
      conflicts: mockConflicts,
    });
  });

  it("reason-only edit skips the conflict gate and persists immediately", async () => {
    const stored = mockRecurringBlock({ reason: "Old reason" });
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(stored);
    const input = {
      dayOfWeek: stored.dayOfWeek,
      startTime: stored.startTime,
      endTime: stored.endTime,
      reason: "New reason",
    };
    const serviceResult = { ok: true, data: { ...stored, reason: "New reason" } };
    mockRecurringBlockLayer.updateRecurringTimeBlock.mockResolvedValueOnce(
      serviceResult
    );

    const result = await updateRecurringTimeBlockAction("rtb-001", input);

    expect(mockRecurringBlockLayer.findConflictingAppointments).not.toHaveBeenCalled();
    expect(mockRecurringBlockLayer.updateRecurringTimeBlock).toHaveBeenCalledWith(
      "rtb-001",
      input
    );
    expect(result).toEqual(serviceResult);
  });

  it("confirm:true persists a time change despite conflicts, skipping the scan", async () => {
    const stored = mockRecurringBlock();
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(stored);
    const input = {
      dayOfWeek: stored.dayOfWeek,
      startTime: stored.startTime,
      endTime: "15:00",
      reason: stored.reason,
    };
    const serviceResult = { ok: true, data: { ...stored, endTime: "15:00" } };
    mockRecurringBlockLayer.updateRecurringTimeBlock.mockResolvedValueOnce(
      serviceResult
    );

    const result = await updateRecurringTimeBlockAction("rtb-001", input, true);

    expect(mockRecurringBlockLayer.findConflictingAppointments).not.toHaveBeenCalled();
    expect(mockRecurringBlockLayer.updateRecurringTimeBlock).toHaveBeenCalledWith(
      "rtb-001",
      input
    );
    expect(result).toEqual(serviceResult);
  });

  it("returns RECURRING_BLOCK_NOT_FOUND without persisting when the rule does not exist", async () => {
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(null);

    const result = await updateRecurringTimeBlockAction(
      "missing-id",
      validCreateRecurringInput
    );

    expect(result).toEqual({ ok: false, error: "RECURRING_BLOCK_NOT_FOUND" });
    expect(mockRecurringBlockLayer.updateRecurringTimeBlock).not.toHaveBeenCalled();
  });

  it("Zod parse failure returns { ok: false, error: 'VALIDATION_ERROR' } without reaching requireAdmin or service", async () => {
    const result = await updateRecurringTimeBlockAction("rtb-001", {
      startTime: "13:00",
    } as never);

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockRequireAdmin).not.toHaveBeenCalled();
    expect(mockRecurringBlockLayer.updateRecurringTimeBlock).not.toHaveBeenCalled();
  });
});

// ─── toggleRecurringTimeBlockActiveAction ─────────────────────────────────────

describe("toggleRecurringTimeBlockActiveAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    const stored = mockRecurringBlock({ active: true });
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(stored);
    mockRecurringBlockLayer.setRecurringTimeBlockActive.mockResolvedValueOnce({
      ok: true,
      data: { ...stored, active: false },
    });

    await toggleRecurringTimeBlockActiveAction("rtb-001", false);

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("false→true (reactivate) triggers the conflict gate and blocks without persisting", async () => {
    const stored = mockRecurringBlock({ active: false });
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(stored);
    mockRecurringBlockLayer.findConflictingAppointments.mockResolvedValueOnce(
      mockConflicts
    );

    const result = await toggleRecurringTimeBlockActiveAction("rtb-001", true);

    expect(mockRecurringBlockLayer.findConflictingAppointments).toHaveBeenCalledWith(
      {
        dayOfWeek: stored.dayOfWeek,
        startTime: stored.startTime,
        endTime: stored.endTime,
      }
    );
    expect(result).toEqual({
      ok: false,
      error: "APPOINTMENT_CONFLICTS",
      conflicts: mockConflicts,
    });
    expect(mockRecurringBlockLayer.setRecurringTimeBlockActive).not.toHaveBeenCalled();
  });

  it("true→false (deactivate) skips the conflict gate and persists immediately", async () => {
    const stored = mockRecurringBlock({ active: true });
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(stored);
    const serviceResult = { ok: true, data: { ...stored, active: false } };
    mockRecurringBlockLayer.setRecurringTimeBlockActive.mockResolvedValueOnce(
      serviceResult
    );

    const result = await toggleRecurringTimeBlockActiveAction("rtb-001", false);

    expect(mockRecurringBlockLayer.findConflictingAppointments).not.toHaveBeenCalled();
    expect(mockRecurringBlockLayer.setRecurringTimeBlockActive).toHaveBeenCalledWith(
      "rtb-001",
      false
    );
    expect(result).toEqual(serviceResult);
  });

  it("confirm:true persists a reactivation despite conflicts, skipping the scan", async () => {
    const stored = mockRecurringBlock({ active: false });
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(stored);
    const serviceResult = { ok: true, data: { ...stored, active: true } };
    mockRecurringBlockLayer.setRecurringTimeBlockActive.mockResolvedValueOnce(
      serviceResult
    );

    const result = await toggleRecurringTimeBlockActiveAction(
      "rtb-001",
      true,
      true
    );

    expect(mockRecurringBlockLayer.findConflictingAppointments).not.toHaveBeenCalled();
    expect(mockRecurringBlockLayer.setRecurringTimeBlockActive).toHaveBeenCalledWith(
      "rtb-001",
      true
    );
    expect(result).toEqual(serviceResult);
  });

  it("returns RECURRING_BLOCK_NOT_FOUND without persisting when the rule does not exist", async () => {
    mockRecurringBlockLayer.findRuleById.mockResolvedValueOnce(null);

    const result = await toggleRecurringTimeBlockActiveAction(
      "missing-id",
      true
    );

    expect(result).toEqual({ ok: false, error: "RECURRING_BLOCK_NOT_FOUND" });
    expect(mockRecurringBlockLayer.setRecurringTimeBlockActive).not.toHaveBeenCalled();
  });
});

// ─── deleteRecurringTimeBlockAction ───────────────────────────────────────────

describe("deleteRecurringTimeBlockAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockRecurringBlockLayer.deleteRecurringTimeBlock.mockResolvedValueOnce({
      ok: true,
      data: mockRecurringBlock(),
    });

    await deleteRecurringTimeBlockAction("rtb-001");

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("deletes without any conflict check and returns the service result", async () => {
    const serviceResult = { ok: true, data: mockRecurringBlock() };
    mockRecurringBlockLayer.deleteRecurringTimeBlock.mockResolvedValueOnce(
      serviceResult
    );

    const result = await deleteRecurringTimeBlockAction("rtb-001");

    expect(mockRecurringBlockLayer.findConflictingAppointments).not.toHaveBeenCalled();
    expect(mockRecurringBlockLayer.deleteRecurringTimeBlock).toHaveBeenCalledWith(
      "rtb-001"
    );
    expect(result).toEqual(serviceResult);
  });
});
