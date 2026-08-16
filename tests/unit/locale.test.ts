import { describe, it, expect } from "vitest";
import {
  localeHref,
  stripLocale,
  localeFromPathname,
  switchLocalePath,
  isLocale,
} from "@/i18n/locales";
import { getMessages } from "@/i18n";

describe("locale route mapping", () => {
  it("keeps EN unprefixed and prefixes KA", () => {
    expect(localeHref("en", "/work")).toBe("/work");
    expect(localeHref("en", "/")).toBe("/");
    expect(localeHref("ka", "/work")).toBe("/ka/work");
    expect(localeHref("ka", "/")).toBe("/ka");
  });

  it("strips the locale prefix back to an app path", () => {
    expect(stripLocale("/ka/work")).toBe("/work");
    expect(stripLocale("/ka")).toBe("/");
    expect(stripLocale("/work")).toBe("/work");
    expect(stripLocale("/")).toBe("/");
  });

  it("strips the proxy's internal /en tree (KA burger 404 regression)", () => {
    // The proxy rewrites unprefixed EN requests to /en/... internally; if
    // that pathname leaks into the language switcher it must never produce
    // /ka/en/... (which resolved to the branded 404).
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/en/work")).toBe("/work");
    expect(switchLocalePath("/en", "ka")).toBe("/ka");
    expect(switchLocalePath("/en/services", "ka")).toBe("/ka/services");
  });

  it("detects the active locale from a pathname", () => {
    expect(localeFromPathname("/ka/work")).toBe("ka");
    expect(localeFromPathname("/work")).toBe("en");
    expect(localeFromPathname("/")).toBe("en");
  });

  it("maps a path to its equivalent in another locale (language switch)", () => {
    expect(switchLocalePath("/work", "ka")).toBe("/ka/work");
    expect(switchLocalePath("/ka/work", "en")).toBe("/work");
    expect(switchLocalePath("/ka/work/aom", "en")).toBe("/work/aom");
    expect(switchLocalePath("/", "ka")).toBe("/ka");
  });

  it("validates locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ka")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("returns distinct EN/KA dictionaries (no duplicated strings)", () => {
    const en = getMessages("en");
    const ka = getMessages("ka");
    expect(en.nav.work).not.toBe(ka.nav.work);
    expect(ka.home.hero.headline).toContain("კადრამდე");
  });
});
