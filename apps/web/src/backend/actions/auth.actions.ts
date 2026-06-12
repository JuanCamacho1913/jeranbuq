"use server";

import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/backend/lib/auth";
import { prisma } from "@barberia-jeranbuq/database";
import {
  BarberCodeSchema,
  OnboardingSchema,
} from "@barberia-jeranbuq/shared";

// ─── Cookie TTL (5 minutes in seconds) ───────────────────────────────────────

const INTENT_COOKIE_TTL = 300;

// ─── Cookie signing ───────────────────────────────────────────────────────────

function signValue(value: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(value);
  const signature = hmac.digest("hex");
  return `${value}.${signature}`;
}

// ─── validateBarberCode ───────────────────────────────────────────────────────

/**
 * Server action: validate the barber admin code.
 * On success, sets an httpOnly cookie `x-auth-intent=ADMIN` (signed, 5 min TTL).
 * Returns `{ success: true }` or `{ success: false, error }`.
 */
export async function validateBarberCode(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const secretCode = process.env.BARBER_SECRET_CODE;
  if (!secretCode) {
    return { success: false, error: "Service unavailable" };
  }

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return { success: false, error: "Service unavailable" };
  }

  const parsed = BarberCodeSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.code !== secretCode) {
    return { success: false, error: "Invalid code" };
  }

  const cookieStore = await cookies();
  const signedValue = signValue("ADMIN", authSecret);

  cookieStore.set("x-auth-intent", signedValue, {
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
    return { success: false, error: "Unauthenticated" };
  }

  const parsed = OnboardingSchema.safeParse({
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid phone" };
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

  redirect("/");
}
