import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";
import { formatDateShort, formatTime } from "./format-date";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentCancelledProps {
  recipientName: string;
  serviceName: string;
  startAt: Date;
  cancelledBy: "client" | "admin";
  cancellationReason?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppointmentCancelled({
  recipientName,
  serviceName,
  startAt,
  cancelledBy,
  cancellationReason,
}: AppointmentCancelledProps) {
  const dateStr = formatDateShort(startAt);
  const timeStr = formatTime(startAt);

  const isClientCancel = cancelledBy === "client";

  const heading = isClientCancel
    ? "El cliente canceló su cita"
    : "Tu cita fue cancelada";

  const intro = isClientCancel
    ? `El cliente <strong>${recipientName}</strong> canceló la siguiente cita.`
    : `Hola, <strong>${recipientName}</strong>. Lamentamos informarte que tu cita fue cancelada por el administrador.`;

  return (
    <EmailLayout previewText={heading}>
      <Heading
        style={{ fontSize: "20px", fontWeight: "bold", color: "#111827" }}
      >
        {heading}
      </Heading>

      <Text
        style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}
        dangerouslySetInnerHTML={{ __html: intro }}
      />

      <Section
        style={{
          backgroundColor: "#fef2f2",
          borderRadius: "6px",
          padding: "16px",
          margin: "16px 0",
          borderLeft: "4px solid #ef4444",
        }}
      >
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Servicio:</strong> {serviceName}
        </Text>
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Fecha:</strong> {dateStr}
        </Text>
        <Text style={{ margin: "4px 0", color: "#111827" }}>
          <strong>Hora:</strong> {timeStr}
        </Text>
        <Text
          style={{ margin: "4px 0", color: "#dc2626", fontWeight: "bold" }}
        >
          Estado: CANCELADA {isClientCancel ? "por el cliente" : "por el administrador"}
        </Text>
      </Section>

      {cancellationReason && (
        <Text style={{ color: "#374151", fontSize: "14px" }}>
          <strong>Motivo:</strong> {cancellationReason}
        </Text>
      )}

      <Text style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px" }}>
        Barbería JeranBuq — sistema de citas
      </Text>
    </EmailLayout>
  );
}
