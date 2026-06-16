/**
 * Loading skeleton for /mis-citas — approximates the appointments list.
 * Uses animate-pulse blocks; renders while the RSC fetches appointments.
 */
export default function MisCitasLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-md bg-muted" />
        <div className="h-4 w-64 rounded-md bg-muted" />
      </div>

      {/* Appointment card placeholders — 3 stacked */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="h-5 w-36 rounded-md bg-muted" />
                <div className="h-4 w-48 rounded-md bg-muted" />
                <div className="h-4 w-28 rounded-md bg-muted" />
              </div>
              {/* Status badge */}
              <div className="h-6 w-20 rounded-full bg-muted" />
            </div>
            {/* Action button */}
            <div className="h-8 w-32 rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
