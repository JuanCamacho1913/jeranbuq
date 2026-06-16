// ─── Date formatting helpers ──────────────────────────────────────────────────
// All dates are displayed in America/Bogota (UTC-5) timezone.

const TIMEZONE = "America/Bogota";

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
