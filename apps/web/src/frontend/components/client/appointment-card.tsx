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

  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return `${capitalizedDate} — ${timeStr}`;
}

function formatCOP(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const STATUS_BADGE_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  PENDING: "outline",
  CONFIRMED: "default",
  CANCELLED: "secondary",
  COMPLETED: "outline",
  NO_SHOW: "destructive",
};

const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  PENDING: "border-amber-500/50 text-amber-400 bg-amber-500/10",
  CONFIRMED: "border-green-500/50 text-green-400 bg-green-500/10",
  CANCELLED: "text-[#A0A0A0]",
  COMPLETED: "border-blue-500/50 text-blue-400 bg-blue-500/10",
  NO_SHOW: "",
};

const CANCELLABLE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

function isCancellable(appointment: Appointment): boolean {
  if (!CANCELLABLE_STATUSES.includes(appointment.status)) return false;
  const msUntilStart = new Date(appointment.startAt).getTime() - Date.now();
  return msUntilStart >= CANCEL_HOURS * 60 * 60 * 1000;
}

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

    setIsPending(false);
  }

  return (
    <Card className="border-white/8 bg-[#1E1E1E]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="font-display text-base text-foreground">{service.name}</CardTitle>
          <Badge
            variant={STATUS_BADGE_VARIANT[status]}
            className={STATUS_BADGE_CLASS[status]}
          >
            {STATUS_LABELS[status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        <div className="flex items-center gap-1.5 text-sm text-[#A0A0A0]">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{formatBogotaDateTime(new Date(startAt))}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-[#A0A0A0]">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{service.durationMin} min</span>
        </div>

        <p className="text-base font-semibold text-gold-400">{formatCOP(service.price)}</p>

        {errorMsg && (
          <div className="rounded-md border border-[#C0392B]/50 bg-[#C0392B]/10 p-2">
            <p className="text-sm text-[#C0392B]">{errorMsg}</p>
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
            className="border-[#C0392B]/30 text-[#C0392B] hover:bg-[#C0392B]/10 hover:text-[#C0392B]"
          >
            {isPending ? "Cancelando..." : "Cancelar cita"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
