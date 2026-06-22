"use client";

import { useState, useTransition } from "react";
import type { Service } from "@barberia-jeranbuq/database";
import { CATEGORY_LABELS } from "@barberia-jeranbuq/shared";
import { deactivateServiceAction } from "@/backend/actions/services.actions";
import { ServiceForm } from "@/frontend/components/admin/service-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return `$ ${price.toLocaleString("es-CO")}`;
}

function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

// ─── ServiceRow ───────────────────────────────────────────────────────────────

function ServiceRow({ service }: { service: Service }) {
  const [isPending, startTransition] = useTransition();
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  function handleDeactivate() {
    const confirmed = window.confirm(
      `¿Desactivar "${service.name}"? Ya no aparecerá en el sistema de reservas.`
    );
    if (!confirmed) return;

    setDeactivateError(null);
    startTransition(async () => {
      const result = await deactivateServiceAction(service.id);
      if (!result.ok) {
        setDeactivateError(result.error ?? "Failed to deactivate service.");
      }
    });
  }

  return (
    <TableRow>
      {/* Name */}
      <TableCell className="font-medium">{service.name}</TableCell>

      {/* Category */}
      <TableCell>{CATEGORY_LABELS[service.category]}</TableCell>

      {/* Duration */}
      <TableCell>{formatDuration(service.durationMin)}</TableCell>

      {/* Price */}
      <TableCell>{formatPrice(service.price)}</TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant={service.active ? "default" : "secondary"}>
          {service.active ? "Activo" : "Inactivo"}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-2">
          {/* Edit */}
          <ServiceForm
            mode="edit"
            defaultValues={service}
            trigger={
              <Button variant="outline" size="sm">
                Editar
              </Button>
            }
          />

          {/* Deactivate — only shown for active services */}
          {service.active && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDeactivate}
            >
              {isPending ? "Desactivando…" : "Desactivar"}
            </Button>
          )}
        </div>

        {/* Inline error for deactivate failure */}
        {deactivateError && (
          <p className="text-xs text-destructive mt-1">{deactivateError}</p>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── ServiceList ──────────────────────────────────────────────────────────────

interface ServiceListProps {
  services: Service[];
}

/**
 * Table of services with edit and deactivate actions.
 * Receives the services array as a prop (fetched by the RSC page).
 */
export function ServiceList({ services }: ServiceListProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#1E1E1E] px-6 py-12 text-center">
        <p className="text-sm text-[#9CA3AF]">
          Todavía no hay servicios. Creá el primero con el botón de arriba.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/[0.08] bg-[#1E1E1E] hover:bg-[#1E1E1E]">
            <TableHead className="text-[#9CA3AF]">Nombre</TableHead>
            <TableHead className="text-[#9CA3AF]">Categoría</TableHead>
            <TableHead className="text-[#9CA3AF]">Duración</TableHead>
            <TableHead className="text-[#9CA3AF]">Precio</TableHead>
            <TableHead className="text-[#9CA3AF]">Estado</TableHead>
            <TableHead className="text-[#9CA3AF]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <ServiceRow key={service.id} service={service} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
