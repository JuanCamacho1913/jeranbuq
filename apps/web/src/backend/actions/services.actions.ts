"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/backend/lib/guards";
import {
  createService,
  updateService,
  deactivateService,
  getServices,
} from "@/backend/services/services.service";
import {
  CreateServiceSchema,
  UpdateServiceSchema,
} from "@barberia-jeranbuq/shared";
import type {
  ServiceFormData,
  UpdateServiceData,
} from "@barberia-jeranbuq/shared";
import type { ApiResponse } from "@barberia-jeranbuq/shared";
import type { Service } from "@barberia-jeranbuq/database";

// ─── createServiceAction ──────────────────────────────────────────────────────

/**
 * Server action: create a new service.
 * Pattern: Zod parse → requireAdmin() → service layer → revalidatePath → return.
 */
export async function createServiceAction(
  input: unknown
): Promise<ApiResponse<Service>> {
  const parsed = CreateServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  await requireAdmin();

  const result = await createService(parsed.data as ServiceFormData);

  if (result.ok) {
    revalidatePath("/admin/servicios");
  }

  return result;
}

// ─── updateServiceAction ──────────────────────────────────────────────────────

/**
 * Server action: update an existing service.
 * Pattern: Zod parse → requireAdmin() → service layer → revalidatePath → return.
 */
export async function updateServiceAction(
  input: unknown
): Promise<ApiResponse<Service>> {
  const parsed = UpdateServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_ERROR" };
  }

  await requireAdmin();

  const result = await updateService(parsed.data as UpdateServiceData);

  if (result.ok) {
    revalidatePath("/admin/servicios");
  }

  return result;
}

// ─── deactivateServiceAction ──────────────────────────────────────────────────

/**
 * Server action: soft-delete a service by setting isActive = false.
 * Pattern: requireAdmin() → service layer → revalidatePath → return.
 */
export async function deactivateServiceAction(
  id: string
): Promise<ApiResponse<Service>> {
  await requireAdmin();

  const result = await deactivateService(id);

  if (result.ok) {
    revalidatePath("/admin/servicios");
  }

  return result;
}

// ─── getServicesAction ────────────────────────────────────────────────────────

/**
 * Server action: retrieve services list.
 * When includeInactive is true, returns all services (admin view).
 * When includeInactive is false, returns only active services (client view).
 */
export async function getServicesAction(
  includeInactive: boolean
): Promise<ApiResponse<Service[]>> {
  await requireAdmin();

  return getServices(includeInactive);
}
