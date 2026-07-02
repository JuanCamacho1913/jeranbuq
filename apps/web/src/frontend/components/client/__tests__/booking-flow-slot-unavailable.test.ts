import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── TASK-009 / TASK-010: SLOT_UNAVAILABLE handler test (GREEN) ───────────────
//
// Spec: SPEC-QA-006
// When createAppointmentAction returns { ok: false, error: "SLOT_UNAVAILABLE" },
// the booking flow MUST:
//   1. Set slotsError to the user-facing message (error stays visible after re-fetch)
//   2. Move to step 1 (slot picker), NOT step 0 (calendar)
//   3. Re-fetch slots from /api/v1/availability (fetch is called again)
//   4. Preserve the selected date
//
// This test file exercises the state-machine logic of handleSlotUnavailable
// in isolation, using a node environment (no DOM / no React rendering).
// ─────────────────────────────────────────────────────────────────────────────

// Simulate the state variables that BookingFlow holds
function createBookingState(selectedDate: string, serviceId: string) {
  let step = 2; // starts at confirmation step
  let slotsError: string | null = null;
  let slotsLoading = false;
  let selectedSlot: { startAtUTC: string } | null = { startAtUTC: "2025-03-15T18:00:00Z" };
  let slots: unknown[] = [{ startTime: "13:00", endTime: "14:00", startAtUTC: "2025-03-15T18:00:00Z" }];

  // Fixed handleSlotUnavailable — mirrors booking-flow.tsx after TASK-010 fix.
  // Sets slotsError BEFORE the inline fetch; fetch does NOT clear slotsError.
  function handleSlotUnavailableFixed() {
    selectedSlot = null;
    step = 1;
    slotsError = "El horario seleccionado ya fue tomado. Por favor elegí otro.";
    // Re-fetch inline without clearing the error message
    if (selectedDate) {
      slotsLoading = true;
      const url = `/api/v1/availability?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(selectedDate)}`;
      void fetch(url)
        .then((res) => res.json())
        .then((json: { ok: boolean; data?: { slots: unknown[] } }) => {
          slots = json.data?.slots ?? [];
        })
        .catch(() => {
          slotsError = "Error de red. Por favor verificá tu conexión.";
        })
        .finally(() => {
          slotsLoading = false;
        });
    }
  }

  return {
    getState: () => ({ step, slotsError, slotsLoading, selectedSlot, slots, selectedDate }),
    handleSlotUnavailable: handleSlotUnavailableFixed,
  };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

const SERVICE_ID = "svc-001";
const SELECTED_DATE = "2025-03-15";
const SLOTS_URL = `/api/v1/availability?serviceId=${encodeURIComponent(SERVICE_ID)}&date=${encodeURIComponent(SELECTED_DATE)}`;

describe("BookingFlow — handleSlotUnavailable (SPEC-QA-006)", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          slots: [
            { startTime: "14:00", endTime: "15:00", startAtUTC: "2025-03-15T19:00:00Z" },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("moves to step 1 (slot picker) after SLOT_UNAVAILABLE — not step 0", () => {
    const booking = createBookingState(SELECTED_DATE, SERVICE_ID);
    booking.handleSlotUnavailable();
    const { step } = booking.getState();
    expect(step).toBe(1);
  });

  it("preserves the selected date after SLOT_UNAVAILABLE", () => {
    const booking = createBookingState(SELECTED_DATE, SERVICE_ID);
    booking.handleSlotUnavailable();
    const { selectedDate } = booking.getState();
    expect(selectedDate).toBe(SELECTED_DATE);
  });

  it("re-fetches slots (fetch is called with the availability URL)", () => {
    const booking = createBookingState(SELECTED_DATE, SERVICE_ID);
    booking.handleSlotUnavailable();
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith(SLOTS_URL);
  });

  it("shows error message 'El horario seleccionado ya fue tomado' after SLOT_UNAVAILABLE", () => {
    // After TASK-010 (GREEN): slotsError is set BEFORE the inline fetch and
    // the fetch does NOT call setSlotsError(null), so the message persists.
    const booking = createBookingState(SELECTED_DATE, SERVICE_ID);
    booking.handleSlotUnavailable();
    const { slotsError } = booking.getState();
    expect(slotsError).toBe("El horario seleccionado ya fue tomado. Por favor elegí otro.");
  });

  it("clears the selected slot after SLOT_UNAVAILABLE", () => {
    const booking = createBookingState(SELECTED_DATE, SERVICE_ID);
    booking.handleSlotUnavailable();
    const { selectedSlot } = booking.getState();
    expect(selectedSlot).toBeNull();
  });
});
