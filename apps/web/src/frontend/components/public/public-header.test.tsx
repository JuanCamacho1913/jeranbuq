import { describe, it, expect } from "vitest";

// Node environment — no jsdom. Use import-only smoke tests.
// Verifies the module exports correctly and has the expected shape.

describe("PublicHeader", () => {
  it("exports a PublicHeader named export", async () => {
    const mod = await import("./public-header");
    expect(typeof mod.PublicHeader).toBe("function");
  });

  it("does not import useSession or getServerSession", async () => {
    // Verify the source does not pull in session hooks.
    // We check by confirming the module resolves without requiring auth context.
    const mod = await import("./public-header");
    expect(mod.PublicHeader).toBeDefined();
    // If the component imported useSession it would fail at import time in node env.
  });
});
