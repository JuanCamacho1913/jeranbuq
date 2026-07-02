"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Service } from "@barberia-jeranbuq/database";
import { DatePickerCalendar, formatDateSpanish } from "./date-picker-calendar";
import { SlotGrid } from "./slot-grid";
import type { SlotItem } from "./slot-grid";
import { BookingConfirmDialog } from "./booking-confirm-dialog";
import { Button } from "@/frontend/components/ui/button";
import { ChevronLeft } from "lucide-react";

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ["Fecha", "Horario", "Confirmar"] as const;
type Step = 0 | 1 | 2;

function StepBreadcrumb({ current }: { current: Step }) {
  return (
    <nav aria-label="Pasos del proceso de reserva">
      <ol className="flex items-center gap-2 text-sm list-none m-0 p-0">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground" aria-hidden="true">/</span>}
            <span
              aria-current={i === current ? "step" : undefined}
              className={
                i === current
                  ? "font-semibold text-foreground"
                  : i < current
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              }
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ─── BookingFlow ──────────────────────────────────────────────────────────────

/**
 * 3-step booking wizard:
 *  Step 0: DatePickerCalendar — pick a date
 *  Step 1: SlotGrid — pick a time slot (fetched from /api/v1/availability)
 *  Step 2: BookingConfirmDialog — review and confirm
 *
 * On success: redirects to /mis-citas.
 * On SLOT_UNAVAILABLE: shows error and goes back to step 1.
 *
 * @param availableDayOfWeeks — set of dayOfWeek numbers (0–6) with active AdminAvailability.
 *   Passed from the RSC parent so the calendar can gray out unavailable days.
 */
export function BookingFlow({
  service,
  availableDayOfWeeks,
}: {
  service: Service;
  availableDayOfWeeks: Set<number>;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  // Step 0 → 1: date selected, fetch slots
  const handleDateSelect = useCallback(
    async (date: string) => {
      setSelectedDate(date);
      setSelectedSlot(null);
      setSlots([]);
      setSlotsError(null);
      setSlotsLoading(true);
      setStep(1);

      try {
        const res = await fetch(
          `/api/v1/availability?serviceId=${encodeURIComponent(service.id)}&date=${encodeURIComponent(date)}`
        );
        if (!res.ok) {
          setSlotsError("No se pudieron cargar los horarios. Intentá de nuevo.");
          setSlotsLoading(false);
          return;
        }
        const json = (await res.json()) as { ok: boolean; data?: { slots: SlotItem[] } };
        setSlots(json.data?.slots ?? []);
      } catch {
        setSlotsError("Error de red. Por favor verificá tu conexión.");
      } finally {
        setSlotsLoading(false);
      }
    },
    [service.id]
  );

  // Step 1 → 2: slot selected
  function handleSlotSelect(slot: SlotItem) {
    setSelectedSlot(slot);
    setStep(2);
  }

  // Step 2 back → step 1
  function handleBackToSlots() {
    setStep(1);
    setSelectedSlot(null);
  }

  // Back to calendar from slot view
  function handleBackToCalendar() {
    setStep(0);
    setSelectedSlot(null);
  }

  // SLOT_UNAVAILABLE: go back to step 1, show error, re-fetch slots without clearing the error
  function handleSlotUnavailable() {
    setSelectedSlot(null);
    setStep(1);
    setSlotsError("El horario seleccionado ya fue tomado. Por favor elegí otro.");
    // Re-fetch inline: do NOT call handleDateSelect because it clears slotsError
    if (selectedDate) {
      setSlotsLoading(true);
      fetch(
        `/api/v1/availability?serviceId=${encodeURIComponent(service.id)}&date=${encodeURIComponent(selectedDate)}`
      )
        .then((res) => res.json())
        .then((json: { ok: boolean; data?: { slots: SlotItem[] } }) => {
          setSlots(json.data?.slots ?? []);
        })
        .catch(() => {
          setSlotsError("Error de red. Por favor verificá tu conexión.");
        })
        .finally(() => {
          setSlotsLoading(false);
        });
    }
  }

  // Booking confirmed successfully
  function handleSuccess() {
    router.push("/mis-citas");
  }

  return (
    <div className="space-y-6">
      <StepBreadcrumb current={step} />

      {/* Step 0: Calendar */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Seleccioná una fecha</h2>
          <DatePickerCalendar
            availableDayOfWeeks={availableDayOfWeeks}
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
          />
        </div>
      )}

      {/* Step 1: Slot grid */}
      {step === 1 && selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCalendar}
              className="gap-1 -ml-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
          <div>
            <h2 className="text-base font-semibold">Seleccioná un horario</h2>
            <p className="text-sm text-muted-foreground capitalize">
              {formatDateSpanish(selectedDate)}
            </p>
          </div>

          {slotsError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{slotsError}</p>
            </div>
          )}

          <SlotGrid
            slots={slots}
            selectedSlot={selectedSlot}
            onSelect={handleSlotSelect}
            isLoading={slotsLoading}
          />
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && selectedDate && selectedSlot && (
        <BookingConfirmDialog
          service={service}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          onBack={handleBackToSlots}
          onSuccess={handleSuccess}
          onSlotUnavailable={handleSlotUnavailable}
        />
      )}
    </div>
  );
}
