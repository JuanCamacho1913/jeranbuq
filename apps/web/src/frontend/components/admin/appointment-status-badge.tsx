"use client";

import type { AppointmentStatus } from "@barberia-jeranbuq/database";
import { Badge } from "@/frontend/components/ui/badge";

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
  PENDING: "outline",
  CONFIRMED: "default",
  CANCELLED: "secondary",
  COMPLETED: "outline",
  NO_SHOW: "destructive",
};

const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  PENDING: "border-amber-400 text-amber-700 bg-amber-50",
  CONFIRMED: "border-green-500 text-green-700 bg-green-50",
  CANCELLED: "text-muted-foreground",
  COMPLETED: "border-blue-400 text-blue-700 bg-blue-50",
  NO_SHOW: "",
};

// ─── AppointmentStatusBadge ───────────────────────────────────────────────────

/**
 * Colored badge for an appointment status with Spanish labels.
 */
export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge
      variant={STATUS_BADGE_VARIANT[status]}
      className={STATUS_BADGE_CLASS[status]}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
