import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockRequireAdmin, mockAvailabilityLayer } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockAvailabilityLayer: {
    getSchedule: vi.fn(),
    upsertSchedule: vi.fn(),
    createTimeBlock: vi.fn(),
    deleteTimeBlock: vi.fn(),
    repeatTimeBlockForWeekdays: vi.fn(),
  },
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/backend/lib/guards", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/backend/services/availability.service", () => mockAvailabilityLayer);

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
  isActive: dayOfWeek !== 0,
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
  isActive: i !== 0,
}));

const validTimeBlockInput = {
  date: "2026-06-16",
  startTime: "12:00",
  endTime: "13:00",
  reason: "Almuerzo",
};

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
