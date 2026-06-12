import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockRequireAdmin, mockServiceLayer } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockServiceLayer: {
    createService: vi.fn(),
    updateService: vi.fn(),
    deactivateService: vi.fn(),
    getServices: vi.fn(),
  },
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/backend/lib/guards", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/backend/services/services.service", () => mockServiceLayer);

// next/cache revalidatePath is a server-only API — stub it out
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  createServiceAction,
  updateServiceAction,
  deactivateServiceAction,
  getServicesAction,
} from "../services.actions";

// ─── Test data ────────────────────────────────────────────────────────────────

const mockSession = {
  user: { id: "user-1", role: "ADMIN", name: "Admin User" },
  expires: "2099-01-01",
};

const mockService = {
  id: "cmc0000000000000000000001",
  name: "Corte Clásico",
  description: null,
  durationMinutes: 30,
  price: 25000,
  isActive: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// ─── createServiceAction ──────────────────────────────────────────────────────

describe("createServiceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockServiceLayer.createService.mockResolvedValueOnce({
      ok: true,
      data: mockService,
    });

    await createServiceAction({
      name: "Corte Clásico",
      durationMinutes: 30,
      price: 25000,
    });

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("valid input delegates to service layer and returns result", async () => {
    const serviceResult = { ok: true, data: mockService };
    mockServiceLayer.createService.mockResolvedValueOnce(serviceResult);

    const result = await createServiceAction({
      name: "Corte Clásico",
      durationMinutes: 30,
      price: 25000,
    });

    expect(mockServiceLayer.createService).toHaveBeenCalledWith({
      name: "Corte Clásico",
      durationMinutes: 30,
      price: 25000,
    });
    expect(result).toEqual(serviceResult);
  });

  it("Zod parse failure returns { ok: false, error: 'VALIDATION_ERROR' } without reaching service", async () => {
    const result = await createServiceAction({
      name: "",
      durationMinutes: 30,
      price: 25000,
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockServiceLayer.createService).not.toHaveBeenCalled();
  });
});

// ─── updateServiceAction ──────────────────────────────────────────────────────

describe("updateServiceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockServiceLayer.updateService.mockResolvedValueOnce({
      ok: true,
      data: mockService,
    });

    await updateServiceAction({
      id: mockService.id,
      price: 30000,
    });

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("valid input delegates to service layer and returns result", async () => {
    const updated = { ...mockService, price: 30000 };
    const serviceResult = { ok: true, data: updated };
    mockServiceLayer.updateService.mockResolvedValueOnce(serviceResult);

    const result = await updateServiceAction({
      id: mockService.id,
      price: 30000,
    });

    expect(mockServiceLayer.updateService).toHaveBeenCalledWith({
      id: mockService.id,
      price: 30000,
    });
    expect(result).toEqual(serviceResult);
  });

  it("Zod parse failure returns { ok: false, error: 'VALIDATION_ERROR' } without reaching service", async () => {
    // id is required by UpdateServiceSchema — omitting it triggers Zod failure
    const result = await updateServiceAction({} as never);

    expect(result).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(mockServiceLayer.updateService).not.toHaveBeenCalled();
  });
});

// ─── deactivateServiceAction ──────────────────────────────────────────────────

describe("deactivateServiceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockServiceLayer.deactivateService.mockResolvedValueOnce({
      ok: true,
      data: { ...mockService, isActive: false },
    });

    await deactivateServiceAction(mockService.id);

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("valid id delegates to service layer and returns result", async () => {
    const deactivated = { ...mockService, isActive: false };
    const serviceResult = { ok: true, data: deactivated };
    mockServiceLayer.deactivateService.mockResolvedValueOnce(serviceResult);

    const result = await deactivateServiceAction(mockService.id);

    expect(mockServiceLayer.deactivateService).toHaveBeenCalledWith(
      mockService.id
    );
    expect(result).toEqual(serviceResult);
  });
});

// ─── getServicesAction ────────────────────────────────────────────────────────

describe("getServicesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(mockSession);
  });

  it("calls requireAdmin() before processing", async () => {
    mockServiceLayer.getServices.mockResolvedValueOnce({
      ok: true,
      data: [mockService],
    });

    await getServicesAction(true);

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("delegates to service layer with includeInactive flag and returns result", async () => {
    const serviceResult = { ok: true, data: [mockService] };
    mockServiceLayer.getServices.mockResolvedValueOnce(serviceResult);

    const result = await getServicesAction(true);

    expect(mockServiceLayer.getServices).toHaveBeenCalledWith(true);
    expect(result).toEqual(serviceResult);
  });

  it("passes includeInactive=false when requested", async () => {
    const serviceResult = { ok: true, data: [mockService] };
    mockServiceLayer.getServices.mockResolvedValueOnce(serviceResult);

    await getServicesAction(false);

    expect(mockServiceLayer.getServices).toHaveBeenCalledWith(false);
  });
});
