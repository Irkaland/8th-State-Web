import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en";
import ka from "@/i18n/messages/ka";
import { LOCALES } from "@/i18n/locales";
import { readSource } from "./read-source";

/**
 * RESPONSIVE TEXT MOTION SYSTEM V3 - the contract, checked at the source.
 *
 * These are the rules that cannot be verified by looking at one page in a
 * browser: that there is exactly ONE motion architecture, that no text is
 * measured or split, that every tier exists, and that nothing is left
 * invisible when the runtime does not start.
 */

const motion = () => readSource("src/app/dao-motion.css");
const reveal = () => readSource("src/lib/reveal.ts");

describe("§19 motion families", () => {
  it("declares all eight animated families plus the interaction family", () => {
    const css = motion();
    for (const fam of ["mo-a", "mo-b", "mo-c", "mo-d", "mo-e", "mo-f", "mo-g", "mo-h"]) {
      expect(css, `family .${fam} is missing`).toContain(`.${fam}`);
    }
  });

  it("keeps A's entry variant distinct from its scroll level", () => {
    expect(motion()).toContain(".mo-a--entry");
  });

  it("does not collapse the families into one shared fade", () => {
    const css = motion();
    // each family owns a different property set - if they were all one fade
    // these markers would not all be present
    expect(css).toContain("clip-path: inset(0 100% 0 0)"); // G
    expect(css).toContain("letter-spacing: calc(var(--ls, 0.2em) + var(--moD-ls))"); // D
    expect(css).toContain("letter-spacing: calc(var(--ls, 0.26em) + var(--moF-ls))"); // F
  });
});

describe("§20 responsive tiers", () => {
  const css = motion;

  it("defines the tier 1 token set at the root", () => {
    for (const token of [
      "--moA-entry-travel: 74%",
      "--moA-entry-dur: 720ms",
      "--moA-travel: 46%",
      "--moB-y: 6px",
      "--moC-dur: 300ms",
      "--moD-ls: 0.08em",
      "--moF-ls: 0.1em",
      "--moG-dur: 540ms",
    ]) {
      expect(css(), `tier 1 token ${token}`).toContain(token);
    }
  });

  it("retunes at all three lower tiers", () => {
    for (const q of [
      "@media (max-width: 1279px)",
      "@media (max-width: 768px)",
      "@media (max-width: 480px)",
    ]) {
      expect(css(), `missing tier query ${q}`).toContain(q);
    }
  });

  it("makes mobile quieter, never stronger, on every travel token", () => {
    const s = css();
    const value = (query: string, token: string) => {
      const block = query ? s.slice(s.indexOf(query)) : s;
      const m = block.match(new RegExp(`${token}:\\s*([0-9.]+)(%|px|em|ms)`));
      if (!m) throw new Error(`token ${token} not found after ${query || "root"}`);
      return Number(m[1]);
    };
    // A's travel and duration shrink monotonically as the viewport narrows
    const tiers = [
      "",
      "@media (max-width: 1279px)",
      "@media (max-width: 768px)",
      "@media (max-width: 480px)",
    ];
    for (const token of ["--moA-entry-travel", "--moA-travel", "--moA-entry-dur", "--moB-y"]) {
      const series = tiers.map((q) => value(q, token));
      for (let i = 1; i < series.length; i += 1) {
        expect(series[i], `${token} grew at tier ${i + 1}`).toBeLessThanOrEqual(series[i - 1]);
      }
    }
  });

  it("falls G back to a fade at 768 and below, so a wrapped title cannot clip", () => {
    const s = css();
    const at768 = s.slice(s.indexOf("@media (max-width: 768px)", s.indexOf(".mo-g")));
    expect(at768).toContain("clip-path: none");
  });
});

describe("§24 reduced motion", () => {
  it("resets every animated property to its final state with no transition", () => {
    const s = motion();
    const block = s.slice(s.indexOf("@media (prefers-reduced-motion: reduce)"));
    for (const decl of [
      "opacity: 1 !important",
      "transform: none !important",
      "clip-path: none !important",
      "transition: none !important",
      "transition-delay: 0ms !important",
    ]) {
      expect(block, `reduced motion must set ${decl}`).toContain(decl);
    }
  });

  it("covers the retuned original primitives as well as the new families", () => {
    const block = motion().slice(motion().indexOf("@media (prefers-reduced-motion: reduce)"));
    for (const sel of [".dao-rise > *", ".dao-fade", ".dao-side"]) {
      expect(block, `${sel} must be reset under reduced motion`).toContain(sel);
    }
  });

  it("withholds the runtime attribute entirely when reduced motion is on", () => {
    // the pre-paint switch is the primary mechanism - the media query above is
    // the backstop, not the only line of defence
    const layout = readSource("src/app/[locale]/layout.tsx");
    expect(layout).toContain('matchMedia("(prefers-reduced-motion: reduce)").matches');
    expect(layout).toContain('setAttribute("data-dao-motion"');
  });
});

describe("§41 progressive enhancement", () => {
  it("scopes every hidden pre-state to the runtime attribute", () => {
    const s = motion();
    // the two gate blocks - families, and the retuned primitives
    expect(s.match(/html\[data-dao-motion\] \{/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    // and nothing sets opacity 0 outside a gate: every `opacity: 0` in the file
    // must sit after the first gate opens
    const firstGate = s.indexOf("html[data-dao-motion] {");
    const stray = s.slice(0, firstGate).includes("opacity: 0");
    expect(stray, "an ungated opacity:0 would hide text when JS never runs").toBe(false);
  });

  it("resets the original primitives to their final state outside the gate", () => {
    const s = motion();
    expect(s).toContain(`.dao-rise > * {\n  transform: none;\n}`);
    expect(s).toContain(`.dao-fade,\n.dao-side {\n  opacity: 1;\n  transform: none;\n}`);
  });
});

describe("§22 no text is measured, split or cloned", () => {
  const sources = [
    "src/components/dao/StudioIntro.tsx",
    "src/app/[locale]/studio/page.tsx",
    "src/components/dao/WorkArchive.tsx",
    "src/components/dao/TeamContactSheet.tsx",
  ];

  it("never splits a string by characters or word count for animation", () => {
    for (const file of sources) {
      const s = readSource(file);
      expect(s, `${file} splits text by character`).not.toMatch(/split\(\s*""\s*\)/);
      expect(s, `${file} still counts words to build groups`).not.toMatch(
        /split\(\s*" "\s*\)[\s\S]{0,200}?(ceil|length \/)/,
      );
    }
  });

  it("uses authored groups for the statement, and they reconstruct it exactly", () => {
    for (const [name, dict] of [
      ["en", en],
      ["ka", ka],
    ] as const) {
      const groups = dict.dao.intro.statementGroups;
      expect(groups.length, `${name} needs at least two authored groups`).toBeGreaterThan(1);
      expect(groups.join(" "), `${name} groups must reconstruct the statement`).toBe(
        dict.dao.intro.statement,
      );
    }
  });

  it("authors the groups per locale rather than reusing the English cut", () => {
    expect(en.dao.intro.statementGroups).not.toEqual(ka.dao.intro.statementGroups);
    expect(LOCALES.length).toBe(2);
  });
});

describe("§23/§42 one observer", () => {
  it("creates exactly one TEXT-REVEAL observer in the whole application", () => {
    /**
     * §42 forbids several observers doing the SAME job, not every observer.
     * A reveal observer is one that adds `is-in` - that is the class every
     * family responds to - so the test asks precisely that question rather
     * than counting constructors. The Studio act's orbital gate is a different
     * job (it starts and stops a scroll-driven visual, and never touches text),
     * and §38 explicitly allows non-text component motion to stay local.
     */
    const files = [
      "src/lib/reveal.ts",
      "src/components/dao/hooks.ts",
      "src/components/dao/InView.tsx",
      "src/components/dao/Reveal.tsx",
      "src/components/dao/TeamContactSheet.tsx",
      "src/components/dao/StudioIntro.tsx",
      "src/components/dao/DaoChrome.tsx",
      "src/components/dao/Showreel.tsx",
    ];
    const revealObservers = files.filter((file) => {
      const s = readSource(file);
      return s.includes("new IntersectionObserver") && s.includes("is-in");
    });
    expect(revealObservers, `reveal observers in: ${revealObservers.join(", ")}`).toEqual([
      "src/lib/reveal.ts",
    ]);
  });

  it("leaves no page-local reveal observer or MutationObserver behind", () => {
    for (const file of [
      "src/components/dao/TeamContactSheet.tsx",
      "src/components/dao/InView.tsx",
      "src/components/dao/hooks.ts",
    ]) {
      const s = readSource(file);
      expect(s, `${file} still constructs its own observer`).not.toContain(
        "new IntersectionObserver",
      );
      expect(s, `${file} still watches the DOM for animatable nodes`).not.toContain(
        "new MutationObserver",
      );
    }
  });

  it("uses the approved reveal points, measured against the viewport", () => {
    const s = reveal();
    // 15% desktop / 10% at <=768 - as a fraction of the VIEWPORT, so the top of
    // a section several screens tall is not held back by its own height
    expect(s).toContain("const reveal = mobile ? 0.1 : 0.15;");
    expect(s).toContain("window.innerHeight * reveal");
    expect(s).toContain("entry.intersectionRect.height < need");
  });

  it("reveals once - the element is unobserved as it lands", () => {
    expect(reveal()).toContain("observer?.unobserve(el)");
  });

  it("never attaches animation work to a scroll event", () => {
    expect(reveal()).not.toContain('addEventListener("scroll"');
  });

  it("treats a history traversal as a return rather than an arrival", () => {
    const s = reveal();
    expect(s).toContain('addEventListener("popstate"');
    expect(s).toContain("quietEntrance");
  });

  it("shows content immediately where IntersectionObserver does not exist", () => {
    expect(reveal()).toContain('el.classList.add("is-in")');
  });
});

describe("§21 mobile behaviour", () => {
  it("makes H a tap acknowledgement with no shift and no sticky hover", () => {
    const s = motion();
    const block = s.slice(s.indexOf(".mo-h {"));
    const mobile = block.slice(block.indexOf("@media (max-width: 768px)"));
    expect(mobile).toContain("transform: none");
    expect(mobile).toContain("opacity: 0.7");
  });

  it("keeps E almost pure opacity on the smallest tier", () => {
    const s = motion();
    const t4 = s.slice(s.indexOf("@media (max-width: 480px)"));
    expect(t4).toContain("--moE-y: 0px");
  });
});
