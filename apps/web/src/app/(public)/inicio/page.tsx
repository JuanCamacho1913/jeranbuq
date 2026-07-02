import Link from "next/link";
import { prisma } from "@barberia-jeranbuq/database";
import {
  CATEGORY_DISPLAY_ORDER,
  CATEGORY_LABELS,
} from "@barberia-jeranbuq/shared";
import { ServiceCard } from "@/frontend/components/client/service-card";

export default async function InicioPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  // Group services by category
  const servicesByCategory = Object.fromEntries(
    CATEGORY_DISPLAY_ORDER.map((cat) => [
      cat,
      services.filter((s) => s.category === cat),
    ])
  );

  // Only categories that have at least one service
  const activeCategories = CATEGORY_DISPLAY_ORDER.filter(
    (cat) => (servicesByCategory[cat]?.length ?? 0) > 0
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-20 text-center sm:py-28 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.06)_0%,transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-2xl space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="JB Barber Studio"
            width={100}
            height={100}
            className="mx-auto h-20 w-20 animate-fade-in rounded-full object-contain sm:h-24 sm:w-24"
          />

          <h1 className="animate-fade-up font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Jeranbuq,{" "}
            <span className="text-gold-400">asesora tu imagen</span>
          </h1>

          <p className="animate-fade-up-delay-1 mx-auto max-w-md text-base text-[#A0A0A0] sm:text-lg">
            Estilo, precisión y atención premium. Reserva tu turno y vive
            la experiencia JB Barber Studio.
          </p>

          <div className="animate-fade-up-delay-2">
            <Link
              href="#servicios"
              className="inline-flex items-center rounded-lg bg-gold-500 px-8 py-3 text-sm font-semibold text-[#050505] transition-all duration-200 hover:bg-gold-400 hover:shadow-[0_0_30px_rgba(201,162,39,0.25)]"
            >
              Reservar turno
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gold-500/20 to-transparent" />
      </section>

      {/* ── Services Section ──────────────────────────────────────────── */}
      <section id="servicios" className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="mb-8 space-y-2 sm:mb-12">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Nuestros Servicios
          </h2>
          <p className="text-sm text-[#A0A0A0]">
            Seleccioná un servicio para agendar tu cita.
          </p>
        </div>

        {services.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#A0A0A0]">
            No hay servicios disponibles en este momento.
          </p>
        ) : (
          <div className="space-y-12">
            {activeCategories.map((category) => (
              <div key={category}>
                <h3 className="mb-6 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {CATEGORY_LABELS[category]}
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {servicesByCategory[category]?.map((service, i) => (
                    <div
                      key={service.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <ServiceCard service={service} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
