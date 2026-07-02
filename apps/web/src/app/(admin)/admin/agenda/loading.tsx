/**
 * Loading skeleton for /admin/agenda — approximates the day-view agenda.
 * Uses animate-pulse blocks; renders while the RSC fetches appointments for the day.
 */
export default function AgendaLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Page title */}
      <div className="h-7 w-24 rounded-md bg-muted" />

      {/* Date navigation row */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-muted" />
        <div className="h-6 w-40 rounded-md bg-muted" />
        <div className="h-8 w-8 rounded-md bg-muted" />
      </div>

      {/* Appointment rows — 5 placeholders */}
      <div className="rounded-lg border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 border-b px-4 py-3 bg-muted/30">
          {["Hora", "Cliente", "Servicio", "Estado"].map((col) => (
            <div key={col} className="h-4 w-16 rounded-sm bg-muted" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-4 px-4 py-3 border-b last:border-0"
          >
            <div className="h-4 w-20 rounded-sm bg-muted" />
            <div className="h-4 w-32 rounded-sm bg-muted" />
            <div className="h-4 w-28 rounded-sm bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
