import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";
import { formatDate, formatTime } from "./format-date";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminNewBookingProps {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  startAt: Date;
  endAt: Date;
  appointmentId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminNewBooking({
  clientName,
  clientEmail,
  serviceName,
  startAt,
  endAt,
  appointmentId: _appointmentId,
}: AdminNewBookingProps) {
  const dateStr = formatDate(startAt);
  const startStr = formatTime(startAt);
  const endStr = formatTime(endAt);

  return (
    <EmailLayout previewText={`Nueva solicitud de cita — ${clientName}`}>
      <Heading
        style={{ fontSize: "20px", fontWeight: "bold", color: "#111827" }}
      >
        Nueva solicitud de cita
      </Heading>

      <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
        Un cliente ha solicitado una nueva cita. Revisá los detalles a continuación.
      </Text>

      <Section
        style={{
          backgroundColor: "#eff6ff",
          borderRadius: "6px",
          padding: "16px",
          margin: "16px 0",
          borderLeft: "4px solid #3b82f6",
        }}
      >
        <Text style={{ margin: "4px 0", color: "#111827", fontWeight: "bold" }}>
          Datos del cliente
        </Text>
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Nombre:</strong> {clientName}
        </Text>
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Email:</strong> {clientEmail}
        </Text>
      </Section>

      <Section
        style={{
          backgroundColor: "#f3f4f6",
          borderRadius: "6px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text style={{ margin: "4px 0", color: "#111827", fontWeight: "bold" }}>
          Detalles de la cita
        </Text>
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Servicio:</strong> {serviceName}
        </Text>
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Fecha:</strong> {dateStr}
        </Text>
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Horario:</strong> {startStr} – {endStr}
        </Text>
      </Section>

      <Text style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px" }}>
        Barbería JeranBuq — sistema de citas
      </Text>
    </EmailLayout>
  );
}
