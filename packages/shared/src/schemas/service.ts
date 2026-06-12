import { z } from "zod";

// ─── createServiceSchema ──────────────────────────────────────────────────────

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  durationMin: z.number().int().min(10).max(240),
  price: z.number().int().min(0).max(10_000_000),
});

// ─── updateServiceSchema ──────────────────────────────────────────────────────

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string().cuid(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ServiceFormData = z.infer<typeof createServiceSchema>;
export type UpdateServiceData = z.infer<typeof updateServiceSchema>;
