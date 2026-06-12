"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { DaySchedule } from "@barberia-jeranbuq/shared";
import { updateScheduleAction } from "@/backend/actions/availability.actions";
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
import { Switch } from "@/frontend/components/ui/switch";
import type { AdminAvailability } from "@barberia-jeranbuq/database";

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

// ─── Form schema ──────────────────────────────────────────────────────────────

// Concrete day schema for the form — slotMinutes is required (no .default()) so
// the input and output types match and zodResolver is happy.
const FormDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotMinutes: z.number().int().min(10).max(120),
  active: z.boolean(),
});

// Wrap the top-level array in an object for react-hook-form compatibility
// (useFieldArray requires a parent object key)
const FormSchema = z.object({
  slotMinutes: z.number().int().min(10).max(120),
  days: z.array(FormDaySchema).length(7),
});

type FormValues = z.infer<typeof FormSchema>;

// ─── Default day builder ──────────────────────────────────────────────────────

function buildDefaultDays(
  schedule: AdminAvailability[] | null
): DaySchedule[] {
  return Array.from({ length: 7 }, (_, i) => {
    const existing = schedule?.find((row) => row.dayOfWeek === i);
    return {
      dayOfWeek: i,
      startTime: existing?.startTime ?? "07:00",
      endTime: existing?.endTime ?? "19:00",
      slotMinutes: existing?.slotMinutes ?? 30,
      active: existing?.active ?? (i !== 0), // Sunday off by default
    };
  });
}

// ─── WeeklyScheduleForm ───────────────────────────────────────────────────────

interface WeeklyScheduleFormProps {
  /** Current schedule from the database (may be partial — missing days get defaults). */
  defaultValues: AdminAvailability[] | null;
}

/**
 * Form for configuring the 7-day weekly schedule.
 * Each row: day name, active switch, start/end time inputs.
 * A single global slotMinutes input applies to all days on submit.
 */
export function WeeklyScheduleForm({ defaultValues }: WeeklyScheduleFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultDays = buildDefaultDays(defaultValues);
  const defaultSlot = defaultDays[1]?.slotMinutes ?? 30; // use Mon as reference

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      slotMinutes: defaultSlot,
      days: defaultDays,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "days",
  });

  const { isSubmitting } = form.formState;

  // Watch active per day to conditionally disable time inputs
  const watchedDays = form.watch("days");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSuccessMessage(null);

    // Apply the global slotMinutes to every day before submitting
    const daysWithSlot: DaySchedule[] = values.days.map((day) => ({
      ...day,
      slotMinutes: values.slotMinutes,
    }));

    const result = await updateScheduleAction(daysWithSlot);

    if (!result.ok) {
      setServerError(
        result.error === "VALIDATION_ERROR"
          ? "Invalid schedule data. Please check the times."
          : (result.error ?? "An unexpected error occurred.")
      );
      return;
    }

    setSuccessMessage("Schedule saved successfully.");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Global slot duration */}
        <div className="flex items-end gap-4">
          <FormField
            control={form.control}
            name="slotMinutes"
            render={({ field }) => (
              <FormItem className="w-48">
                <FormLabel>Slot duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={10}
                    max={120}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Day rows */}
        <div className="space-y-3">
          {fields.map((field, index) => {
            const isActive = watchedDays[index]?.active ?? false;

            return (
              <div
                key={field.id}
                className="grid grid-cols-[140px_auto_1fr_1fr] items-center gap-4 rounded-md border px-4 py-3"
              >
                {/* Day name */}
                <span className="text-sm font-medium">
                  {DAY_NAMES[field.dayOfWeek]}
                </span>

                {/* Active switch */}
                <FormField
                  control={form.control}
                  name={`days.${index}.active`}
                  render={({ field: switchField }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={switchField.value}
                          onCheckedChange={switchField.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Start time */}
                <FormField
                  control={form.control}
                  name={`days.${index}.startTime`}
                  render={({ field: timeField }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Start
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          disabled={!isActive}
                          className={!isActive ? "opacity-50" : ""}
                          {...timeField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End time */}
                <FormField
                  control={form.control}
                  name={`days.${index}.endTime`}
                  render={({ field: timeField }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        End
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          disabled={!isActive}
                          className={!isActive ? "opacity-50" : ""}
                          {...timeField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Server feedback */}
        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
        {successMessage && (
          <p className="text-sm text-green-600">{successMessage}</p>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save schedule"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
