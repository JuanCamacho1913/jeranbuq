"use server";

import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { auth, unstable_update } from "@/backend/lib/auth";
import { prisma } from "@barberia-jeranbuq/database";
import {
  BarberCodeSchema,
  OnboardingSchema,
} from "@barberia-jeranbuq/shared";

// ─── Cookie TTL (5 minutes in seconds) ───────────────────────────────────────

const INTENT_COOKIE_TTL = 300;

// ─── validateBarberCode ───────────────────────────────────────────────────────

/**
 * Server action: validate the barber admin code.
 * On success, sets an httpOnly cookie `x-auth-intent=ADMIN` (plain value, 5 min TTL).
 * The cookie is already protected by httpOnly + short TTL; signing adds no benefit here
 * and would break the exact-string match in the signIn callback.
 * Returns `{ success: true }` or `{ success: false, error }`.
 */
export async function validateBarberCode(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const secretCode = process.env.BARBER_SECRET_CODE;
  if (!secretCode) {
    return { success: false, error: "SERVICE_UNAVAILABLE" };
  }

  const parsed = BarberCodeSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { success: false, error: "INVALID_INPUT" };
  }

  // Constant-time comparison to prevent character-by-character timing inference
  const codeBuffer = Buffer.from(parsed.data.code);
  const secretBuffer = Buffer.from(secretCode);
  const match =
    codeBuffer.length === secretBuffer.length &&
    timingSafeEqual(codeBuffer, secretBuffer);

  if (!match) {
    return { success: false, error: "INVALID_CODE" };
  }

  const cookieStore = await cookies();

  cookieStore.set("x-auth-intent", "ADMIN", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: INTENT_COOKIE_TTL,
  });

  return { success: true };
}

// ─── completeOnboarding ───────────────────────────────────────────────────────

/**
 * Server action: complete user onboarding by saving the phone number.
 * Updates the DB record, patches the JWT via unstable_update, then redirects to "/".
 * Returns `{ success: false, error }` on validation failure (does NOT throw).
 */
export async function completeOnboarding(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "UNAUTHENTICATED" };
  }

  // Prevent re-submission if onboarding was already completed
  if (session.user.onboardingCompletedAt) {
    return { success: true };
  }

  const parsed = OnboardingSchema.safeParse({
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { success: false, error: "INVALID_PHONE" };
  }

  const { phone } = parsed.data;
  const onboardingCompletedAt = new Date();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone, onboardingCompletedAt },
  });

  await unstable_update({
    user: { phone, onboardingCompletedAt: onboardingCompletedAt.toISOString() },
  });

  return { success: true };
}
