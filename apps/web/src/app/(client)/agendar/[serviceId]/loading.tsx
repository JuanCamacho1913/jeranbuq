/**
 * Loading skeleton for /agendar/[serviceId] — approximates the booking wizard.
 * Uses animate-pulse blocks; renders while the RSC fetches service + availability.
 */
export default function AgendarLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 animate-pulse">
      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="h-7 w-40 rounded-md bg-muted" />
        <div className="h-4 w-56 rounded-md bg-muted" />
      </div>

      {/* Step breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-12 rounded-md bg-muted" />
        <div className="h-4 w-2 rounded-md bg-muted" />
        <div className="h-4 w-16 rounded-md bg-muted" />
        <div className="h-4 w-2 rounded-md bg-muted" />
        <div className="h-4 w-20 rounded-md bg-muted" />
      </div>

      {/* Calendar placeholder */}
      <div className="space-y-3">
        <div className="h-5 w-44 rounded-md bg-muted" />
        {/* Calendar grid */}
        <div className="rounded-lg border p-4 space-y-3">
          {/* Month nav row */}
          <div className="flex justify-between items-center">
            <div className="h-5 w-5 rounded-md bg-muted" />
            <div className="h-5 w-28 rounded-md bg-muted" />
            <div className="h-5 w-5 rounded-md bg-muted" />
          </div>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-6 rounded-sm bg-muted" />
            ))}
          </div>
          {/* Calendar day cells — 5 rows */}
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, col) => (
                <div key={col} className="h-8 rounded-sm bg-muted" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
