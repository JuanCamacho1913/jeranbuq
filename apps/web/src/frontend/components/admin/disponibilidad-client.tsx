"use client";

import type { AdminAvailability, TimeBlock } from "@barberia-jeranbuq/database";
import { WeeklyScheduleForm } from "@/frontend/components/admin/weekly-schedule-form";
import { TimeBlockForm } from "@/frontend/components/admin/time-block-form";
import { TimeBlockList } from "@/frontend/components/admin/time-block-list";

// ─── DisponibilidadClient ─────────────────────────────────────────────────────

interface DisponibilidadClientProps {
  schedule: AdminAvailability[];
  timeBlocks: TimeBlock[];
}

/**
 * Client wrapper for the disponibilidad page.
 * Renders two independent sections:
 *   1. Horario Semanal — WeeklyScheduleForm (edit schedule)
 *   2. Bloques de Tiempo — TimeBlockForm + TimeBlockList (manage blocks)
 *
 * State refresh after mutations is handled via revalidatePath in server actions,
 * which triggers a RSC re-render of the parent page automatically.
 */
export function DisponibilidadClient({
  schedule,
  timeBlocks,
}: DisponibilidadClientProps) {
  return (
    <div className="space-y-10">
      {/* Section 1: Weekly schedule */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Horario Semanal</h2>
          <p className="text-sm text-muted-foreground">
            Configure the working hours for each day of the week.
          </p>
        </div>
        <WeeklyScheduleForm defaultValues={schedule} />
      </section>

      <hr className="border-border" />

      {/* Section 2: Time blocks */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Bloques de Tiempo</h2>
          <p className="text-sm text-muted-foreground">
            Block specific dates or time ranges (vacations, lunch breaks, etc.).
          </p>
        </div>

        {/* Create form */}
        <div className="rounded-md border p-4">
          <h3 className="text-sm font-medium mb-4">Add time block</h3>
          <TimeBlockForm />
        </div>

        {/* Upcoming blocks list */}
        <TimeBlockList timeBlocks={timeBlocks} />
      </section>
    </div>
  );
}
