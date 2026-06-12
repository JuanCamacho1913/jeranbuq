import { prisma } from "@barberia-jeranbuq/database";
import type { AdminAvailability, TimeBlock } from "@barberia-jeranbuq/database";
import type { ApiResponse } from "@barberia-jeranbuq/shared";
import type {
  DaySchedule,
  CreateTimeBlockData,
} from "@barberia-jeranbuq/shared";

// ─── Default values for missing schedule days ─────────────────────────────────

const DEFAULT_START_TIME = "07:00";
const DEFAULT_END_TIME = "19:00";
const DEFAULT_SLOT_MINUTES = 30;

// ─── getSchedule ──────────────────────────────────────────────────────────────

/**
 * Returns all 7 AdminAvailability rows (0=Sunday through 6=Saturday).
 * Any missing day is upserted with default values (07:00–19:00, 30min, inactive).
 */
export async function getSchedule(): Promise<
  ApiResponse<AdminAvailability[]>
> {
  const existing = await prisma.adminAvailability.findMany();

  const existingDays = new Set(existing.map((row) => row.dayOfWeek));

  const upsertPromises = Array.from({ length: 7 }, (_, dayOfWeek) => {
    if (existingDays.has(dayOfWeek)) return null;

    return prisma.adminAvailability.upsert({
      where: { dayOfWeek },
      create: {
        dayOfWeek,
        startTime: DEFAULT_START_TIME,
        endTime: DEFAULT_END_TIME,
        slotMinutes: DEFAULT_SLOT_MINUTES,
        active: false,
      },
      update: {},
    });
  }).filter(Boolean);

  const inserted = await Promise.all(upsertPromises);

  const allRows = [
    ...existing,
    ...(inserted.filter(Boolean) as AdminAvailability[]),
  ].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return { ok: true, data: allRows };
}

// ─── upsertSchedule ───────────────────────────────────────────────────────────

/**
 * Upserts all 7 AdminAvailability rows from the provided days array.
 * Each day is identified by its dayOfWeek value.
 */
export async function upsertSchedule(
  days: DaySchedule[]
): Promise<ApiResponse<AdminAvailability[]>> {
  const results = await Promise.all(
    days.map((day) =>
      prisma.adminAvailability.upsert({
        where: { dayOfWeek: day.dayOfWeek },
        create: {
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          slotMinutes: day.slotMinutes,
          active: day.active,
        },
        update: {
          startTime: day.startTime,
          endTime: day.endTime,
          slotMinutes: day.slotMinutes,
          active: day.active,
        },
      })
    )
  );

  return { ok: true, data: results };
}

// ─── createTimeBlock ──────────────────────────────────────────────────────────

/**
 * Inserts a new TimeBlock row.
 * Returns INVALID_BLOCK_RANGE if endTime <= startTime.
 */
export async function createTimeBlock(
  data: CreateTimeBlockData,
  userId: string
): Promise<ApiResponse<TimeBlock>> {
  if (data.endTime <= data.startTime) {
    return { ok: false, error: "INVALID_BLOCK_RANGE" };
  }

  const block = await prisma.timeBlock.create({
    data: {
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
      createdBy: userId,
    },
  });

  return { ok: true, data: block };
}

// ─── deleteTimeBlock ──────────────────────────────────────────────────────────

/**
 * Permanently deletes a TimeBlock row by id.
 * Returns BLOCK_NOT_FOUND if no row with the given id exists.
 */
export async function deleteTimeBlock(
  id: string
): Promise<ApiResponse<TimeBlock>> {
  const existing = await prisma.timeBlock.findUnique({ where: { id } });

  if (!existing) {
    return { ok: false, error: "BLOCK_NOT_FOUND" };
  }

  const deleted = await prisma.timeBlock.delete({ where: { id } });

  return { ok: true, data: deleted };
}

// ─── repeatTimeBlockForWeekdays ───────────────────────────────────────────────

/**
 * Creates one TimeBlock per weekday (Monday–Friday) for the week containing
 * the reference date in `data.date`. Uses the same startTime, endTime, and
 * reason for all 5 days. Skips any day that already has a block with the same
 * startTime and endTime on that date to avoid duplicates.
 */
export async function repeatTimeBlockForWeekdays(
  data: CreateTimeBlockData,
  userId: string
): Promise<ApiResponse<TimeBlock[]>> {
  // Compute Mon-Fri dates for the week containing data.date
  const refDate = new Date(data.date);
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  const refDay = refDate.getUTCDay();
  // Distance from Monday (day 1): if refDay=1, offset=0; if Sun=0, offset=-6
  const offsetToMonday = refDay === 0 ? -6 : 1 - refDay;

  const weekdays: Date[] = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(refDate);
    d.setUTCDate(refDate.getUTCDate() + offsetToMonday + i);
    return d;
  });

  // Query existing blocks for those 5 dates with the same time range
  const existing = await prisma.timeBlock.findMany({
    where: {
      date: { in: weekdays },
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });

  // Build a set of ISO date strings for days that already have a block
  const existingDates = new Set(
    existing.map((b) => b.date.toISOString().slice(0, 10))
  );

  // Filter weekdays that are NOT already covered
  const newDates = weekdays.filter(
    (d) => !existingDates.has(d.toISOString().slice(0, 10))
  );

  if (newDates.length === 0) {
    return { ok: true, data: [] };
  }

  const createData = newDates.map((date) => ({
    date,
    startTime: data.startTime,
    endTime: data.endTime,
    reason: data.reason,
    createdBy: userId,
  }));

  await prisma.timeBlock.createMany({ data: createData });

  // Return TimeBlock-shaped objects (createMany does not return rows in Prisma)
  const blocks: TimeBlock[] = createData.map((d, i) => ({
    id: `pending-${i}`,
    date: d.date,
    startTime: d.startTime,
    endTime: d.endTime,
    reason: d.reason ?? null,
    createdBy: d.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return { ok: true, data: blocks };
}
