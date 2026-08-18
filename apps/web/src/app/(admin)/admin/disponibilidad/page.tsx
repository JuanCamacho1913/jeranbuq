import { prisma } from "@barberia-jeranbuq/database";
import { getScheduleAction } from "@/backend/actions/availability.actions";
import { listRecurringTimeBlocks } from "@/backend/services/recurring-time-block.service";
import { DisponibilidadClient } from "@/frontend/components/admin/disponibilidad-client";

// ─── DisponibilidadPage ───────────────────────────────────────────────────────

/**
 * Schedule management page — /admin/disponibilidad
 *
 * RSC: fetches the weekly schedule, upcoming time blocks, and recurring
 * weekly blocks server-side. requireAdmin() is already enforced by the
 * (admin)/layout.tsx.
 *
 * Sections:
 *   1. Horario Semanal — WeeklyScheduleForm with current schedule as defaultValues
 *   2. Bloques de Tiempo — TimeBlockForm + TimeBlockList
 *   3. Bloqueos Recurrentes — RecurringTimeBlockForm + RecurringTimeBlockList
 */
export default async function DisponibilidadPage() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [scheduleResult, upcomingBlocks, recurringResult] = await Promise.all(
    [
      getScheduleAction(),
      prisma.timeBlock.findMany({
        where: { date: { gte: today } },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
      listRecurringTimeBlocks(),
    ]
  );

  const schedule = scheduleResult.ok ? (scheduleResult.data ?? []) : [];
  const recurringTimeBlocks = recurringResult.ok
    ? (recurringResult.data ?? [])
    : [];

  return (
    <div className="space-y-8 p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Disponibilidad</h1>
      <DisponibilidadClient
        schedule={schedule}
        timeBlocks={upcomingBlocks}
        recurringTimeBlocks={recurringTimeBlocks}
      />
    </div>
  );
}
