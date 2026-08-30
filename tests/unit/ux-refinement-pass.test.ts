import { describe, expect, it } from "vitest";
import { DAO_SERVICES, DAO_SERVICE_GROUPS, projectHasCapability } from "@/content/dao-services";
import { PROJECTS, projectsSorted } from "@/content/projects";
import { applyWorkFilter, capabilityPreview, parseWorkFilter } from "@/content/work-filters";
import { switchLocalePath } from "@/i18n/locales";
import en from "@/i18n/messages/en";
import ka from "@/i18n/messages/ka";
import { readSource } from "./read-source";

const read = (p: string) => readSource(p);

describe("§15 locale switching preserves the query", () => {
  it("carries a category filter across both directions", () => {
    expect(switchLocalePath("/work", "ka", "?category=photography")).toBe(
      "/ka/work?category=photography",
    );
    expect(switchLocalePath("/ka/work", "en", "?category=photography")).toBe(
      "/work?category=photography",
    );
  });

  it("carries a capability filter", () => {
    expect(switchLocalePath("/work", "ka", "?capability=production-design")).toBe(
      "/ka/work?capability=production-design",
    );
    expect(switchLocalePath("/ka/work", "en", "?capability=production-design")).toBe(
      "/work?capability=production-design",
    );
  });

  it("carries a status filter", () => {
    expect(switchLocalePath("/work", "ka", "?status=in-development")).toBe(
      "/ka/work?status=in-development",
    );
    expect(switchLocalePath("/ka/work", "en", "?status=in-development")).toBe(
      "/work?status=in-development",
    );
  });

  it("is generic - it does not know the parameter names", () => {
    expect(switchLocalePath("/work", "ka", "?a=1&b=2&c=3")).toBe("/ka/work?a=1&b=2&c=3");
    // and accepts the string with or without its leading ?
    expect(switchLocalePath("/work", "ka", "category=photography")).toBe(
      "/ka/work?category=photography",
    );
  });

  it("still behaves exactly as before with no query", () => {
    expect(switchLocalePath("/work", "ka")).toBe("/ka/work");
    expect(switchLocalePath("/ka/studio", "en")).toBe("/studio");
    expect(switchLocalePath("/", "ka")).toBe("/ka");
    expect(switchLocalePath("/ka", "en")).toBe("/");
    // an empty or bare "?" must not leave a dangling separator
    expect(switchLocalePath("/work", "ka", "")).toBe("/ka/work");
    expect(switchLocalePath("/work", "ka", "?")).toBe("/ka/work");
  });

  it("does not change what the filter means", () => {
    // the query is copied verbatim, so the destination parses to the same filter
    for (const q of [
      "?category=photography",
      "?capability=scenography",
      "?status=in-development",
    ]) {
      const sp = Object.fromEntries(new URLSearchParams(q));
      const target = switchLocalePath("/work", "ka", q);
      const carried = Object.fromEntries(new URLSearchParams(target.split("?")[1] ?? ""));
      expect(parseWorkFilter(carried)).toEqual(parseWorkFilter(sp));
    }
  });
});

describe("§02 capability preview routes truthfully", () => {
  const archive = projectsSorted();

  it("offers a still only from a project the capability is credited on", () => {
    for (const [i, s] of DAO_SERVICES.entries()) {
      const preview = capabilityPreview(archive, s.id, i);
      if (!preview) continue;
      const project = PROJECTS.find((p) => p.slug === preview.slug);
      expect(project, `${s.id} preview points at a real project`).toBeDefined();
      expect(
        projectHasCapability(project!, s.id),
        `${s.id} must not borrow a still from work it is not credited on`,
      ).toBe(true);
    }
  });

  it("returns nothing for a capability with no credited work", () => {
    for (const id of ["art-direction", "scenography", "decoration", "post-production"] as const) {
      expect(applyWorkFilter(archive, parseWorkFilter({ capability: id }))).toHaveLength(0);
      expect(capabilityPreview(archive, id), `${id} must not show a photograph`).toBeNull();
    }
  });

  it("does offer a still for every capability that has credited work", () => {
    for (const s of DAO_SERVICES) {
      const count = archive.filter((p) => projectHasCapability(p, s.id)).length;
      expect(!!capabilityPreview(archive, s.id), s.id).toBe(count > 0);
    }
  });

  it("is deterministic, so server and client agree", () => {
    for (const [i, s] of DAO_SERVICES.entries()) {
      const a = capabilityPreview(archive, s.id, i);
      const b = capabilityPreview(archive, s.id, i);
      expect(a).toEqual(b);
    }
  });

  it("stays in range whatever spread it is handed", () => {
    for (const spread of [0, 1, 7, 40, -3]) {
      const p = capabilityPreview(archive, "photography", spread);
      expect(p).not.toBeNull();
      expect(PROJECTS.some((x) => x.slug === p!.slug)).toBe(true);
    }
  });

  it("still routes every capability to its own filtered archive, from /services", () => {
    // The homepage act that carried the worked-example stills was replaced by
    // the approved What We Make dossier, so the capability -> archive route is
    // now owned by the catalogue page. The rule this was written to protect -
    // a capability never borrows another capability's photograph, and its link
    // is built from the canonical id - is unchanged and still checked.
    const src = read("src/app/[locale]/services/page.tsx");
    expect(src).not.toContain("const FRAGMENTS");
    expect(src).toContain("CapabilityWorkLink");
    const link = read("src/components/dao/CapabilityWorkLink.tsx");
    expect(link).toContain("capabilityWorkHref");
    expect(link).toContain("data-dao-capability");
  });
});

describe("§16 all nine capabilities keep their own canonical route", () => {
  it("resolves each capability to its own filter and count", () => {
    const archive = projectsSorted();
    const expected: Record<string, number> = {
      "creative-direction": 5,
      "art-direction": 0,
      "production-design": 5,
      scenography: 0,
      "costume-design": 2,
      decoration: 0,
      "film-video-production": 2,
      photography: 11,
      "post-production": 0,
    };
    expect(Object.keys(expected).sort()).toEqual(DAO_SERVICES.map((s) => s.id).sort());
    for (const s of DAO_SERVICES) {
      const f = parseWorkFilter({ capability: s.id });
      expect(f).toEqual({ kind: "capability", id: s.id });
      const hits = applyWorkFilter(archive, f);
      expect(hits, s.id).toHaveLength(expected[s.id]);
      for (const p of hits) expect(projectHasCapability(p, s.id)).toBe(true);
    }
  });
});

describe("§06 Studio Lab colour hierarchy", () => {
  const css = read("src/app/dao.css");

  it("paints the PRIMARY label brand green in every state", () => {
    const rule = css.match(
      /\.dao-nav__link--lab,\s*\.dao-nav__link--lab:hover,\s*\.dao-nav__link--lab:focus-visible \{[^}]*\}/,
    );
    expect(rule, "one rule covers rest, hover and focus").not.toBeNull();
    expect(rule![0]).toContain("var(--dao-green)");
    expect(css).toContain("--dao-green: #9dab5c");
  });

  it("paints the SECONDARY companion brand red", () => {
    const rule = css.match(/\.dao-nav__row--lab \.dao-nav__ka \{[^}]*\}/);
    expect(rule).not.toBeNull();
    expect(rule![0]).toContain("var(--dao-red)");
    expect(css).toContain("--dao-red: #d03e26");
  });

  it("no longer turns the label mint on hover", () => {
    expect(css).not.toMatch(
      /\.dao-nav__link--lab:hover,\s*\n?\s*\.dao-nav__link--lab:focus-visible \{\s*color: var\(--dao-mint\)/,
    );
  });

  it("assigns the pair by hierarchy, so it holds in both locales", () => {
    // .dao-nav__link is always the primary label and .dao-nav__ka always the
    // secondary one - the messages swap, the slots do not
    expect(en.dao.nav.lab).toBe("STUDIO LAB");
    expect(en.dao.nav.labKa).toBe("სტუდიო ლაბი");
    expect(ka.dao.nav.lab).toBe("სტუდიო ლაბი");
    expect(ka.dao.nav.labKa).toBe("STUDIO LAB");
  });

  it("recolours nothing else in the burger", () => {
    // the generic link hover stays blue; only the --lab variant is overridden
    expect(css).toMatch(
      /\.dao-nav__link:hover,\s*\n\.dao-nav__link:focus-visible \{\s*\n\s*color: var\(--dao-blue\);/,
    );
  });
});

describe("the Studio Lab bloom is gone from the burger", () => {
  const css = read("src/app/dao.css");
  const jsx = read("src/components/dao/DaoChrome.tsx");

  // SUPERSEDED: the previous pass moved this ornament into its own slot between
  // the two labels. This pass removes it outright - it read as too small to earn
  // its place - so these assertions now guard the removal instead of the
  // positioning. The colour hierarchy and the green rule are unaffected.
  it("renders neither the symbol nor its slot", () => {
    expect(jsx).not.toContain("dao-nav__bloomslot");
    expect(jsx).not.toContain("dao-nav__bloom ");
    expect(jsx).not.toContain("data-dao-bloom");
    expect(jsx).not.toContain("bloom.webp");
  });

  it("leaves no dead CSS behind", () => {
    // selector-level, not substring: prose in comments is allowed to mention it
    expect(css).not.toMatch(/\.dao-nav__bloomslot\b/);
    expect(css).not.toMatch(/\.dao-nav__bloom\b/);
    // including the mobile stand-down rule that existed only for the slot
    const mobile = css.slice(css.indexOf("@media (max-width: 900px)"));
    expect(mobile).not.toMatch(/\.dao-nav__bloom/);
  });

  it("keeps one intentional gap between the two labels", () => {
    // the slot used to cancel a gap with negative margins; with it gone the row
    // gap alone separates the labels, and it is still a single named value
    expect(css).toContain("--dao-nav-gap: 26px");
    expect(css).toMatch(/gap: var\(--dao-nav-gap\)/);
    expect(css).not.toContain("calc(var(--dao-nav-gap) / -2)");
  });

  it("keeps the Studio Lab green rule", () => {
    expect(jsx).toContain('background: "var(--dao-green)"');
    expect(css).toContain(".dao-nav__link--lab:hover .dao-strike");
  });
});

describe("§08 the Process FR frame labels are gone", () => {
  it("carries no FR 0001-0009 label and no rule left behind", () => {
    const page = read("src/app/[locale]/process/page.tsx");
    expect(page).not.toMatch(/FR\s*0*1?\s*-\s*0*9/);
    expect(page).not.toContain("FR 0001");
    expect(page).not.toContain("dpr__frline");
    // the now-dead style went with it
    expect(read("src/app/dao-routes.css")).not.toContain("dpr__frline");
  });

  it("leaves the numbering that carries real meaning alone", () => {
    const page = read("src/app/[locale]/process/page.tsx");
    // the nine stages are still numbered from the taxonomy, and the call-sheet
    // reference is a different treatment on a different axis
    expect(page).toContain("dpr__num");
    expect(page).toContain("PS-");
    expect(DAO_SERVICES).toHaveLength(9);
  });
});

describe("§11 the WORK burger item carries no blue rule", () => {
  const jsx = read("src/components/dao/DaoChrome.tsx");

  it("has no strike on the WORK label in any state", () => {
    // isolate the WORK row: from its link to the end of that row
    const start = jsx.indexOf('href={href("/work")}');
    const end = jsx.indexOf("dao-nav__cats", start);
    const workRow = jsx.slice(start, end);
    expect(workRow).not.toContain("dao-strike");
    expect(workRow).not.toContain("--dao-blue");
  });

  it("keeps the expanded state announced, so nothing accessible was lost", () => {
    expect(jsx).toContain("aria-expanded={workOpen}");
  });

  it("keeps a real focus treatment for keyboard users", () => {
    expect(read("src/app/dao.css")).toContain(".dao-nav__link:focus-visible");
  });
});

describe("§12 the Work archive text sits on a local scrim", () => {
  const css = read("src/app/dao-routes.css");
  const rule = css.match(/\.dwk__frame::before \{[\s\S]*?\n\}/)![0];

  it("is anchored to the caption zone, not the whole image", () => {
    expect(rule).toContain("inset: auto 0 0 0");
    const h = Number(rule.match(/height: (\d+)%/)![1]);
    expect(h).toBeGreaterThan(20);
    expect(h).toBeLessThanOrEqual(50);
  });

  it("reaches about 80% at its strongest and fades to nothing", () => {
    expect(rule).toContain("rgba(0, 0, 0, 0.8) 0%");
    expect(rule).toContain("rgba(0, 0, 0, 0) 100%");
    expect(css).toContain("--dao-black");
  });

  it("paints above the photograph but below the text", () => {
    expect(rule).toContain("z-index: 1");
    expect(css.match(/\.dwk__caption \{[\s\S]*?\n\}/)![0]).toContain("z-index: 2");
  });

  it("never intercepts the card link", () => {
    expect(rule).toContain("pointer-events: none");
  });
});

describe("§10/§13/§14 Optika at a real weight, never synthesised", () => {
  const routes = read("src/app/dao-routes.css");

  it("uses 600 - the heaviest weight the shipped files provide", () => {
    // there is no Optika Bold file in the repository
    expect(() => read("src/fonts/Optika-Bold.woff2")).toThrow();
    read("src/fonts/Optika-SemiBold.woff2");
    expect(read("src/app/dao.css")).toContain("--dao-w-editorial: 600");
  });

  const cases: [string, string, string][] = [
    ["§13 Work card title", ".dwk__name", "var(--dao-f-latin)"],
    ["§14 Process stage title", ".dpr__stagename", "var(--dao-f-ui)"],
    ["§10 Georgia support title", ".dgp__indexname", "var(--dao-f-ui)"],
  ];
  for (const [label, selector, family] of cases) {
    it(`${label} is Optika at the editorial weight`, () => {
      const rule = routes.match(new RegExp(`^\\${selector} \\{[\\s\\S]*?\\n\\}`, "m"))![0];
      expect(rule).toContain(`font-family: ${family}`);
      expect(rule).toContain("font-weight: var(--dao-w-editorial)");
      expect(rule).not.toContain("var(--dao-f-display)");
      expect(rule).not.toContain("font-weight: 700");
    });
  }

  it("leaves the secondary metadata secondary", () => {
    // anchored: .dwk__meta also appears in hover/focus descendant rules
    const meta = routes.match(/^\.dwk__meta \{[\s\S]*?\n\}/m)![0];
    expect(meta).toContain("font-weight: 500");
    const desc = routes.match(/\.dgp__indexdesc \{[\s\S]*?\n\}/)![0];
    expect(desc).not.toContain("--dao-w-editorial");
  });
});

describe("§04 the Enter the Lab rule measures its own words", () => {
  it("gives the CTA intrinsic width instead of a hardcoded one", () => {
    const page = read("src/app/[locale]/studio/page.tsx");
    const cta = page.slice(page.indexOf('localeHref(locale, "/studio-lab")'));
    const block = cta.slice(0, cta.indexOf(">"));
    expect(block).toContain('alignSelf: "flex-start"');
    expect(block).not.toMatch(/width:\s*\d+/);
  });
});

describe("§09 the Georgia Production symbols are one group", () => {
  it("wraps the star and the mark together", () => {
    const page = read("src/app/[locale]/georgia-production/page.tsx");
    const group = page.slice(page.indexOf('className="dgp__symbols"'));
    const close = group.indexOf("</span>", group.indexOf("dgp__mark"));
    const inner = group.slice(0, close);
    expect(inner).toContain("dgp__star");
    expect(inner).toContain("dgp__mark");
    // the inline align-self was what the media query could not override
    expect(inner).not.toContain("alignSelf");
  });

  it("does nothing on desktop and clusters them on mobile", () => {
    const css = read("src/app/dao-routes.css");
    expect(css.match(/\.dgp__symbols \{[^}]*\}/)![0]).toContain("display: contents");
    const mobile = css.slice(css.indexOf("@media (max-width: 720px)"));
    expect(mobile).toContain(".dgp__symbols");
    expect(mobile).toMatch(/\.dgp__symbols \{[^}]*display: flex/);
  });
});

describe("§03 the Studio team module", () => {
  const page = read("src/app/[locale]/studio/page.tsx");

  it("routes the board to the team, locale-aware", () => {
    expect(page).toContain('localeHref(locale, "/team")');
    expect(page).toContain("data-dao-team-cta");
  });

  it("is a single link, with nothing interactive nested inside it", () => {
    const slate = page.slice(page.indexOf('className="dst__slate"'));
    const body = slate.slice(0, slate.indexOf("</Link>"));
    expect(body).not.toContain("<Link");
    expect(body).not.toContain("<button");
    expect(body).not.toContain("href=");
  });

  it("carries an accessible label", () => {
    const slate = page.slice(page.indexOf('className="dst__slate"'));
    expect(slate.slice(0, slate.indexOf(">"))).toContain("aria-label");
  });

  it("invents no person and states only what the site already says", () => {
    const slate = page.slice(page.indexOf('className="dst__slate"'));
    const body = slate.slice(0, slate.indexOf("</Link>"));
    // the only literal is the wordmark; every other value comes from messages
    const literals = [...body.matchAll(/>([0-9A-Z][0-9A-Za-z .&-]{2,})</g)].map((m) => m[1]);
    expect(literals).toEqual(["8TH STATE"]);
    expect(body).toContain("m.common.tbilisi");
    expect(body).not.toMatch(/portrait|photo|headshot/i);
  });

  it("respects reduced motion and gives the keyboard the same reveal", () => {
    const css = read("src/app/dao-routes.css");
    const slate = css.slice(css.indexOf(".dst__slate {"));
    expect(slate).toContain(".dst__slate:focus-visible");
    expect(slate).toContain("@media (hover: hover)");
    expect(slate).toContain("prefers-reduced-motion");
  });

  it("localises every slate field", () => {
    for (const m of [en, ka]) {
      for (const k of ["slateProd", "slateScene", "slateLoc", "slateSceneValue"] as const) {
        expect(m.daoRoutes.studio[k].length).toBeGreaterThan(0);
      }
    }
    // and the Georgian strings are actually Georgian
    expect(ka.daoRoutes.studio.slateSceneValue).toMatch(/[Ⴀ-ჿ]/);
  });
});

describe("§01 the four layer descriptors are preserved", () => {
  it("keeps all four, in both locales", () => {
    expect(DAO_SERVICE_GROUPS).toHaveLength(4);
    for (const g of DAO_SERVICE_GROUPS) {
      expect(g.layer.en.length).toBeGreaterThan(0);
      expect(g.layer.ka.length).toBeGreaterThan(0);
    }
    expect(DAO_SERVICE_GROUPS.map((g) => g.layer.en)).toEqual([
      "The thinking layer - idea and look",
      "The made-world layer",
      "The capture layer",
      "The completion layer",
    ]);
  });

  it("leaves the wording lifted from the approved capability copy intact", () => {
    const post = DAO_SERVICES.find((s) => s.id === "post-production")!;
    expect(post.desc.en).toContain("the completion layer");
    expect(DAO_SERVICE_GROUPS[3].layer.en).toBe("The completion layer");
  });

  it("keeps the dossier title clearly ahead of its service rows at every width", () => {
    // The homepage no longer prints group headings above capabilities - the
    // approved dossier prints five top-level services under one title. The
    // requirement is the same one this test was written for: the heading has
    // to lead its rows at BOTH ends of the clamp, not only at one width.
    const css = read("src/app/dao.css");
    const head = css.match(/\.dao-wwm__title \{[\s\S]*?\n\}/)![0];
    const row = css.match(/\.dao-wwm__name \{[\s\S]*?\n\}/)![0];
    const floor = (r: string) => Number(r.match(/font-size: clamp\((\d+(?:\.\d+)?)px/)![1]);
    const ceil = (r: string) =>
      Number(r.match(/font-size: clamp\([^,]+,[^,]+,\s*(\d+(?:\.\d+)?)px\)/)![1]);
    expect(floor(head) - floor(row)).toBeGreaterThanOrEqual(4);
    expect(ceil(head)).toBeGreaterThan(ceil(row));
    // and the rows were not shrunk to achieve it - they stay the primary
    // navigation into each service, not a caption
    expect(floor(row)).toBe(24);
    expect(ceil(row)).toBe(46);
  });
});

/* ------------------------------------------------------------------------- */
/* Typography and navigation cleanup pass                                    */
/* ------------------------------------------------------------------------- */

describe("typography cleanup - Optika at real weights only", () => {
  const routes = read("src/app/dao-routes.css");

  it("has no Optika Bold file to synthesise from", () => {
    expect(() => read("src/fonts/Optika-Bold.woff2")).toThrow();
    read("src/fonts/Optika-SemiBold.woff2");
    expect(read("src/app/dao.css")).toContain("--dao-w-editorial: 600");
  });

  /** every target, its reusable class, and the token it must resolve through */
  const TARGETS: [string, string, string][] = [
    ["Services capability titles", ".dsv__name", "var(--dao-f-ui)"],
    ["Studio 'Make something with us.'", ".dst__make", "var(--dao-f-ui)"],
    ["Studio Lab green-card copy", ".dst__lablines", "var(--dao-f-ui)"],
    // the study card went with the field-notes page; the Lab's discipline
  ];

  for (const [label, selector, family] of TARGETS) {
    it(`${label} declare Optika at the editorial weight`, () => {
      const rule = routes.match(new RegExp(`^\\${selector} \\{[\\s\\S]*?\\n\\}`, "m"))![0];
      expect(rule).toContain(`font-family: ${family}`);
      expect(rule).toContain("font-weight: var(--dao-w-editorial)");
      // the display face is gone, and no synthetic bold was introduced
      expect(rule).not.toContain("var(--dao-f-display)");
      expect(rule).not.toMatch(/font-weight:\s*(700|800|900|bold)/);
    });
  }

  it("sets the Services capability face once, not per instance", () => {
    // all nine titles share .dsv__name; only the sizes are context-scoped
    const page = read("src/app/[locale]/services/page.tsx");
    const carousel = read("src/components/dao/ServicesFilmCarousel.tsx");
    expect((page.match(/dsv__name/g) || []).length).toBe(4); // 01, 02, 03-06 map, 09
    expect(carousel).toContain("dsv__name"); // 07, 08
    // no one-off font declarations on those instances
    expect(page).not.toMatch(/dsv__name[\s\S]{0,200}fontFamily/);
    for (const scope of [".dsv__g1names", ".dsv__g2grid", ".dsv__g3names", ".dsv__g4"]) {
      expect(routes, `${scope} keeps its own size`).toContain(`${scope} .dsv__name`);
    }
  });

  it("moves the Studio Lab card copy off an inline style onto a class", () => {
    const studio = read("src/app/[locale]/studio/page.tsx");
    expect(studio).toContain('className="dst__lablines"');
    expect(studio).not.toMatch(/fontFamily: "var\(--dao-f-display\)"/);
    // the three-line structure is still carried by the same mechanism
    expect(routes.match(/^\.dst__lablines \{[\s\S]*?\n\}/m)![0]).toContain("white-space: pre-line");
  });

  it("keeps the red full stop and the CTA out of the Make heading change", () => {
    const studio = read("src/app/[locale]/studio/page.tsx");
    const make = studio.slice(studio.indexOf('className="dst__make'));
    expect(make.slice(0, 400)).toContain('color: "var(--dao-red)"');
  });
});

describe("Start a Project placeholders are Optika 400", () => {
  const routes = read("src/app/dao-routes.css");
  const rule = routes.match(/^\.dbr__write::placeholder \{[\s\S]*?\n\}/m)![0];

  it("declares Optika at 400, never the editorial weight", () => {
    expect(rule).toContain("font-family: var(--dao-f-ui)");
    expect(rule).toContain("font-weight: 400");
    expect(rule).not.toContain("var(--dao-f-display)");
    expect(rule).not.toContain("var(--dao-w-editorial)");
    expect(rule).not.toMatch(/font-weight:\s*(600|700|bold)/);
  });

  it("keeps the muted placeholder colour", () => {
    expect(rule).toContain("rgba(19, 18, 16, 0.4)");
  });

  it("covers every placeholder in the form through one shared class", () => {
    const brief = read("src/components/dao/DaoBrief.tsx");
    const placeholders = [...brief.matchAll(/placeholder=\{([^}]+)\}/g)].map((m) => m[1]);
    expect(placeholders).toEqual(["m.q2Placeholder", "m.whenPlaceholder", "m.wherePlaceholder"]);
    // and each of those controls carries .dbr__write
    for (const p of placeholders) {
      const at = brief.indexOf(`placeholder={${p}}`);
      expect(brief.slice(at - 260, at)).toContain("dbr__write");
    }
  });

  it("does not touch the typed value, labels or the unplaceheld inputs", () => {
    const write = routes.match(/^\.dbr__write \{[\s\S]*?\n\}/m)![0];
    expect(write).toContain("var(--dao-f-display)"); // the value keeps its own face
    const brief = read("src/components/dao/DaoBrief.tsx");
    // name/email use real labels and no placeholder at all
    expect(brief).toContain('className="dbr__input"');
    expect(brief).not.toMatch(/dbr__input[\s\S]{0,200}placeholder=/);
  });

  it("keeps every placeholder field labelled, so placeholders are not the label", () => {
    const brief = read("src/components/dao/DaoBrief.tsx");
    for (const id of ["brief-about", "brief-when", "brief-where"]) {
      expect(brief).toContain(`htmlFor="${id}"`);
      expect(brief).toContain(`id="${id}"`);
    }
  });

  it("keeps the placeholder wording unchanged in both locales", () => {
    for (const m of [en, ka]) {
      for (const k of ["q2Placeholder", "whenPlaceholder", "wherePlaceholder"] as const) {
        expect(m.daoRoutes.brief[k].length).toBeGreaterThan(0);
      }
    }
    expect(en.daoRoutes.brief.wherePlaceholder).toBe("Georgia, elsewhere, or undecided");
  });
});
