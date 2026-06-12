import { z } from "zod";

export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().url().nullable(),
  role: z.enum(["CLIENT", "ADMIN"]),
  phone: z.string().nullable(),
  onboardingCompletedAt: z.string().datetime().nullable(),
});

export const OnboardingSchema = z.object({
  // Allow spaces, dashes, parentheses, and dots for formatted numbers like "+54 9 11 1234-5678"
  phone: z.string().min(7).max(20).regex(/^\+?[\d\s\-().]+$/),
});

export const BarberCodeSchema = z.object({
  code: z.string().min(1),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type OnboardingData = z.infer<typeof OnboardingSchema>;
export type BarberCodeData = z.infer<typeof BarberCodeSchema>;
