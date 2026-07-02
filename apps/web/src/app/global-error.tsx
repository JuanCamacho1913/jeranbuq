"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Algo salió mal</h2>
          <p className="text-gray-400">Ocurrió un error inesperado.</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-white text-black rounded-md font-medium hover:bg-gray-100"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
