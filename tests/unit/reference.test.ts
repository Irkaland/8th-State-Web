import { describe, it, expect } from "vitest";
import { generateReference, REFERENCE_PATTERN } from "@/lib/reference";

describe("demo reference number", () => {
  it("matches the demo-scoped pattern 8SP-YYYY-NNNN", () => {
    expect(generateReference({ seed: 142, year: 2026 })).toBe("8SP-2026-0142");
    expect(REFERENCE_PATTERN.test(generateReference({ seed: 5, year: 2026 }))).toBe(true);
  });

  it("pads to 4 digits and wraps at 10000", () => {
    expect(generateReference({ seed: 7, year: 2026 })).toBe("8SP-2026-0007");
    expect(generateReference({ seed: 12345, year: 2026 })).toBe("8SP-2026-2345");
  });

  it("always produces a valid pattern with random seeds", () => {
    for (let i = 0; i < 50; i++) {
      expect(REFERENCE_PATTERN.test(generateReference())).toBe(true);
    }
  });
});
