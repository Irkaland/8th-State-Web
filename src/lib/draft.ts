import type { BriefValues } from "./brief-schema";

// Time-limited local draft storage for the project brief.
// Stores form values only (no file bytes) with an expiry timestamp.
const KEY = "8sp-brief-draft-v1";
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type DraftEnvelope = {
  savedAt: number;
  expiresAt: number;
  values: BriefValues;
};

export function saveDraft(values: BriefValues, now: number = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    // Never persist file bytes - only name/size metadata is kept in `values.files`.
    const envelope: DraftEnvelope = { savedAt: now, expiresAt: now + DRAFT_TTL_MS, values };
    window.localStorage.setItem(KEY, JSON.stringify(envelope));
  } catch {
    /* storage unavailable / quota - non-fatal for a demo */
  }
}

/** Load a draft if present and not expired/invalid. Clears invalid or expired drafts. */
export function loadDraft(now: number = Date.now()): BriefValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftEnvelope>;
    if (
      !parsed ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.values !== "object" ||
      parsed.values === null
    ) {
      clearDraft();
      return null;
    }
    if (now > parsed.expiresAt) {
      clearDraft();
      return null;
    }
    return parsed.values as BriefValues;
  } catch {
    clearDraft();
    return null;
  }
}

/** Pure helper (testable without a DOM) to decide if an envelope is still valid. */
export function isDraftValid(envelope: unknown, now: number = Date.now()): boolean {
  if (typeof envelope !== "object" || envelope === null) return false;
  const e = envelope as Partial<DraftEnvelope>;
  return (
    typeof e.expiresAt === "number" &&
    e.expiresAt >= now &&
    typeof e.values === "object" &&
    e.values !== null
  );
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* non-fatal */
  }
}

export const DRAFT_KEY = KEY;
