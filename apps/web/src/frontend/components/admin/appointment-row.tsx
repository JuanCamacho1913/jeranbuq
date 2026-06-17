"use client";

import { useState } from "react";
import type { Appointment, AppointmentStatus, Service, User } from "@barberia-jeranbuq/database";
import { updateAppointmentStatusAction } from "@/backend/actions/appointments.actions";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { AppointmentStatusBadge } from "@/frontend/components/admin/appointment-status-badge";
import { WhatsAppButton } from "@/frontend/components/admin/whatsapp-button";
import { Clock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentWithRelations = Appointment & {
  user: User;
  service: Service;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a time range in Bogota timezone using 12-hour Colombian format.
 * Example: "10:00 a. m. — 10:30 a. m."
 */
function formatTimeRange(startAt: Date, endAt: Date): string {
  const fmt = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${fmt.format(startAt)} — ${fmt.format(endAt)}`;
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

/** Terminal statuses — no action buttons shown. */
const TERMINAL_STATUSES: AppointmentStatus[] = ["CANCELLED", "COMPLETED", "NO_SHOW"];

// ─── CancelDialog ─────────────────────────────────────────────────────────────

/**
 * Shadcn Dialog for collecting an optional cancellation reason before
 * confirming the cancel action.
 */
function CancelDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  function handleConfirm() {
    onConfirm(reason.trim() || undefined);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar cita</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            ¿Motivo de cancelación? (opcional)
          </p>
          <Textarea
            placeholder="Ej: El cliente no pudo asistir"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            disabled={loading}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Cancelando..." : "Cancelar cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AppointmentRow ───────────────────────────────────────────────────────────

/**
 * Renders one appointment as a table row with:
 * - Time range, client info, service, duration, price, status badge
 * - Action buttons depending on current status
 * - WhatsApp button if the client has a phone number
 * - Cancel dialog with optional reason
 */
export function AppointmentRow({
  appointment,
}: {
  appointment: AppointmentWithRelations;
}) {
  const [actionLoading, setActionLoading] = useState<AppointmentStatus | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { user, service, status, startAt, endAt, id } = appointment;

  const isTerminal = TERMINAL_STATUSES.includes(status);
  const clientName = user.name ?? user.email;

  async function handleAction(newStatus: AppointmentStatus, cancellationReason?: string) {
    setActionLoading(newStatus);
    setErrorMsg(null);

    const result = await updateAppointmentStatusAction({
      appointmentId: id,
      status: newStatus,
      ...(cancellationReason !== undefined && { cancellationReason }),
    });

    if (!result.ok) {
      setErrorMsg("No se pudo actualizar la cita. Intentá de nuevo.");
    }

    setActionLoading(null);
    setCancelDialogOpen(false);
  }

  function openCancelDialog() {
    setCancelDialogOpen(true);
  }

  return (
    <>
      <tr className="border-b border-white/[0.08] last:border-0">
        {/* Time */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="whitespace-nowrap">
              {formatTimeRange(new Date(startAt), new Date(endAt))}
            </span>
          </div>
        </td>

        {/* Client */}
        <td className="py-3 px-4">
          <div className="text-sm">
            <p className="font-medium">{clientName}</p>
            {user.name && (
              <p className="text-muted-foreground text-xs">{user.email}</p>
            )}
          </div>
        </td>

        {/* Service */}
        <td className="py-3 px-4">
          <div className="text-sm">
            <p className="font-medium">{service.name}</p>
            <p className="text-muted-foreground text-xs">{service.durationMin} min</p>
          </div>
        </td>

        {/* Price */}
        <td className="py-3 px-4 text-sm font-semibold">
          {formatCOP(service.price)}
        </td>

        {/* Status */}
        <td className="py-3 px-4">
          <AppointmentStatusBadge status={status} />
        </td>

        {/* Actions */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-2 flex-wrap">
            {!isTerminal && (
              <>
                {status === "PENDING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                    onClick={() => handleAction("CONFIRMED")}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "CONFIRMED" ? "Confirmando..." : "Confirmar"}
                  </Button>
                )}

                {status === "CONFIRMED" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
                      onClick={() => handleAction("COMPLETED")}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === "COMPLETED" ? "Completando..." : "Completar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[#9CA3AF] border-white/[0.15] hover:bg-white/[0.05]"
                      onClick={() => handleAction("NO_SHOW")}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === "NO_SHOW" ? "Registrando..." : "No asistió"}
                    </Button>
                  </>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  onClick={openCancelDialog}
                  disabled={actionLoading !== null}
                >
                  Cancelar
                </Button>
              </>
            )}

            <WhatsAppButton phone={user.phone ?? null} />
          </div>

          {errorMsg && (
            <p className="text-xs text-destructive mt-1">{errorMsg}</p>
          )}
        </td>
      </tr>

      <CancelDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={(reason) => handleAction("CANCELLED", reason)}
        loading={actionLoading === "CANCELLED"}
      />
    </>
  );
}
