"use client";

import { useActionState, useState } from "react";
import { validateBarberCode } from "@/backend/actions/auth.actions";
import { GoogleSignInButton } from "./google-sign-in-button";

type FormState = {
  success: boolean;
  error?: string;
};

const initialState: FormState = { success: false };

export function BarberCodeForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      return validateBarberCode(formData);
    },
    initialState
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
          {state.error === "Invalid code" ? "Código incorrecto" : state.error}
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
