import { describe, it, expect } from "vitest";
import {
  SessionUserSchema,
  OnboardingSchema,
  BarberCodeSchema,
} from "./auth";

// ─── SessionUserSchema ────────────────────────────────────────────────────────

describe("SessionUserSchema", () => {
  const validUser = {
    id: "clxabc123",
    email: "user@example.com",
    name: "Juan Pérez",
    image: "https://example.com/avatar.png",
    role: "CLIENT" as const,
    phone: "+5491112345678",
    onboardingCompletedAt: "2024-01-01T00:00:00.000Z",
  };

  it("accepts a fully valid CLIENT user", () => {
    expect(() => SessionUserSchema.parse(validUser)).not.toThrow();
  });

  it("accepts a valid ADMIN user", () => {
    expect(() =>
      SessionUserSchema.parse({ ...validUser, role: "ADMIN" })
    ).not.toThrow();
  });

  it("accepts null nullable fields", () => {
    expect(() =>
      SessionUserSchema.parse({
        ...validUser,
        name: null,
        image: null,
        phone: null,
        onboardingCompletedAt: null,
      })
    ).not.toThrow();
  });

  it("rejects an invalid role", () => {
    expect(() =>
      SessionUserSchema.parse({ ...validUser, role: "SUPERUSER" })
    ).toThrow();
  });

  it("rejects a missing email", () => {
    const { email: _email, ...rest } = validUser;
    expect(() => SessionUserSchema.parse(rest)).toThrow();
  });

  it("rejects a malformed email", () => {
    expect(() =>
      SessionUserSchema.parse({ ...validUser, email: "not-an-email" })
    ).toThrow();
  });

  it("rejects an invalid datetime string for onboardingCompletedAt", () => {
    expect(() =>
      SessionUserSchema.parse({
        ...validUser,
        onboardingCompletedAt: "not-a-date",
      })
    ).toThrow();
  });

  it("rejects a missing id", () => {
    const { id: _id, ...rest } = validUser;
    expect(() => SessionUserSchema.parse(rest)).toThrow();
  });
});

// ─── OnboardingSchema ─────────────────────────────────────────────────────────

describe("OnboardingSchema", () => {
  it("accepts a valid local phone number (7 digits)", () => {
    expect(() => OnboardingSchema.parse({ phone: "1234567" })).not.toThrow();
  });

  it("accepts a phone with leading plus sign", () => {
    expect(() =>
      OnboardingSchema.parse({ phone: "+5491112345678" })
    ).not.toThrow();
  });

  it("accepts maximum length phone (15 digits)", () => {
    expect(() =>
      OnboardingSchema.parse({ phone: "123456789012345" })
    ).not.toThrow();
  });

  it("accepts phone with spaces (formatted Argentinian number)", () => {
    expect(() =>
      OnboardingSchema.parse({ phone: "+54 9 11 1234-5678" })
    ).not.toThrow();
  });

  it("accepts phone with dashes (formatted US number)", () => {
    expect(() =>
      OnboardingSchema.parse({ phone: "+1-555-123-4567" })
    ).not.toThrow();
  });

  it("accepts phone with parentheses (formatted area code)", () => {
    expect(() =>
      OnboardingSchema.parse({ phone: "(011) 4555-1234" })
    ).not.toThrow();
  });

  it("rejects a phone that is too short (< 7 chars)", () => {
    expect(() => OnboardingSchema.parse({ phone: "12345" })).toThrow();
  });

  it("rejects a phone that is too long (> 20 chars)", () => {
    expect(() =>
      OnboardingSchema.parse({ phone: "123456789012345678901" })
    ).toThrow();
  });

  it("rejects a phone with letters", () => {
    expect(() =>
      OnboardingSchema.parse({ phone: "+549ABC12345" })
    ).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => OnboardingSchema.parse({ phone: "" })).toThrow();
  });

  it("rejects a missing phone field", () => {
    expect(() => OnboardingSchema.parse({})).toThrow();
  });
});

// ─── BarberCodeSchema ─────────────────────────────────────────────────────────

describe("BarberCodeSchema", () => {
  it("accepts a non-empty code", () => {
    expect(() => BarberCodeSchema.parse({ code: "SECRET123" })).not.toThrow();
  });

  it("accepts a single-character code", () => {
    expect(() => BarberCodeSchema.parse({ code: "x" })).not.toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => BarberCodeSchema.parse({ code: "" })).toThrow();
  });

  it("rejects a missing code field", () => {
    expect(() => BarberCodeSchema.parse({})).toThrow();
  });
});
