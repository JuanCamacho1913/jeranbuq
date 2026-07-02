import React from "react";
import { prisma } from "@barberia-jeranbuq/database";
import type { AppointmentStatus, Appointment } from "@barberia-jeranbuq/database";
import type { ApiResponse } from "@barberia-jeranbuq/shared";
import { CANCEL_HOURS } from "@barberia-jeranbuq/shared";
import { sendEmail } from "../lib/email";
import {
  BookingCreated,
  AdminNewBooking,
  AppointmentConfirmed,
  AppointmentCancelled,
} from "../emails";

// ─── Status Transition Map ────────────────────────────────────────────────────
// Note: CANCELLED transitions are handled exclusively by cancel functions.
// updateStatus only handles non-cancel transitions.

const TRANSITION_MAP: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Statuses that can be cancelled (PENDING or CONFIRMED). */
const CANCELLABLE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

/**
 * Converts a Bogota date string to UTC Date boundaries.
 * Bogota is UTC-5, so midnight Bogota = 05:00 UTC.
 */
function bogotaDayBounds(date: string): { gte: Date; lt: Date } {
  const gte = new Date(`${date}T00:00:00-05:00`);
  const lt = new Date(`${date}T24:00:00-05:00`);
  return { gte, lt };
}

// ─── createAppointment ────────────────────────────────────────────────────────

/**
 * Creates an appointment inside a transaction.
 * Steps: fetch service → compute endAt → check overlap → insert.
 * Returns SLOT_UNAVAILABLE if an overlapping PENDING/CONFIRMED appointment exists.
 * Returns SERVICE_NOT_FOUND if the service does not exist or is inactive.
 */
export async function createAppointment(
  userId: string,
  serviceId: string,
  startAt: Date
): Promise<ApiResponse<Appointment>> {
  const result = await prisma.$transaction(async (tx): Promise<ApiResponse<Appointment>> => {
    // 1. Fetch service and verify it exists and is active
    const service = await tx.service.findUnique({ where: { id: serviceId } });

    if (!service || !service.active) {
      return { ok: false, error: "SERVICE_NOT_FOUND" };
    }

    // 2. Compute endAt from service duration
    const endAt = new Date(startAt.getTime() + service.durationMin * 60 * 1000);

    // 3. Check for overlapping PENDING/CONFIRMED appointments
    // Overlap condition: existing.startAt < endAt AND existing.endAt > startAt
    const conflict = await tx.appointment.findFirst({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    if (conflict) {
      return { ok: false, error: "SLOT_UNAVAILABLE" };
    }

    // 4. Insert appointment
    const appointment = await tx.appointment.create({
      data: {
        userId,
        serviceId,
        startAt,
        endAt,
        status: "PENDING",
      },
    });

    return { ok: true, data: appointment };
  });

  // Send emails after the transaction commits — fire-and-forget
  if (result.ok) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: result.data!.id },
      include: { user: true, service: true },
    });

    if (appointment) {
      const { user, service } = appointment as typeof appointment & {
        user: { name: string; email: string };
        service: { name: string };
      };

      void sendEmail({
        to: user.email,
        subject: "Solicitud de cita recibida — Barbería JeranBuq",
        react: React.createElement(BookingCreated, {
          clientName: user.name,
          serviceName: service.name,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          appointmentId: appointment.id,
        }),
      });

      void sendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL!,
        subject: "Nueva solicitud de cita",
        react: React.createElement(AdminNewBooking, {
          clientName: user.name,
          clientEmail: user.email,
          serviceName: service.name,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          appointmentId: appointment.id,
        }),
      });
    }
  }

  return result;
}

// ─── cancelAppointment ────────────────────────────────────────────────────────

/**
 * Cancels an appointment on behalf of the client.
 * Validates:
 * - Appointment exists
 * - userId matches the appointment owner (FORBIDDEN otherwise)
 * - Status is PENDING or CONFIRMED (INVALID_STATUS_TRANSITION otherwise)
 * - startAt is more than CANCEL_HOURS in the future (CANCELLATION_WINDOW_EXPIRED otherwise)
 */
export async function cancelAppointment(
  appointmentId: string,
  userId: string
): Promise<ApiResponse<Appointment>> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    return { ok: false, error: "APPOINTMENT_NOT_FOUND" };
  }

  if (appointment.userId !== userId) {
    return { ok: false, error: "FORBIDDEN" };
  }

  if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
    return { ok: false, error: "INVALID_STATUS_TRANSITION" };
  }

  const msUntilStart = appointment.startAt.getTime() - Date.now();
  const cancelWindowMs = CANCEL_HOURS * 60 * 60 * 1000;

  if (msUntilStart < cancelWindowMs) {
    return { ok: false, error: "CANCELLATION_WINDOW_EXPIRED" };
  }

  const cancelled = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });

  // Notify admin that the client cancelled — fire-and-forget
  const appointmentWithRelations = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { user: true, service: true },
  });

  if (appointmentWithRelations) {
    const { user, service } = appointmentWithRelations as typeof appointmentWithRelations & {
      user: { name: string; email: string };
      service: { name: string };
    };

    void sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL!,
      subject: "Un cliente canceló su cita",
      react: React.createElement(AppointmentCancelled, {
        recipientName: user.name,
        serviceName: service.name,
        startAt: appointmentWithRelations.startAt,
        cancelledBy: "client",
      }),
    });
  }

  return { ok: true, data: cancelled };
}

// ─── cancelAppointmentAdmin ───────────────────────────────────────────────────

/**
 * Cancels an appointment as admin — no time restriction.
 * Validates:
 * - Appointment exists
 * - Status is PENDING or CONFIRMED (INVALID_STATUS_TRANSITION otherwise)
 * @param cancellationReason Optional reason stored on the appointment.
 */
export async function cancelAppointmentAdmin(
  appointmentId: string,
  cancellationReason?: string
): Promise<ApiResponse<Appointment>> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    return { ok: false, error: "APPOINTMENT_NOT_FOUND" };
  }

  if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
    return { ok: false, error: "INVALID_STATUS_TRANSITION" };
  }

  const cancelled = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
      ...(cancellationReason !== undefined && { cancellationReason }),
    },
  });

  // Notify client that admin cancelled — fire-and-forget
  const appointmentWithRelations = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { user: true, service: true },
  });

  if (appointmentWithRelations) {
    const { user, service } = appointmentWithRelations as typeof appointmentWithRelations & {
      user: { name: string; email: string };
      service: { name: string };
    };

    void sendEmail({
      to: user.email,
      subject: "Tu cita fue cancelada — Barbería JeranBuq",
      react: React.createElement(AppointmentCancelled, {
        recipientName: user.name,
        serviceName: service.name,
        startAt: appointmentWithRelations.startAt,
        cancelledBy: "admin",
        ...(cancellationReason !== undefined && { cancellationReason }),
      }),
    });
  }

  return { ok: true, data: cancelled };
}

// ─── updateStatus ─────────────────────────────────────────────────────────────

/**
 * Transitions an appointment to a new status via the TRANSITION_MAP.
 * Does NOT handle cancellation — use cancelAppointment / cancelAppointmentAdmin.
 * Returns INVALID_STATUS_TRANSITION when the transition is not allowed.
 */
export async function updateStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<ApiResponse<Appointment>> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    return { ok: false, error: "APPOINTMENT_NOT_FOUND" };
  }

  const allowedTransitions = TRANSITION_MAP[appointment.status] ?? [];

  if (!allowedTransitions.includes(status)) {
    return { ok: false, error: "INVALID_STATUS_TRANSITION" };
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  // Send confirmation email to client when appointment is CONFIRMED — fire-and-forget
  if (status === "CONFIRMED") {
    const appointmentWithRelations = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { user: true, service: true },
    });

    if (appointmentWithRelations) {
      const { user, service } = appointmentWithRelations as typeof appointmentWithRelations & {
        user: { name: string; email: string };
        service: { name: string };
      };

      void sendEmail({
        to: user.email,
        subject: "¡Tu cita fue confirmada! — Barbería JeranBuq",
        react: React.createElement(AppointmentConfirmed, {
          clientName: user.name,
          serviceName: service.name,
          startAt: appointmentWithRelations.startAt,
          endAt: appointmentWithRelations.endAt,
          appointmentId: appointmentWithRelations.id,
        }),
      });
    }
  }

  return { ok: true, data: updated };
}

// ─── getAppointments ──────────────────────────────────────────────────────────

/**
 * Admin agenda view: returns all appointments for a given Bogota date.
 * Date boundaries are computed in UTC (Bogota UTC-5).
 * Includes user and service relations, ordered by startAt ASC.
 */
export async function getAppointments(
  date: string
): Promise<ApiResponse<(Appointment & { user: unknown; service: unknown })[]>> {
  const { gte, lt } = bogotaDayBounds(date);

  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: { gte, lt },
    },
    orderBy: { startAt: "asc" },
    include: {
      user: true,
      service: true,
    },
  });

  return { ok: true, data: appointments };
}

// ─── getMyAppointments ────────────────────────────────────────────────────────

/**
 * Client view: returns all appointments for a given user.
 * Includes service relation, ordered by startAt DESC.
 */
export async function getMyAppointments(
  userId: string
): Promise<ApiResponse<(Appointment & { service: unknown })[]>> {
  const appointments = await prisma.appointment.findMany({
    where: { userId },
    orderBy: { startAt: "desc" },
    include: {
      service: true,
    },
  });

  return { ok: true, data: appointments };
}
