"use client";

import { useState } from "react";
import type { Appointment, AppointmentStatus, Service } from "@barberia-jeranbuq/database";
import { CANCEL_HOURS } from "@barberia-jeranbuq/shared";
import { cancelMyAppointmentAction } from "@/backend/actions/appointments.actions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a Date to a full Spanish date+time string in Bogota timezone.
 * Example: "lunes, 16 de junio de 2026 — 10:00 a. m."
 */
function formatBogotaDateTime(date: Date): string {
  const dateStr = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const timeStr = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  // Capitalize first letter
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return `${capitalizedDate} — ${timeStr}`;
}

/**
 * Formats a price in COP with Colombian thousand separators.
 * Example: 25000 → "$25.000"
 */
function formatCOP(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const STATUS_BADGE_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  PENDING: "outline",     // amber-ish with outline
  CONFIRMED: "default",   // green-ish (primary)
  CANCELLED: "secondary", // gray
  COMPLETED: "outline",   // blue-ish with outline
  NO_SHOW: "destructive", // red
};

/**
 * Extra className to fine-tune badge colors beyond the base variants.
 */
const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  PENDING: "border-amber-400 text-amber-700 bg-amber-50",
  CONFIRMED: "border-green-500 text-green-700 bg-green-50",
  CANCELLED: "text-muted-foreground",
  COMPLETED: "border-blue-400 text-blue-700 bg-blue-50",
  NO_SHOW: "",
};

// ─── Cancellable guard ────────────────────────────────────────────────────────

const CANCELLABLE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

/**
 * Returns true if the appointment can still be cancelled by the client.
 * Conditions: status is PENDING/CONFIRMED AND startAt is > CANCEL_HOURS away.
 */
function isCancellable(appointment: Appointment): boolean {
  if (!CANCELLABLE_STATUSES.includes(appointment.status)) return false;
  const msUntilStart = new Date(appointment.startAt).getTime() - Date.now();
  return msUntilStart >= CANCEL_HOURS * 60 * 60 * 1000;
}

// ─── AppointmentCard ──────────────────────────────────────────────────────────

/**
 * Displays a single appointment card with service name, date/time, status badge,
 * price, and an optional cancel button (only when cancellation is still allowed).
 */
export function AppointmentCard({
  appointment,
}: {
  appointment: Appointment & { service: Service };
}) {
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { service, status, startAt, id } = appointment;
  const cancellable = isCancellable(appointment);

  async function handleCancel() {
    setIsPending(true);
    setErrorMsg(null);

    const result = await cancelMyAppointmentAction({ appointmentId: id });

    if (!result.ok) {
      const message =
        result.error === "CANCELLATION_WINDOW_EXPIRED"
          ? "El tiempo para cancelar esta cita ya venció."
          : "No se pudo cancelar la cita. Intentá de nuevo.";
      setErrorMsg(message);
    }

    // On success, revalidatePath("/mis-citas") in the action triggers a re-render.
    setIsPending(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{service.name}</CardTitle>
          <Badge
            variant={STATUS_BADGE_VARIANT[status]}
            className={STATUS_BADGE_CLASS[status]}
          >
            {STATUS_LABELS[status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{formatBogotaDateTime(new Date(startAt))}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{service.durationMin} min</span>
        </div>

        <p className="text-base font-semibold">{formatCOP(service.price)}</p>

        {errorMsg && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
            <p className="text-sm text-destructive">{errorMsg}</p>
          </div>
        )}
      </CardContent>

      {cancellable && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          >
            {isPending ? "Cancelando..." : "Cancelar cita"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
