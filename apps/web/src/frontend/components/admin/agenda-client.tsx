"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { AppointmentRow, type AppointmentWithRelations } from "@/frontend/components/admin/appointment-row";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a YYYY-MM-DD date string as a full Spanish date.
 * Example: "2026-06-16" → "Lunes, 16 de junio de 2026"
 */
function formatDateSpanish(dateStr: string): string {
  // Parse as local noon to avoid UTC offset shifting the day
  const date = new Date(`${dateStr}T12:00:00`);
  const formatted = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Adds `days` to a YYYY-MM-DD date string and returns the resulting string.
 */
function shiftDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Returns today's date in Bogota timezone as a YYYY-MM-DD string.
 */
function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
  }).format(new Date());
}

// ─── AgendaClient ─────────────────────────────────────────────────────────────

/**
 * Client component for the admin agenda page.
 * Handles day navigation (prev/next/hoy) and renders the appointment table.
 */
export function AgendaClient({
  appointments,
  date,
}: {
  appointments: AppointmentWithRelations[];
  date: string;
}) {
  const router = useRouter();
  const today = todayBogota();

  function navigate(targetDate: string) {
    router.push(`/admin/agenda?date=${targetDate}`);
  }

  return (
    <div className="space-y-6">
      {/* Day navigation bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(shiftDate(date, -1))}
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(shiftDate(date, 1))}
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium truncate">
            {formatDateSpanish(date)}
          </span>
        </div>

        {date !== today && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(today)}
          >
            Hoy
          </Button>
        )}
      </div>

      {/* Appointment table or empty state */}
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-[#1E1E1E] py-16 text-center">
          <CalendarDays className="h-8 w-8 text-[#9CA3AF] mb-3" />
          <p className="text-sm text-[#9CA3AF]">
            No hay citas para este día
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/8 overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Agenda de citas</caption>
            <thead>
              <tr className="border-b border-white/8 bg-[#1E1E1E]">
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Hora
                </th>
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Cliente
                </th>
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Servicio
                </th>
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Precio
                </th>
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Estado
                </th>
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <AppointmentRow key={appt.id} appointment={appt} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
