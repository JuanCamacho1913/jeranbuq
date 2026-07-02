import { describe, it, expect } from "vitest";
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  updateAppointmentStatusSchema,
  getSlotsQuerySchema,
} from "./appointment";
import { AppointmentStatus } from "../constants/appointment-status";

// ─── createAppointmentSchema ─────────────────────────────────────────────────

describe("createAppointmentSchema", () => {
  const validCuid = "clxabc123def456ghi789";
  const validInput = {
    serviceId: validCuid,
    startAt: "2026-06-15T15:00:00.000Z",
  };

  it("accepts a valid serviceId and ISO startAt", () => {
    expect(() => createAppointmentSchema.parse(validInput)).not.toThrow();
  });

  it("rejects when serviceId is missing", () => {
    const result = createAppointmentSchema.safeParse({
      startAt: validInput.startAt,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("serviceId");
    }
  });

  it("rejects when serviceId is not a cuid", () => {
    const result = createAppointmentSchema.safeParse({
      ...validInput,
      serviceId: "not-a-valid-cuid!!!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when startAt is missing", () => {
    const result = createAppointmentSchema.safeParse({
      serviceId: validCuid,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("startAt");
    }
  });

  it("rejects when startAt is not a valid ISO datetime", () => {
    const result = createAppointmentSchema.safeParse({
      ...validInput,
      startAt: "2026-06-15 15:00:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when startAt has no timezone offset (not ISO 8601 compliant)", () => {
    const result = createAppointmentSchema.safeParse({
      ...validInput,
      startAt: "2026-06-15T15:00:00",
    });
    expect(result.success).toBe(false);
  });
});

// ─── cancelAppointmentSchema ─────────────────────────────────────────────────

describe("cancelAppointmentSchema", () => {
  const validCuid = "clxabc123def456ghi789";

  it("accepts a valid appointmentId", () => {
    expect(() =>
      cancelAppointmentSchema.parse({ appointmentId: validCuid })
    ).not.toThrow();
  });

  it("rejects when appointmentId is missing", () => {
    const result = cancelAppointmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects when appointmentId is not a cuid", () => {
    const result = cancelAppointmentSchema.safeParse({
      appointmentId: "not-a-cuid",
    });
    expect(result.success).toBe(false);
  });
});

// ─── updateAppointmentStatusSchema ───────────────────────────────────────────

describe("updateAppointmentStatusSchema", () => {
  const validCuid = "clxabc123def456ghi789";

  it("accepts a valid status transition to CONFIRMED", () => {
    expect(() =>
      updateAppointmentStatusSchema.parse({
        appointmentId: validCuid,
        status: AppointmentStatus.CONFIRMED,
      })
    ).not.toThrow();
  });

  it("accepts CANCELLED with optional cancellationReason", () => {
    expect(() =>
      updateAppointmentStatusSchema.parse({
        appointmentId: validCuid,
        status: AppointmentStatus.CANCELLED,
        cancellationReason: "Client requested cancellation",
      })
    ).not.toThrow();
  });

  it("accepts COMPLETED status without cancellationReason", () => {
    expect(() =>
      updateAppointmentStatusSchema.parse({
        appointmentId: validCuid,
        status: AppointmentStatus.COMPLETED,
      })
    ).not.toThrow();
  });

  it("accepts NO_SHOW status", () => {
    expect(() =>
      updateAppointmentStatusSchema.parse({
        appointmentId: validCuid,
        status: AppointmentStatus.NO_SHOW,
      })
    ).not.toThrow();
  });

  it("rejects unknown status value", () => {
    const result = updateAppointmentStatusSchema.safeParse({
      appointmentId: validCuid,
      status: "REJECTED",
    });
    expect(result.success).toBe(false);
  });

  it("rejects PENDING as a status value (not a valid target transition)", () => {
    const result = updateAppointmentStatusSchema.safeParse({
      appointmentId: validCuid,
      status: "PENDING",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when appointmentId is missing", () => {
    const result = updateAppointmentStatusSchema.safeParse({
      status: AppointmentStatus.CONFIRMED,
    });
    expect(result.success).toBe(false);
  });

  it("rejects cancellationReason exceeding 500 characters", () => {
    const result = updateAppointmentStatusSchema.safeParse({
      appointmentId: validCuid,
      status: AppointmentStatus.CANCELLED,
      cancellationReason: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ─── getSlotsQuerySchema ─────────────────────────────────────────────────────

describe("getSlotsQuerySchema", () => {
  const validCuid = "clxabc123def456ghi789";

  it("accepts a valid date and serviceId", () => {
    expect(() =>
      getSlotsQuerySchema.parse({ date: "2026-06-20", serviceId: validCuid })
    ).not.toThrow();
  });

  it("rejects date without dashes (YYYYMMDD format)", () => {
    const result = getSlotsQuerySchema.safeParse({
      date: "20260620",
      serviceId: validCuid,
    });
    expect(result.success).toBe(false);
  });

  it("rejects date in wrong format (MM/DD/YYYY)", () => {
    const result = getSlotsQuerySchema.safeParse({
      date: "06/20/2026",
      serviceId: validCuid,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when date is missing", () => {
    const result = getSlotsQuerySchema.safeParse({ serviceId: validCuid });
    expect(result.success).toBe(false);
  });

  it("rejects when serviceId is empty string", () => {
    const result = getSlotsQuerySchema.safeParse({
      date: "2026-06-20",
      serviceId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when serviceId is missing", () => {
    const result = getSlotsQuerySchema.safeParse({ date: "2026-06-20" });
    expect(result.success).toBe(false);
  });
});
