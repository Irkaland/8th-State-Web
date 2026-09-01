import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import en from "@/i18n/messages/en";
import ka from "@/i18n/messages/ka";
import {
  chromeMessages,
  identMessages,
  reelMessages,
  introMessages,
  selectedWorkMessages,
  studioLabMessages,
  contactActMessages,
  workArchiveMessages,
  teamSheetMessages,
  labMessages,
  briefMessages,
} from "@/i18n/slices";
import { readSource } from "./read-source";

/**
 * §P3: the client localization boundary.
 *
 * Two things are worth protecting here, and neither is a snapshot of the
 * dictionary's contents:
 *
 *   1. EN and KA stay structurally identical. TypeScript already enforces this
 *      (`Messages = typeof en`, `const ka: Messages`), but a compiler error is
 *      invisible in a diff review and says nothing about arrays or empty
 *      strings, so the shape is asserted at runtime too.
 *   2. Client components keep receiving SLICES, not the whole dictionary. That
 *      is the regression this phase exists to prevent: it costs nothing to
 *      write `messages={m}` again, and the payload silently triples.
 */

const read = (p: string) => readSource(p);

/** Every leaf path in an object, as dot notation. */
function paths(o: unknown, prefix = ""): string[] {
  if (o === null || typeof o !== "object") return [prefix];
  if (Array.isArray(o)) return [`${prefix}[]`];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
    paths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("§09 EN / KA schema parity", () => {
  it("has identical key paths in both locales", () => {
    const e = paths(en).sort();
    const g = paths(ka).sort();
    const missingInKa = e.filter((p) => !g.includes(p));
    const missingInEn = g.filter((p) => !e.includes(p));
    expect(missingInKa, `missing from ka.ts: ${missingInKa.join(", ")}`).toEqual([]);
    expect(missingInEn, `missing from en.ts: ${missingInEn.join(", ")}`).toEqual([]);
    expect(e.length).toBe(g.length);
  });

  it("keeps array-valued keys as arrays of the same length in both locales", () => {
    const arrays = (o: unknown, p = ""): [string, number][] => {
      if (Array.isArray(o)) return [[p, o.length]];
      if (o === null || typeof o !== "object") return [];
      return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
        arrays(v, p ? `${p}.${k}` : k),
      );
    };
    const e = Object.fromEntries(arrays(en));
    const g = Object.fromEntries(arrays(ka));
    expect(Object.keys(g).sort()).toEqual(Object.keys(e).sort());
    for (const k of Object.keys(e)) expect(g[k], `${k} length`).toBe(e[k]);
  });

  it("has no empty string in either locale", () => {
    const empties = (o: unknown, p = ""): string[] => {
      if (typeof o === "string") return o.trim() === "" ? [p] : [];
      if (o === null || typeof o !== "object") return [];
      return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
        empties(v, p ? `${p}.${k}` : k),
      );
    };
    expect(empties(en)).toEqual([]);
    expect(empties(ka)).toEqual([]);
  });
});

describe("§21 client components receive slices, never the whole dictionary", () => {
  const CLIENT_WITH_SLICE: [string, string][] = [
    ["StudioIdent", "IdentMessages"],
    ["DaoChrome", "ChromeMessages"],
    ["Showreel", "ReelMessages"],
    ["StudioIntro", "IntroMessages"],
    ["SelectedWork", "SelectedWorkMessages"],
    ["StudioLab", "StudioLabMessages"],
    ["ContactAct", "ContactActMessages"],
    ["DaoBrief", "BriefMessages"],
    // StudioLab is server-rendered since the approved Lab redesign; it is
    // listed above because the slice boundary still has to hold for it -
    // LabFieldNotes went with the field-notes page it belonged to.
    ["TeamContactSheet", "TeamSheetMessages"],
    ["WorkArchive", "WorkArchiveMessages"],
  ];

  /**
   * The What We Make dossier replaced the ServicesAct client component. It is a
   * SERVER component - five links, no state, every responsive decision a media
   * query - so it takes the whole dictionary freely (which never crosses the
   * wire) and needs no slice. This asserts that, rather than letting the entry
   * simply disappear from the list above.
   */
  it("WhatWeMake is a server component, so it needs no slice", () => {
    const src = read("src/components/dao/WhatWeMake.tsx");
    expect(src, "WhatWeMake must not be a client component").not.toContain('"use client"');
    expect(src, "a server component may take the full dictionary").toMatch(/messages: Messages/);
  });

  for (const [component, slice] of CLIENT_WITH_SLICE) {
    it(`${component} takes ${slice}`, () => {
      const src = read(`src/components/dao/${component}.tsx`);
      expect(src, `${component} should import its slice type`).toContain(slice);
      // the whole point: no `: Messages` annotation anywhere in a client file
      expect(src, `${component} must not take the full dictionary`).not.toMatch(/:\s*Messages\b/);
    });
  }

  it("no client component anywhere is annotated with the full Messages type", () => {
    const dir = "src/components/dao";
    const offenders: string[] = [];
    for (const f of readdirSync(join(process.cwd(), dir))) {
      if (!f.endsWith(".tsx")) continue;
      const src = read(join(dir, f));
      if (!src.includes('"use client"')) continue;
      if (/:\s*Messages\b/.test(src)) offenders.push(f);
    }
    expect(
      offenders,
      `client components taking the full dictionary: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("the always-present chrome slice stays small", () => {
    // DaoShell renders these two on EVERY route, so they set the floor for the
    // whole site. A regression here is the expensive one.
    const chrome = Buffer.byteLength(JSON.stringify(chromeMessages(ka)), "utf8");
    const ident = Buffer.byteLength(JSON.stringify(identMessages(ka)), "utf8");
    const full = Buffer.byteLength(JSON.stringify(ka), "utf8");
    expect(
      chrome + ident,
      "global slices should be a small fraction of the dictionary",
    ).toBeLessThan(full * 0.1);
  });
});

describe("§05 each slice carries what its component renders, and no more", () => {
  it("chrome carries the burger labels and both switcher announcements", () => {
    const c = chromeMessages(en);
    expect(c.nav.work).toBe(en.dao.nav.work);
    expect(c.nav.catArchive).toBe(en.dao.nav.catArchive);
    expect(c.menu).toBe(en.nav.menu);
    expect(c.primary).toBe(en.nav.primary);
    expect(c.switchToEnglish).toBe(en.common.switchToEnglish);
    expect(c.switchToGeorgian).toBe(en.common.switchToGeorgian);
    // ...and nothing else. Asserted on the SHAPE rather than by substring-probing
    // values: `dao.contact.title1` is the two words "START A", which appear
    // inside the chrome's own legitimate "START A PROJECT", so a value probe
    // reports a leak that is not there.
    expect(Object.keys(c).sort()).toEqual([
      "imagePending",
      "menu",
      "nav",
      "primary",
      "switchToEnglish",
      "switchToGeorgian",
    ]);
    expect(paths(c).sort()).toEqual(paths(chromeMessages(ka)).sort());
  });

  it("carries no unrelated namespace into route slices", () => {
    const cases: [string, unknown, string[]][] = [
      ["ident", identMessages(en), [en.dao.contact.note, en.daoRoutes.team.intro]],
      ["reel", reelMessages(en), [en.dao.lab.copy, en.daoRoutes.brief.intro]],
      ["intro", introMessages(en), [en.dao.contact.note, en.daoRoutes.work.archive]],
      ["selectedWork", selectedWorkMessages(en), [en.dao.services.intro, en.daoRoutes.lab.copy]],
      ["studioLab", studioLabMessages(en), [en.dao.contact.note, en.daoRoutes.team.intro]],
      ["team", teamSheetMessages(en), [en.dao.reel.act, en.daoRoutes.brief.intro]],
      ["workArchive", workArchiveMessages(en), [en.daoRoutes.team.intro, en.dao.lab.copy]],
      ["brief", briefMessages(en), [en.daoRoutes.team.intro, en.dao.services.intro]],
    ];
    for (const [name, slice, forbidden] of cases) {
      const s = JSON.stringify(slice);
      for (const f of forbidden) expect(s, `${name} leaked "${f.slice(0, 30)}"`).not.toContain(f);
    }
  });

  it("carries the cross-namespace strings its components genuinely need", () => {
    expect(contactActMessages(en).city).toBe(en.dao.ident.city);
    expect(contactActMessages(en).contactNav).toBe(en.dao.nav.contact);
    expect(labMessages(en).contentRequired).toBe(en.daoRoutes.contentRequired);
    expect(briefMessages(en).success).toEqual(en.brief.success);
  });

  it("produces the same shape in both locales", () => {
    const pairs: [string, unknown, unknown][] = [
      ["chrome", chromeMessages(en), chromeMessages(ka)],
      ["ident", identMessages(en), identMessages(ka)],
      ["contactAct", contactActMessages(en), contactActMessages(ka)],
      ["lab", labMessages(en), labMessages(ka)],
      ["brief", briefMessages(en), briefMessages(ka)],
      ["team", teamSheetMessages(en), teamSheetMessages(ka)],
    ];
    for (const [name, e, g] of pairs) {
      expect(paths(g).sort(), `${name} shape differs between locales`).toEqual(paths(e).sort());
    }
  });
});

describe("§08 one source of truth", () => {
  it("keeps exactly two dictionary files", () => {
    const files = readdirSync(join(process.cwd(), "src/i18n/messages")).sort();
    expect(files).toEqual(["en.ts", "ka.ts"]);
  });

  it("defines every slice by deriving from Messages, never by restating copy", () => {
    const src = read("src/i18n/slices.ts");
    // types are derived, so a key that does not exist in both locales cannot compile
    expect(src).toContain('import type { Messages } from "./messages/en"');
    expect(src).toMatch(/Messages\["dao"\]/);

    // The boundary module SELECTS strings; it must never author them. Checked by
    // asking whether any real dictionary value appears in the file's CODE - the
    // comments legitimately name things like the Studio Ident, and a check that
    // cannot tell prose from a literal would flag its own documentation.
    const code = src
      .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
      .replace(/^\s*\/\/.*$/gm, ""); // line comments
    const values = (o: unknown): string[] =>
      typeof o === "string"
        ? [o]
        : o && typeof o === "object"
          ? Object.values(o as Record<string, unknown>).flatMap(values)
          : [];
    // compared against the file's own STRING LITERALS - a raw substring search
    // matches identifiers too ("Services" is both a dictionary value and part of
    // `ServicesActMessages`), which is a false positive, not a restated string.
    const literals = new Set(
      [...code.matchAll(/(['"])((?:(?!\1)[^\\]|\\.)*)\1/g)].map((m) => m[2]),
    );
    const dictValues = new Set([...values(en), ...values(ka)].map((v) => v.trim()));
    const restated = [...literals].filter((l) => l.trim().length >= 4 && dictValues.has(l.trim()));
    expect(restated, `slices.ts restates copy: ${restated.slice(0, 3).join(" | ")}`).toEqual([]);
  });
});
