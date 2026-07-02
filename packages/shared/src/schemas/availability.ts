import { z } from "zod";

// ─── Time format helper ───────────────────────────────────────────────────────

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// ─── dayScheduleSchema ────────────────────────────────────────────────────────

export const dayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  slotMinutes: z.number().int().min(10).max(120).default(30),
  active: z.boolean(),
});

// ─── updateScheduleSchema ─────────────────────────────────────────────────────

export const updateScheduleSchema = z
  .array(dayScheduleSchema)
  .length(7)
  .refine(
    (days) =>
      days.every(
        (day) => !day.active || day.endTime > day.startTime
      ),
    { message: "endTime must be after startTime for active days" }
  );

// ─── createTimeBlockSchema ────────────────────────────────────────────────────

export const createTimeBlockSchema = z
  .object({
    date: z.string().regex(dateRegex),
    startTime: z.string().regex(timeRegex),
    endTime: z.string().regex(timeRegex),
    reason: z.string().max(200).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type DaySchedule = z.infer<typeof dayScheduleSchema>;
export type UpdateScheduleData = z.infer<typeof updateScheduleSchema>;
export type CreateTimeBlockData = z.infer<typeof createTimeBlockSchema>;
