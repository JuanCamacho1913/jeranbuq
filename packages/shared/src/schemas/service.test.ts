import { describe, it, expect } from "vitest";
import {
  createServiceSchema,
  updateServiceSchema,
  SERVICE_CATEGORIES,
  CATEGORY_LABELS,
} from "./service";

// ─── createServiceSchema ──────────────────────────────────────────────────────

describe("createServiceSchema", () => {
  const validService = {
    name: "Corte Clásico",
    durationMin: 30,
    price: 25000,
    description: "Un corte clásico profesional",
    category: "HAIRCUT" as const,
  };

  it("accepts a fully valid service", () => {
    expect(() => createServiceSchema.parse(validService)).not.toThrow();
  });

  it("accepts a service without optional description", () => {
    const { description: _description, ...rest } = validService;
    expect(() => createServiceSchema.parse(rest)).not.toThrow();
  });

  it("rejects an empty name", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, name: "" })
    ).toThrow();
  });

  it("rejects a name exceeding 100 characters", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, name: "a".repeat(101) })
    ).toThrow();
  });

  it("accepts a name at exactly 100 characters", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, name: "a".repeat(100) })
    ).not.toThrow();
  });

  it("rejects price with decimals (non-integer)", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, price: 25000.5 })
    ).toThrow();
  });

  it("rejects a negative price", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, price: -1 })
    ).toThrow();
  });

  it("rejects price above maximum (10_000_000)", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, price: 10_000_001 })
    ).toThrow();
  });

  it("accepts price at exactly 0", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, price: 0 })
    ).not.toThrow();
  });

  it("rejects durationMin below minimum (10)", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, durationMin: 9 })
    ).toThrow();
  });

  it("rejects durationMin above maximum (240)", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, durationMin: 241 })
    ).toThrow();
  });

  it("accepts durationMin at minimum boundary (10)", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, durationMin: 10 })
    ).not.toThrow();
  });

  it("accepts durationMin at maximum boundary (240)", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, durationMin: 240 })
    ).not.toThrow();
  });

  it("rejects durationMin with decimals (non-integer)", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, durationMin: 30.5 })
    ).toThrow();
  });

  it("rejects description exceeding 500 characters", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, description: "a".repeat(501) })
    ).toThrow();
  });
});

// ─── updateServiceSchema ──────────────────────────────────────────────────────

describe("updateServiceSchema", () => {
  const validCuid = "clxabc123def456ghi789";

  it("accepts a valid update with all fields", () => {
    expect(() =>
      updateServiceSchema.parse({
        id: validCuid,
        name: "Barba",
        durationMin: 20,
        price: 15000,
        description: "Solo barba",
      })
    ).not.toThrow();
  });

  it("accepts partial fields with required id", () => {
    expect(() =>
      updateServiceSchema.parse({ id: validCuid, name: "Nuevo nombre" })
    ).not.toThrow();
  });

  it("accepts update with only id (all other fields optional)", () => {
    expect(() =>
      updateServiceSchema.parse({ id: validCuid })
    ).not.toThrow();
  });

  it("rejects update without id", () => {
    expect(() =>
      updateServiceSchema.parse({ name: "Sin id" })
    ).toThrow();
  });

  it("rejects update with non-cuid id", () => {
    expect(() =>
      updateServiceSchema.parse({ id: "not-a-cuid!!!", name: "Barba" })
    ).toThrow();
  });

  it("still rejects invalid price when provided", () => {
    expect(() =>
      updateServiceSchema.parse({ id: validCuid, price: 25000.5 })
    ).toThrow();
  });

  it("still rejects durationMin below min when provided", () => {
    expect(() =>
      updateServiceSchema.parse({ id: validCuid, durationMin: 9 })
    ).toThrow();
  });

  it("accepts update with only category (partial)", () => {
    expect(() =>
      updateServiceSchema.parse({ id: validCuid, category: "VIP" })
    ).not.toThrow();
  });
});

// ─── ServiceCategory schema ────────────────────────────────────────────────────

describe("ServiceCategory schema", () => {
  const validService = {
    name: "Servicio de prueba",
    durationMin: 30,
    price: 25000,
  };

  it("exports SERVICE_CATEGORIES with 6 values", () => {
    expect(SERVICE_CATEGORIES).toHaveLength(6);
    expect(SERVICE_CATEGORIES).toContain("HAIRCUT");
    expect(SERVICE_CATEGORIES).toContain("COMBO");
    expect(SERVICE_CATEGORIES).toContain("PREMIUM");
    expect(SERVICE_CATEGORIES).toContain("VIP");
    expect(SERVICE_CATEGORIES).toContain("COLORIMETRIA");
    expect(SERVICE_CATEGORIES).toContain("KIDS");
  });

  it("exports CATEGORY_LABELS with Spanish label for each category", () => {
    for (const cat of SERVICE_CATEGORIES) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
      expect(typeof CATEGORY_LABELS[cat]).toBe("string");
    }
  });

  it.each(SERVICE_CATEGORIES)("accepts valid category %s", (cat) => {
    expect(() =>
      createServiceSchema.parse({ ...validService, category: cat })
    ).not.toThrow();
  });

  it("rejects unknown category value", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, category: "UNKNOWN" })
    ).toThrow();
  });

  it("rejects missing category", () => {
    expect(() => createServiceSchema.parse(validService)).toThrow();
  });

  it("accepts priceNote up to 50 characters", () => {
    expect(() =>
      createServiceSchema.parse({
        ...validService,
        category: "HAIRCUT",
        priceNote: "a".repeat(50),
      })
    ).not.toThrow();
  });

  it("rejects priceNote exceeding 50 characters", () => {
    expect(() =>
      createServiceSchema.parse({
        ...validService,
        category: "HAIRCUT",
        priceNote: "a".repeat(51),
      })
    ).toThrow();
  });

  it("accepts missing priceNote (optional)", () => {
    expect(() =>
      createServiceSchema.parse({ ...validService, category: "HAIRCUT" })
    ).not.toThrow();
  });
});
