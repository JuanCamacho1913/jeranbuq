"use client";

import { useState } from "react";
import type {
  AdminAvailability,
  TimeBlock,
  RecurringTimeBlock,
} from "@barberia-jeranbuq/database";
import { WeeklyScheduleForm } from "@/frontend/components/admin/weekly-schedule-form";
import { TimeBlockForm } from "@/frontend/components/admin/time-block-form";
import { TimeBlockList } from "@/frontend/components/admin/time-block-list";
import { RecurringTimeBlockForm } from "@/frontend/components/admin/recurring-time-block-form";
import { RecurringTimeBlockList } from "@/frontend/components/admin/recurring-time-block-list";

// ─── DisponibilidadClient ─────────────────────────────────────────────────────

interface DisponibilidadClientProps {
  schedule: AdminAvailability[];
  timeBlocks: TimeBlock[];
  recurringTimeBlocks: RecurringTimeBlock[];
}

/**
 * Client wrapper for the disponibilidad page.
 * Renders three independent sections:
 *   1. Horario Semanal — WeeklyScheduleForm (edit schedule)
 *   2. Bloques de Tiempo — TimeBlockForm + TimeBlockList (exact-date blocks)
 *   3. Bloqueos Recurrentes — RecurringTimeBlockForm + RecurringTimeBlockList
 *      (weekly-recurring blocks, e.g. "every Monday 13:00–14:00")
 *
 * State refresh after mutations is handled via revalidatePath in server actions,
 * which triggers a RSC re-render of the parent page automatically.
 */
export function DisponibilidadClient({
  schedule,
  timeBlocks,
  recurringTimeBlocks,
}: DisponibilidadClientProps) {
  // Lifted here so a row's "Editar" click in the list can load its data into
  // the form above it.
  const [editingRecurringBlock, setEditingRecurringBlock] =
    useState<RecurringTimeBlock | null>(null);

  return (
    <div className="space-y-10">
      {/* Section 1: Weekly schedule */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Horario Semanal</h2>
          <p className="text-sm text-muted-foreground">
            Configurá el horario de atención para cada día de la semana.
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
            Bloqueá fechas o rangos horarios específicos (vacaciones, descansos, etc.).
          </p>
        </div>

        {/* Create form */}
        <div className="rounded-xl bg-[#1E1E1E] p-4">
          <h3 className="text-sm font-medium mb-4">Agregar bloque</h3>
          <TimeBlockForm />
        </div>

        {/* Upcoming blocks list */}
        <TimeBlockList timeBlocks={timeBlocks} />
      </section>

      <hr className="border-border" />

      {/* Section 3: Recurring weekly blocks */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Bloqueos Recurrentes</h2>
          <p className="text-sm text-muted-foreground">
            Definí un bloqueo que se repite todas las semanas en el mismo día
            y horario (ej. &ldquo;todos los lunes de 13:00 a 14:00&rdquo;),
            sin tener que crear un bloque nuevo cada semana.
          </p>
        </div>

        {/* Create/edit form */}
        <div className="rounded-xl bg-[#1E1E1E] p-4">
          <h3 className="text-sm font-medium mb-4">
            {editingRecurringBlock
              ? "Editar bloqueo recurrente"
              : "Agregar bloqueo recurrente"}
          </h3>
          <RecurringTimeBlockForm
            editingBlock={editingRecurringBlock}
            onCancelEdit={() => setEditingRecurringBlock(null)}
          />
        </div>

        {/* Rules list */}
        <RecurringTimeBlockList
          recurringTimeBlocks={recurringTimeBlocks}
          onEdit={setEditingRecurringBlock}
        />
      </section>
    </div>
  );
}
