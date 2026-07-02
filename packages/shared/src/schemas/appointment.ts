import { z } from "zod";
import { AppointmentStatus } from "../constants/appointment-status";

// ─── createAppointmentSchema ─────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  serviceId: z.string().cuid(),
  startAt: z.string().datetime(),
});

// ─── cancelAppointmentSchema ─────────────────────────────────────────────────

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().cuid(),
});

// ─── updateAppointmentStatusSchema ───────────────────────────────────────────
// Valid target statuses for admin: all except PENDING (you cannot set back to PENDING)

const updatableStatuses = [
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.NO_SHOW,
] as const;

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().cuid(),
  status: z.enum(updatableStatuses),
  cancellationReason: z.string().max(500).optional(),
});

// ─── getSlotsQuerySchema ─────────────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const getSlotsQuerySchema = z.object({
  date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  serviceId: z.string().min(1),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentData = z.infer<typeof cancelAppointmentSchema>;
export type UpdateAppointmentStatusData = z.infer<
  typeof updateAppointmentStatusSchema
>;
export type GetSlotsQuery = z.infer<typeof getSlotsQuerySchema>;
