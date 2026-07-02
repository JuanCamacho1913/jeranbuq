import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type React from "react";

// ─── Mock Resend ──────────────────────────────────────────────────────────────

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ data: { id: "test-email-id" }, error: null }),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return { emails: { send: mockSend } };
  }),
}));

// ─── Mock @react-email/render ─────────────────────────────────────────────────

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html>test email</html>"),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { sendEmail } from "../email";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Avoid JSX in .ts test file — cast a plain object as ReactElement
const fakeElement = { type: "div", props: { children: "Hello" } } as unknown as React.ReactElement;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("sendEmail", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "citas@tudominio.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("calls resend.emails.send() with correct payload", async () => {
    await sendEmail({
      to: "client@example.com",
      subject: "Your appointment is confirmed",
      react: fakeElement,
    });

    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "citas@tudominio.com",
        to: "client@example.com",
        subject: "Your appointment is confirmed",
      })
    );
  });

  it("does NOT throw when Resend throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("Resend API unreachable"));

    await expect(
      sendEmail({
        to: "client@example.com",
        subject: "Test",
        react: fakeElement,
      })
    ).resolves.toBeUndefined();
  });

  it("calls console.error when Resend throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSend.mockRejectedValueOnce(new Error("Resend API unreachable"));

    await sendEmail({
      to: "client@example.com",
      subject: "Test",
      react: fakeElement,
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    consoleSpy.mockRestore();
  });

  it("calls console.error and does not send when RESEND_API_KEY is absent", async () => {
    delete process.env.RESEND_API_KEY;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await sendEmail({
      to: "client@example.com",
      subject: "Test",
      react: fakeElement,
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(mockSend).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
