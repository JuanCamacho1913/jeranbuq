import { prisma } from "@barberia-jeranbuq/database";
import type {
  ServiceFormData,
  UpdateServiceData,
} from "@barberia-jeranbuq/shared";
import type { ApiResponse } from "@barberia-jeranbuq/shared";
import type { Service } from "@barberia-jeranbuq/database";

// ─── createService ────────────────────────────────────────────────────────────

/**
 * Inserts a new Service row.
 * Returns SERVICE_NAME_TAKEN if a service with the same name already exists.
 */
export async function createService(
  data: ServiceFormData
): Promise<ApiResponse<Service>> {
  const existing = await prisma.service.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    return { ok: false, error: "SERVICE_NAME_TAKEN" };
  }

  const service = await prisma.service.create({ data });

  return { ok: true, data: service };
}

// ─── updateService ────────────────────────────────────────────────────────────

/**
 * Updates an existing Service row by id.
 * Returns SERVICE_NOT_FOUND if no matching row exists.
 */
export async function updateService(
  data: UpdateServiceData
): Promise<ApiResponse<Service>> {
  const { id, ...fields } = data;

  const existing = await prisma.service.findUnique({ where: { id } });

  if (!existing) {
    return { ok: false, error: "SERVICE_NOT_FOUND" };
  }

  const service = await prisma.service.update({
    where: { id },
    data: fields,
  });

  return { ok: true, data: service };
}

// ─── deactivateService ────────────────────────────────────────────────────────

/**
 * Soft-deletes a service by setting isActive = false.
 * Idempotent: succeeds even if the service is already inactive.
 * Returns SERVICE_NOT_FOUND if no matching row exists.
 */
export async function deactivateService(
  id: string
): Promise<ApiResponse<Service>> {
  const existing = await prisma.service.findUnique({ where: { id } });

  if (!existing) {
    return { ok: false, error: "SERVICE_NOT_FOUND" };
  }

  const service = await prisma.service.update({
    where: { id },
    data: { active: false },
  });

  return { ok: true, data: service };
}

// ─── getServices ──────────────────────────────────────────────────────────────

/**
 * Returns all services.
 * When includeInactive is true, returns every row.
 * When includeInactive is false, returns only rows where isActive = true.
 */
export async function getServices(
  includeInactive: boolean
): Promise<ApiResponse<Service[]>> {
  const orderBy = [{ category: "asc" as const }, { name: "asc" as const }];

  const services = includeInactive
    ? await prisma.service.findMany({ orderBy })
    : await prisma.service.findMany({ where: { active: true }, orderBy });

  return { ok: true, data: services };
}
