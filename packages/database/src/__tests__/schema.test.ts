import { describe, it, expect } from "vitest";
import { prisma } from "../index";

describe("Prisma schema — new models from migration", () => {
  it("prisma client exposes the service model delegate", () => {
    expect(prisma.service).toBeDefined();
  });

  it("prisma client exposes the adminAvailability model delegate", () => {
    expect(prisma.adminAvailability).toBeDefined();
  });

  it("prisma client exposes the timeBlock model delegate", () => {
    expect(prisma.timeBlock).toBeDefined();
  });
});
