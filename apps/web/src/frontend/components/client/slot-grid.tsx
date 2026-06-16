"use client";

import { cn } from "@/frontend/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlotItem = {
  startTime: string;   // "HH:mm" Bogota
  endTime: string;     // "HH:mm" Bogota
  startAtUTC: string;  // ISO 8601 UTC — sent to createAppointmentAction
  available: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats "HH:mm" Bogota string to "hh:mm a.m./p.m." Colombian 12h format.
 * Colombian convention typically uses lowercase "a. m." / "p. m." with spaces.
 */
function formatBogotaTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h < 12 ? "a. m." : "p. m.";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

// ─── SlotGrid ─────────────────────────────────────────────────────────────────

/**
 * Renders a grid of time slot buttons.
 * - Available slots: clickable, normal styling.
 * - Unavailable slots: disabled, grayed out.
 * - Selected slot: highlighted with primary color.
 * - Shows loading skeleton when isLoading=true.
 */
export function SlotGrid({
  slots,
  selectedSlot,
  onSelect,
  isLoading,
}: {
  slots: SlotItem[];
  selectedSlot: SlotItem | null;
  onSelect: (slot: SlotItem) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-md bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No hay horarios disponibles para este día.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.startAtUTC === slot.startAtUTC;
        return (
          <button
            key={slot.startAtUTC}
            disabled={!slot.available}
            onClick={() => slot.available && onSelect(slot)}
            className={cn(
              "rounded-md border px-2 py-2 text-sm font-medium transition-colors",
              slot.available
                ? cn(
                    "border-border hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    isSelected && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )
                : "border-border bg-muted text-muted-foreground/50 cursor-not-allowed line-through"
            )}
            aria-pressed={isSelected}
            aria-label={`${formatBogotaTime(slot.startTime)}${slot.available ? "" : " — no disponible"}`}
          >
            {formatBogotaTime(slot.startTime)}
          </button>
        );
      })}
    </div>
  );
}
