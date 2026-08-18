"use client";

import { useState, useTransition } from "react";
import type { RecurringTimeBlock } from "@barberia-jeranbuq/database";
import {
  toggleRecurringTimeBlockActiveAction,
  deleteRecurringTimeBlockAction,
} from "@/backend/actions/availability.actions";
import type { AppointmentConflict } from "@/backend/services/recurring-time-block.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Switch } from "@/frontend/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/frontend/components/ui/dialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

// ─── RecurringTimeBlockRow ─────────────────────────────────────────────────────

function RecurringTimeBlockRow({
  block,
  onEdit,
}: {
  block: RecurringTimeBlock;
  onEdit: (block: RecurringTimeBlock) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [rowError, setRowError] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<AppointmentConflict[] | null>(
    null
  );

  function handleToggle(checked: boolean) {
    setRowError(null);
    startTransition(async () => {
      const result = await toggleRecurringTimeBlockActiveAction(
        block.id,
        checked
      );
      if (!result.ok) {
        if ("conflicts" in result) {
          setConflicts(result.conflicts);
          setConflictDialogOpen(true);
          return;
        }
        setRowError(result.error ?? "Error inesperado. Intentá de nuevo.");
      }
    });
  }

  function handleConflictConfirm() {
    setConflictDialogOpen(false);
    setRowError(null);
    startTransition(async () => {
      // Reactivation was the only path that can reach this dialog (see
      // toggleRecurringTimeBlockActiveAction — deactivation never gates).
      const result = await toggleRecurringTimeBlockActiveAction(
        block.id,
        true,
        true
      );
      if (!result.ok && !("conflicts" in result)) {
        setRowError(result.error ?? "Error inesperado. Intentá de nuevo.");
      }
      setConflicts(null);
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "¿Eliminar esta regla recurrente? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    setRowError(null);
    startTransition(async () => {
      const result = await deleteRecurringTimeBlockAction(block.id);
      if (!result.ok) {
        setRowError(result.error ?? "Error inesperado. Intentá de nuevo.");
      }
    });
  }

  return (
    <>
      <TableRow>
        {/* Day */}
        <TableCell className="font-medium">
          {DAY_NAMES[block.dayOfWeek]}
        </TableCell>

        {/* Time range */}
        <TableCell>
          {block.startTime} – {block.endTime}
        </TableCell>

        {/* Reason */}
        <TableCell>
          {block.reason ? (
            <Badge variant="secondary">{block.reason}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Active toggle */}
        <TableCell>
          <Switch
            checked={block.active}
            disabled={isPending}
            onCheckedChange={handleToggle}
            className="data-[state=unchecked]:bg-white/20 data-[state=checked]:bg-gold-500"
          />
        </TableCell>

        {/* Actions */}
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onEdit(block)}
            >
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "…" : "Eliminar"}
            </Button>
          </div>
          {rowError && (
            <p className="text-xs text-destructive mt-1">{rowError}</p>
          )}
        </TableCell>
      </TableRow>

      {/* Conflict confirmation dialog (reactivation only) */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Turnos en conflicto</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Hay {conflicts?.length ?? 0} turno(s) confirmado(s) o pendiente(s)
            que se superponen con {DAY_NAMES[block.dayOfWeek]} {block.startTime}
            –{block.endTime}:
          </p>

          <ul className="max-h-48 overflow-y-auto space-y-1 text-sm">
            {conflicts?.map((conflict) => (
              <li
                key={conflict.id}
                className="rounded-md bg-[#1E1E1E] px-3 py-2"
              >
                {conflict.date} · {conflict.startTime} – {conflict.endTime}
              </li>
            ))}
          </ul>

          <p className="text-sm text-muted-foreground">
            Estos turnos no se cancelan ni se modifican. ¿Querés reactivar el
            bloqueo de todas formas?
          </p>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConflictDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConflictConfirm}>
              Confirmar de todas formas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── RecurringTimeBlockList ────────────────────────────────────────────────────

interface RecurringTimeBlockListProps {
  /** Recurring rules sorted by [dayOfWeek asc, startTime asc] (fetched by the RSC page). */
  recurringTimeBlocks: RecurringTimeBlock[];
  /** Called when the admin clicks "Editar" on a row, to load it into the form above. */
  onEdit: (block: RecurringTimeBlock) => void;
}

/**
 * Table of recurring weekly time blocks, sorted/grouped by weekday.
 * Each row: day name, time range, reason, active toggle, edit, delete.
 * Renders an empty state when no rules exist.
 */
export function RecurringTimeBlockList({
  recurringTimeBlocks,
  onEdit,
}: RecurringTimeBlockListProps) {
  if (recurringTimeBlocks.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-[#1E1E1E] px-6 py-12 text-center">
        <p className="text-sm text-[#9CA3AF]">
          No hay bloqueos recurrentes. Usá el formulario de arriba para
          agregar uno.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Desactivar una regla la pausa TODAS las semanas hasta que la
        reactivés — no solo una fecha puntual. Para bloquear una única fecha,
        usá la sección de Bloques de Tiempo de arriba.
      </p>
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/8 bg-[#1E1E1E] hover:bg-[#1E1E1E]">
              <TableHead className="text-[#9CA3AF]">Día</TableHead>
              <TableHead className="text-[#9CA3AF]">Horario</TableHead>
              <TableHead className="text-[#9CA3AF]">Motivo</TableHead>
              <TableHead className="text-[#9CA3AF]">Activo</TableHead>
              <TableHead className="text-[#9CA3AF]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recurringTimeBlocks.map((block) => (
              <RecurringTimeBlockRow
                key={block.id}
                block={block}
                onEdit={onEdit}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
