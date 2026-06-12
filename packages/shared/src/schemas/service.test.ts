import { describe, it, expect } from "vitest";
import {
  CreateServiceSchema,
  UpdateServiceSchema,
} from "./service";

// ─── CreateServiceSchema ──────────────────────────────────────────────────────

describe("CreateServiceSchema", () => {
  const validService = {
    name: "Corte Clásico",
    durationMinutes: 30,
    price: 25000,
    description: "Un corte clásico profesional",
  };

  it("accepts a fully valid service", () => {
    expect(() => CreateServiceSchema.parse(validService)).not.toThrow();
  });

  it("accepts a service without optional description", () => {
    const { description: _description, ...rest } = validService;
    expect(() => CreateServiceSchema.parse(rest)).not.toThrow();
  });

  it("rejects an empty name", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, name: "" })
    ).toThrow();
  });

  it("rejects a name exceeding 100 characters", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, name: "a".repeat(101) })
    ).toThrow();
  });

  it("accepts a name at exactly 100 characters", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, name: "a".repeat(100) })
    ).not.toThrow();
  });

  it("rejects price with decimals (non-integer)", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, price: 25000.5 })
    ).toThrow();
  });

  it("rejects a negative price", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, price: -1 })
    ).toThrow();
  });

  it("rejects price above maximum (10_000_000)", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, price: 10_000_001 })
    ).toThrow();
  });

  it("accepts price at exactly 0", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, price: 0 })
    ).not.toThrow();
  });

  it("rejects durationMinutes below minimum (10)", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, durationMinutes: 9 })
    ).toThrow();
  });

  it("rejects durationMinutes above maximum (240)", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, durationMinutes: 241 })
    ).toThrow();
  });

  it("accepts durationMinutes at minimum boundary (10)", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, durationMinutes: 10 })
    ).not.toThrow();
  });

  it("accepts durationMinutes at maximum boundary (240)", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, durationMinutes: 240 })
    ).not.toThrow();
  });

  it("rejects durationMinutes with decimals (non-integer)", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, durationMinutes: 30.5 })
    ).toThrow();
  });

  it("rejects description exceeding 500 characters", () => {
    expect(() =>
      CreateServiceSchema.parse({ ...validService, description: "a".repeat(501) })
    ).toThrow();
  });
});

// ─── UpdateServiceSchema ──────────────────────────────────────────────────────

describe("UpdateServiceSchema", () => {
  const validCuid = "clxabc123def456ghi789";

  it("accepts a valid update with all fields", () => {
    expect(() =>
      UpdateServiceSchema.parse({
        id: validCuid,
        name: "Barba",
        durationMinutes: 20,
        price: 15000,
        description: "Solo barba",
      })
    ).not.toThrow();
  });

  it("accepts partial fields with required id", () => {
    expect(() =>
      UpdateServiceSchema.parse({ id: validCuid, name: "Nuevo nombre" })
    ).not.toThrow();
  });

  it("accepts update with only id (all other fields optional)", () => {
    expect(() =>
      UpdateServiceSchema.parse({ id: validCuid })
    ).not.toThrow();
  });

  it("rejects update without id", () => {
    expect(() =>
      UpdateServiceSchema.parse({ name: "Sin id" })
    ).toThrow();
  });

  it("rejects update with non-cuid id", () => {
    expect(() =>
      UpdateServiceSchema.parse({ id: "not-a-cuid!!!", name: "Barba" })
    ).toThrow();
  });

  it("still rejects invalid price when provided", () => {
    expect(() =>
      UpdateServiceSchema.parse({ id: validCuid, price: 25000.5 })
    ).toThrow();
  });

  it("still rejects durationMinutes below min when provided", () => {
    expect(() =>
      UpdateServiceSchema.parse({ id: validCuid, durationMinutes: 9 })
    ).toThrow();
  });
});
