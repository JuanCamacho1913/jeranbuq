"use client";

import { useState, useTransition } from "react";
import type { Service } from "@barberia-jeranbuq/database";
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
      `Deactivate "${service.name}"? It will no longer appear for booking.`
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

      {/* Duration */}
      <TableCell>{formatDuration(service.durationMinutes)}</TableCell>

      {/* Price */}
      <TableCell>{formatPrice(service.price)}</TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant={service.isActive ? "default" : "secondary"}>
          {service.isActive ? "Active" : "Inactive"}
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
                Edit
              </Button>
            }
          />

          {/* Deactivate — only shown for active services */}
          {service.isActive && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDeactivate}
            >
              {isPending ? "Deactivating…" : "Deactivate"}
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
      <div className="rounded-md border px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No services yet. Create your first service using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
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
