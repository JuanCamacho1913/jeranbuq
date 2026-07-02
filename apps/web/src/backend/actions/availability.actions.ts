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
  updateScheduleSchema,
  createTimeBlockSchema,
} from "@barberia-jeranbuq/shared";
import type {
  DaySchedule,
  CreateTimeBlockData,
} from "@barberia-jeranbuq/shared";
import type { ApiResponse } from "@barberia-jeranbuq/shared";
import type { AdminAvailability, TimeBlock } from "@barberia-jeranbuq/database";

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
