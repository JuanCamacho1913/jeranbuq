import { describe, it, expect } from "vitest";
import { DEFAULT_COUNTRY_CODE, CANCEL_HOURS } from "./business";

describe("business constants", () => {
  it("DEFAULT_COUNTRY_CODE is +57 (Colombia)", () => {
    expect(DEFAULT_COUNTRY_CODE).toBe("+57");
  });

  it("CANCEL_HOURS is 2", () => {
    expect(CANCEL_HOURS).toBe(2);
  });
});
