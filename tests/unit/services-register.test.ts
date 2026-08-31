import { describe, expect, it } from "vitest";
import { DEPARTMENTS, SERVICES_COPY, SYSTEM_ROUTES } from "@/content/services-departments";
import { WHAT_WE_MAKE } from "@/content/what-we-make";
import { readSource } from "./read-source";

/**
 * THE SERVICES DOSSIER, AFTER THE REGISTER PASS.
 *
 * Four things changed on /services and each of them can be undone by a single
 * careless edit, so each is held here rather than left to a screenshot:
 *
 *   1  the department register moved onto the brand red, on the site's own
 *      paper stock, and its five department colours have to stay visible and
 *      distinguishable on that ground;
 *   2  the register's names, its capability descriptors, the closing copy and
 *      the whole production-line section left the display face - it is
 *      reserved for genuine headlines now;
 *   3  the production line prints DEPARTMENTS and WORKFLOW STAGES as two
 *      different ranks, and a department step carries no writable label at
 *      all, which is what makes `05 IDENTITY` impossible rather than merely
 *      discouraged;
 *   4  the light surfaces are printed on the existing paper grain, reusing the
 *      site's own utility rather than introducing a second texture.
 *
 * The measurement helpers below are the same WCAG ones services-palette.test.ts
 * uses, and for the same reason: the contrast floors on a FIXED brand ground
 * are a design constraint that has to be re-derived, not asserted from memory.
 */

const CSS = readSource("src/app/dao-routes.css");
const DOSSIER = readSource("src/components/dao/ServicesDossier.tsx");
const CONTENT = readSource("src/content/services-departments.ts");

/** relative luminance, WCAG */
function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/** HSV saturation - how far from neutral a colour is */
function sat(hex: string): number {
  const [r, g, b] = rgb(hex) as [number, number, number];
  const mx = Math.max(r, g, b);
  return mx === 0 ? 0 : (mx - Math.min(r, g, b)) / mx;
}

/** the shorter way round the hue circle, in degrees; 0 for a neutral */
function hueGap(a: string, b: string): number {
  const angle = (hex: string): number | null => {
    const [r, g, b2] = rgb(hex) as [number, number, number];
    const mx = Math.max(r, g, b2);
    const d = mx - Math.min(r, g, b2);
    if (d === 0) return null;
    const h = mx === r ? ((g - b2) / d) % 6 : mx === g ? (b2 - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  const x = angle(a);
  const y = angle(b);
  if (x === null || y === null) return 0;
  const raw = Math.abs(x - y);
  return Math.min(raw, 360 - raw);
}

/** the rule body for a single selector, so an assertion cannot match a neighbour */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = CSS.match(new RegExp(`${escaped} \\{[\\s\\S]*?\\n\\}`));
  expect(m, `no rule for ${selector}`).toBeTruthy();
  return m![0];
}

/** the mandated Department Register ground */
const REGISTER_RED = "#d03e26";

/**
 * What the register actually paints for a department: its own accent, or the
 * red-ground pick where its accent could not carry that ground. Every
 * visibility and distinctness assertion below measures THIS, not the accent,
 * because this is the colour a reader sees.
 */
const ink = (d: (typeof DEPARTMENTS)[number]) => d.onRed ?? d.service.accent;

describe("1 · the department register, on the brand red", () => {
  it("is drawn on the mandated red, as printed paper rather than a flat block", () => {
    const r = rule(".dsvc__index");
    expect(r).toContain("background: var(--dao-red)");
    // isolation is what keeps the grain's multiply dyeing the RED rather than
    // reaching through to the paper the register sits on
    expect(r).toContain("isolation: isolate");
    expect(DOSSIER).toMatch(
      /className="dsvc__index"[\s\S]{0,160}dao-grain--strong[\s\S]{0,120}dao-weave/,
    );
  });

  it("takes its five colours from the homepage accents", () => {
    expect(DEPARTMENTS).toHaveLength(5);
    for (const d of DEPARTMENTS) {
      const preview = WHAT_WE_MAKE.find((s) => s.id === d.service.id)!;
      expect(d.service.accent, d.n).toBe(preview.accent);
    }
    // the join, not a second hand-copied hex list: this is what stops a
    // department having one colour on the homepage and another here
    expect(DOSSIER).toContain("d.onRed ?? d.service.accent");
    expect(CONTENT, "a second colour field came back").not.toMatch(/^\s*(registerColor|swatch):/m);
  });

  it("re-picks an accent for the red ground only where the red cannot carry it", () => {
    // The one documented exception, and NOT a free-for-all: a red-ground pick
    // has to stay inside its own accent's hue. It is the same department in the
    // same colour family, moved only as far as the ground requires - anything
    // else would be a second colour identity, which is precisely what reading
    // service.accent exists to prevent.
    const overridden = DEPARTMENTS.filter((d) => d.onRed);
    expect(
      overridden.map((d) => d.n),
      "only 02 needs a red-ground pick",
    ).toEqual(["02"]);
    for (const d of overridden) {
      expect(hueGap(d.onRed!, d.service.accent), `${d.n} left its own hue`).toBeLessThanOrEqual(2);
      // and it has to actually FIX something: a variant that reads no better
      // than the accent it replaces is just a different colour
      expect(
        contrast(d.onRed!, REGISTER_RED),
        `${d.n} ${d.onRed} is no more readable than ${d.service.accent}`,
      ).toBeGreaterThan(contrast(d.service.accent, REGISTER_RED) + 0.5);
    }
    // and it is a named brand token, not a hex invented at the call site
    expect(readSource("src/app/dao.css")).toMatch(/--dao-gold-lift:\s*#ffd16b/);
    expect(CONTENT).toContain('"#ffd16b"');
  });

  it("leaves the homepage's own gold alone", () => {
    // the red-ground pick is scoped to this register. 02 is drawn on the BLUE
    // ground on the homepage, where gold was deliberately chosen and measures
    // fine - see dao-services.ts. Lifting it there would change a page this
    // pass has no business touching.
    expect(WHAT_WE_MAKE.find((s) => s.id === "production-design")!.accent).toBe("#f0ab11");
  });

  it("gives the number and the square ONE colour per department", () => {
    // --n is set once, on the row, and both marks read it - they cannot be
    // given two different colours by editing one declaration
    expect(rule(".dsvc__swatch")).toContain("background: var(--n)");
    expect(rule(".dsvc__rown")).toContain("color: var(--n)");
    expect(CSS).not.toContain("--swatch");
  });

  it("uses five DIFFERENT colours, none of them the ground", () => {
    const used = DEPARTMENTS.map((d) => ink(d).toLowerCase());
    expect(new Set(used).size).toBe(5);
    for (const c of used) expect(c).not.toBe(REGISTER_RED);
  });

  it("keeps all five visible against #d03e26", () => {
    // The same kind of measured floor, and the same reasoning, as the §05
    // group labels on the blue ground (see services-palette.test.ts). The
    // ground is a FIXED brand hex at mid luminance, and measured against it
    // the whole palette falls into two groups:
    //
    //   in    yellow 4.41 · black 4.40 · paper 4.09 · ink 3.92 · gold-lift
    //         3.32 · mint 2.75 · gold 2.40
    //   out   green 1.91 · brown 1.88 · ident-green 1.55 · orange 1.42 ·
    //         green-ink 1.38 · blue 1.04
    //
    // 2.70 is set just under the weakest colour the register actually paints
    // (mint, 2.75), so the bar has teeth: it rejects every other brand colour,
    // the next of which lands at 1.91, AND it rejects plain gold at 2.40 -
    // which is the regression this floor exists to catch, since gold sinking
    // into this red is what the red-ground pick above was added to fix. The
    // rendered red is darker than the token besides, because the paper grain
    // multiplies into it, so the real ratios are a little better than these.
    for (const d of DEPARTMENTS) {
      expect(contrast(ink(d), REGISTER_RED), `${d.n} ${ink(d)}`).toBeGreaterThanOrEqual(2.7);
    }
  });

  it("keeps every pair of departments apart on at least one axis", () => {
    // Luminance alone is the wrong test here, and deliberately not what is
    // asked. services-palette.test.ts measures 3px STROKES, where hue barely
    // registers; these marks are a filled 14px square and a letterspaced
    // numeral, which carry hue and saturation perfectly well. Two of the pairs
    // are near-identical in lightness and unmistakable in person:
    //
    //   02 gold-lift vs 03 mint    lum 1.21  but 131 deg of hue apart
    //   01 yellow    vs 04 paper   lum 1.08  but one is warm at 0.33
    //                                        saturation, the other neutral at
    //                                        0.06
    //
    // The second is the closest pair in the run - it is why the thresholds
    // below are set where they are, and it is as far apart as the fixed brand
    // palette can put two colours that both have to stay visible on this red.
    const fail: string[] = [];
    for (let i = 0; i < DEPARTMENTS.length; i += 1) {
      for (let j = i + 1; j < DEPARTMENTS.length; j += 1) {
        const a = DEPARTMENTS[i]!;
        const b = DEPARTMENTS[j]!;
        const ok =
          contrast(ink(a), ink(b)) >= 1.25 ||
          hueGap(ink(a), ink(b)) >= 25 ||
          Math.abs(sat(ink(a)) - sat(ink(b))) >= 0.25;
        if (!ok) fail.push(`${a.n} ${ink(a)} vs ${b.n} ${ink(b)}`);
      }
    }
    expect(fail, fail.join(", ")).toEqual([]);
  });

  it("carries the register's small text at AA on the red", () => {
    // §14 already established that the off-white brand paper cannot hold small
    // text on this red (4.09:1) and that pure white can (4.77:1) - the red
    // button label takes the same exception.
    expect(contrast("#ffffff", REGISTER_RED)).toBeGreaterThanOrEqual(4.5);
    expect(rule(".dsvc__rowtag")).toContain("color: #fff");
    expect(rule(".dsvc__indexhead")).toContain("color: #fff");
  });

  it("prints CONTENTS - 01-05 in black, still as a small functional label", () => {
    expect(rule(".dsvc__indexcontents")).toContain("color: var(--dao-black)");
    // it must not have grown into something that competes with the names
    const head = rule(".dsvc__indexhead");
    expect(head).toContain("font-size: 10px");
    const name = rule(".dsvc__rowname");
    expect(name).toContain("clamp(15px, 1.55vw, 23px)");
  });

  it("drops the arrow that used to follow each descriptor", () => {
    // an arrow after a capability run reads as "and then", which is the
    // process logic this column deliberately no longer carries
    expect(CSS).not.toContain("dsvc__rowarrow");
    expect(DOSSIER).not.toContain("dsvc__rowarrow");
  });
});

describe("2 · one information logic in the descriptor column", () => {
  it("prints a capability run for every department, and nothing else", () => {
    const tags = DEPARTMENTS.map((d) => d.tag.en);
    expect(tags).toEqual([
      "FILM · COMMERCIAL · CONTENT · POST",
      "WORLD · SPACE · OBJECT · CHARACTER",
      "CAMPAIGN · EDITORIAL · PRODUCT · PORTRAIT",
      "CONCEPT · CAMPAIGN · IMAGE · WORLD",
      "IDENTITY · TYPE · MOTION · BROADCAST",
    ]);
    for (const tag of tags) {
      // four capabilities, one separator, no process arrow, no sentence
      expect(tag.split(" · "), tag).toHaveLength(4);
      expect(tag, `${tag} is a process, not a capability run`).not.toMatch(/→|->/);
    }
  });

  it("leaves the five official department names untouched", () => {
    expect(DEPARTMENTS.map((d) => d.service.name.en)).toEqual([
      "Audiovisual Production",
      "Production Design",
      "Photography",
      "Creative & Art Direction",
      "Graphic & Broadcast Design",
    ]);
  });
});

describe("3 · the production line separates departments from workflow stages", () => {
  const ANCHORS = new Set(DEPARTMENTS.map((d) => d.anchor));

  it("keeps the section, and the four published route categories", () => {
    expect(DOSSIER).toContain("dsvc__map");
    expect(SYSTEM_ROUTES.map((r) => r.key.en)).toEqual(["COMMERCIAL", "CAMPAIGN", "FILM", "BRAND"]);
  });

  it("names every department step by ANCHOR, never by a hand-written label", () => {
    // a department step carries no text at all, so its printed label is always
    // the department's own - which is what makes renaming one in passing
    // impossible rather than merely discouraged
    for (const r of SYSTEM_ROUTES) {
      for (const s of r.steps) {
        if (s.kind !== "dept") continue;
        expect(ANCHORS.has(s.anchor), `${r.key.en}: ${s.anchor}`).toBe(true);
        expect(Object.keys(s).sort()).toEqual(["anchor", "kind"]);
      }
    }
  });

  it("invents no sixth department - a stage is a stage, and is never numbered", () => {
    const stages = SYSTEM_ROUTES.flatMap((r) =>
      r.steps.filter((s) => s.kind === "stage").map((s) => (s as { label: { en: string } }).label),
    ).map((l) => l.en);
    expect(new Set(stages)).toEqual(new Set(["SHOOT", "POST"]));
    for (const label of stages) expect(label, `${label} is numbered`).not.toMatch(/\d/);
  });

  it("never renames department 05", () => {
    const printed = JSON.stringify(SYSTEM_ROUTES);
    for (const wrong of ["05 IDENTITY", "IDENTITY →", "CAMPAIGN ASSETS", "TITLES & KEY ART"]) {
      expect(printed, `${wrong} came back`).not.toContain(wrong);
    }
  });

  it("gives every route a one-line outcome, so the category reads in seconds", () => {
    for (const r of SYSTEM_ROUTES) {
      expect(r.outcome.en.length, r.key.en).toBeGreaterThan(20);
      expect(r.outcome.en.length, r.key.en).toBeLessThan(70);
    }
  });

  it("draws the two ranks differently, and links only the departments", () => {
    // the department name is the emphasised rank...
    expect(rule(".dsvc__nodename")).toContain("var(--dao-w-editorial)");
    // ...and the stage is smaller, quieter and bracketed
    const stage = rule(".dsvc__stage");
    expect(stage).toContain("var(--dao-f-numeral)");
    expect(stage).toMatch(/color: rgba\(19, 18, 16, 0\.4\d?\)/);
    expect(CSS).toMatch(/\.dsvc__stage::before \{\s*content: "\["/);
    expect(DOSSIER).toContain('<span className="dsvc__stage">');
    expect(DOSSIER).toContain('className="dsvc__node"');
  });

  it("says which rank is which, in one printed key rather than a legend widget", () => {
    expect(SERVICES_COPY.mapKeyDept.en).toBe("NUMBERED - DEPARTMENT");
    expect(SERVICES_COPY.mapKeyStage.en).toBe("UNNUMBERED - WORKFLOW STAGE");
    expect(DOSSIER).toContain("dsvc__mapkey");
    // Each definition is atomic, so the key can only ever wrap BETWEEN the
    // two. As one run it broke after "UNNUMBERED -" on a phone, dangling a
    // dash and splitting a definition across two lines; non-breaking spaces
    // do not prevent that, because the hyphen is a break opportunity in its
    // own right.
    expect(rule(".dsvc__mapkey > span")).toContain("white-space: nowrap");
  });
});

describe("4 · the display face is reserved for genuine headlines", () => {
  it("sets the five register names in the functional face", () => {
    const r = rule(".dsvc__rowname");
    expect(r).toContain("font-family: var(--dao-f-ui)");
    expect(r).toContain("font-weight: var(--dao-w-editorial)");
    expect(r).not.toContain("--dao-f-display");
  });

  it("sets the closing explanatory copy in the functional face", () => {
    const r = rule(".dsvc__closecopy");
    expect(r).toContain("font-family: var(--dao-f-ui)");
    expect(r).not.toContain("--dao-f-display");
  });

  it("uses the display face nowhere in the production line section", () => {
    const from = CSS.indexOf("/* ---------- system map");
    const to = CSS.indexOf("/* ---------- closing");
    expect(from, "the system map section moved").toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    expect(CSS.slice(from, to)).not.toContain("--dao-f-display");
  });

  it("still reserves the display face for the page title and the chapter titles", () => {
    expect(rule(".dsvc__title")).toContain("font-family: var(--dao-f-display)");
    expect(rule(".dsvc__chaptertitle")).toContain("font-family: var(--dao-f-display)");
  });
});

describe("5 · the light surfaces are printed on the site's own paper stock", () => {
  it("reuses the existing grain utility and introduces no second texture", () => {
    expect((DOSSIER.match(/dao-grain--strong/g) || []).length).toBeGreaterThanOrEqual(4);
    expect(DOSSIER, "a texture was drawn locally").not.toMatch(/url\(|background-image/);
  });

  it("puts the grain on the surfaces that can actually show it", () => {
    // it used to sit on .dsvc, where every section's own opaque background
    // painted straight over it - which is why the light areas read as flat
    for (const host of ["dsvc__open", "dsvc__index", "dsvc__map"]) {
      const at = DOSSIER.indexOf(`"${host}"`);
      expect(at, host).toBeGreaterThan(-1);
      expect(DOSSIER.slice(at, at + 400), `${host} has no grain`).toContain("dao-grain--strong");
    }
    // and the paper chapters, which are light Services surfaces too
    expect(DOSSIER).toContain('d.surface === "paper" ? <div className="dao-grain--strong"');
  });

  it("prints it across the chrome clearance, so the stock has no seam", () => {
    // .dao-page's padding band is the page element's own flat background and
    // no section can print across it; /services reserves the clearance inside
    // the dossier instead
    expect(readSource("src/app/[locale]/services/page.tsx")).toContain("dao-page--flush");
    expect(rule(".dao-page--flush")).toContain("padding-top: 0");
    expect(rule(".dsvc__open")).toContain("calc(var(--dsvc-chrome)");
  });

  it("textures the Services footer without touching the other seven routes", () => {
    const footer = readSource("src/components/dao/DaoFooter.tsx");
    expect(footer, "the shared footer changed for every route").toContain("textured = false");
    expect(readSource("src/app/[locale]/services/page.tsx")).toContain("footerTextured");
  });
});

describe("6 · the running department folio is gone", () => {
  it("takes the component, its styles and its copy with it", () => {
    expect(DOSSIER).not.toContain("ServicesFolio");
    expect(CSS, "folio styles survived").not.toMatch(/\.dsvc__folio/);
    expect(CONTENT, "the folio's aria-label survived").not.toMatch(/^\s*departments:/m);
  });

  it("leaves the dossier with no client component at all", () => {
    expect(DOSSIER).not.toContain('"use client"');
    expect(DOSSIER).not.toContain("useEffect");
  });

  it("spends the band it reserved on the opening's own closing air", () => {
    // removing a fixed strip and leaving its space behind is the failure this
    // guards against - the clearance token is named for what it now is
    expect(CSS).not.toContain("--dsvc-folio");
    expect(CSS).toContain("scroll-margin-top: calc(var(--dsvc-chrome) + var(--dsvc-lead))");
    expect(rule(".dsvc__open")).toContain("clamp(40px, 7vh, 76px)");
  });
});
