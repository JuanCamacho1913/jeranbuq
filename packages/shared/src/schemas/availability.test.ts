import { describe, it, expect } from "vitest";
import {
  DayScheduleSchema,
  UpdateScheduleSchema,
  CreateTimeBlockSchema,
} from "./availability";

// ─── DayScheduleSchema ────────────────────────────────────────────────────────

describe("DayScheduleSchema", () => {
  const validDay = {
    dayOfWeek: 1,
    startTime: "07:00",
    endTime: "19:00",
    slotMinutes: 30,
    isActive: true,
  };

  it("accepts a fully valid day schedule", () => {
    expect(() => DayScheduleSchema.parse(validDay)).not.toThrow();
  });

  it("uses default slotMinutes of 30 when not provided", () => {
    const { slotMinutes: _sm, ...rest } = validDay;
    const result = DayScheduleSchema.parse(rest);
    expect(result.slotMinutes).toBe(30);
  });

  it("rejects dayOfWeek below 0", () => {
    expect(() =>
      DayScheduleSchema.parse({ ...validDay, dayOfWeek: -1 })
    ).toThrow();
  });

  it("rejects dayOfWeek above 6", () => {
    expect(() =>
      DayScheduleSchema.parse({ ...validDay, dayOfWeek: 7 })
    ).toThrow();
  });

  it("rejects invalid startTime format (not HH:mm)", () => {
    expect(() =>
      DayScheduleSchema.parse({ ...validDay, startTime: "7:00" })
    ).toThrow();
  });

  it("rejects invalid endTime format (not HH:mm)", () => {
    expect(() =>
      DayScheduleSchema.parse({ ...validDay, endTime: "19:0" })
    ).toThrow();
  });

  it("rejects startTime with letters", () => {
    expect(() =>
      DayScheduleSchema.parse({ ...validDay, startTime: "ab:cd" })
    ).toThrow();
  });

  it("accepts all valid dayOfWeek values (0-6)", () => {
    for (let day = 0; day <= 6; day++) {
      expect(() =>
        DayScheduleSchema.parse({ ...validDay, dayOfWeek: day })
      ).not.toThrow();
    }
  });
});

// ─── UpdateScheduleSchema ─────────────────────────────────────────────────────

describe("UpdateScheduleSchema", () => {
  const makeDay = (dayOfWeek: number, isActive = true) => ({
    dayOfWeek,
    startTime: "07:00",
    endTime: "19:00",
    slotMinutes: 30,
    isActive,
  });

  const validWeeklySchedule = Array.from({ length: 7 }, (_, i) => makeDay(i));

  it("accepts a valid weekly schedule with 7 days", () => {
    expect(() =>
      UpdateScheduleSchema.parse(validWeeklySchedule)
    ).not.toThrow();
  });

  it("rejects a schedule with fewer than 7 days", () => {
    expect(() =>
      UpdateScheduleSchema.parse(validWeeklySchedule.slice(0, 6))
    ).toThrow();
  });

  it("rejects a schedule with more than 7 days", () => {
    expect(() =>
      UpdateScheduleSchema.parse([...validWeeklySchedule, makeDay(0)])
    ).toThrow();
  });

  it("rejects when an active day has endTime before startTime", () => {
    const badSchedule = validWeeklySchedule.map((day, i) =>
      i === 1
        ? { ...day, startTime: "19:00", endTime: "07:00", isActive: true }
        : day
    );
    expect(() => UpdateScheduleSchema.parse(badSchedule)).toThrow();
  });

  it("accepts when an inactive day has endTime before startTime (not validated)", () => {
    const scheduleWithInactiveConflict = validWeeklySchedule.map((day, i) =>
      i === 0
        ? { ...day, startTime: "19:00", endTime: "07:00", isActive: false }
        : day
    );
    expect(() =>
      UpdateScheduleSchema.parse(scheduleWithInactiveConflict)
    ).not.toThrow();
  });
});

// ─── CreateTimeBlockSchema ────────────────────────────────────────────────────

describe("CreateTimeBlockSchema", () => {
  const validBlock = {
    date: "2026-06-15",
    startTime: "09:00",
    endTime: "11:00",
    reason: "Staff meeting",
  };

  it("accepts a fully valid time block", () => {
    expect(() => CreateTimeBlockSchema.parse(validBlock)).not.toThrow();
  });

  it("accepts a time block without optional reason", () => {
    const { reason: _reason, ...rest } = validBlock;
    expect(() => CreateTimeBlockSchema.parse(rest)).not.toThrow();
  });

  it("rejects when endTime is before startTime", () => {
    expect(() =>
      CreateTimeBlockSchema.parse({
        ...validBlock,
        startTime: "11:00",
        endTime: "09:00",
      })
    ).toThrow();
  });

  it("rejects when endTime equals startTime", () => {
    expect(() =>
      CreateTimeBlockSchema.parse({
        ...validBlock,
        startTime: "09:00",
        endTime: "09:00",
      })
    ).toThrow();
  });

  it("rejects invalid date format (not YYYY-MM-DD)", () => {
    expect(() =>
      CreateTimeBlockSchema.parse({ ...validBlock, date: "15/06/2026" })
    ).toThrow();
  });

  it("rejects invalid date format (MM-DD-YYYY)", () => {
    expect(() =>
      CreateTimeBlockSchema.parse({ ...validBlock, date: "06-15-2026" })
    ).toThrow();
  });

  it("rejects invalid startTime format (not HH:mm)", () => {
    expect(() =>
      CreateTimeBlockSchema.parse({ ...validBlock, startTime: "9:00" })
    ).toThrow();
  });

  it("rejects invalid endTime format (not HH:mm)", () => {
    expect(() =>
      CreateTimeBlockSchema.parse({ ...validBlock, endTime: "11:0" })
    ).toThrow();
  });

  it("rejects reason exceeding 200 characters", () => {
    expect(() =>
      CreateTimeBlockSchema.parse({ ...validBlock, reason: "a".repeat(201) })
    ).toThrow();
  });

  it("accepts reason at exactly 200 characters", () => {
    expect(() =>
      CreateTimeBlockSchema.parse({ ...validBlock, reason: "a".repeat(200) })
    ).not.toThrow();
  });

  it("rejects a missing date field", () => {
    const { date: _date, ...rest } = validBlock;
    expect(() => CreateTimeBlockSchema.parse(rest)).toThrow();
  });
});
