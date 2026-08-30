import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { readSource } from "./read-source";

/**
 * UI/UX refinement pass - the parts that are decided in FILES rather than in
 * layout, so they are cheaper and more precise to assert here than in a
 * browser: which asset a mark ships as, what the icon actually is, and which
 * declarations carry each fix. The rendered behaviour of the same fixes is
 * covered by tests/e2e/ui-refinement.spec.ts.
 */
const read = (p: string) => readSource(p);
const routes = read("src/app/dao-routes.css");
const dao = read("src/app/dao.css");

/**
 * The body of the FIRST rule whose selector list starts at `selector`.
 * Indentation-tolerant, so a rule nested inside a media query reads the same
 * way as a top-level one; the body ends at the first close brace that returns
 * to the selector's own indent.
 */
function rule(css: string, selector: string): string {
  const at = new RegExp(`^([ \\t]*)${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m").exec(
    css,
  );
  expect(at, `${selector} exists`).not.toBeNull();
  const indent = at![1];
  const open = css.indexOf("{", at!.index);
  const close = css.indexOf(`\n${indent}}`, open);
  expect(close, `${selector} closes`).toBeGreaterThan(open);
  return css.slice(open, close);
}

/** a rule body with its comments removed - these rules carry long rationale */
const decls = (body: string) => body.replace(/\/\*[\s\S]*?\*\//g, "");

/* ------------------------------------------------- 01 the Studio Lab card -- */

describe("01 the Studio Lab card is calmer and a third smaller", () => {
  const card = rule(routes, ".dst__labpanel {");

  it("keeps the tilted-card concept but eases the turn", () => {
    const deg = Number(/transform:\s*rotate\((-?[\d.]+)deg\)/.exec(card)![1]);
    // 23 -> 15 (first pass) -> 7.5 (Studio pass): a card laid on the
    // composition rather than pinned to it, and still never level
    expect(deg).toBeGreaterThan(5);
    expect(deg).toBeLessThan(11);
  });

  it("is about a third smaller, and still landscape", () => {
    const w = /width:\s*clamp\(([\d.]+)px,\s*([\d.]+)vw,\s*([\d.]+)px\)/.exec(card)!;
    // the ramp that actually resolves on a desktop is the vw term: 40 -> 27
    expect(Number(w[2])).toBeGreaterThan(24);
    expect(Number(w[2])).toBeLessThan(30);
    expect(Number(w[3])).toBeLessThan(420);
    expect(card).toContain("aspect-ratio: 1.62");
  });

  it("still crosses the section boundary from above", () => {
    // a NEGATIVE top is what puts the card's upper edge on the paper world
    expect(card).toMatch(/top:\s*clamp\(-\d/);
  });

  it("measures its own contents against the card, not the viewport", () => {
    // this is what makes the type and the botanical shrink WITH the card
    expect(card).toContain("container-type: inline-size");
    expect(rule(routes, ".dst__lablines {")).toContain("cqw");
    expect(rule(routes, ".dst__labstem {")).toContain("cqw");
    expect(rule(routes, ".dst__labpanel-inner {")).toContain("cqw");
  });

  it("does not take the full desktop reduction on a phone", () => {
    const phone = /\.dst__rooms \.dst__labpanel \{([\s\S]*?)\n {2}\}/.exec(routes)![1];
    const px = Number(/width:\s*min\(100%,\s*(\d+)px\)/.exec(phone)![1]);
    // 340 -> 300: moderately smaller. Two thirds of 340 is 227, which is too
    // small for three lines of copy to still be a statement.
    expect(px).toBeGreaterThan(280);
    expect(px).toBeLessThan(330);
    // 12 -> 8 -> 4, halved with the desktop card step for step
    const deg = Number(/transform:\s*rotate\((-?[\d.]+)deg\)/.exec(phone)![1]);
    expect(deg).toBeGreaterThan(2);
    expect(deg).toBeLessThan(6);
  });
});

/* ------------------------------------------------------------ 02 the sun -- */

/**
 * SUPERSEDES "02 the closing sun is sized to fit the band it is clipped by",
 * which required the band to carry a `min-height` large enough for the whole
 * mark. That is exactly what put 390px of empty ink into the closing act; the
 * Studio pass reverses the dependency, so the assertion inverts with it.
 */
describe("02 the closing band is sized by its content, not by the sun", () => {
  it("carries no minimum height of its own", () => {
    // declarations only - these rules carry long rationale comments, and the
    // word "min-height" appears in the one explaining why it is gone
    const band = decls(rule(routes, ".dst__handoff {"));
    expect(band, "still clips, so nothing can lengthen the page").toContain("overflow: clip");
    expect(band, "the graphic must not set the section's height").not.toContain("min-height");
    // and it is back to ordinary flow - no grid centring the statement in a box
    expect(band).not.toContain("align-content");
  });

  it("anchors the sun by its TOP so no upper ray can be sheared", () => {
    const sun = rule(routes, ".dst__handoffsun {");
    // height-first: the old `width: 62vw` never looked at the band at all
    expect(sun).toMatch(/height:\s*clamp\(/);
    expect(sun).toContain("width: auto");
    expect(sun).toContain("bb-sun-symbol.webp");
    // a POSITIVE top inset - the whole point. `top: -60px` was the original
    // defect and `top: 50%` was the version that needed a taller band.
    const top = /top:\s*clamp\((\d+)px/.exec(sun);
    expect(top, "top is a positive clamp").not.toBeNull();
    expect(Number(top![1])).toBeGreaterThan(0);
    expect(sun, "no vertical centring to re-introduce the height dependency").not.toContain(
      "translateY(-50%)",
    );
  });

  it("puts the phone sun behind the statement rather than under it", () => {
    const phone = /\.dst__handoffsun \{([\s\S]*?)\n {2}\}/.exec(
      routes.slice(routes.indexOf("@media (max-width: 720px)")),
    )![1];
    // §Refinement 02 bought the mark its own zone with ~300px of extra lower
    // padding; that dead space is what the Studio pass removes
    expect(phone).not.toContain("bottom:");
    expect(routes).not.toContain("padding-bottom: clamp(300px, 72vw, 420px)");
  });
});

/* ------------------------------------------------- 03 the two dark blacks -- */

describe("03 the dark Studio surfaces are one material", () => {
  it("contains the phone card's collapsing bottom margin", () => {
    const rooms = rule(routes, ".dst__rooms {");
    // `overflow-x: clip` does NOT establish a block formatting context, so the
    // in-flow card's 34px bottom margin collapsed straight through the section
    // and became a band of untextured page ink between the two dark surfaces
    expect(rooms).toContain("overflow-x: clip");
    expect(rooms).toContain("display: flow-root");
  });

  it("gives the card's drop shadow room to finish inside its own section", () => {
    const phone = routes.slice(routes.indexOf("@media (max-width: 720px)"));
    const block = /\n {2}\.dst__rooms \{([\s\S]*?)\n {2}\}/.exec(phone)![1];
    const pad = Number(/padding-bottom:\s*(\d+)px/.exec(block)![1]);
    // 34px of margin + this padding must clear the shadow's ~45px reach, or
    // the next section occludes its tail and redraws the same hard edge
    expect(pad + 34).toBeGreaterThanOrEqual(45);
  });

  it("never states a second black - both sections use the one ink token", () => {
    for (const sel of [".dst__rooms {", ".dst__handoff {"]) {
      expect(rule(routes, sel), sel).toContain("background: var(--dao-ink)");
    }
  });
});

/* ------------------------------------------------- 03/09 the white bird --- */

describe("03/09 the Start a Project swallow", () => {
  it("ships as vector traced from the brandbook, not as an enlarged raster", () => {
    expect(existsSync("public/assets/graphics/swallow.svg")).toBe(true);
    expect(existsSync("public/assets/graphics/swallow.webp")).toBe(false);
    const svg = read("public/assets/graphics/swallow.svg");
    // the outgoing raster's box, kept exactly, so no CSS framing had to move
    expect(svg).toContain('viewBox="0 0 900 994"');
    // white, so it works as a mask under either mask-mode
    expect(svg).toContain('fill="#fff"');
    // two contours: the bird and its eye
    expect(svg.match(/z/g)!.length).toBe(2);
  });

  it("is referenced everywhere the bird is drawn, with no raster left behind", () => {
    for (const f of ["src/app/dao-routes.css", "src/components/dao/StudioIntro.tsx"]) {
      expect(read(f), f).not.toContain("swallow.webp");
    }
    expect(routes).toContain("/assets/graphics/swallow.svg");
  });

  it("is reproducible from the brandbook rather than hand-edited", () => {
    const script = read("scripts/vectorize-swallow.mjs");
    expect(script).toContain("SOURCE_OBJ = 1377");
    // the script refuses to write a file whose shape drifted from the source
    expect(script).toContain("iou < 0.99");
  });
});

/* ------------------------------------------- 04 the three service titles -- */

describe("04 the three major service headings take the display face", () => {
  it("scopes the change to the spread headings only", () => {
    const r = rule(routes, ".dsv__g1names .dsv__name,");
    expect(r).toContain("font-family: var(--dao-f-display)");
    // Adevas ships Regular only - 600 here would be a synthesised bold
    expect(r).toContain("font-weight: 400");
  });

  it("covers group I, group III and group IV, and nothing else", () => {
    const i = routes.indexOf(".dsv__g1names .dsv__name,");
    const head = routes.slice(i, routes.indexOf("{", i));
    expect(head).toContain(".dsv__g3names .dsv__name");
    expect(head).toContain(".dsv__g4 .dsv__name");
    expect(head, "group II keeps strong Optika").not.toContain(".dsv__g2grid");
  });

  it("leaves the shared base rule - and therefore group II - untouched", () => {
    const base = rule(routes, ".dsv__name {");
    expect(base).toContain("font-family: var(--dao-f-ui)");
    expect(base).toContain("font-weight: var(--dao-w-editorial)");
    expect(base).not.toContain("--dao-f-display");
  });
});

/* ------------------------------------------------------- 05 the favicon --- */

describe("05 the favicon is the red brandbook sun", () => {
  const icon = read("src/app/icon.svg");

  it("is the brand red, not the old blue disc with an infinity glyph", () => {
    expect(icon).toContain("#d03e26");
    expect(icon).not.toContain("#4E7CA8");
    expect(icon).not.toContain("∞");
    expect(icon).not.toContain("<text");
    // transparent: a single path on no ground
    expect(icon).not.toContain("<rect");
    expect(icon.match(/<path/g)!.length).toBe(1);
  });

  it("carries the App Router icon set, so nothing points at a stale path", () => {
    expect(existsSync("src/app/icon.svg")).toBe(true);
    expect(existsSync("src/app/apple-icon.png")).toBe(true);
    // the conventions ARE the declaration - a hand-written <link> would be a
    // second source of truth that could go stale
    expect(read("src/app/[locale]/layout.tsx")).not.toContain('rel="icon"');
    expect(existsSync("public/favicon.ico")).toBe(false);
  });

  it("is reproducible from the brandbook mark", () => {
    const script = read("scripts/make-favicon.mjs");
    expect(script).toContain("bb-sun-symbol.webp");
    expect(script).toContain("iou < 0.99");
  });
});

/* ------------------------------------------------- 06 the Lab Work slash -- */

/* REMOVED: "06 the Studio Lab filter separator".
   The Lab field-notes page it belonged to - filter row, LAB WORK link and
   all - is superseded by the approved Studio Lab design, which has neither a
   filter row nor a separator to hide. The Lab's own guards live in
   tests/unit/studio-lab.test.ts. */

/* ------------------------------------------------ 07 the burger menu size - */

describe("07 the long burger labels", () => {
  it("no longer step down in English at all", () => {
    // the ONLY --sm rule left is scoped to the Georgian document
    const hits = [...dao.matchAll(/\.dao-nav__link--sm\s*\{/g)];
    expect(hits.length).toBe(1);
    const i = dao.indexOf(".dao-nav__link--sm");
    expect(dao.slice(i - 120, i)).toContain('html[lang="ka"]');
  });

  it("steps Georgian down by as little as it takes", () => {
    const r = rule(dao, 'html[lang="ka"] .dao-nav__link--sm {');
    const vw = Number(/min\([\d.]+vh,\s*([\d.]+)vw\)/.exec(r)![1]);
    const base = Number(/min\([\d.]+vh,\s*([\d.]+)vw\)/.exec(rule(dao, ".dao-nav__link {"))![1]);
    // it used to be 4.6vw against a 6.2vw base - a quarter smaller
    expect(vw / base).toBeGreaterThan(0.82);
    expect(vw).toBeLessThan(base);
  });

  it("stops carrying START A PROJECT, which fits at the shared size", () => {
    const chrome = read("src/components/dao/DaoChrome.tsx");
    expect((chrome.match(/^\s+small$/gm) || []).length).toBe(1);
  });
});

/* -------------------------------------------- 08 the brief option buttons -- */

describe("08 the Start a Project options are one system", () => {
  it("read from the left edge, wrapped or not", () => {
    // a <button> centres its text by default, which only shows once one wraps
    expect(rule(routes, ".dbr__chip {")).toContain("text-align: left");
  });
});

/* ------------------------------------------------------ 10 the CTA arrow -- */

describe("10 a CTA label and its arrow are one object", () => {
  it("holds ALL SERVICES and its arrow together", () => {
    // the approved What We Make dossier replaced the capability index act, so
    // this contract now sits on the dossier's own foot CTA - the same object,
    // the same requirement, a new class
    const r = rule(dao, ".dao-wwm__all {");
    expect(r).toContain("display: inline-flex");
    // and the foot wraps, so a CTA with no room takes its own line WHOLE
    expect(rule(dao, ".dao-wwm__foot {")).toContain("flex-wrap: wrap");
    // §13: it is also a real touch target
    expect(r).toContain("min-height: 44px");
  });

  it("holds every shared text CTA together, without forcing an overflow", () => {
    const r = rule(routes, ".dao-cta {");
    expect(r).toContain("display: inline-flex");
    // the LABEL may still wrap inside its own flex item - only the arrow is
    // pinned to it - so a long Georgian CTA cannot push the page sideways
    expect(r).not.toContain("white-space: nowrap");
    // on a wrapped label the arrow belongs on the LAST line
    expect(r).toContain("align-items: last baseline");
  });
});
