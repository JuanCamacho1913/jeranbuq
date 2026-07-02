import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Preview,
} from "@react-email/components";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmailLayout({ children, previewText }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body
        style={{
          backgroundColor: "#f9fafb",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: "0",
          padding: "0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "40px auto",
            padding: "32px",
            borderRadius: "8px",
            maxWidth: "560px",
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}
