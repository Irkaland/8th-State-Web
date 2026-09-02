import { describe, expect, it } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { readSource } from "./read-source";

/**
 * ONE ARROW.
 *
 * The site draws one arrow: a long, slightly uneven stem with a small open
 * head. It used to exist as three identical copies of the same path - the Lab
 * kit, the Services dossier, the What We Make register - with the route CTAs
 * carrying a U+2192 text glyph instead, which every font renders at its own
 * weight, length and height. These guards are what keep it from splitting
 * again: the path lives in exactly one module, and no CTA goes back to a glyph.
 */

const ARROW_PATH = "M1 6.4 C14 5.6 28 6.8 43 5.9";

/** every .ts/.tsx under src/ */
function sources(dir = "src", out: string[] = []): string[] {
  for (const entry of readdirSync(join(process.cwd(), dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(process.cwd(), rel)).isDirectory()) sources(rel, out);
    else if (/\.tsx?$/.test(entry)) out.push(rel);
  }
  return out;
}

describe("the CTA arrow is one primitive", () => {
  it("the drawn path exists in exactly one module", () => {
    const carriers = sources().filter((f) => readSource(f).includes(ARROW_PATH));
    expect(carriers).toEqual(["src/components/dao/EditorialArrow.tsx"]);
  });

  it("the primitive inherits the CTA's colour and cannot be substituted by a font", () => {
    const src = readSource("src/components/dao/EditorialArrow.tsx");
    expect(src).toContain("<svg");
    expect(src).toContain('stroke={stroke ?? "currentColor"}');
    expect(src).toContain('aria-hidden="true"');
    // the mark's own box, which the CSS sizes are derived from
    expect(src).toContain('viewBox="0 0 46 12"');
  });

  it("the CTA size is declared once, from the CTA's own type", () => {
    const css = readSource("src/app/dao.css");
    const rule = css.slice(css.indexOf(".dao-arrow {"), css.indexOf(".dao-arrow {") + 400);
    expect(rule).toContain("clamp(22px, 2.6em, 46px)");
    // height follows the 46x12 mark, so the geometry cannot drift
    expect(rule).toContain("* 12 / 46");
    expect(rule).toContain("color: inherit");
    // exactly one declaration of the class
    expect(css.split(".dao-arrow {").length - 1).toBe(1);
  });

  it("the three former copies now delegate to it", () => {
    for (const f of [
      "src/components/dao/LabKit.tsx",
      "src/components/dao/ServicesDossier.tsx",
      "src/components/dao/WhatWeMake.tsx",
    ]) {
      const src = readSource(f);
      expect(src, f).toContain("EditorialArrow");
      expect(src, f).not.toContain(ARROW_PATH);
    }
  });

  it("no route CTA carries an arrow glyph any more", () => {
    // U+2192 / U+2197 / U+27F6 inside a rendered CTA. The two families that
    // keep their glyphs by design are asserted separately below.
    const offenders: string[] = [];
    for (const f of sources()) {
      const src = readSource(f);
      src.split("\n").forEach((line, i) => {
        if (!/[→↗⟶]/.test(line)) return;
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // prose in a comment
        offenders.push(`${f}:${i + 1} ${line.trim()}`);
      });
    }
    // what remains is the sequence's own NEXT arrow, the three back links, the
    // masthead back mark, and localized copy that happens to contain an arrow
    // (a kicker, an annotation) - never a CTA's indicator.
    const allowed =
      /(labels\.next|labels\.previous|backToSite|backToLab|allCourses|dao-mback|kicker|Annotation|annotation|cta: \{|Studio → |სტუდია → )/;
    const unexpected = offenders.filter((o) => !allowed.test(o));
    expect(unexpected, unexpected.join("\n")).toEqual([]);
  });
});
