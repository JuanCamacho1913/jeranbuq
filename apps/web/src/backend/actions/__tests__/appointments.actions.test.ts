import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockRequireAuth, mockRequireAdmin, mockAppointmentsLayer } =
  vi.hoisted(() => ({
    mockRequireAuth: vi.fn(),
    mockRequireAdmin: vi.fn(),
    mockAppointmentsLayer: {
      createAppointment: vi.fn(),
      cancelAppointment: vi.fn(),
      cancelAppointmentAdmin: vi.fn(),
      updateStatus: vi.fn(),
    },
  }));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/backend/lib/guards", () => ({
  requireAuth: mockRequireAuth,
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/backend/services/appointments.service", () => mockAppointmentsLayer);

// next/cache revalidatePath is a server-only API — stub it out
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  createAppointmentAction,
  cancelMyAppointmentAction,
  updateAppointmentStatusAction,
} from "../appointments.actions";

// ─── Test data ────────────────────────────────────────────────────────────────

const mockClientSession = {
  user: { id: "user-client-001", role: "CLIENT", name: "Test Client" },
  expires: "2099-01-01",
};

const mockAdminSession = {
  user: { id: "user-admin-001", role: "ADMIN", name: "Test Admin" },
  expires: "2099-01-01",
};

const mockAppointment = {
  id: "cmc0000000000000000000001",
  userId: "user-client-001",
  serviceId: "cmc0000000000000000000002",
  startAt: new Date("2026-06-20T15:00:00.000Z"),
  endAt: new Date("2026-06-20T16:00:00.000Z"),
  status: "PENDING",
  notes: null,
  cancellationReason: null,
  createdAt: new Date("2026-06-15"),
  updatedAt: new Date("2026-06-15"),
};

const validServiceId = "cmc0000000000000000000002";
const validStartAt = "2026-06-20T15:00:00.000Z";
const validAppointmentId = "cmc0000000000000000000001";

// ─── createAppointmentAction ──────────────────────────────────────────────────

describe("createAppointmentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockClientSession);
  });

  it("happy path: valid input calls service.createAppointment and returns ok", async () => {
    const serviceResult = { ok: true, data: mockAppointment };
    mockAppointmentsLayer.createAppointment.mockResolvedValueOnce(serviceResult);

    const result = await createAppointmentAction({
      serviceId: validServiceId,
      startAt: validStartAt,
    });

    expect(mockRequireAuth).toHaveBeenCalledOnce();
    expect(mockAppointmentsLayer.createAppointment).toHaveBeenCalledWith(
      mockClientSession.user.id,
      validServiceId,
      new Date(validStartAt)
    );
    expect(result).toEqual(serviceResult);
  });

  it("invalid Zod input returns VALIDATION_ERROR without reaching service", async () => {
    // Missing serviceId triggers Zod parse failure
    const result = await createAppointmentAction({
      startAt: validStartAt,
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockAppointmentsLayer.createAppointment).not.toHaveBeenCalled();
  });

  it("invalid startAt format returns VALIDATION_ERROR", async () => {
    const result = await createAppointmentAction({
      serviceId: validServiceId,
      startAt: "not-a-valid-datetime",
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockAppointmentsLayer.createAppointment).not.toHaveBeenCalled();
  });

  it("unauthenticated user causes requireAuth to throw (redirect)", async () => {
    mockRequireAuth.mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      createAppointmentAction({
        serviceId: validServiceId,
        startAt: validStartAt,
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockAppointmentsLayer.createAppointment).not.toHaveBeenCalled();
  });
});

// ─── cancelMyAppointmentAction ────────────────────────────────────────────────

describe("cancelMyAppointmentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockClientSession);
  });

  it("happy path: valid appointmentId calls service.cancelAppointment with session userId", async () => {
    const serviceResult = {
      ok: true,
      data: { ...mockAppointment, status: "CANCELLED" },
    };
    mockAppointmentsLayer.cancelAppointment.mockResolvedValueOnce(serviceResult);

    const result = await cancelMyAppointmentAction({
      appointmentId: validAppointmentId,
    });

    expect(mockRequireAuth).toHaveBeenCalledOnce();
    expect(mockAppointmentsLayer.cancelAppointment).toHaveBeenCalledWith(
      validAppointmentId,
      mockClientSession.user.id
    );
    expect(result).toEqual(serviceResult);
  });

  it("service returns CANCELLATION_WINDOW_EXPIRED — action propagates the error", async () => {
    const serviceResult = {
      ok: false,
      error: "CANCELLATION_WINDOW_EXPIRED",
    };
    mockAppointmentsLayer.cancelAppointment.mockResolvedValueOnce(serviceResult);

    const result = await cancelMyAppointmentAction({
      appointmentId: validAppointmentId,
    });

    expect(result).toEqual(serviceResult);
  });

  it("service returns FORBIDDEN — action propagates the error", async () => {
    const serviceResult = {
      ok: false,
      error: "FORBIDDEN",
    };
    mockAppointmentsLayer.cancelAppointment.mockResolvedValueOnce(serviceResult);

    const result = await cancelMyAppointmentAction({
      appointmentId: validAppointmentId,
    });

    expect(result).toEqual(serviceResult);
  });

  it("invalid appointmentId (not a cuid) returns VALIDATION_ERROR", async () => {
    const result = await cancelMyAppointmentAction({
      appointmentId: "not-a-cuid",
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockAppointmentsLayer.cancelAppointment).not.toHaveBeenCalled();
  });
});

// ─── updateAppointmentStatusAction ───────────────────────────────────────────

describe("updateAppointmentStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockAdminSession);
  });

  it("happy path: valid non-CANCELLED status calls service.updateStatus and returns ok", async () => {
    const serviceResult = {
      ok: true,
      data: { ...mockAppointment, status: "CONFIRMED" },
    };
    mockAppointmentsLayer.updateStatus.mockResolvedValueOnce(serviceResult);

    const result = await updateAppointmentStatusAction({
      appointmentId: validAppointmentId,
      status: "CONFIRMED",
    });

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
    expect(mockAppointmentsLayer.updateStatus).toHaveBeenCalledWith(
      validAppointmentId,
      "CONFIRMED"
    );
    expect(result).toEqual(serviceResult);
  });

  it("CANCELLED status with cancellationReason calls cancelAppointmentAdmin", async () => {
    const serviceResult = {
      ok: true,
      data: { ...mockAppointment, status: "CANCELLED", cancellationReason: "Client no-show" },
    };
    mockAppointmentsLayer.cancelAppointmentAdmin.mockResolvedValueOnce(
      serviceResult
    );

    const result = await updateAppointmentStatusAction({
      appointmentId: validAppointmentId,
      status: "CANCELLED",
      cancellationReason: "Client no-show",
    });

    expect(mockAppointmentsLayer.cancelAppointmentAdmin).toHaveBeenCalledWith(
      validAppointmentId,
      "Client no-show"
    );
    expect(mockAppointmentsLayer.updateStatus).not.toHaveBeenCalled();
    expect(result).toEqual(serviceResult);
  });

  it("CANCELLED status without cancellationReason calls cancelAppointmentAdmin with undefined reason", async () => {
    const serviceResult = {
      ok: true,
      data: { ...mockAppointment, status: "CANCELLED" },
    };
    mockAppointmentsLayer.cancelAppointmentAdmin.mockResolvedValueOnce(
      serviceResult
    );

    const result = await updateAppointmentStatusAction({
      appointmentId: validAppointmentId,
      status: "CANCELLED",
    });

    expect(mockAppointmentsLayer.cancelAppointmentAdmin).toHaveBeenCalledWith(
      validAppointmentId,
      undefined
    );
    expect(result).toEqual(serviceResult);
  });

  it("unauthenticated/non-admin causes requireAdmin to throw", async () => {
    mockRequireAdmin.mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      updateAppointmentStatusAction({
        appointmentId: validAppointmentId,
        status: "CONFIRMED",
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockAppointmentsLayer.updateStatus).not.toHaveBeenCalled();
  });

  it("invalid status value returns VALIDATION_ERROR", async () => {
    const result = await updateAppointmentStatusAction({
      appointmentId: validAppointmentId,
      status: "PENDING", // PENDING is not in updatableStatuses
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockAppointmentsLayer.updateStatus).not.toHaveBeenCalled();
  });
});
