import { describe, it, expect } from "vitest";
import {
  dayScheduleSchema,
  updateScheduleSchema,
  createTimeBlockSchema,
  createRecurringTimeBlockSchema,
  updateRecurringTimeBlockSchema,
} from "./availability";

// ─── dayScheduleSchema ────────────────────────────────────────────────────────

describe("dayScheduleSchema", () => {
  const validDay = {
    dayOfWeek: 1,
    startTime: "07:00",
    endTime: "19:00",
    slotMinutes: 30,
    active: true,
  };

  it("accepts a fully valid day schedule", () => {
    expect(() => dayScheduleSchema.parse(validDay)).not.toThrow();
  });

  it("uses default slotMinutes of 30 when not provided", () => {
    const { slotMinutes: _sm, ...rest } = validDay;
    const result = dayScheduleSchema.parse(rest);
    expect(result.slotMinutes).toBe(30);
  });

  it("rejects dayOfWeek below 0", () => {
    expect(() =>
      dayScheduleSchema.parse({ ...validDay, dayOfWeek: -1 })
    ).toThrow();
  });

  it("rejects dayOfWeek above 6", () => {
    expect(() =>
      dayScheduleSchema.parse({ ...validDay, dayOfWeek: 7 })
    ).toThrow();
  });

  it("rejects invalid startTime format (not HH:mm)", () => {
    expect(() =>
      dayScheduleSchema.parse({ ...validDay, startTime: "7:00" })
    ).toThrow();
  });

  it("rejects invalid endTime format (not HH:mm)", () => {
    expect(() =>
      dayScheduleSchema.parse({ ...validDay, endTime: "19:0" })
    ).toThrow();
  });

  it("rejects startTime with letters", () => {
    expect(() =>
      dayScheduleSchema.parse({ ...validDay, startTime: "ab:cd" })
    ).toThrow();
  });

  it("accepts all valid dayOfWeek values (0-6)", () => {
    for (let day = 0; day <= 6; day++) {
      expect(() =>
        dayScheduleSchema.parse({ ...validDay, dayOfWeek: day })
      ).not.toThrow();
    }
  });
});

// ─── updateScheduleSchema ─────────────────────────────────────────────────────

describe("updateScheduleSchema", () => {
  const makeDay = (dayOfWeek: number, active = true) => ({
    dayOfWeek,
    startTime: "07:00",
    endTime: "19:00",
    slotMinutes: 30,
    active,
  });

  const validWeeklySchedule = Array.from({ length: 7 }, (_, i) => makeDay(i));

  it("accepts a valid weekly schedule with 7 days", () => {
    expect(() =>
      updateScheduleSchema.parse(validWeeklySchedule)
    ).not.toThrow();
  });

  it("rejects a schedule with fewer than 7 days", () => {
    expect(() =>
      updateScheduleSchema.parse(validWeeklySchedule.slice(0, 6))
    ).toThrow();
  });

  it("rejects a schedule with more than 7 days", () => {
    expect(() =>
      updateScheduleSchema.parse([...validWeeklySchedule, makeDay(0)])
    ).toThrow();
  });

  it("rejects when an active day has endTime before startTime", () => {
    const badSchedule = validWeeklySchedule.map((day, i) =>
      i === 1
        ? { ...day, startTime: "19:00", endTime: "07:00", active: true }
        : day
    );
    expect(() => updateScheduleSchema.parse(badSchedule)).toThrow();
  });

  it("accepts when an inactive day has endTime before startTime (not validated)", () => {
    const scheduleWithInactiveConflict = validWeeklySchedule.map((day, i) =>
      i === 0
        ? { ...day, startTime: "19:00", endTime: "07:00", active: false }
        : day
    );
    expect(() =>
      updateScheduleSchema.parse(scheduleWithInactiveConflict)
    ).not.toThrow();
  });
});

// ─── createTimeBlockSchema ────────────────────────────────────────────────────

describe("createTimeBlockSchema", () => {
  const validBlock = {
    date: "2026-06-15",
    startTime: "09:00",
    endTime: "11:00",
    reason: "Staff meeting",
  };

  it("accepts a fully valid time block", () => {
    expect(() => createTimeBlockSchema.parse(validBlock)).not.toThrow();
  });

  it("accepts a time block without optional reason", () => {
    const { reason: _reason, ...rest } = validBlock;
    expect(() => createTimeBlockSchema.parse(rest)).not.toThrow();
  });

  it("rejects when endTime is before startTime", () => {
    expect(() =>
      createTimeBlockSchema.parse({
        ...validBlock,
        startTime: "11:00",
        endTime: "09:00",
      })
    ).toThrow();
  });

  it("rejects when endTime equals startTime", () => {
    expect(() =>
      createTimeBlockSchema.parse({
        ...validBlock,
        startTime: "09:00",
        endTime: "09:00",
      })
    ).toThrow();
  });

  it("rejects invalid date format (not YYYY-MM-DD)", () => {
    expect(() =>
      createTimeBlockSchema.parse({ ...validBlock, date: "15/06/2026" })
    ).toThrow();
  });

  it("rejects invalid date format (MM-DD-YYYY)", () => {
    expect(() =>
      createTimeBlockSchema.parse({ ...validBlock, date: "06-15-2026" })
    ).toThrow();
  });

  it("rejects invalid startTime format (not HH:mm)", () => {
    expect(() =>
      createTimeBlockSchema.parse({ ...validBlock, startTime: "9:00" })
    ).toThrow();
  });

  it("rejects invalid endTime format (not HH:mm)", () => {
    expect(() =>
      createTimeBlockSchema.parse({ ...validBlock, endTime: "11:0" })
    ).toThrow();
  });

  it("rejects reason exceeding 200 characters", () => {
    expect(() =>
      createTimeBlockSchema.parse({ ...validBlock, reason: "a".repeat(201) })
    ).toThrow();
  });

  it("accepts reason at exactly 200 characters", () => {
    expect(() =>
      createTimeBlockSchema.parse({ ...validBlock, reason: "a".repeat(200) })
    ).not.toThrow();
  });

  it("rejects a missing date field", () => {
    const { date: _date, ...rest } = validBlock;
    expect(() => createTimeBlockSchema.parse(rest)).toThrow();
  });
});

// ─── createRecurringTimeBlockSchema ────────────────────────────────────────────

describe("createRecurringTimeBlockSchema", () => {
  const validRule = {
    dayOfWeek: 1,
    startTime: "13:00",
    endTime: "14:00",
    reason: "Almuerzo semanal",
  };

  it("accepts a fully valid recurring rule", () => {
    expect(() =>
      createRecurringTimeBlockSchema.parse(validRule)
    ).not.toThrow();
  });

  it("accepts a rule without optional reason", () => {
    const { reason: _reason, ...rest } = validRule;
    expect(() => createRecurringTimeBlockSchema.parse(rest)).not.toThrow();
  });

  it("does NOT accept or require a date range field", () => {
    const result = createRecurringTimeBlockSchema.parse(validRule);
    expect(result).not.toHaveProperty("date");
    expect(result).not.toHaveProperty("startDate");
    expect(result).not.toHaveProperty("endDate");
  });

  it("rejects when endTime is before startTime", () => {
    expect(() =>
      createRecurringTimeBlockSchema.parse({
        ...validRule,
        startTime: "14:00",
        endTime: "13:00",
      })
    ).toThrow();
  });

  it("rejects when endTime equals startTime", () => {
    expect(() =>
      createRecurringTimeBlockSchema.parse({
        ...validRule,
        startTime: "13:00",
        endTime: "13:00",
      })
    ).toThrow();
  });

  it("rejects dayOfWeek below 0", () => {
    expect(() =>
      createRecurringTimeBlockSchema.parse({ ...validRule, dayOfWeek: -1 })
    ).toThrow();
  });

  it("rejects dayOfWeek above 6", () => {
    expect(() =>
      createRecurringTimeBlockSchema.parse({ ...validRule, dayOfWeek: 7 })
    ).toThrow();
  });

  it("accepts all valid dayOfWeek values (0-6)", () => {
    for (let day = 0; day <= 6; day++) {
      expect(() =>
        createRecurringTimeBlockSchema.parse({ ...validRule, dayOfWeek: day })
      ).not.toThrow();
    }
  });

  it("rejects invalid startTime format (not HH:mm)", () => {
    expect(() =>
      createRecurringTimeBlockSchema.parse({ ...validRule, startTime: "1:00" })
    ).toThrow();
  });

  it("rejects reason exceeding 200 characters", () => {
    expect(() =>
      createRecurringTimeBlockSchema.parse({
        ...validRule,
        reason: "a".repeat(201),
      })
    ).toThrow();
  });
});

// ─── updateRecurringTimeBlockSchema ────────────────────────────────────────────

describe("updateRecurringTimeBlockSchema", () => {
  const validUpdate = {
    dayOfWeek: 1,
    startTime: "13:00",
    endTime: "14:00",
    reason: "Almuerzo semanal",
    active: false,
  };

  it("accepts a fully valid update including active", () => {
    expect(() =>
      updateRecurringTimeBlockSchema.parse(validUpdate)
    ).not.toThrow();
  });

  it("accepts an update without the optional active field", () => {
    const { active: _active, ...rest } = validUpdate;
    expect(() =>
      updateRecurringTimeBlockSchema.parse(rest)
    ).not.toThrow();
  });

  it("rejects when endTime is before startTime", () => {
    expect(() =>
      updateRecurringTimeBlockSchema.parse({
        ...validUpdate,
        startTime: "14:00",
        endTime: "13:00",
      })
    ).toThrow();
  });

  it("rejects dayOfWeek above 6", () => {
    expect(() =>
      updateRecurringTimeBlockSchema.parse({ ...validUpdate, dayOfWeek: 7 })
    ).toThrow();
  });
});
