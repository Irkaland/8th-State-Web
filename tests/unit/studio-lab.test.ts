import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LAB_COURSES,
  LAB_DISCIPLINES,
  LAB_ECOSYSTEM,
  LAB_FACULTY,
  LAB_PROGRAM,
  labCourseBySlug,
  labCourseSlugs,
} from "@/content/lab-courses";
import en from "@/i18n/messages/en";
import ka from "@/i18n/messages/ka";

/**
 * The approved Studio Lab, guarded.
 *
 * The design handoff answers a set of questions exactly, and each answer is
 * something a later edit could quietly undo: the texture stack could be
 * flattened to a plain green fill, the drawn rules could become CSS borders,
 * the hand-drawn marks could be swapped for an icon library, the botanicals
 * could start intercepting clicks, and the studio's unconfirmed facts could be
 * filled in with plausible-looking numbers.
 *
 * These tests pin the handoff's own values. They are not a style opinion.
 */

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const dao = read("src/app/dao.css");
const routes = read("src/app/dao-routes.css");
const kit = read("src/components/dao/LabKit.tsx");

/**
 * The rule block that actually DECLARES `needle`.
 *
 * Several of these selectors appear twice - once in a shared list that sets
 * layout, once alone where the design values live - so matching the first
 * block for a selector finds the wrong one.
 */
function declaring(css: string, selector: string, needle: string): string {
  const re = new RegExp(`^\\${selector}[^{]*\\{[\\s\\S]*?\\n\\}`, "gm");
  for (const m of css.matchAll(re)) if (m[0].includes(needle)) return m[0];
  throw new Error(`no ${selector} block declares ${needle}`);
}

describe("the course system is the four approved courses", () => {
  it("carries exactly four courses, in the approved order", () => {
    expect(LAB_COURSES.map((c) => c.slug)).toEqual(["photography", "art", "portfolio", "film"]);
    expect(labCourseSlugs()).toHaveLength(4);
  });

  it("names each course and its lecturer as the studio confirmed them", () => {
    const byName = Object.fromEntries(LAB_COURSES.map((c) => [c.slug, c]));
    expect(byName.photography.name.en).toBe("Photography: Theory & Practice");
    expect(byName.photography.lecturer).toBe("Beka Jokharidze");
    expect(byName.art.name.en).toBe("Art Course");
    expect(byName.art.lecturer).toBe("Mariam Kandiashvili");
    expect(byName.portfolio.name.en).toBe("Portfolio Creation");
    expect(byName.portfolio.lecturer).toBe("Mariam Kandiashvili");
    expect(byName.film.name.en).toBe("History of Cinema");
    expect(byName.film.lecturer).toBe("Tea Kandiashvili");
  });

  it("keeps History of Cinema online only", () => {
    const film = labCourseBySlug("film")!;
    expect(film.format.en).toBe("Online only");
    expect(film.formatTbd).toBe(false);
    expect(film.discLabel.en.toLowerCase()).toContain("online only");
    const sheetFormat = film.sheet.find((s) => s.key.en === "Format")!;
    expect(sheetFormat.value.en).toBe("Online only");
    expect(sheetFormat.tbd).toBe(false);
  });

  it("keeps the photography format as the two confirmed individual modes", () => {
    const p = labCourseBySlug("photography")!;
    expect(p.format.en).toContain("Individual in-person");
    expect(p.format.en).toContain("Individual online");
    expect(p.formatTbd).toBe(false);
  });

  it("keeps the portfolio process at its fixed five stages", () => {
    const folio = labCourseBySlug("portfolio")!;
    expect(folio.program.map((m) => m.title.en)).toEqual([
      "Assessment",
      "Portfolio planning",
      "Project creation",
      "Texts",
      "Final portfolio",
    ]);
    expect(folio.programNote.en).toMatch(/five-stage/i);
  });

  it("keeps the five cinema frames", () => {
    expect(labCourseBySlug("film")!.program.map((m) => m.title.en)).toEqual([
      "Cinema language",
      "Directorial approaches",
      "Visual style",
      "Cultural context",
      "Film analysis",
    ]);
  });

  it("localises every course string", () => {
    for (const c of LAB_COURSES) {
      for (const [label, v] of [
        ["name", c.name],
        ["blurb", c.blurb],
        ["format", c.format],
        ["annotation", c.annotation],
      ] as const) {
        expect(v.en.length, `${c.slug} ${label} en`).toBeGreaterThan(0);
        expect(v.ka, `${c.slug} ${label} ka`).toMatch(/[Ⴀ-ჿ]|Production|Design/);
      }
      for (const list of [c.who, c.learn]) {
        for (const item of list) expect(item.ka).toMatch(/[Ⴀ-ჿ]/);
      }
    }
  });
});

describe("no business fact is invented", () => {
  /* The studio supplied names, lecturers and two formats. It did NOT supply
     durations, schedules, prices, the art formats or any biography. */
  it("marks every unconfirmed practical value as TBD", () => {
    for (const c of LAB_COURSES) {
      for (const key of ["Duration", "Schedule", "Price"]) {
        const row = c.sheet.find((s) => s.key.en === key);
        expect(row, `${c.slug} ${key} row`).toBeDefined();
        expect(row!.tbd, `${c.slug} ${key} must stay TBD`).toBe(true);
      }
    }
  });

  it("states no price, date or duration anywhere in the course data", () => {
    const blob = JSON.stringify(LAB_COURSES);
    // a currency amount, a week/month count, or a date would all be inventions
    expect(blob).not.toMatch(/[₾$€]\s?\d/);
    expect(blob).not.toMatch(/\b\d+\s*(weeks?|months?|hours?|lari|gel|usd|eur)\b/i);
    expect(blob).not.toMatch(/\b20\d{2}\b/);
  });

  it("leaves the art and portfolio formats unannounced", () => {
    for (const slug of ["art", "portfolio"]) {
      expect(labCourseBySlug(slug)!.formatTbd, slug).toBe(true);
    }
  });

  it("writes no lecturer biography", () => {
    // the faculty entries carry a name and a course, never invented prose
    expect(LAB_FACULTY).toHaveLength(3);
    for (const f of LAB_FACULTY) {
      expect(Object.keys(f)).not.toContain("bio");
    }
    expect(en.daoRoutes.lab.bioPending).toMatch(/to be provided/i);
  });

  it("says the syllabus is in preparation where it is", () => {
    for (const slug of ["photography", "art"]) {
      expect(labCourseBySlug(slug)!.programNote.en).toMatch(/in preparation/i);
    }
  });
});

describe("the three disciplines and the program listing", () => {
  it("lists the three disciplines in the approved order, with their tilts", () => {
    expect(LAB_DISCIPLINES.map((d) => d.id)).toEqual(["photography", "art", "film"]);
    expect(LAB_DISCIPLINES.map((d) => d.rot)).toEqual([-1.5, 1, -1]);
  });

  it("lists all four courses in the program table, numbered 01-04", () => {
    expect(LAB_PROGRAM.map((p) => p.n)).toEqual(["01", "02", "03", "04"]);
    for (const row of LAB_PROGRAM) expect(labCourseBySlug(row.slug), row.slug).toBeDefined();
  });

  it("dims the format cell exactly where the format is unannounced", () => {
    for (const row of LAB_PROGRAM) {
      expect(row.formatTbd, row.slug).toBe(labCourseBySlug(row.slug)!.formatTbd);
    }
  });

  it("keeps the three wider-Lab entries", () => {
    expect(LAB_ECOSYSTEM.map((e) => e.title.en)).toEqual(["Workshops", "Research", "Experiments"]);
  });
});

describe("the marks are the approved drawn ones", () => {
  it("draws every rule as a wobbled path, never a border", () => {
    // four variants, all 400x4 paths at a non-scaling 1px stroke
    for (const v of ["M0 2.4 C60", "M0 2.1 C70", "M0 2.6 C55", "M0 2.2 C80"]) {
      expect(kit, v).toContain(v);
    }
    expect(kit).toContain('vectorEffect="non-scaling-stroke"');
    expect(kit).toContain('preserveAspectRatio="none"');
    // the rule element itself carries no border
    const rule = routes.match(/^\.dsl-rule \{[\s\S]*?\n\}/m);
    expect(rule?.[0] ?? dao.match(/^\.dsl-rule \{[\s\S]*?\n\}/m)![0]).not.toContain("border");
  });

  it("keeps the hand-drawn discipline marks and no icon library", () => {
    // the approved camera / art / film paths, verbatim from the design logic
    expect(kit).toContain("M2.7 7.2 L10.1 6.7 L12 3.5");
    expect(kit).toContain("M3.2 3.6 L28.5 3.1 L28.9 20.7");
    expect(kit).toContain("M4.1 3.2 L28.2 3.5 L27.8 20.5");
    for (const lib of ["lucide", "heroicons", "font-awesome", "react-icons"]) {
      expect(kit.toLowerCase(), lib).not.toContain(lib);
    }
  });

  it("keeps the texture stack rather than a flat green fill", () => {
    const weave = declaring(dao, ".dsl-weave", "canvas-weave.webp");
    const grain = declaring(dao, ".dsl-grain", "paper-grain-strong.webp");
    expect(weave).toContain("canvas-weave.webp");
    expect(weave).toContain("512px");
    expect(weave).toContain("opacity: 0.14");
    expect(weave).toContain("mix-blend-mode: overlay");
    expect(grain).toContain("paper-grain-strong.webp");
    expect(grain).toContain("352px");
    expect(grain).toContain("opacity: 0.3");
    expect(grain).toContain("mix-blend-mode: multiply");
  });

  it("keeps the ground on the existing token, not a restated literal", () => {
    const ground = dao.match(/^\.dao-lab,\n\.dsl,\n\.dsc \{[\s\S]*?\n\}/m)![0];
    expect(ground).toContain("var(--dao-green)");
    expect(ground).toContain("var(--dao-ink)");
    expect(ground).not.toMatch(/#9dab5c/i);
  });

  it("keeps every botanical static, behind, and untouchable", () => {
    const bot = dao.match(/^\.dsl-bot \{[\s\S]*?\n\}/m)![0];
    expect(bot).not.toContain("animation");
    expect(bot).not.toContain("transition");
    for (const orn of ["dsl__heroorn", "dsl__programorn", "dsl__folioorn", "dsl__widerorn"]) {
      const r = routes.match(new RegExp(`^\\.${orn} \\{[\\s\\S]*?\\n\\}`, "m"))![0];
      expect(r, orn).toContain("pointer-events: none");
      expect(r, orn).toContain("z-index: 0");
    }
  });
});

describe("the interaction set is the restrained one the handoff defines", () => {
  it("shifts rows and drifts CTA arrows, and does nothing else", () => {
    for (const sel of ["dsl__herorow", "dsl__discrow", "dsl__prow"]) {
      const r = declaring(routes, `.${sel}`, "transition: padding-left");
      expect(r, sel).toContain("transition: padding-left 240ms ease");
    }
    const cta = dao.match(/^\.dao-lab__cta,\n\.dsl__cta \{[\s\S]*?\n\}/m)![0];
    expect(cta).toContain("transition: gap 240ms ease");
  });

  it("introduces no parallax, marquee or scroll gimmick", () => {
    const lab = routes.slice(
      routes.indexOf("/studio-lab + /studio-lab/[course]"),
      routes.indexOf("/process - production choreography"),
    );
    for (const banned of ["@keyframes", "animation:", "translateZ", "will-change", "perspective"]) {
      expect(lab, banned).not.toContain(banned);
    }
  });

  it("removes the motion entirely under prefers-reduced-motion", () => {
    const at = routes.indexOf(
      "@media (prefers-reduced-motion: reduce)",
      routes.indexOf(".dsl__prow"),
    );
    expect(at).toBeGreaterThan(-1);
    expect(routes.slice(at, at + 500)).toContain("transition: none");
  });

  it("ships the Lab without a client bundle", () => {
    // every Lab surface is server-rendered: the interactions are pure CSS
    for (const f of [
      "src/components/dao/LabKit.tsx",
      "src/components/dao/StudioLab.tsx",
      "src/app/[locale]/studio-lab/page.tsx",
      "src/app/[locale]/studio-lab/[course]/page.tsx",
    ]) {
      expect(read(f), f).not.toContain('"use client"');
    }
  });
});

describe("the media slots keep their contractual ratios", () => {
  const page = read("src/app/[locale]/studio-lab/page.tsx");
  const course = read("src/app/[locale]/studio-lab/[course]/page.tsx");

  it("uses 4:3 for the lab room, 4:5 for the featured course, 3:4 for portraits", () => {
    expect(page).toContain('ratio="4 / 3"');
    expect(page).toContain('ratio="4 / 5"');
    expect(page).toContain('ratio="3 / 4"');
  });

  it("uses 16:10 for the course hero", () => {
    expect(course).toContain('ratio="16 / 10"');
  });

  it("renders a composed pending plate rather than a broken image", () => {
    const slot = routes.match(/^\.dsl-fig__slot \{[\s\S]*?\n\}/m)![0];
    expect(slot).toContain("aspect-ratio: var(--ar)");
    expect(slot).toContain("dashed");
    expect(kit).not.toContain("<img src={pending}");
  });
});

describe("both locales carry the whole Lab", () => {
  it("keeps EN and KA structurally identical for the Lab block", () => {
    const paths = (o: unknown, p = ""): string[] =>
      o === null || typeof o !== "object"
        ? [p]
        : Array.isArray(o)
          ? [`${p}[${o.length}]`]
          : Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
              paths(v, p ? `${p}.${k}` : k),
            );
    expect(paths(ka.daoRoutes.lab).sort()).toEqual(paths(en.daoRoutes.lab).sort());
    expect(paths(ka.dao.lab).sort()).toEqual(paths(en.dao.lab).sort());
  });

  it("carries the six index words, unnumbered, in the approved order", () => {
    const order = ["Field notes", "Archive", "Research", "Workshops", "Experiments", "Education"];
    expect(en.dao.lab.index).toEqual(order);
    expect(en.daoRoutes.lab.index).toEqual(order);
    expect(ka.dao.lab.index).toHaveLength(6);
    for (const w of en.dao.lab.index) expect(w).not.toMatch(/\d/);
  });

  it("writes the Lab page copy in Georgian on the Georgian side", () => {
    for (const k of ["copy", "s02Statement", "registerCopy", "programTitle"] as const) {
      expect(ka.daoRoutes.lab[k], k).toMatch(/[Ⴀ-ჿ]/);
    }
  });
});
