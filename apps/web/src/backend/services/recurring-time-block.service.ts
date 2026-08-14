import { prisma } from "@barberia-jeranbuq/database";
import type { RecurringTimeBlock } from "@barberia-jeranbuq/database";
import type { ApiResponse } from "@barberia-jeranbuq/shared";
import type {
  CreateRecurringTimeBlockData,
  UpdateRecurringTimeBlockData,
} from "@barberia-jeranbuq/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentConflict = {
  id: string;
  startAt: Date;
  endAt: Date;
  date: string; // Bogota "YYYY-MM-DD"
  startTime: string; // Bogota "HH:mm"
  endTime: string; // Bogota "HH:mm"
};

// ─── Error Constants ──────────────────────────────────────────────────────────

const INVALID_BLOCK_RANGE = "INVALID_BLOCK_RANGE" as const;
const RECURRING_BLOCK_NOT_FOUND = "RECURRING_BLOCK_NOT_FOUND" as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BOGOTA_UTC_OFFSET_MS = 5 * 60 * 60 * 1000; // America/Bogota is UTC-5 (no DST)

/**
 * Fetches a RecurringTimeBlock by id, or null if it doesn't exist.
 * Centralizes the findUnique-then-act guard shared by update/toggle/delete.
 * Exported so the actions layer can diff a submitted edit against the
 * stored row to decide whether the conflict gate applies (time/day change
 * vs. reason-only edit) without duplicating this query.
 */
export async function findRuleById(id: string): Promise<RecurringTimeBlock | null> {
  return prisma.recurringTimeBlock.findUnique({ where: { id } });
}

/**
 * Converts a UTC Date to its Bogota calendar date ("YYYY-MM-DD") and
 * local time ("HH:mm") by subtracting the fixed UTC-5 offset, then
 * reading the UTC parts of the shifted instant.
 */
function utcToBogotaParts(d: Date): { date: string; time: string } {
  const bogota = new Date(d.getTime() - BOGOTA_UTC_OFFSET_MS);

  const year = bogota.getUTCFullYear();
  const month = String(bogota.getUTCMonth() + 1).padStart(2, "0");
  const day = String(bogota.getUTCDate()).padStart(2, "0");
  const hours = String(bogota.getUTCHours()).padStart(2, "0");
  const minutes = String(bogota.getUTCMinutes()).padStart(2, "0");

  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

// ─── findConflictingAppointments ───────────────────────────────────────────────

/**
 * Fetches future PENDING/CONFIRMED appointments and returns the ones whose
 * Bogota calendar weekday and time range overlap the given recurring rule.
 */
export async function findConflictingAppointments(
  rule: { dayOfWeek: number; startTime: string; endTime: string },
  now?: Date
): Promise<AppointmentConflict[]> {
  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: { gte: now ?? new Date() },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  const conflicts: AppointmentConflict[] = [];

  for (const appt of appointments) {
    const startParts = utcToBogotaParts(appt.startAt);
    const endParts = utcToBogotaParts(appt.endAt);

    const [year, month, day] = startParts.date.split("-").map(Number);
    const apptDayOfWeek = new Date(
      Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)
    ).getUTCDay();

    const overlaps =
      apptDayOfWeek === rule.dayOfWeek &&
      startParts.time < rule.endTime &&
      endParts.time > rule.startTime;

    if (overlaps) {
      conflicts.push({
        id: appt.id,
        startAt: appt.startAt,
        endAt: appt.endAt,
        date: startParts.date,
        startTime: startParts.time,
        endTime: endParts.time,
      });
    }
  }

  return conflicts;
}

// ─── createRecurringTimeBlock ──────────────────────────────────────────────────

/**
 * Inserts a new RecurringTimeBlock row.
 * Returns INVALID_BLOCK_RANGE if endTime <= startTime.
 */
export async function createRecurringTimeBlock(
  data: CreateRecurringTimeBlockData,
  userId: string
): Promise<ApiResponse<RecurringTimeBlock>> {
  if (data.endTime <= data.startTime) {
    return { ok: false, error: INVALID_BLOCK_RANGE };
  }

  const block = await prisma.recurringTimeBlock.create({
    data: {
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
      createdBy: userId,
    },
  });

  return { ok: true, data: block };
}

// ─── listRecurringTimeBlocks ───────────────────────────────────────────────────

/**
 * Returns all RecurringTimeBlock rows sorted by dayOfWeek then startTime,
 * including inactive rules.
 */
export async function listRecurringTimeBlocks(): Promise<
  ApiResponse<RecurringTimeBlock[]>
> {
  const rows = await prisma.recurringTimeBlock.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return { ok: true, data: rows };
}

// ─── updateRecurringTimeBlock ──────────────────────────────────────────────────

/**
 * Updates an existing RecurringTimeBlock row.
 * Returns RECURRING_BLOCK_NOT_FOUND if no row with the given id exists.
 */
export async function updateRecurringTimeBlock(
  id: string,
  data: UpdateRecurringTimeBlockData
): Promise<ApiResponse<RecurringTimeBlock>> {
  const existing = await findRuleById(id);

  if (!existing) {
    return { ok: false, error: RECURRING_BLOCK_NOT_FOUND };
  }

  const updated = await prisma.recurringTimeBlock.update({
    where: { id },
    data: {
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
      active: data.active,
    },
  });

  return { ok: true, data: updated };
}

// ─── setRecurringTimeBlockActive ───────────────────────────────────────────────

/**
 * Toggles the active state of a RecurringTimeBlock row.
 * Returns RECURRING_BLOCK_NOT_FOUND if no row with the given id exists.
 */
export async function setRecurringTimeBlockActive(
  id: string,
  active: boolean
): Promise<ApiResponse<RecurringTimeBlock>> {
  const existing = await findRuleById(id);

  if (!existing) {
    return { ok: false, error: RECURRING_BLOCK_NOT_FOUND };
  }

  const updated = await prisma.recurringTimeBlock.update({
    where: { id },
    data: { active },
  });

  return { ok: true, data: updated };
}

// ─── deleteRecurringTimeBlock ──────────────────────────────────────────────────

/**
 * Permanently deletes a RecurringTimeBlock row by id.
 * Returns RECURRING_BLOCK_NOT_FOUND if no row with the given id exists.
 */
export async function deleteRecurringTimeBlock(
  id: string
): Promise<ApiResponse<RecurringTimeBlock>> {
  const existing = await findRuleById(id);

  if (!existing) {
    return { ok: false, error: RECURRING_BLOCK_NOT_FOUND };
  }

  const deleted = await prisma.recurringTimeBlock.delete({ where: { id } });

  return { ok: true, data: deleted };
}
