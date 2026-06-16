import { requireAuth } from "@/backend/lib/guards";
import { getMyAppointments } from "@/backend/services/appointments.service";
import { AppointmentList } from "@/frontend/components/client/appointment-list";
import type { Appointment, Service } from "@barberia-jeranbuq/database";

/**
 * /mis-citas — Client appointments page.
 * RSC: guards with requireAuth, fetches appointments for the session user,
 * and delegates rendering to AppointmentList.
 */
export default async function MisCitasPage() {
  const session = await requireAuth();
  const userId = session.user!.id!;

  const result = await getMyAppointments(userId);
  const appointments = result.ok ? result.data : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Citas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí podés ver y gestionar tus citas agendadas.
        </p>
      </div>

      <AppointmentList
        appointments={appointments as (Appointment & { service: Service })[]}
      />
    </div>
  );
}
