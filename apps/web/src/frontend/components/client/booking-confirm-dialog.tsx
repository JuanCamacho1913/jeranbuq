"use client";

import { useState } from "react";
import type { Service } from "@barberia-jeranbuq/database";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Separator } from "@/frontend/components/ui/separator";
import { CalendarDays, Clock, CreditCard, Scissors } from "lucide-react";
import { createAppointmentAction } from "@/backend/actions/appointments.actions";
import { formatDateSpanish } from "./date-picker-calendar";
import type { SlotItem } from "./slot-grid";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatBogotaTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h < 12 ? "a. m." : "p. m.";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

// ─── BookingConfirmDialog ─────────────────────────────────────────────────────

/**
 * Step 3 of the booking wizard — shows a summary card and confirm/back buttons.
 * On confirm: calls createAppointmentAction with startAt (UTC ISO).
 * On SLOT_UNAVAILABLE error: shows an alert and calls onSlotUnavailable so the
 * parent can reset slot selection.
 * On success: calls onSuccess for the parent to redirect.
 */
export function BookingConfirmDialog({
  service,
  selectedDate,
  selectedSlot,
  onBack,
  onSuccess,
  onSlotUnavailable,
}: {
  service: Service;
  selectedDate: string;
  selectedSlot: SlotItem;
  onBack: () => void;
  onSuccess: () => void;
  onSlotUnavailable: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    const result = await createAppointmentAction({
      serviceId: service.id,
      startAt: selectedSlot.startAtUTC,
    });

    setSubmitting(false);

    if (!result.ok) {
      if (result.error === "SLOT_UNAVAILABLE") {
        setError("Este horario ya no está disponible. Por favor seleccioná otro horario.");
        onSlotUnavailable();
      } else {
        setError("Ocurrió un error al agendar tu cita. Por favor intentá de nuevo.");
      }
      return;
    }

    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumen de tu cita</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Scissors className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Servicio</p>
              <p className="text-sm font-medium">{service.name}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p className="text-sm font-medium capitalize">
                {formatDateSpanish(selectedDate)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Hora (Bogotá)</p>
              <p className="text-sm font-medium">
                {formatBogotaTime(selectedSlot.startTime)} — {formatBogotaTime(selectedSlot.endTime)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Precio</p>
              <p className="text-sm font-medium">{formatCOP(service.price)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Agendando…" : "Confirmar Cita"}
        </Button>
      </CardFooter>
    </Card>
  );
}
