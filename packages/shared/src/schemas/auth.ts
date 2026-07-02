import { z } from "zod";

// ─── User Roles (single source of truth) ─────────────────────────────────────

export const USER_ROLES = ["CLIENT", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const UserRoleSchema = z.enum(USER_ROLES);

// ─── Session ──────────────────────────────────────────────────────────────────

export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().url().nullable(),
  role: UserRoleSchema,
  phone: z.string().nullable(),
  onboardingCompletedAt: z.string().datetime().nullable(),
});

export const OnboardingSchema = z.object({
  // Allow spaces, dashes, parentheses, and dots for formatted numbers like "+54 9 11 1234-5678".
  // Positive lookahead ensures at least one digit is present (rejects strings like "       " or "(((((((").
  phone: z.string().min(7).max(20).regex(/^\+?(?=.*\d)[\d\s\-().]+$/),
});

export const BarberCodeSchema = z.object({
  code: z.string().min(1),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type OnboardingData = z.infer<typeof OnboardingSchema>;
export type BarberCodeData = z.infer<typeof BarberCodeSchema>;
