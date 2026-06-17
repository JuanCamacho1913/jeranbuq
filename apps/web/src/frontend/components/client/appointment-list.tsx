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
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#1E1E1E] py-16 text-center">
        <p className="text-sm text-[#9CA3AF]">No tenés citas programadas.</p>
      </div>
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
