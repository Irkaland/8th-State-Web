import { describe, it, expect, beforeEach } from "vitest";
import { saveDraft, loadDraft, clearDraft, isDraftValid, DRAFT_TTL_MS } from "@/lib/draft";
import { briefDefaults } from "@/lib/brief-schema";

const values = { ...briefDefaults, fullName: "Nino", email: "nino@aom.ge" };

describe("draft storage", () => {
  beforeEach(() => clearDraft());

  it("saves and loads a draft within TTL", () => {
    const now = 1_000_000;
    saveDraft(values, now);
    expect(loadDraft(now + 1000)?.fullName).toBe("Nino");
  });

  it("expires a draft after the TTL", () => {
    const now = 1_000_000;
    saveDraft(values, now);
    expect(loadDraft(now + DRAFT_TTL_MS + 1)).toBeNull();
  });

  it("clears a draft", () => {
    saveDraft(values);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("does not persist file bytes (only metadata)", () => {
    const withFiles = { ...values, files: [{ name: "a.pdf", size: 1024 }] };
    saveDraft(withFiles, 1);
    const raw = window.localStorage.getItem("8sp-brief-draft-v1")!;
    expect(raw).toContain("a.pdf");
    expect(raw).not.toMatch(/bytes|blob|data:/i);
  });

  it("isDraftValid rejects expired/invalid envelopes", () => {
    expect(isDraftValid({ expiresAt: 10, values: {} }, 5)).toBe(true);
    expect(isDraftValid({ expiresAt: 10, values: {} }, 20)).toBe(false);
    expect(isDraftValid(null, 5)).toBe(false);
    expect(isDraftValid({ nope: true }, 5)).toBe(false);
  });
});
