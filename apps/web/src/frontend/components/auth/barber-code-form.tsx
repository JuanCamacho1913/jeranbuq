"use client";

import { useActionState } from "react";
import { validateBarberCode } from "@/backend/actions/auth.actions";
import {
  type ActionState,
  initialActionState,
} from "@/frontend/types/form";
import { GoogleSignInButton } from "./google-sign-in-button";

const errorMessages: Record<string, string> = {
  INVALID_CODE: "Código incorrecto",
  SERVICE_UNAVAILABLE: "Servicio no disponible. Intentá más tarde.",
  INVALID_INPUT: "El código no puede estar vacío",
};

export function BarberCodeForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      return validateBarberCode(formData);
    },
    initialActionState
  );

  if (state.success) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gold-400">
          Código correcto. Iniciá sesión con Google para continuar.
        </p>
        <GoogleSignInButton callbackUrl="/" />
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label
          htmlFor="code"
          className="block text-sm font-medium text-[#A0A0A0]"
        >
          Código de acceso
        </label>
        <input
          id="code"
          name="code"
          type="password"
          required
          autoComplete="off"
          placeholder="Ingresá el código"
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
        {isPending ? "Verificando..." : "Verificar código"}
      </button>
    </form>
  );
}
