import { z } from "zod";

// ─── Time format helper ───────────────────────────────────────────────────────

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// ─── DayScheduleSchema ────────────────────────────────────────────────────────

export const DayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  slotMinutes: z.number().int().min(10).max(120).default(30),
  isActive: z.boolean(),
});

// ─── UpdateScheduleSchema ─────────────────────────────────────────────────────

export const UpdateScheduleSchema = z
  .array(DayScheduleSchema)
  .length(7)
  .refine(
    (days) =>
      days.every(
        (day) => !day.isActive || day.endTime > day.startTime
      ),
    { message: "endTime must be after startTime for active days" }
  );

// ─── CreateTimeBlockSchema ────────────────────────────────────────────────────

export const CreateTimeBlockSchema = z
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

export type DaySchedule = z.infer<typeof DayScheduleSchema>;
export type UpdateScheduleData = z.infer<typeof UpdateScheduleSchema>;
export type CreateTimeBlockData = z.infer<typeof CreateTimeBlockSchema>;
