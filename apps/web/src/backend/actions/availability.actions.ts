"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/backend/lib/guards";
import {
  getSchedule,
  upsertSchedule,
  createTimeBlock,
  deleteTimeBlock,
  repeatTimeBlockForWeekdays,
} from "@/backend/services/availability.service";
import {
  createRecurringTimeBlock,
  updateRecurringTimeBlock,
  setRecurringTimeBlockActive,
  deleteRecurringTimeBlock,
  findConflictingAppointments,
  findRuleById,
  type AppointmentConflict,
} from "@/backend/services/recurring-time-block.service";
import {
  updateScheduleSchema,
  createTimeBlockSchema,
  createRecurringTimeBlockSchema,
  updateRecurringTimeBlockSchema,
} from "@barberia-jeranbuq/shared";
import type {
  DaySchedule,
  CreateTimeBlockData,
  CreateRecurringTimeBlockData,
  UpdateRecurringTimeBlockData,
} from "@barberia-jeranbuq/shared";
import type { ApiResponse } from "@barberia-jeranbuq/shared";
import type {
  AdminAvailability,
  TimeBlock,
  RecurringTimeBlock,
} from "@barberia-jeranbuq/database";

// ─── getScheduleAction ────────────────────────────────────────────────────────

/**
 * Server action: retrieve the full 7-day schedule.
 * Pattern: requireAdmin() → service layer → return.
 */
export async function getScheduleAction(): Promise<
  ApiResponse<AdminAvailability[]>
> {
  await requireAdmin();

  return getSchedule();
}

// ─── updateScheduleAction ─────────────────────────────────────────────────────

/**
 * Server action: upsert all 7 AdminAvailability rows.
 * Pattern: Zod parse → requireAdmin() → service layer → revalidatePath → return.
 */
export async function updateScheduleAction(
  input: unknown
): Promise<ApiResponse<AdminAvailability[]>> {
  const parsed = updateScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  await requireAdmin();

  const result = await upsertSchedule(parsed.data as DaySchedule[]);

  if (result.ok) {
    revalidatePath("/admin/disponibilidad");
  }

  return result;
}

// ─── createTimeBlockAction ────────────────────────────────────────────────────

/**
 * Server action: create a new time block.
 * Pattern: Zod parse → requireAdmin() → service layer → revalidatePath → return.
 */
export async function createTimeBlockAction(
  input: unknown
): Promise<ApiResponse<TimeBlock>> {
  const parsed = createTimeBlockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  const session = await requireAdmin();
  const userId = session.user!.id!;

  const result = await createTimeBlock(
    parsed.data as CreateTimeBlockData,
    userId
  );

  if (result.ok) {
    revalidatePath("/admin/disponibilidad");
  }

  return result;
}

// ─── deleteTimeBlockAction ────────────────────────────────────────────────────

/**
 * Server action: permanently delete a time block.
 * Pattern: requireAdmin() → service layer → revalidatePath → return.
 */
export async function deleteTimeBlockAction(
  id: string
): Promise<ApiResponse<TimeBlock>> {
  await requireAdmin();

  const result = await deleteTimeBlock(id);

  if (result.ok) {
    revalidatePath("/admin/disponibilidad");
  }

  return result;
}

// ─── repeatTimeBlockForWeekdaysAction ─────────────────────────────────────────

/**
 * Server action: create one time block per weekday (Mon–Fri) for the week
 * containing the given date, skipping any days that already have a block for
 * the same time range.
 * Pattern: Zod parse → requireAdmin() → service layer → revalidatePath → return.
 */
export async function repeatTimeBlockForWeekdaysAction(
  input: unknown
): Promise<ApiResponse<TimeBlock[]>> {
  const parsed = createTimeBlockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  const session = await requireAdmin();
  const userId = session.user!.id!;

  const result = await repeatTimeBlockForWeekdays(
    parsed.data as CreateTimeBlockData,
    userId
  );

  if (result.ok) {
    revalidatePath("/admin/disponibilidad");
  }

  return result;
}

// ─── RecurringBlockResponse ────────────────────────────────────────────────────

/**
 * Response shape shared by the recurring-block actions that can trigger the
 * Appointment Conflict Warning gate (create, update, toggle). Callers narrow
 * with `"conflicts" in result`.
 */
export type RecurringBlockResponse =
  | ApiResponse<RecurringTimeBlock>
  | { ok: false; error: "APPOINTMENT_CONFLICTS"; conflicts: AppointmentConflict[] };

// ─── createRecurringTimeBlockAction ────────────────────────────────────────────

/**
 * Server action: create a new recurring weekly time block.
 * Pattern: Zod parse → requireAdmin() → conflict gate (skipped when
 * confirm===true) → service → revalidatePath → return.
 */
export async function createRecurringTimeBlockAction(
  input: unknown,
  confirm?: boolean
): Promise<RecurringBlockResponse> {
  const parsed = createRecurringTimeBlockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  const session = await requireAdmin();
  const userId = session.user!.id!;

  const data = parsed.data as CreateRecurringTimeBlockData;

  if (!confirm) {
    const conflicts = await findConflictingAppointments({
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    if (conflicts.length > 0) {
      return { ok: false, error: "APPOINTMENT_CONFLICTS", conflicts };
    }
  }

  const result = await createRecurringTimeBlock(data, userId);

  if (result.ok) {
    revalidatePath("/admin/disponibilidad");
  }

  return result;
}

// ─── updateRecurringTimeBlockAction ────────────────────────────────────────────

/**
 * Server action: edit an existing recurring weekly time block.
 * Pattern: Zod parse → requireAdmin() → fetch stored row → conflict gate
 * (only when startTime/endTime/dayOfWeek differ from the stored row and
 * confirm!==true; a reason-only edit skips it) → service → revalidatePath.
 */
export async function updateRecurringTimeBlockAction(
  id: string,
  input: unknown,
  confirm?: boolean
): Promise<RecurringBlockResponse> {
  const parsed = updateRecurringTimeBlockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  await requireAdmin();

  const data = parsed.data as UpdateRecurringTimeBlockData;

  const existing = await findRuleById(id);
  if (!existing) {
    return { ok: false, error: "RECURRING_BLOCK_NOT_FOUND" };
  }

  const scheduleChanged =
    data.dayOfWeek !== existing.dayOfWeek ||
    data.startTime !== existing.startTime ||
    data.endTime !== existing.endTime;

  if (scheduleChanged && !confirm) {
    const conflicts = await findConflictingAppointments({
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    if (conflicts.length > 0) {
      return { ok: false, error: "APPOINTMENT_CONFLICTS", conflicts };
    }
  }

  const result = await updateRecurringTimeBlock(id, data);

  if (result.ok) {
    revalidatePath("/admin/disponibilidad");
  }

  return result;
}

// ─── toggleRecurringTimeBlockActiveAction ──────────────────────────────────────

/**
 * Server action: toggle the active state of a recurring weekly time block.
 * Pattern: requireAdmin() → fetch stored row → conflict gate (only on
 * false→true reactivation, skipped when confirm===true) → service →
 * revalidatePath. Deactivating (true→false) never triggers the gate.
 */
export async function toggleRecurringTimeBlockActiveAction(
  id: string,
  active: boolean,
  confirm?: boolean
): Promise<RecurringBlockResponse> {
  await requireAdmin();

  const existing = await findRuleById(id);
  if (!existing) {
    return { ok: false, error: "RECURRING_BLOCK_NOT_FOUND" };
  }

  const isReactivating = !existing.active && active;

  if (isReactivating && !confirm) {
    const conflicts = await findConflictingAppointments({
      dayOfWeek: existing.dayOfWeek,
      startTime: existing.startTime,
      endTime: existing.endTime,
    });

    if (conflicts.length > 0) {
      return { ok: false, error: "APPOINTMENT_CONFLICTS", conflicts };
    }
  }

  const result = await setRecurringTimeBlockActive(id, active);

  if (result.ok) {
    revalidatePath("/admin/disponibilidad");
  }

  return result;
}

// ─── deleteRecurringTimeBlockAction ────────────────────────────────────────────

/**
 * Server action: permanently delete a recurring weekly time block.
 * Pattern: requireAdmin() → service layer → revalidatePath → return.
 * Never triggers the conflict gate.
 */
export async function deleteRecurringTimeBlockAction(
  id: string
): Promise<ApiResponse<RecurringTimeBlock>> {
  await requireAdmin();

  const result = await deleteRecurringTimeBlock(id);

  if (result.ok) {
    revalidatePath("/admin/disponibilidad");
  }

  return result;
}
