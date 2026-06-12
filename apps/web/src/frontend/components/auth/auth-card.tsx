/**
 * AuthCard — shared centered card layout used on auth and onboarding pages.
 * Server component: no client-side interactivity.
 */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
