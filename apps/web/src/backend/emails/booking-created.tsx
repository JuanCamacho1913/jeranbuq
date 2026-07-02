import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";
import { formatDate, formatTime } from "./format-date";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingCreatedProps {
  clientName: string;
  serviceName: string;
  startAt: Date;
  endAt: Date;
  appointmentId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingCreated({
  clientName,
  serviceName,
  startAt,
  endAt,
  appointmentId: _appointmentId,
}: BookingCreatedProps) {
  const dateStr = formatDate(startAt);
  const startStr = formatTime(startAt);
  const endStr = formatTime(endAt);

  return (
    <EmailLayout previewText={`Tu cita está pendiente de confirmación — ${serviceName}`}>
      <Heading
        style={{ fontSize: "20px", fontWeight: "bold", color: "#111827" }}
      >
        Solicitud de cita recibida
      </Heading>

      <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
        Hola, <strong>{clientName}</strong>. Recibimos tu solicitud de cita.
        Pronto recibirás una confirmación.
      </Text>

      <Section
        style={{
          backgroundColor: "#f3f4f6",
          borderRadius: "6px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Servicio:</strong> {serviceName}
        </Text>
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Fecha:</strong> {dateStr}
        </Text>
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Horario:</strong> {startStr} – {endStr}
        </Text>
        <Text style={{ margin: "4px 0", color: "#d97706", fontWeight: "bold" }}>
          Estado: PENDIENTE de confirmación
        </Text>
      </Section>

      <Text style={{ color: "#6b7280", fontSize: "14px" }}>
        Te notificaremos cuando tu cita sea confirmada por el barbero.
      </Text>

      <Text style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px" }}>
        Barbería JeranBuq — sistema de citas
      </Text>
    </EmailLayout>
  );
}
