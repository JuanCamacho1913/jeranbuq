import { z } from "zod";

// ─── CreateServiceSchema ──────────────────────────────────────────────────────

export const CreateServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(10).max(240),
  price: z.number().int().min(0).max(10_000_000),
});

// ─── UpdateServiceSchema ──────────────────────────────────────────────────────

export const UpdateServiceSchema = CreateServiceSchema.partial().extend({
  id: z.string().cuid(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ServiceFormData = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceData = z.infer<typeof UpdateServiceSchema>;
