/**
 * Generate a clearly demo-scoped reference number, e.g. "8SP-2026-0142".
 * Deterministic when `seed`/`year` are provided (used in unit tests).
 * The success screen also states explicitly that submission is a demo.
 */
export function generateReference(opts?: { seed?: number; year?: number }): string {
  const year = opts?.year ?? new Date().getFullYear();
  const seed = opts?.seed ?? Math.floor(Math.random() * 10000);
  const num = String(Math.abs(seed) % 10000).padStart(4, "0");
  return `8SP-${year}-${num}`;
}

export const REFERENCE_PATTERN = /^8SP-\d{4}-\d{4}$/;
