import { describe, expect, it } from "vitest";
import ka from "@/i18n/messages/ka";
import en from "@/i18n/messages/en";
import { readSource } from "./read-source";

/**
 * §P4: the Georgian typography architecture.
 *
 * The measured situation this file protects, read out of the woff2 tables
 * rather than assumed from the file names:
 *
 *   Adevas Regular   400 only, 233 codepoints, no Georgian
 *   Optika           400 / 500 / 600 as three real files, no Georgian
 *   Glacier Regular  400 only, 221 codepoints, no Georgian
 *   ALK Sanet        400 only, 128 codepoints - every one of the 32 Mkhedruli
 *                    letters the site uses, and no typographic punctuation
 *
 * Two consequences, and they are the two regressions worth catching early:
 *
 *   1. Georgian has ONE real weight. Asking a 400-only file for 600 does not
 *      produce a bolder brand face, it produces the rasterizer's impression of
 *      one, so the synthesis guard has to stay.
 *   2. Any stack that can receive Georgian text needs a Georgian face IN it.
 *      A stack ending in bare `sans-serif` hands Georgian to whatever the
 *      operating system happens to ship, which is a different typeface on
 *      every platform.
 *
 * These are asserted against the stylesheet source, because the tokens are the
 * architecture; how a given component consumes them is the browser test's job.
 */

const read = (p: string) => readSource(p);
const dao = read("src/app/dao.css");
const layout = read("src/app/[locale]/layout.tsx");

/** the declaration body of a custom property defined in dao.css */
const token = (name: string) => {
  const m = dao.match(new RegExp(`^\\s*${name.replace(/[-]/g, "\\-")}:\\s*([^;]+);`, "m"));
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
};

describe("§P4 Georgian stacks always contain a Georgian face", () => {
  const GEORGIAN_STACKS = [
    "--dao-f-ka",
    "--dao-f-ka-display",
    "--dao-f-ka-editorial",
    "--dao-f-ka-copy",
    // not a Georgian role by name, but it carries translated labels - the Lab
    // filters and the Studio slate values - so Georgian reaches it
    "--dao-f-numeral",
  ];

  for (const name of GEORGIAN_STACKS) {
    it(`${name} can render Georgian without leaving the brand`, () => {
      const value = token(name);
      expect(value, `${name} is not defined in dao.css`).toBeTruthy();
      expect(value, `${name} has no Georgian face`).toContain("--f-sanet");
    });
  }

  it("the Latin-only roles are deliberately NOT given a Georgian face", () => {
    // --dao-f-latin exists precisely so a Latin wordmark renders the same in
    // both locales; adding a Georgian face to it would defeat that.
    expect(token("--dao-f-latin")).toBe("var(--f-optika), sans-serif");
  });
});

describe("§P4 no synthesized Georgian weight", () => {
  it("suppresses weight synthesis for Georgian text", () => {
    expect(dao, "the :lang(ka) synthesis guard is missing").toMatch(
      /:lang\(ka\)\s*\{[^}]*font-synthesis-weight:\s*none/,
    );
  });

  it("scopes the guard to :lang(ka), not to the Georgian document alone", () => {
    // html[lang="ka"] would miss the burger's Georgian companion spans, which
    // sit inside an English document.
    const guard = dao.match(/(html\[lang="ka"\]|:lang\(ka\))\s*\{[^}]*font-synthesis-weight/);
    expect(guard?.[1]).toBe(":lang(ka)");
  });

  it("leaves the shared weight tokens alone so Latin keeps its real weights", () => {
    // --dao-w-editorial is consumed by --dao-f-latin rules too, and Optika has
    // genuine 500 and 600 files. Flattening the token would strip the real
    // weight off Latin on a Georgian page.
    expect(token("--dao-w-editorial")).toBe("600");
    expect(token("--dao-w-copy")).toBe("500");
    expect(dao).not.toMatch(/html\[lang="ka"\]\s*\{[^}]*--dao-w-/);
  });
});

describe("§P4 the font files are declared as what they contain", () => {
  it("declares 400 for each single-style face", () => {
    for (const family of ["Adevas-Regular", "Glacier-Regular", "ALK-Sanet-Regular"]) {
      const decl = layout.match(
        new RegExp(`src: "[^"]*${family}\\.woff2",\\s*\\n\\s*weight: "(\\d+)"`),
      );
      expect(decl?.[1], `${family} does not declare its weight`).toBe("400");
    }
  });

  it("keeps Optika's three real weights", () => {
    for (const w of ["400", "500", "600"]) {
      expect(layout).toMatch(new RegExp(`Optika-[A-Za-z]+\\.woff2",\\s*weight: "${w}"`));
    }
  });

  it("lets the Georgian stack own its own fallback", () => {
    // next/font otherwise inserts a metric-adjusted local("Arial") face right
    // after `sanet`, which intercepts every character ALK Sanet lacks before
    // the rest of the stack is consulted.
    expect(layout).toMatch(/ALK-Sanet-Regular\.woff2[\s\S]{0,220}adjustFontFallback: false/);
  });
});

describe("§P4 the role utilities stay, and state Georgian's real weight", () => {
  // Unused by components today, but they are the documented role map and the
  // place a component is meant to pick a role from. §09: not to be removed.
  for (const role of ["display", "editorial", "copy", "nav"]) {
    it(`.dao-t-${role} and its Georgian resolution exist`, () => {
      expect(dao).toContain(`.dao-t-${role} {`);
      expect(dao).toContain(`.dao-t-${role}:lang(ka) {`);
    });
  }

  it("the Georgian editorial and copy roles ask for 400, the weight that exists", () => {
    for (const role of ["editorial", "copy"]) {
      const block = dao.match(new RegExp(`\\.dao-t-${role}:lang\\(ka\\) \\{([^}]*)\\}`));
      expect(block?.[1], `.dao-t-${role}:lang(ka)`).toMatch(/font-weight:\s*400/);
    }
  });
});

describe("§P4 the Georgian copy stays inside what the stack can render", () => {
  const strings = (o: unknown): string[] =>
    typeof o === "string"
      ? [o]
      : o && typeof o === "object"
        ? Object.values(o).flatMap(strings)
        : [];

  /**
   * ALK Sanet holds the 32 Mkhedruli letters the site uses and nothing else of
   * consequence; Optika, next in every Georgian stack, holds the Latin and the
   * typographic punctuation. What must not appear is a character neither can
   * render, because that is the one that reaches a system font.
   */
  const SANET_MKHEDRULI = /[ა-ჰ]/;
  const OPTIKA_COVERED = /[ -~ -ÿ–—‘-„…→]/;
  const KNOWN_UNCOVERED = new Set(["№", "✓", "※"]);

  it("every character in the Georgian dictionary has a brand face that can render it", () => {
    const chars = new Set(strings(ka).join(""));
    const orphans = [...chars].filter(
      (c) =>
        !/\s/.test(c) &&
        !SANET_MKHEDRULI.test(c) &&
        !OPTIKA_COVERED.test(c) &&
        !KNOWN_UNCOVERED.has(c),
    );
    expect(
      orphans,
      `no brand face covers: ${orphans.map((c) => `${c} U+${c.codePointAt(0)!.toString(16)}`).join(", ")}`,
    ).toEqual([]);
  });

  it("uses no archaic Mkhedruli letter, which ALK Sanet does not contain", () => {
    // U+10F1-U+10FA are the ten archaic letters missing from the file.
    const archaic = [...new Set(strings(ka).join(""))].filter((c) => /[ჱ-ჺ]/.test(c));
    expect(archaic).toEqual([]);
  });

  it("the same holds for the Georgian that appears inside the English dictionary", () => {
    // the burger's Georgian companion labels live in en.ts and render on EN pages
    const chars = new Set(strings(en).join("").match(/[Ⴀ-ჿ]/g) ?? []);
    expect(chars.size, "en.ts should carry the Georgian companion labels").toBeGreaterThan(0);
    const orphans = [...chars].filter((c) => !SANET_MKHEDRULI.test(c));
    expect(orphans).toEqual([]);
  });
});
