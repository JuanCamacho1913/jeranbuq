/**
 * Generic discriminated union for API responses.
 * Successful responses carry `data`; error responses carry `error` (string message).
 */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
