"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin } from "@/backend/lib/guards";
import {
  createAppointment,
  cancelAppointment,
  cancelAppointmentAdmin,
  updateStatus,
} from "@/backend/services/appointments.service";
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  updateAppointmentStatusSchema,
} from "@barberia-jeranbuq/shared";
import type { ApiResponse } from "@barberia-jeranbuq/shared";
import type { Appointment } from "@barberia-jeranbuq/database";

// ─── createAppointmentAction ──────────────────────────────────────────────────

/**
 * Server action: create a new appointment for the authenticated client.
 * Pattern: Zod parse → requireAuth() → service.createAppointment → revalidatePath → return.
 */
export async function createAppointmentAction(
  input: unknown
): Promise<ApiResponse<Appointment>> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  const session = await requireAuth();
  const userId = session.user!.id!;

  const startAt = new Date(parsed.data.startAt);

  const result = await createAppointment(userId, parsed.data.serviceId, startAt);

  if (result.ok) {
    revalidatePath("/mis-citas");
  }

  return result;
}

// ─── cancelMyAppointmentAction ────────────────────────────────────────────────

/**
 * Server action: cancel an appointment on behalf of the authenticated client.
 * Pattern: Zod parse → requireAuth() → service.cancelAppointment → revalidatePath → return.
 */
export async function cancelMyAppointmentAction(
  input: unknown
): Promise<ApiResponse<Appointment>> {
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  const session = await requireAuth();
  const userId = session.user!.id!;

  const result = await cancelAppointment(parsed.data.appointmentId, userId);

  if (result.ok) {
    revalidatePath("/mis-citas");
  }

  return result;
}

// ─── updateAppointmentStatusAction ───────────────────────────────────────────

/**
 * Server action: admin updates appointment status.
 * If status is CANCELLED, delegates to cancelAppointmentAdmin (allows optional reason).
 * Otherwise delegates to updateStatus via TRANSITION_MAP.
 * Pattern: Zod parse → requireAdmin() → service call → revalidatePath → return.
 */
export async function updateAppointmentStatusAction(
  input: unknown
): Promise<ApiResponse<Appointment>> {
  const parsed = updateAppointmentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  await requireAdmin();

  const { appointmentId, status, cancellationReason } = parsed.data;

  let result: ApiResponse<Appointment>;

  if (status === "CANCELLED") {
    result = await cancelAppointmentAdmin(appointmentId, cancellationReason);
  } else {
    result = await updateStatus(appointmentId, status);
  }

  if (result.ok) {
    revalidatePath("/admin/agenda");
  }

  return result;
}
