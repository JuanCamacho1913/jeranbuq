"use client";

import type { Service } from "@barberia-jeranbuq/database";
import { ServiceForm } from "@/frontend/components/admin/service-form";
import { ServiceList } from "@/frontend/components/admin/service-list";
import { Button } from "@/frontend/components/ui/button";
import { Plus } from "lucide-react";

// ─── ServiciosClient ──────────────────────────────────────────────────────────

interface ServiciosClientProps {
  services: Service[];
}

/**
 * Client wrapper for the servicios page.
 * Manages the "New Service" Dialog trigger and renders the ServiceList.
 * Exists so the RSC page (ServiciosPage) can stay a Server Component.
 */
export function ServiciosClient({ services }: ServiciosClientProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar: New Service button */}
      <div className="flex justify-end">
        <ServiceForm
          mode="create"
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo servicio
            </Button>
          }
        />
      </div>

      {/* Services table */}
      <ServiceList services={services} />
    </div>
  );
}
