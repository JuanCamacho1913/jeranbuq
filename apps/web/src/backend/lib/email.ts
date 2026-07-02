import type React from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendEmailPayload {
  to: string;
  subject: string;
  react: React.ReactElement;
}

// ─── Resend client factory ────────────────────────────────────────────────────
// Not a cached singleton — created fresh per call so env vars are always read
// at call-time. In production this is called infrequently enough that the
// overhead is negligible; the Resend SDK is stateless between sends.

function createResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is not set — email will not be sent");
    return null;
  }
  return new Resend(apiKey);
}

// ─── sendEmail ────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget email wrapper.
 * Catches all errors internally — never rethrows.
 * Missing RESEND_API_KEY: logs a warning and returns early.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  const resend = createResend();
  if (!resend) return;

  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com";

  try {
    const html = await render(payload.react);
    await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html,
    });
  } catch (error) {
    console.error("[email] Failed to send email:", error);
  }
}
