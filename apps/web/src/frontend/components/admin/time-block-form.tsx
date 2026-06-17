"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTimeBlockSchema,
  type CreateTimeBlockData,
} from "@barberia-jeranbuq/shared";
import {
  createTimeBlockAction,
  repeatTimeBlockForWeekdaysAction,
} from "@/backend/actions/availability.actions";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/frontend/components/ui/dialog";

// ─── TimeBlockForm ────────────────────────────────────────────────────────────

interface TimeBlockFormProps {
  /** Called after a successful create or repeat action so the list can refresh. */
  onSuccess?: () => void;
}

/**
 * Form for creating a time block (date + time range + reason).
 * Two submit paths:
 *   1. "Crear Bloque"              → createTimeBlockAction (single day)
 *   2. "Repetir para días hábiles" → repeatTimeBlockForWeekdaysAction (Mon–Fri
 *                                    of the same week, with a confirmation dialog)
 */
export function TimeBlockForm({ onSuccess }: TimeBlockFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Hold the validated form values while we wait for the user to confirm
  const [pendingRepeat, setPendingRepeat] = useState<CreateTimeBlockData | null>(
    null
  );

  const form = useForm<CreateTimeBlockData>({
    resolver: zodResolver(createTimeBlockSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      reason: "",
    },
  });

  // ── Single block creation ──────────────────────────────────────────────────

  async function handleCreate(data: CreateTimeBlockData) {
    setServerError(null);
    setIsCreating(true);
    try {
      const result = await createTimeBlockAction(data);
      if (!result.ok) {
        setServerError(
          result.error === "VALIDATION_ERROR"
            ? "Datos inválidos. Revisá los campos."
            : (result.error ?? "Error inesperado. Intentá de nuevo.")
        );
        return;
      }
      form.reset();
      onSuccess?.();
    } finally {
      setIsCreating(false);
    }
  }

  // ── Repeat for weekdays — open confirmation dialog ─────────────────────────

  async function handleRepeatClick() {
    // Validate the form first before opening the dialog
    const valid = await form.trigger();
    if (!valid) return;

    const values = form.getValues();
    setPendingRepeat(values);
    setConfirmOpen(true);
  }

  // ── Repeat confirmed ───────────────────────────────────────────────────────

  async function handleRepeatConfirm() {
    if (!pendingRepeat) return;

    setConfirmOpen(false);
    setServerError(null);
    setIsRepeating(true);
    try {
      const result = await repeatTimeBlockForWeekdaysAction(pendingRepeat);
      if (!result.ok) {
        setServerError(
          result.error === "VALIDATION_ERROR"
            ? "Datos inválidos. Revisá los campos."
            : (result.error ?? "Error inesperado. Intentá de nuevo.")
        );
        return;
      }
      form.reset();
      onSuccess?.();
    } finally {
      setIsRepeating(false);
      setPendingRepeat(null);
    }
  }

  const isBusy = isCreating || isRepeating;

  return (
    <>
      <Form {...form}>
        <form className="space-y-4">
          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
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
                    placeholder="Ej. Vacaciones, almuerzo"
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
            {/* Single block */}
            <Button
              type="button"
              disabled={isBusy}
              onClick={form.handleSubmit(handleCreate)}
            >
              {isCreating ? "Creando…" : "Crear bloque"}
            </Button>

            {/* Repeat for weekdays */}
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleRepeatClick}
            >
              {isRepeating ? "Repitiendo…" : "Repetir para días hábiles"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Confirmation dialog for "Repetir para días hábiles" */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Repetir para días hábiles</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Se creará un bloque por cada día hábil (lunes a viernes) de la
            semana que contiene el{" "}
            <strong>{pendingRepeat?.date ?? ""}</strong>, de{" "}
            <strong>{pendingRepeat?.startTime}</strong> a{" "}
            <strong>{pendingRepeat?.endTime}</strong>
            {pendingRepeat?.reason ? (
              <>
                {" "}
                — <em>{pendingRepeat.reason}</em>
              </>
            ) : null}
            . Los días que ya tengan un bloque en ese horario serán ignorados.
          </p>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleRepeatConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
