import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@react-email/render";

import { BookingCreated } from "../booking-created";
import { AdminNewBooking } from "../admin-new-booking";
import { AppointmentConfirmed } from "../appointment-confirmed";
import { AppointmentCancelled } from "../appointment-cancelled";
import { AppointmentReminder } from "../appointment-reminder";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const startAt = new Date("2025-03-15T18:00:00.000Z"); // 13:00 Bogotá (UTC-5)
const endAt = new Date("2025-03-15T19:00:00.000Z");   // 14:00 Bogotá (UTC-5)

// ─── BookingCreated ────────────────────────────────────────────────────────────

describe("BookingCreated", () => {
  it("contains client name, service name, formatted date and pending status", async () => {
    const html = await render(
      React.createElement(BookingCreated, {
        clientName: "Juan Esteban",
        serviceName: "Corte Clásico",
        startAt,
        endAt,
        appointmentId: "appt-001",
      })
    );

    expect(html).toContain("Juan Esteban");
    expect(html).toContain("Corte Clásico");
    // Date formatted in America/Bogota — should show March 15
    expect(html.toLowerCase()).toMatch(/pendiente/i);
    // Date contains some recognizable date fragment
    expect(html).toMatch(/15|marzo|march/i);
  });
});

// ─── AdminNewBooking ───────────────────────────────────────────────────────────

describe("AdminNewBooking", () => {
  it("contains client name, client email, service name and formatted date", async () => {
    const html = await render(
      React.createElement(AdminNewBooking, {
        clientName: "Juan Esteban",
        clientEmail: "juan@example.com",
        serviceName: "Corte Clásico",
        startAt,
        endAt,
        appointmentId: "appt-001",
      })
    );

    expect(html).toContain("Juan Esteban");
    expect(html).toContain("juan@example.com");
    expect(html).toContain("Corte Clásico");
    expect(html).toMatch(/15|marzo|march/i);
  });
});

// ─── AppointmentConfirmed ─────────────────────────────────────────────────────

describe("AppointmentConfirmed", () => {
  it("contains client name, service name, formatted date and confirmed message", async () => {
    const html = await render(
      React.createElement(AppointmentConfirmed, {
        clientName: "Juan Esteban",
        serviceName: "Corte Clásico",
        startAt,
        endAt,
        appointmentId: "appt-001",
      })
    );

    expect(html).toContain("Juan Esteban");
    expect(html).toContain("Corte Clásico");
    expect(html.toLowerCase()).toMatch(/confirmad/i);
    expect(html).toMatch(/15|marzo|march/i);
  });
});

// ─── AppointmentCancelled — cancelledBy: client ───────────────────────────────

describe("AppointmentCancelled (cancelledBy: client)", () => {
  it("contains service name, date and message indicating client cancelled", async () => {
    const html = await render(
      React.createElement(AppointmentCancelled, {
        recipientName: "Admin",
        serviceName: "Corte Clásico",
        startAt,
        cancelledBy: "client" as const,
      })
    );

    expect(html).toContain("Corte Clásico");
    expect(html).toMatch(/15|marzo|march/i);
    // Admin receives notification that client cancelled
    expect(html.toLowerCase()).toMatch(/cliente|client/i);
    expect(html.toLowerCase()).toMatch(/cancel/i);
  });
});

// ─── AppointmentCancelled — cancelledBy: admin ────────────────────────────────

describe("AppointmentCancelled (cancelledBy: admin)", () => {
  it("contains service name, date and message indicating admin cancelled", async () => {
    const html = await render(
      React.createElement(AppointmentCancelled, {
        recipientName: "Juan Esteban",
        serviceName: "Corte Clásico",
        startAt,
        cancelledBy: "admin" as const,
        cancellationReason: "Emergency closure",
      })
    );

    expect(html).toContain("Corte Clásico");
    expect(html).toContain("Juan Esteban");
    expect(html).toMatch(/15|marzo|march/i);
    expect(html.toLowerCase()).toMatch(/cancel/i);
    expect(html).toContain("Emergency closure");
  });
});

// ─── AppointmentReminder ──────────────────────────────────────────────────────

describe("AppointmentReminder", () => {
  it("contains client name, service name, formatted date and reminder copy", async () => {
    const html = await render(
      React.createElement(AppointmentReminder, {
        clientName: "Juan Esteban",
        serviceName: "Corte Clásico",
        startAt,
        endAt,
      })
    );

    expect(html).toContain("Juan Esteban");
    expect(html).toContain("Corte Clásico");
    expect(html).toMatch(/15|marzo|march/i);
    // Should mention "2 horas" or "recordatorio"
    expect(html.toLowerCase()).toMatch(/2 horas|recordatorio|reminder/i);
  });
});
