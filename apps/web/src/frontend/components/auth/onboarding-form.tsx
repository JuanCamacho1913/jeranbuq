"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { completeOnboarding } from "@/backend/actions/auth.actions";
import {
  type ActionState,
  initialActionState,
} from "@/frontend/types/form";

const errorMessages: Record<string, string> = {
  INVALID_PHONE: "El número de teléfono no es válido",
  UNAUTHENTICATED: "Tu sesión expiró. Iniciá sesión nuevamente.",
};

export function OnboardingForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      return completeOnboarding(formData);
    },
    initialActionState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
      router.push("/inicio");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-[#A0A0A0]"
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
          className="block w-full rounded-lg border border-gold-500/20 bg-[#0A0A0A] px-3 py-2 text-sm text-foreground placeholder:text-[#555] transition-colors duration-200 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/50 disabled:opacity-60"
          disabled={isPending}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-[#C0392B]">
          {errorMessages[state.error] ?? state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full justify-center rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-[#050505] shadow-sm transition-all duration-200 hover:bg-gold-400 hover:shadow-[0_0_20px_rgba(201,162,39,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
