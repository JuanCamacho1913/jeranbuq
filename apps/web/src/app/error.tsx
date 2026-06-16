"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">Algo salió mal</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Ocurrió un error inesperado.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Intentar de nuevo
      </button>
    </main>
  );
}
