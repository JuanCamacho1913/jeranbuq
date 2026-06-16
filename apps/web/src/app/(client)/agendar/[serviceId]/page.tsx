import { notFound } from "next/navigation";
import { prisma } from "@barberia-jeranbuq/database";
import { BookingFlow } from "@/frontend/components/client/booking-flow";

// ─── AgendarPage ──────────────────────────────────────────────────────────────

/**
 * RSC: booking wizard page for a specific service.
 * - 404s if the service does not exist or is inactive.
 * - Fetches AdminAvailability to determine which days are selectable.
 * - Passes service data and available day-of-weeks to the BookingFlow client component.
 */
export default async function AgendarPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  // Fetch the service — must exist and be active
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service || !service.active) {
    notFound();
  }

  // Fetch all active AdminAvailability records to pass day-of-week info to the calendar
  const availabilities = await prisma.adminAvailability.findMany({
    where: { active: true },
    select: { dayOfWeek: true },
  });

  const availableDayOfWeeks = new Set(availabilities.map((a) => a.dayOfWeek));

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Agendar cita</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {service.name} — {service.durationMin} min
        </p>
      </div>

      <BookingFlow service={service} availableDayOfWeeks={availableDayOfWeeks} />
    </div>
  );
}
