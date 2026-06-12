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
  phone: z.string().min(7).max(15).regex(/^\+?[0-9]+$/),
});

export const BarberCodeSchema = z.object({
  code: z.string().min(1),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type OnboardingData = z.infer<typeof OnboardingSchema>;
export type BarberCodeData = z.infer<typeof BarberCodeSchema>;
