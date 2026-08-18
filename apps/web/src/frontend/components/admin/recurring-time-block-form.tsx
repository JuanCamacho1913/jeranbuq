"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RecurringTimeBlock } from "@barberia-jeranbuq/database";
import {
  createRecurringTimeBlockSchema,
  type CreateRecurringTimeBlockData,
} from "@barberia-jeranbuq/shared";
import {
  createRecurringTimeBlockAction,
  updateRecurringTimeBlockAction,
} from "@/backend/actions/availability.actions";
import type { AppointmentConflict } from "@/backend/services/recurring-time-block.service";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/frontend/components/ui/form";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
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

const EMPTY_VALUES: CreateRecurringTimeBlockData = {
  dayOfWeek: 1,
  startTime: "",
  endTime: "",
  reason: "",
};

function blockToFormValues(
  block: RecurringTimeBlock
): CreateRecurringTimeBlockData {
  return {
    dayOfWeek: block.dayOfWeek,
    startTime: block.startTime,
    endTime: block.endTime,
    reason: block.reason ?? "",
  };
}

// ─── RecurringTimeBlockForm ────────────────────────────────────────────────────

interface RecurringTimeBlockFormProps {
  /** When set, the form edits this rule instead of creating a new one. */
  editingBlock?: RecurringTimeBlock | null;
  /** Called after a successful create or update so the list can refresh. */
  onSuccess?: () => void;
  /** Called when an edit finishes (success) or is cancelled by the admin. */
  onCancelEdit?: () => void;
}

/**
 * Form for creating or editing a recurring weekly time block (one weekday
 * per submission — dayOfWeek, start/end time, optional reason).
 *
 * Integrates the Appointment Conflict Warning flow shared by
 * create/update/toggle: on submit, the action runs the conflict scan
 * (unless confirm===true). If future appointments overlap, the action
 * returns them unpersisted and this form shows a confirmation dialog
 * (mirrors the "Repetir para días hábiles" precedent in TimeBlockForm)
 * letting the admin resubmit with confirm:true.
 */
export function RecurringTimeBlockForm({
  editingBlock,
  onSuccess,
  onCancelEdit,
}: RecurringTimeBlockFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<AppointmentConflict[] | null>(
    null
  );
  const [pendingData, setPendingData] =
    useState<CreateRecurringTimeBlockData | null>(null);

  const isEditing = Boolean(editingBlock);

  const form = useForm<CreateRecurringTimeBlockData>({
    resolver: zodResolver(createRecurringTimeBlockSchema),
    defaultValues: editingBlock
      ? blockToFormValues(editingBlock)
      : EMPTY_VALUES,
  });

  // Re-sync the form whenever the admin selects a different rule to edit
  // (or cancels back to create mode).
  useEffect(() => {
    form.reset(editingBlock ? blockToFormValues(editingBlock) : EMPTY_VALUES);
  }, [editingBlock, form]);

  async function runSubmit(
    data: CreateRecurringTimeBlockData,
    confirm?: boolean
  ) {
    const result = editingBlock
      ? await updateRecurringTimeBlockAction(editingBlock.id, data, confirm)
      : await createRecurringTimeBlockAction(data, confirm);

    if (!result.ok) {
      if ("conflicts" in result) {
        setPendingData(data);
        setConflicts(result.conflicts);
        setConflictDialogOpen(true);
        return;
      }
      setServerError(
        result.error === "VALIDATION_ERROR"
          ? "Datos inválidos. Revisá los campos."
          : (result.error ?? "Error inesperado. Intentá de nuevo.")
      );
      return;
    }

    form.reset(EMPTY_VALUES);
    onSuccess?.();
    onCancelEdit?.();
  }

  async function handleSubmit(data: CreateRecurringTimeBlockData) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await runSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConflictConfirm() {
    if (!pendingData) return;
    setConflictDialogOpen(false);
    setServerError(null);
    setIsSubmitting(true);
    try {
      await runSubmit(pendingData, true);
    } finally {
      setIsSubmitting(false);
      setPendingData(null);
      setConflicts(null);
    }
  }

  function handleCancelEdit() {
    form.reset(EMPTY_VALUES);
    setServerError(null);
    onCancelEdit?.();
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          {/* Day of week */}
          <FormField
            control={form.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Día de la semana</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar día" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DAY_NAMES.map((name, index) => (
                      <SelectItem key={name} value={String(index)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Start time */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora inicio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End time */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora fin</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Reason (optional) */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Motivo{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej. Almuerzo, mantenimiento"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Crear bloqueo recurrente"}
            </Button>

            {isEditing && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleCancelEdit}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Form>

      {/* Conflict confirmation dialog */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Turnos en conflicto</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Hay {conflicts?.length ?? 0} turno(s) confirmado(s) o pendiente(s)
            que se superponen con este horario:
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
            Estos turnos no se cancelan ni se modifican. ¿Querés guardar el
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
