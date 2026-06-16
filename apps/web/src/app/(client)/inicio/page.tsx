import { prisma } from "@barberia-jeranbuq/database";
import { ServiceCard } from "@/frontend/components/client/service-card";

/**
 * Client home page — displays all active services as selectable cards.
 * RSC: fetches directly from the DB; no server action indirection needed.
 */
export default async function InicioPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuestros Servicios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seleccioná un servicio para agendar tu cita.
        </p>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay servicios disponibles en este momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
