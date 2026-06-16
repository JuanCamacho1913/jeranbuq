import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/backend/lib/guards";
import { getAvailableSlots } from "@/backend/services/slots.service";
import { getSlotsQuerySchema } from "@barberia-jeranbuq/shared";

// ─── GET /api/v1/availability ─────────────────────────────────────────────────

/**
 * Returns available time slots for a given service and date.
 *
 * Query params:
 *   - date:      YYYY-MM-DD (Bogota calendar date)
 *   - serviceId: string (service cuid)
 *
 * Responses:
 *   - 401: unauthenticated
 *   - 400: invalid/missing query params
 *   - 200: { ok: true, data: { date, slots } }
 *
 * Cache-Control: no-store — slots change with every booking.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth check: requireAuth redirects if unauthenticated.
  // In a Route Handler context we catch the redirect and return 401 instead.
  try {
    await requireAuth();
  } catch {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Parse and validate query params
  const { searchParams } = request.nextUrl;
  const rawParams = {
    date: searchParams.get("date") ?? undefined,
    serviceId: searchParams.get("serviceId") ?? undefined,
  };

  const parsed = getSlotsQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_PARAMS" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { serviceId, date } = parsed.data;
  const result = await getAvailableSlots(serviceId, date);

  return NextResponse.json(result, {
    status: result.ok ? 200 : 500,
    headers: { "Cache-Control": "no-store" },
  });
}
