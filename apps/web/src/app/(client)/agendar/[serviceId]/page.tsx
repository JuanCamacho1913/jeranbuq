import { notFound } from "next/navigation";
import { prisma } from "@barberia-jeranbuq/database";
import { BookingFlow } from "@/frontend/components/client/booking-flow";

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service || !service.active) {
    notFound();
  }

  const availabilities = await prisma.adminAvailability.findMany({
    where: { active: true },
    select: { dayOfWeek: true },
  });

  const availableDayOfWeeks = new Set(availabilities.map((a) => a.dayOfWeek));

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Agendar cita
        </h1>
        <p className="mt-1 text-sm text-[#A0A0A0]">
          {service.name} — {service.durationMin} min
        </p>
      </div>

      <BookingFlow service={service} availableDayOfWeeks={availableDayOfWeeks} />
    </div>
  );
}
