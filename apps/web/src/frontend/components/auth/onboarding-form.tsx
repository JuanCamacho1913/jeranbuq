"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/backend/actions/auth.actions";
import {
  type ActionState,
  initialActionState,
} from "@/frontend/types/form";

// ─── Error code → display message map ────────────────────────────────────────

const errorMessages: Record<string, string> = {
  INVALID_PHONE: "El número de teléfono no es válido",
  UNAUTHENTICATED: "Tu sesión expiró. Iniciá sesión nuevamente.",
};

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      return completeOnboarding(formData);
    },
    initialActionState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-neutral-700"
        >
          Número de teléfono
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+54 9 11 1234-5678"
          className="block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
          disabled={isPending}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessages[state.error] ?? state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
