import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";
import { formatDate, formatTime } from "./format-date";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentConfirmedProps {
  clientName: string;
  serviceName: string;
  startAt: Date;
  endAt: Date;
  appointmentId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppointmentConfirmed({
  clientName,
  serviceName,
  startAt,
  endAt,
  appointmentId: _appointmentId,
}: AppointmentConfirmedProps) {
  const dateStr = formatDate(startAt);
  const startStr = formatTime(startAt);
  const endStr = formatTime(endAt);

  return (
    <EmailLayout previewText={`Tu cita fue confirmada — ${serviceName}`}>
      <Heading
        style={{ fontSize: "20px", fontWeight: "bold", color: "#111827" }}
      >
        ¡Cita confirmada!
      </Heading>

      <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
        Hola, <strong>{clientName}</strong>. Tu cita ha sido{" "}
        <strong>confirmada</strong>. Te esperamos.
      </Text>

      <Section
        style={{
          backgroundColor: "#f0fdf4",
          borderRadius: "6px",
          padding: "16px",
          margin: "16px 0",
          borderLeft: "4px solid #22c55e",
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
        <Text style={{ margin: "4px 0", color: "#16a34a", fontWeight: "bold" }}>
          Estado: CONFIRMADA
        </Text>
      </Section>

      <Text style={{ color: "#374151", fontSize: "16px" }}>
        ¡Hasta pronto!
      </Text>

      <Text style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px" }}>
        Barbería JeranBuq — sistema de citas
      </Text>
    </EmailLayout>
  );
}
