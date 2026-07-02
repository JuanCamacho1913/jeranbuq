import { requireAuth } from "@/backend/lib/guards";
import { getMyAppointments } from "@/backend/services/appointments.service";
import { AppointmentList } from "@/frontend/components/client/appointment-list";
import type { Appointment, Service } from "@barberia-jeranbuq/database";

export default async function MisCitasPage() {
  const session = await requireAuth();
  const userId = session.user!.id!;

  const result = await getMyAppointments(userId);
  const appointments = result.ok ? result.data : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Mis Citas
        </h1>
        <p className="mt-1 text-sm text-[#A0A0A0]">
          Aquí podés ver y gestionar tus citas agendadas.
        </p>
      </div>

      <AppointmentList
        appointments={appointments as (Appointment & { service: Service })[]}
      />
    </div>
  );
}
