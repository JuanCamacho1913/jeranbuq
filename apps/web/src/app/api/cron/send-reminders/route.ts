import React from "react";
import { NextResponse } from "next/server";
import { prisma } from "@barberia-jeranbuq/database";
import { sendEmail } from "@/backend/lib/email";
import { AppointmentReminder } from "@/backend/emails";

// ─── GET /api/cron/send-reminders ─────────────────────────────────────────────

/**
 * Vercel Cron handler — sends appointment reminder emails for appointments
 * starting in the next 1h45min–2h15min window.
 *
 * Authentication: Authorization: Bearer <CRON_SECRET>
 *
 * Returns: { sent: N } — count of successfully sent reminders.
 *
 * Idempotency: reminderSentAt is stamped ONLY after a successful send.
 * Failures are logged and skipped so they retry on the next hourly run.
 */
export async function GET(request: Request): Promise<NextResponse> {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Time window (spec: now +1h45min to now +2h15min) ────────────────────────
  const now = new Date();
  const windowStart = new Date(now.getTime() + 1 * 60 * 60 * 1000 + 45 * 60 * 1000); // +1h45min
  const windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000);   // +2h15min

  // ── Query appointments ───────────────────────────────────────────────────────
  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: { user: true, service: true },
  });

  // ── Process each appointment ─────────────────────────────────────────────────
  let sent = 0;

  for (const appt of appointments) {
    try {
      await sendEmail({
        to: appt.user.email,
        subject: "Recordatorio: tu cita es en 2 horas",
        react: React.createElement(AppointmentReminder, {
          clientName: appt.user.name ?? "Cliente",
          serviceName: appt.service.name,
          startAt: appt.startAt,
          endAt: appt.endAt,
        }),
      });

      // Only stamp reminderSentAt after a confirmed successful send
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: new Date() },
      });

      sent++;
    } catch (error) {
      // Log and skip — appointment will retry on the next hourly cron run
      console.error(`[cron] Failed to send reminder for appointment ${appt.id}:`, error);
    }
  }

  return NextResponse.json({ sent });
}
