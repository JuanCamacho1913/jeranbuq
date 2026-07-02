import { z } from "zod";

// ─── ServiceCategory constants ────────────────────────────────────────────────

export const SERVICE_CATEGORIES = [
  "HAIRCUT",
  "COMBO",
  "PREMIUM",
  "VIP",
  "COLORIMETRIA",
  "KIDS",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  HAIRCUT: "Corte",
  COMBO: "Combo",
  PREMIUM: "Premium",
  VIP: "VIP",
  COLORIMETRIA: "Colorimetría",
  KIDS: "Niños",
};

/**
 * Display order for category sections in the client UI.
 * Lower index = shown first.
 */
export const CATEGORY_DISPLAY_ORDER: ServiceCategory[] = [
  "HAIRCUT",
  "COMBO",
  "PREMIUM",
  "VIP",
  "COLORIMETRIA",
  "KIDS",
];

// ─── Internal schema ──────────────────────────────────────────────────────────

const serviceCategorySchema = z.enum(SERVICE_CATEGORIES);

// ─── createServiceSchema ──────────────────────────────────────────────────────

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  durationMin: z.number().int().min(10).max(240),
  price: z.number().int().min(0).max(10_000_000),
  category: serviceCategorySchema,
  priceNote: z.string().max(50).optional(),
});

// ─── updateServiceSchema ──────────────────────────────────────────────────────

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string().cuid(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ServiceFormData = z.infer<typeof createServiceSchema>;
export type UpdateServiceData = z.infer<typeof updateServiceSchema>;
