"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalizes a phone number for WhatsApp deep links.
 * - Strips all non-digit characters.
 * - Prepends "57" (Colombia) if the number doesn't already start with a
 *   country code (i.e. is less than 10 digits after stripping).
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Colombian mobile numbers are 10 digits (e.g. 3001234567).
  // If already has country code prefix (12+ digits) leave as-is.
  if (digits.length <= 10) {
    return `57${digits}`;
  }
  return digits;
}

// ─── WhatsAppButton ───────────────────────────────────────────────────────────

/**
 * Renders a WhatsApp deep-link button.
 * If `phone` is null or empty, renders nothing.
 */
export function WhatsAppButton({ phone }: { phone: string | null }) {
  if (!phone) return null;

  const normalized = normalizePhone(phone);
  const href = `https://wa.me/${normalized}`;

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className="text-green-700 border-green-400 hover:bg-green-50 hover:text-green-800"
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4 mr-1.5" />
        WhatsApp
      </a>
    </Button>
  );
}
