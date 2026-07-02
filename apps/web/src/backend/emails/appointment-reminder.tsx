import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";
import { formatDate, formatTime } from "./format-date";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentReminderProps {
  clientName: string;
  serviceName: string;
  startAt: Date;
  endAt: Date;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppointmentReminder({
  clientName,
  serviceName,
  startAt,
  endAt,
}: AppointmentReminderProps) {
  const dateStr = formatDate(startAt);
  const startStr = formatTime(startAt);
  const endStr = formatTime(endAt);

  return (
    <EmailLayout
      previewText={`Recordatorio: tu cita es en 2 horas — ${serviceName}`}
    >
      <Heading
        style={{ fontSize: "20px", fontWeight: "bold", color: "#111827" }}
      >
        Recordatorio de cita
      </Heading>

      <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
        Hola, <strong>{clientName}</strong>. Te recordamos que tu cita es{" "}
        <strong>en 2 horas</strong>.
      </Text>

      <Section
        style={{
          backgroundColor: "#fffbeb",
          borderRadius: "6px",
          padding: "16px",
          margin: "16px 0",
          borderLeft: "4px solid #f59e0b",
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
      </Section>

      <Text style={{ color: "#374151", fontSize: "16px" }}>
        ¡Te esperamos!
      </Text>

      <Text style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px" }}>
        Barbería JeranBuq — sistema de citas
      </Text>
    </EmailLayout>
  );
}
