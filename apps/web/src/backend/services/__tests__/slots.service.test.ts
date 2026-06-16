import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock Prisma client ───────────────────────────────────────────────────────
// vi.hoisted ensures the object is defined before vi.mock hoisting runs.

const { mockPrismaService, mockPrismaAdminAvailability, mockPrismaTimeBlock, mockPrismaAppointment } =
  vi.hoisted(() => ({
    mockPrismaService: {
      findUnique: vi.fn(),
    },
    mockPrismaAdminAvailability: {
      findUnique: vi.fn(),
    },
    mockPrismaTimeBlock: {
      findMany: vi.fn(),
    },
    mockPrismaAppointment: {
      findMany: vi.fn(),
    },
  }));

vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {
    service: mockPrismaService,
    adminAvailability: mockPrismaAdminAvailability,
    timeBlock: mockPrismaTimeBlock,
    appointment: mockPrismaAppointment,
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { getAvailableSlots } from "../slots.service";

// ─── Test Helpers ─────────────────────────────────────────────────────────────

const SERVICE_ID = "cmc0000000000000000000001";

const mockService = {
  id: SERVICE_ID,
  name: "Corte Clásico",
  description: null,
  durationMin: 30,
  price: 25000,
  active: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// Monday = dayOfWeek 1
const mockAvailability = {
  id: "avail-1",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "18:00",
  slotMinutes: 30,
  active: true,
};

// ─── getAvailableSlots ────────────────────────────────────────────────────────

describe("getAvailableSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── TC-1: No AdminAvailability → empty array ─────────────────────────────

  it("returns empty slots array when no active AdminAvailability for the requested day", async () => {
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(null);

    // 2026-06-15 is a Monday (dayOfWeek = 1)
    const result = await getAvailableSlots(SERVICE_ID, "2026-06-15");

    expect(result).toEqual({
      ok: true,
      data: { date: "2026-06-15", slots: [] },
    });
    expect(mockPrismaTimeBlock.findMany).not.toHaveBeenCalled();
    expect(mockPrismaAppointment.findMany).not.toHaveBeenCalled();
  });

  // ─── TC-2: AdminAvailability exists but inactive → empty array ───────────

  it("returns empty slots array when AdminAvailability is inactive", async () => {
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce({
      ...mockAvailability,
      active: false,
    });

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-15");

    expect(result).toEqual({
      ok: true,
      data: { date: "2026-06-15", slots: [] },
    });
  });

  // ─── TC-3: Normal day generates correct slots ─────────────────────────────

  it("generates the correct number of candidate slots at slotMinutes intervals", async () => {
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);
    // availability: 09:00–18:00, 30min slots, service 30min
    // candidates: 09:00, 09:30, 10:00, ... 17:30 → 18 slots
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(mockAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-22");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // 09:00–18:00 with 30min slots and 30min service: last start = 17:30
    // (18:00 - 0:30 = 17:30), total = 18 slots
    expect(result.data.slots).toHaveLength(18);

    // All slots should be available (no blocks or appointments)
    expect(result.data.slots.every((s) => s.available)).toBe(true);

    // First slot
    expect(result.data.slots[0]).toMatchObject({
      startTime: "09:00",
      endTime: "09:30",
      available: true,
    });
    expect(result.data.slots[0]?.startAtUTC).toBeDefined();

    // Last slot
    expect(result.data.slots[17]).toMatchObject({
      startTime: "17:30",
      endTime: "18:00",
      available: true,
    });
  });

  // ─── TC-4: TimeBlock marks overlapping slots unavailable ─────────────────

  it("marks slots overlapping a TimeBlock as unavailable", async () => {
    // Service: 30min; availability: 09:00–18:00, 30min slots
    // TimeBlock: 10:00–11:00 → blocks 10:00 and 10:30 slots
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(mockAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([
      {
        id: "tb-1",
        date: new Date("2026-06-22"),
        startTime: "10:00",
        endTime: "11:00",
        reason: "Break",
        createdBy: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-22");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const slot1000 = result.data.slots.find((s) => s.startTime === "10:00");
    const slot1030 = result.data.slots.find((s) => s.startTime === "10:30");
    const slot0930 = result.data.slots.find((s) => s.startTime === "09:30");
    const slot1100 = result.data.slots.find((s) => s.startTime === "11:00");

    expect(slot1000?.available).toBe(false);
    expect(slot1030?.available).toBe(false);
    expect(slot0930?.available).toBe(true);
    expect(slot1100?.available).toBe(true);
  });

  // ─── TC-5: PENDING appointment blocks slot ────────────────────────────────

  it("marks slot unavailable when a PENDING appointment overlaps", async () => {
    // Service: 60min; availability: 09:00–18:00
    // Appointment PENDING: 09:00 Bogota = 14:00 UTC, endAt = 15:00 UTC
    const service60min = { ...mockService, durationMin: 60 };
    mockPrismaService.findUnique.mockResolvedValueOnce(service60min);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(mockAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);

    // PENDING appointment: 09:00–10:00 Bogota = 14:00–15:00 UTC
    const startAt = new Date("2026-06-22T14:00:00.000Z");
    const endAt = new Date("2026-06-22T15:00:00.000Z");
    mockPrismaAppointment.findMany.mockResolvedValueOnce([
      {
        id: "appt-1",
        userId: "user-1",
        serviceId: SERVICE_ID,
        startAt,
        endAt,
        status: "PENDING",
        notes: null,
        cancellationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-22");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const slot0900 = result.data.slots.find((s) => s.startTime === "09:00");
    expect(slot0900?.available).toBe(false);
  });

  // ─── TC-6: CONFIRMED appointment blocks slot ──────────────────────────────

  it("marks slot unavailable when a CONFIRMED appointment overlaps", async () => {
    const service60min = { ...mockService, durationMin: 60 };
    mockPrismaService.findUnique.mockResolvedValueOnce(service60min);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(mockAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);

    // CONFIRMED appointment: 09:00–10:00 Bogota = 14:00–15:00 UTC
    const startAt = new Date("2026-06-22T14:00:00.000Z");
    const endAt = new Date("2026-06-22T15:00:00.000Z");
    mockPrismaAppointment.findMany.mockResolvedValueOnce([
      {
        id: "appt-2",
        userId: "user-1",
        serviceId: SERVICE_ID,
        startAt,
        endAt,
        status: "CONFIRMED",
        notes: null,
        cancellationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-22");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const slot0900 = result.data.slots.find((s) => s.startTime === "09:00");
    expect(slot0900?.available).toBe(false);
  });

  // ─── TC-7: CANCELLED appointment does NOT block slot ──────────────────────

  it("does not block slot when an existing appointment is CANCELLED", async () => {
    const service60min = { ...mockService, durationMin: 60 };
    mockPrismaService.findUnique.mockResolvedValueOnce(service60min);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(mockAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);

    // The service only queries PENDING and CONFIRMED from DB so CANCELLED
    // should never appear in the appointments list returned by the mock.
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-22");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const slot0900 = result.data.slots.find((s) => s.startTime === "09:00");
    expect(slot0900?.available).toBe(true);
  });

  // ─── TC-8: Past slots (same-day) marked unavailable ──────────────────────

  it("marks past slots as unavailable when querying today's date", async () => {
    // We mock the "current time" by using a real future date for "today".
    // 2026-06-15 is Monday; we set system time to 11:30 Bogota (16:30 UTC).
    const fakeNow = new Date("2026-06-15T16:30:00.000Z"); // 11:30 Bogota
    vi.setSystemTime(fakeNow);

    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(mockAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-15");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Slots before or at 11:30 Bogota are unavailable (09:00, 09:30, 10:00, 10:30, 11:00, 11:30)
    const slot0900 = result.data.slots.find((s) => s.startTime === "09:00");
    const slot1100 = result.data.slots.find((s) => s.startTime === "11:00");
    const slot1130 = result.data.slots.find((s) => s.startTime === "11:30");
    const slot1200 = result.data.slots.find((s) => s.startTime === "12:00");

    expect(slot0900?.available).toBe(false);
    expect(slot1100?.available).toBe(false);
    expect(slot1130?.available).toBe(false);
    expect(slot1200?.available).toBe(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── TC-9: Multi-slot service stops at endTime - serviceDuration ──────────

  it("stops generating slots when remaining time is less than service duration", async () => {
    // Service: 60min; availability: 09:00–18:00, 30min slots
    // Last valid start = 17:00 (17:00 + 60min = 18:00), NOT 17:30
    const service60min = { ...mockService, durationMin: 60 };
    mockPrismaService.findUnique.mockResolvedValueOnce(service60min);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(mockAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-22");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // 09:00–18:00 with 30min slots and 60min service: last start = 17:00
    // Slots: 09:00, 09:30, ..., 17:00 → (17:00 - 09:00) / 30min + 1 = 480/30 + 1 = 17
    expect(result.data.slots).toHaveLength(17);

    const lastSlot = result.data.slots[result.data.slots.length - 1];
    expect(lastSlot?.startTime).toBe("17:00");
    expect(lastSlot?.endTime).toBe("18:00");

    // No slot starting at 17:30 (would end at 18:30, past endTime)
    const slot1730 = result.data.slots.find((s) => s.startTime === "17:30");
    expect(slot1730).toBeUndefined();
  });

  // ─── TC-10: Service not found → error response ────────────────────────────

  it("returns { ok: false, error: 'SERVICE_NOT_FOUND' } when service does not exist", async () => {
    mockPrismaService.findUnique.mockResolvedValueOnce(null);

    const result = await getAvailableSlots("non-existent-service", "2026-06-22");

    expect(result).toEqual({ ok: false, error: "SERVICE_NOT_FOUND" });
    expect(mockPrismaAdminAvailability.findUnique).not.toHaveBeenCalled();
  });

  // ─── TC-11: Slot endTime must not exceed schedule endTime ─────────────────

  it("does not generate a slot whose endTime would exceed the schedule endTime", async () => {
    // Availability: 09:00–09:45 with 30min slots, service 30min
    // Candidate slots: 09:00 (end 09:30 ✓), 09:30 would end at 10:00 which exceeds 09:45
    const tightAvailability = {
      ...mockAvailability,
      startTime: "09:00",
      endTime: "09:45",
      slotMinutes: 30,
    };
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService); // durationMin: 30
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(tightAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-22");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Only 09:00 is valid; 09:30 start would give endTime 10:00 which exceeds 09:45
    expect(result.data.slots).toHaveLength(1);
    expect(result.data.slots[0]).toMatchObject({
      startTime: "09:00",
      endTime: "09:30",
    });
  });

  // ─── TC-12: startAtUTC matches Bogota→UTC conversion ─────────────────────

  it("slot startAtUTC correctly reflects Bogota time converted to UTC (UTC-5)", async () => {
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(mockAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    const result = await getAvailableSlots(SERVICE_ID, "2026-06-22");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // 09:00 Bogota (UTC-5) = 14:00 UTC
    const slot0900 = result.data.slots.find((s) => s.startTime === "09:00");
    expect(slot0900?.startAtUTC).toBe("2026-06-22T14:00:00.000Z");
  });

  // ─── TC-13: Appointment query uses correct UTC day boundaries ─────────────

  it("queries appointments using UTC boundaries for the Bogota date", async () => {
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);
    mockPrismaAdminAvailability.findUnique.mockResolvedValueOnce(mockAvailability);
    mockPrismaTimeBlock.findMany.mockResolvedValueOnce([]);
    mockPrismaAppointment.findMany.mockResolvedValueOnce([]);

    await getAvailableSlots(SERVICE_ID, "2026-06-22");

    // Day start UTC for 2026-06-22 Bogota = 2026-06-22T05:00:00.000Z
    // Day end UTC = 2026-06-23T04:59:59.999Z
    expect(mockPrismaAppointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startAt: expect.objectContaining({
            gte: new Date("2026-06-22T05:00:00.000Z"),
            lt: new Date("2026-06-23T05:00:00.000Z"),
          }),
          status: { in: ["PENDING", "CONFIRMED"] },
        }),
      })
    );
  });
});
