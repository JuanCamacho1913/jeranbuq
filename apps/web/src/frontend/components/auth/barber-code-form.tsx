"use client";

import { useActionState } from "react";
import { validateBarberCode } from "@/backend/actions/auth.actions";
import {
  type ActionState,
  initialActionState,
} from "@/frontend/types/form";
import { GoogleSignInButton } from "./google-sign-in-button";

// ─── Error code → display message map ────────────────────────────────────────

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
        <p className="text-sm text-green-700">
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
          className="block text-sm font-medium text-neutral-700"
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
        {isPending ? "Verificando..." : "Verificar código"}
      </button>
    </form>
  );
}
