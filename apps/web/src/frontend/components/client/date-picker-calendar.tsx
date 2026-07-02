"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { Button } from "@/frontend/components/ui/button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns today's Bogota date as "YYYY-MM-DD".
 * America/Bogota is UTC-5 (no DST).
 */
function getTodayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Adds N days to a "YYYY-MM-DD" string and returns a new "YYYY-MM-DD" string.
 * Uses UTC arithmetic to avoid DST issues.
 */
function addDays(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + n));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Returns the day-of-week (0=Sunday) for a "YYYY-MM-DD" string (calendar date, not UTC instant).
 */
function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)).getUTCDay();
}

/**
 * Formats a "YYYY-MM-DD" string as "lunes, 16 de junio de 2026" in Spanish.
 */
export function formatDateSpanish(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Spanish locale strings
const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAY_ABBRS_ES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

// ─── DatePickerCalendar ───────────────────────────────────────────────────────

/**
 * A simple 30-day calendar grid.
 * - availableDayOfWeeks: set of dayOfWeek numbers (0–6) that have active AdminAvailability.
 * - Days without AdminAvailability for their dayOfWeek are disabled (grayed out).
 * - Past days relative to today (Bogota) are disabled.
 * - Today is selectable if it has availability.
 * - UI labels in Spanish.
 */
export function DatePickerCalendar({
  availableDayOfWeeks,
  selectedDate,
  onSelect,
}: {
  availableDayOfWeeks: Set<number>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const today = getTodayBogota();

  // Build the 30-day window from today
  const dates: string[] = [];
  for (let i = 0; i < 30; i++) {
    dates.push(addDays(today, i));
  }

  // Pagination: show one month-block at a time
  // We split dates by month to show a proper calendar grid per month
  // For simplicity, we show all 30 days as a flat 7-column grid starting from today's weekday
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 14; // Show 2 weeks at a time for compactness
  const visibleDates = dates.slice(offset, offset + PAGE_SIZE);
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < dates.length;

  // Fill leading blanks so day columns align with Mon-Sun headers
  const firstDow = getDayOfWeek(visibleDates[0] ?? today);
  // Shift so that Sunday (0) is index 0 in our headers
  const leadingBlanks = firstDow; // 0=Sunday, so 0 blanks if starts on Sunday

  // Month label from first visible date
  const [firstYear, firstMonth] = (visibleDates[0] ?? today).split("-").map(Number);
  const monthLabel = `${MONTH_NAMES_ES[(firstMonth ?? 1) - 1]} ${firstYear}`;

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          disabled={!canPrev}
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOffset(Math.min(dates.length - PAGE_SIZE, offset + PAGE_SIZE))}
          disabled={!canNext}
          aria-label="Siguiente semana"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_ABBRS_ES.map((abbr) => (
          <div key={abbr} className="text-xs font-medium text-muted-foreground py-1">
            {abbr}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Leading blank cells to align first day */}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {visibleDates.map((dateStr) => {
          const dow = getDayOfWeek(dateStr);
          const isPast = dateStr < today;
          const hasAvailability = availableDayOfWeeks.has(dow);
          const isDisabled = isPast || !hasAvailability;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const [, , dayNum] = dateStr.split("-");

          return (
            <button
              key={dateStr}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(dateStr)}
              className={cn(
                "rounded-md py-1.5 text-sm transition-colors",
                isDisabled
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "hover:bg-accent hover:text-accent-foreground cursor-pointer",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                isToday && !isSelected && "font-bold underline"
              )}
              aria-label={formatDateSpanish(dateStr)}
              aria-pressed={isSelected}
            >
              {Number(dayNum)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
