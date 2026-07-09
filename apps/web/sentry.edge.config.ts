// Sentry is intentionally disabled on the Edge runtime.
// The middleware only performs auth-checking and redirects — no business logic.
// Keeping this file empty prevents the Sentry SDK from being bundled into the
// edge function, which would push it over Vercel's 1 MB Edge Function size limit.
// Client-side and Node.js server-side Sentry remain fully active.
export {};
