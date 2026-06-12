import { prisma } from "@barberia-jeranbuq/database";
import { getScheduleAction } from "@/backend/actions/availability.actions";
import { DisponibilidadClient } from "@/frontend/components/admin/disponibilidad-client";

// ─── DisponibilidadPage ───────────────────────────────────────────────────────

/**
 * Schedule management page — /admin/disponibilidad
 *
 * RSC: fetches the weekly schedule and upcoming time blocks server-side.
 * requireAdmin() is already enforced by the (admin)/layout.tsx.
 *
 * Sections:
 *   1. Horario Semanal — WeeklyScheduleForm with current schedule as defaultValues
 *   2. Bloques de Tiempo — TimeBlockForm + TimeBlockList
 */
export default async function DisponibilidadPage() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [scheduleResult, upcomingBlocks] = await Promise.all([
    getScheduleAction(),
    prisma.timeBlock.findMany({
      where: { date: { gte: today } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const schedule = scheduleResult.ok ? (scheduleResult.data ?? []) : [];

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Disponibilidad</h1>
      <DisponibilidadClient
        schedule={schedule}
        timeBlocks={upcomingBlocks}
      />
    </div>
  );
}
