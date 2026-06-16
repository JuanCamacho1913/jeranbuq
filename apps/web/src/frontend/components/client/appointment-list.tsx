"use client";

import type { Appointment, Service } from "@barberia-jeranbuq/database";
import { AppointmentCard } from "./appointment-card";

// ─── AppointmentList ──────────────────────────────────────────────────────────

/**
 * Renders a list of AppointmentCard items.
 * Appointments are assumed to be ordered by startAt DESC (from getMyAppointments).
 * Shows an empty-state message when the array is empty.
 */
export function AppointmentList({
  appointments,
}: {
  appointments: (Appointment & { service: Service })[];
}) {
  if (appointments.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No tenés citas programadas.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  );
}
