import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma client ───────────────────────────────────────────────────────
// vi.hoisted ensures the object is defined before vi.mock hoisting runs.

const { mockPrismaAdminAvailability, mockPrismaTimeBlock } = vi.hoisted(() => ({
  mockPrismaAdminAvailability: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  mockPrismaTimeBlock: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    createMany: vi.fn(),
  },
}));

vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {
    adminAvailability: mockPrismaAdminAvailability,
    timeBlock: mockPrismaTimeBlock,
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  getSchedule,
  upsertSchedule,
  createTimeBlock,
  deleteTimeBlock,
  repeatTimeBlockForWeekdays,
} from "../availability.service";

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockDayRow = (dayOfWeek: number, overrides = {}) => ({
  id: `avail-${dayOfWeek}`,
  dayOfWeek,
  startTime: "07:00",
  endTime: "19:00",
  slotMinutes: 30,
  active: true,
  ...overrides,
});

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

// ─── getSchedule ──────────────────────────────────────────────────────────────

describe("getSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a 7-item array, filling missing days with defaults", async () => {
    // Only Mon-Sat (1-6) exist in DB; Sunday (0) is missing
    mockPrismaAdminAvailability.findMany.mockResolvedValueOnce(
      [1, 2, 3, 4, 5, 6].map((d) => mockDayRow(d))
    );
    mockPrismaAdminAvailability.upsert.mockResolvedValue(
      mockDayRow(0, { active: false })
    );

    const result = await getSchedule();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(7);
  });

  it("calls upsert for each missing day to fill defaults", async () => {
    // No rows exist at all
    mockPrismaAdminAvailability.findMany.mockResolvedValueOnce([]);
    mockPrismaAdminAvailability.upsert.mockResolvedValue(
      mockDayRow(0, { active: false })
    );

    await getSchedule();

    // Should have called upsert 7 times (one per missing day)
    expect(mockPrismaAdminAvailability.upsert).toHaveBeenCalledTimes(7);
  });
});

// ─── upsertSchedule ───────────────────────────────────────────────────────────

describe("upsertSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls Prisma upsert for each of the 7 days", async () => {
    const days = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      startTime: "07:00",
      endTime: "19:00",
      slotMinutes: 30,
      active: i !== 0, // Sunday inactive
    }));

    mockPrismaAdminAvailability.upsert.mockResolvedValue(mockDayRow(0));

    const result = await upsertSchedule(days);

    expect(result.ok).toBe(true);
    expect(mockPrismaAdminAvailability.upsert).toHaveBeenCalledTimes(7);
    expect(mockPrismaAdminAvailability.upsert).toHaveBeenCalledWith({
      where: { dayOfWeek: 0 },
      create: expect.objectContaining({ dayOfWeek: 0 }),
      update: expect.objectContaining({ startTime: "07:00" }),
    });
  });
});

// ─── createTimeBlock ──────────────────────────────────────────────────────────

describe("createTimeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valid insert returns ok with block data", async () => {
    mockPrismaTimeBlock.create.mockResolvedValueOnce(mockTimeBlock);

    const result = await createTimeBlock(
      {
        date: "2026-06-16",
        startTime: "12:00",
        endTime: "13:00",
        reason: "Almuerzo",
      },
      "user-1"
    );

    expect(result).toEqual({ ok: true, data: mockTimeBlock });
    expect(mockPrismaTimeBlock.create).toHaveBeenCalledWith({
      data: {
        date: new Date("2026-06-16"),
        startTime: "12:00",
        endTime: "13:00",
        reason: "Almuerzo",
        createdBy: "user-1",
      },
    });
  });

  it("endTime <= startTime returns { ok: false, error: 'INVALID_BLOCK_RANGE' }", async () => {
    const result = await createTimeBlock(
      {
        date: "2026-06-16",
        startTime: "13:00",
        endTime: "12:00",
      },
      "user-1"
    );

    expect(result).toEqual({ ok: false, error: "INVALID_BLOCK_RANGE" });
    expect(mockPrismaTimeBlock.create).not.toHaveBeenCalled();
  });

  it("equal startTime and endTime returns { ok: false, error: 'INVALID_BLOCK_RANGE' }", async () => {
    const result = await createTimeBlock(
      {
        date: "2026-06-16",
        startTime: "12:00",
        endTime: "12:00",
      },
      "user-1"
    );

    expect(result).toEqual({ ok: false, error: "INVALID_BLOCK_RANGE" });
    expect(mockPrismaTimeBlock.create).not.toHaveBeenCalled();
  });
});

// ─── deleteTimeBlock ──────────────────────────────────────────────────────────

describe("deleteTimeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes row and returns ok", async () => {
    mockPrismaTimeBlock.findUnique.mockResolvedValueOnce(mockTimeBlock);
    mockPrismaTimeBlock.delete.mockResolvedValueOnce(mockTimeBlock);

    const result = await deleteTimeBlock("tb-001");

    expect(result).toEqual({ ok: true, data: mockTimeBlock });
    expect(mockPrismaTimeBlock.delete).toHaveBeenCalledWith({
      where: { id: "tb-001" },
    });
  });

  it("non-existent id returns { ok: false, error: 'BLOCK_NOT_FOUND' }", async () => {
    mockPrismaTimeBlock.findUnique.mockResolvedValueOnce(null);

    const result = await deleteTimeBlock("non-existent");

    expect(result).toEqual({ ok: false, error: "BLOCK_NOT_FOUND" });
    expect(mockPrismaTimeBlock.delete).not.toHaveBeenCalled();
  });
});

// ─── repeatTimeBlockForWeekdays ───────────────────────────────────────────────

describe("repeatTimeBlockForWeekdays", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns TimeBlock-shaped objects for Mon-Fri of the given week", async () => {
    // No existing blocks for those times
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);
    mockPrismaTimeBlock.createMany.mockResolvedValueOnce({ count: 5 });

    // Week containing 2026-06-15 (Monday): Mon=Jun15, Tue=Jun16, Wed=Jun17, Thu=Jun18, Fri=Jun19
    const result = await repeatTimeBlockForWeekdays(
      {
        date: "2026-06-15",
        startTime: "12:00",
        endTime: "13:00",
        reason: "Almuerzo",
      },
      "user-1"
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data).toHaveLength(5);
    // Verify shapes — each item should have TimeBlock fields
    expect(result.data[0]).toMatchObject({
      startTime: "12:00",
      endTime: "13:00",
      reason: "Almuerzo",
      createdBy: "user-1",
    });

    // createMany called once with 5 items
    expect(mockPrismaTimeBlock.createMany).toHaveBeenCalledOnce();
    const createManyArg = mockPrismaTimeBlock.createMany.mock.calls[0]?.[0];
    expect(createManyArg?.data).toHaveLength(5);
  });

  it("skips days that already have a block for the same time range", async () => {
    // Wednesday already has a block for 12:00-13:00
    const wednesdayDate = new Date("2026-06-17");
    wednesdayDate.setUTCHours(0, 0, 0, 0);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([
      {
        ...mockTimeBlock,
        date: new Date("2026-06-17"),
        startTime: "12:00",
        endTime: "13:00",
      },
    ]);
    mockPrismaTimeBlock.createMany.mockResolvedValueOnce({ count: 4 });

    const result = await repeatTimeBlockForWeekdays(
      {
        date: "2026-06-15",
        startTime: "12:00",
        endTime: "13:00",
        reason: "Almuerzo",
      },
      "user-1"
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Only 4 blocks (Mon, Tue, Thu, Fri — Wed skipped)
    expect(result.data).toHaveLength(4);
    const createManyArg = mockPrismaTimeBlock.createMany.mock.calls[0]?.[0];
    expect(createManyArg?.data).toHaveLength(4);
  });
});
