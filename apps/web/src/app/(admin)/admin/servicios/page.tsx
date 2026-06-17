import { getServicesAction } from "@/backend/actions/services.actions";
import { ServiciosClient } from "@/frontend/components/admin/servicios-client";

// ─── ServiciosPage ────────────────────────────────────────────────────────────

/**
 * Server Component: fetches all services (including inactive) and delegates
 * interactive rendering (create button, list with edit/deactivate) to the
 * ServiciosClient client component.
 */
export default async function ServiciosPage() {
  const result = await getServicesAction(true);
  const services = result.ok ? (result.data ?? []) : [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Servicios</h1>
      <ServiciosClient services={services} />
    </div>
  );
}
