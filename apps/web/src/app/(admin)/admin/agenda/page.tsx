import { getAppointments } from "@/backend/services/appointments.service";
import { AgendaClient } from "@/frontend/components/admin/agenda-client";
import type { AppointmentWithRelations } from "@/frontend/components/admin/appointment-row";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns today's date in Bogota timezone as a YYYY-MM-DD string.
 * Uses en-CA locale which formats as YYYY-MM-DD natively.
 */
function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
  }).format(new Date());
}

// ─── AgendaPage ───────────────────────────────────────────────────────────────

/**
 * Server Component: admin day-view agenda at /admin/agenda.
 * - Defaults to today's date in Bogota timezone.
 * - Accepts ?date=YYYY-MM-DD search param for navigation.
 * - requireAdmin() is enforced by the (admin)/layout.tsx.
 */
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;

  // Validate the date param — fall back to today if invalid or missing
  const dateParam = params.date;
  const isValidDate = dateParam ? /^\d{4}-\d{2}-\d{2}$/.test(dateParam) : false;
  const date = isValidDate ? dateParam! : todayBogota();

  const result = await getAppointments(date);
  // getAppointments returns Appointment & { user: unknown; service: unknown }[]
  // The prisma include guarantees User + Service shapes at runtime — safe cast.
  const appointments = result.ok
    ? (result.data as unknown as AppointmentWithRelations[])
    : [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Agenda</h1>
      <AgendaClient appointments={appointments} date={date} />
    </div>
  );
}
