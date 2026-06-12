import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma client ───────────────────────────────────────────────────────
// vi.hoisted ensures the object is defined before vi.mock hoisting runs.

const { mockPrismaService } = vi.hoisted(() => ({
  mockPrismaService: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@barberia-jeranbuq/database", () => ({
  prisma: {
    service: mockPrismaService,
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  createService,
  updateService,
  deactivateService,
  getServices,
} from "../services.service";

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockService = {
  id: "cmc0000000000000000000001",
  name: "Corte Clásico",
  description: null,
  durationMin: 30,
  price: 25000,
  active: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// ─── createService ────────────────────────────────────────────────────────────

describe("createService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valid insert returns ok with service data", async () => {
    mockPrismaService.findUnique.mockResolvedValueOnce(null);
    mockPrismaService.create.mockResolvedValueOnce(mockService);

    const result = await createService({
      name: "Corte Clásico",
      durationMin: 30,
      price: 25000,
    });

    expect(result).toEqual({ ok: true, data: mockService });
    expect(mockPrismaService.findUnique).toHaveBeenCalledWith({
      where: { name: "Corte Clásico" },
    });
    expect(mockPrismaService.create).toHaveBeenCalledWith({
      data: {
        name: "Corte Clásico",
        durationMin: 30,
        price: 25000,
      },
    });
  });

  it("duplicate name returns { ok: false, error: 'SERVICE_NAME_TAKEN' }", async () => {
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);

    const result = await createService({
      name: "Corte Clásico",
      durationMin: 30,
      price: 25000,
    });

    expect(result).toEqual({ ok: false, error: "SERVICE_NAME_TAKEN" });
    expect(mockPrismaService.create).not.toHaveBeenCalled();
  });
});

// ─── updateService ────────────────────────────────────────────────────────────

describe("updateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valid update returns ok with updated service data", async () => {
    const updatedService = { ...mockService, price: 30000 };
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);
    mockPrismaService.update.mockResolvedValueOnce(updatedService);

    const result = await updateService({
      id: mockService.id,
      price: 30000,
    });

    expect(result).toEqual({ ok: true, data: updatedService });
    expect(mockPrismaService.findUnique).toHaveBeenCalledWith({
      where: { id: mockService.id },
    });
    expect(mockPrismaService.update).toHaveBeenCalledWith({
      where: { id: mockService.id },
      data: { price: 30000 },
    });
  });

  it("non-existent id returns { ok: false, error: 'SERVICE_NOT_FOUND' }", async () => {
    mockPrismaService.findUnique.mockResolvedValueOnce(null);

    const result = await updateService({
      id: "non-existent-id",
      price: 30000,
    });

    expect(result).toEqual({ ok: false, error: "SERVICE_NOT_FOUND" });
    expect(mockPrismaService.update).not.toHaveBeenCalled();
  });
});

// ─── deactivateService ────────────────────────────────────────────────────────

describe("deactivateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets active=false and returns ok", async () => {
    const deactivatedService = { ...mockService, active: false };
    mockPrismaService.findUnique.mockResolvedValueOnce(mockService);
    mockPrismaService.update.mockResolvedValueOnce(deactivatedService);

    const result = await deactivateService(mockService.id);

    expect(result).toEqual({ ok: true, data: deactivatedService });
    expect(mockPrismaService.update).toHaveBeenCalledWith({
      where: { id: mockService.id },
      data: { active: false },
    });
  });

  it("is idempotent on already-inactive service (returns ok)", async () => {
    const inactiveService = { ...mockService, active: false };
    mockPrismaService.findUnique.mockResolvedValueOnce(inactiveService);
    mockPrismaService.update.mockResolvedValueOnce(inactiveService);

    const result = await deactivateService(mockService.id);

    expect(result).toEqual({ ok: true, data: inactiveService });
    expect(mockPrismaService.update).toHaveBeenCalledWith({
      where: { id: mockService.id },
      data: { active: false },
    });
  });
});

// ─── getServices ──────────────────────────────────────────────────────────────

describe("getServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getServices(true) returns all services including inactive", async () => {
    const allServices = [
      mockService,
      { ...mockService, id: "cmc0000000000000000000002", active: false },
    ];
    mockPrismaService.findMany.mockResolvedValueOnce(allServices);

    const result = await getServices(true);

    expect(result).toEqual({ ok: true, data: allServices });
    expect(mockPrismaService.findMany).toHaveBeenCalledWith();
  });

  it("getServices(false) returns only active services", async () => {
    const activeServices = [mockService];
    mockPrismaService.findMany.mockResolvedValueOnce(activeServices);

    const result = await getServices(false);

    expect(result).toEqual({ ok: true, data: activeServices });
    expect(mockPrismaService.findMany).toHaveBeenCalledWith({
      where: { active: true },
    });
  });
});
