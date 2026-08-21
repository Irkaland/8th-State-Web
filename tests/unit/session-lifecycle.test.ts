import { describe, expect, it } from "vitest";
import {
  HIDDEN_AT_KEY,
  IDENT_ATTR,
  IDENT_DONE_EVENT,
  NAV_OPEN_KEY,
  RESTART_AFTER_MS,
  readHiddenAt,
  shouldRestartFromIntro,
} from "@/lib/session-lifecycle";

const MIN = 60_000;

describe("shouldRestartFromIntro (§15 long-background resume)", () => {
  const now = 1_700_000_000_000;

  it("never restarts when nothing was ever stamped", () => {
    expect(shouldRestartFromIntro(null, now)).toBe(false);
  });

  it("keeps a short app switch exactly where it was", () => {
    // the cases this must never punish: reading a message, checking a map,
    // taking a call, a screen lock
    for (const gap of [0, 1_000, 30_000, 2 * MIN, 5 * MIN, 20 * MIN]) {
      expect(shouldRestartFromIntro(now - gap, now), `${gap}ms`).toBe(false);
    }
  });

  it("restarts from the intro after a genuinely long absence", () => {
    for (const gap of [30 * MIN, 31 * MIN, 3 * 60 * MIN, 24 * 60 * MIN]) {
      expect(shouldRestartFromIntro(now - gap, now), `${gap}ms`).toBe(true);
    }
  });

  it("treats the threshold itself as a restart, and one tick under as not", () => {
    expect(shouldRestartFromIntro(now - RESTART_AFTER_MS, now)).toBe(true);
    expect(shouldRestartFromIntro(now - RESTART_AFTER_MS + 1, now)).toBe(false);
  });

  it("ignores a stamp from the future (clock skew must not force an intro)", () => {
    expect(shouldRestartFromIntro(now + 60 * MIN, now)).toBe(false);
  });

  it("ignores a garbage stamp rather than restarting on it", () => {
    expect(shouldRestartFromIntro(NaN, now)).toBe(false);
    expect(shouldRestartFromIntro(Infinity, now)).toBe(false);
  });

  it("honours an explicit threshold", () => {
    expect(shouldRestartFromIntro(now - 90_000, now, MIN)).toBe(true);
    expect(shouldRestartFromIntro(now - 30_000, now, MIN)).toBe(false);
  });

  it("sits far above task switching and inside the tab-eviction band", () => {
    expect(RESTART_AFTER_MS).toBeGreaterThan(10 * MIN);
    expect(RESTART_AFTER_MS).toBeLessThanOrEqual(60 * MIN);
  });
});

describe("readHiddenAt", () => {
  const store = (value: string | null) => ({ getItem: () => value });

  it("returns null with no store at all (SSR / private mode)", () => {
    expect(readHiddenAt(null)).toBeNull();
  });

  it("returns null for a missing or unparseable stamp", () => {
    expect(readHiddenAt(store(null))).toBeNull();
    expect(readHiddenAt(store("later"))).toBeNull();
  });

  it("reads a numeric stamp back", () => {
    expect(readHiddenAt(store("1700000000000"))).toBe(1_700_000_000_000);
  });

  it("survives a store that throws on access", () => {
    expect(
      readHiddenAt({
        getItem: () => {
          throw new Error("SecurityError");
        },
      }),
    ).toBeNull();
  });
});

describe("lifecycle keys", () => {
  it("are namespaced so they cannot collide with anything else in storage", () => {
    for (const key of [HIDDEN_AT_KEY, NAV_OPEN_KEY]) {
      expect(key.startsWith("dao:")).toBe(true);
    }
    expect(HIDDEN_AT_KEY).not.toBe(NAV_OPEN_KEY);
  });

  it("expose the ident handshake the Showreel listens on", () => {
    expect(IDENT_ATTR).toBe("data-dao-ident");
    expect(IDENT_DONE_EVENT).toBe("dao:ident-done");
  });
});
