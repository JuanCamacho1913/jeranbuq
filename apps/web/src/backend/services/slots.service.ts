import { prisma } from "@barberia-jeranbuq/database";
import type { ApiResponse } from "@barberia-jeranbuq/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlotItem = {
  startTime: string; // "HH:mm" Bogota time
  endTime: string;   // "HH:mm" Bogota time
  startAtUTC: string; // ISO 8601 UTC
  available: boolean;
};

export type SlotResult = {
  date: string; // "YYYY-MM-DD"
  slots: SlotItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts "HH:mm" to total minutes from midnight.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Converts total minutes from midnight to "HH:mm".
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Converts a Bogota date ("YYYY-MM-DD") and local time ("HH:mm") to a UTC Date.
 * America/Bogota is UTC-5 (no DST).
 */
function bogotaToUTC(date: string, time: string): Date {
  return new Date(`${date}T${time}:00-05:00`);
}

// ─── getAvailableSlots ────────────────────────────────────────────────────────

/**
 * Computes available time slots for a given service and Bogota date.
 *
 * Algorithm:
 * 1. Fetch service → get durationMin. If not found → SERVICE_NOT_FOUND.
 * 2. Parse date → get dayOfWeek (0=Sunday, 6=Saturday).
 * 3. Fetch AdminAvailability for dayOfWeek (active:true) → if none, return empty slots.
 * 4. Generate candidate slots at slotMinutes intervals from startTime to (endTime - durationMin).
 * 5. Fetch TimeBlocks for the date → mark overlapping candidates unavailable (string compare).
 * 6. Fetch Appointments for the UTC day range with status IN [PENDING, CONFIRMED].
 * 7. Mark slots overlapping any appointment as unavailable (UTC comparison).
 * 8. If date is today (Bogota): mark slots where startTime <= now (Bogota) as unavailable.
 * 9. Return { ok: true, data: { date, slots } }.
 */
export async function getAvailableSlots(
  serviceId: string,
  date: string
): Promise<ApiResponse<SlotResult>> {
  // Step 1: Fetch service
  const service = await prisma.service.findUnique({ where: { id: serviceId } });

  if (!service || !service.active) {
    return { ok: false, error: "SERVICE_NOT_FOUND" };
  }

  const { durationMin } = service;

  // Step 2: Determine dayOfWeek from the Bogota date
  // Parse as UTC midnight of the Bogota date string (YYYY-MM-DD) and use getUTCDay().
  // This is correct because we treat the date string as a calendar date, not a UTC instant.
  const [year, month, day] = date.split("-").map(Number);
  const calendarDate = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  const dayOfWeek = calendarDate.getUTCDay();

  // Step 3: Fetch AdminAvailability
  const availability = await prisma.adminAvailability.findUnique({
    where: { dayOfWeek },
  });

  if (!availability || !availability.active) {
    return { ok: true, data: { date, slots: [] } };
  }

  const { startTime, endTime, slotMinutes } = availability;
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Step 4: Generate candidate slots
  // A slot is valid if slot.endTime (= slot.startTime + durationMin) <= schedule.endTime
  const candidates: Array<{ startMin: number; endMin: number }> = [];
  for (
    let slotStart = startMinutes;
    slotStart + durationMin <= endMinutes;
    slotStart += slotMinutes
  ) {
    candidates.push({ startMin: slotStart, endMin: slotStart + durationMin });
  }

  // Step 5: Fetch TimeBlocks for the date
  // TimeBlock.date is stored as a Date at midnight UTC; we query a range to be safe.
  const dayStartUTC = bogotaToUTC(date, "00:00");
  const dayEndUTC = bogotaToUTC(date, "24:00"); // next day 05:00 UTC

  const timeBlocks = await prisma.timeBlock.findMany({
    where: {
      date: {
        gte: dayStartUTC,
        lt: dayEndUTC,
      },
    },
  });

  // Step 6: Fetch Appointments for the UTC day range, status IN [PENDING, CONFIRMED]
  // Bogota day boundaries: 00:00 Bogota = 05:00 UTC, next day 00:00 Bogota = next day 05:00 UTC
  const bogotaDayStartUTC = new Date(`${date}T00:00:00-05:00`);
  const bogotaDayEndUTC = (() => {
    // Add 1 day to the calendar date
    const next = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + 1));
    return new Date(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}T00:00:00-05:00`
    );
  })();

  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: {
        gte: bogotaDayStartUTC,
        lt: bogotaDayEndUTC,
      },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  // Step 7 & 8: Build slot items with availability flags
  const nowUTC = new Date();

  const slots: SlotItem[] = candidates.map(({ startMin, endMin }) => {
    const slotStartTime = minutesToTime(startMin);
    const slotEndTime = minutesToTime(endMin);
    const slotStartUTC = bogotaToUTC(date, slotStartTime);
    const slotEndUTC = bogotaToUTC(date, slotEndTime);

    let available = true;

    // Check TimeBlock overlap (string lexicographic comparison — "HH:mm" sorts correctly)
    for (const block of timeBlocks) {
      if (block.startTime < slotEndTime && block.endTime > slotStartTime) {
        available = false;
        break;
      }
    }

    // Check Appointment overlap (UTC DateTime comparison)
    if (available) {
      for (const appt of appointments) {
        if (appt.startAt < slotEndUTC && appt.endAt > slotStartUTC) {
          available = false;
          break;
        }
      }
    }

    // Mark past slots unavailable (applies when date is today in Bogota)
    if (available && slotStartUTC <= nowUTC) {
      available = false;
    }

    return {
      startTime: slotStartTime,
      endTime: slotEndTime,
      startAtUTC: slotStartUTC.toISOString(),
      available,
    };
  });

  return { ok: true, data: { date, slots } };
}
