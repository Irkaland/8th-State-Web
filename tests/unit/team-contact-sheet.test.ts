import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  TEAM,
  TEAM_DEPARTMENTS,
  hasConfirmedTeam,
  hasTeam,
  teamByDepartment,
  teamInSectionOrder,
  teamMemberBySlug,
  teamSorted,
} from "@/content/team";
import { PROJECTS } from "@/content/projects";
import { isCapabilityId } from "@/content/dao-services";
import { teamMemberSchema } from "@/content/types";
import en from "@/i18n/messages/en";
import ka from "@/i18n/messages/ka";

const read = (p: string) => readFileSync(p, "utf8");

describe("department architecture", () => {
  it("declares all seven departments in the approved order", () => {
    expect(TEAM_DEPARTMENTS.map((d) => d.id)).toEqual([
      "production",
      "direction",
      "creative",
      "photography",
      "art-department",
      "post-production",
      "studio-lab",
    ]);
  });

  it("localises every department name", () => {
    for (const d of TEAM_DEPARTMENTS) {
      expect(d.name.en.length).toBeGreaterThan(0);
      expect(d.name.ka.length).toBeGreaterThan(0);
      expect(d.name.ka).toMatch(/[Ⴀ-ჿ]/);
    }
  });

  it("never renders a department with no members", () => {
    for (const s of teamByDepartment()) expect(s.people.length).toBeGreaterThan(0);
    const rendered = teamByDepartment().map((s) => s.id);
    const populated = [...new Set(TEAM.map((p) => p.department))];
    expect(new Set(rendered)).toEqual(new Set(populated));
  });

  it("renders sections in the declared order, not data order", () => {
    const order = TEAM_DEPARTMENTS.map((d) => d.id);
    const rendered = teamByDepartment().map((s) => s.id);
    expect(rendered).toEqual([...rendered].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  });

  it("assigns every member to a declared department", () => {
    const ids = new Set(TEAM_DEPARTMENTS.map((d) => d.id));
    for (const p of TEAM) expect(ids.has(p.department)).toBe(true);
  });
});

describe("no fabricated people", () => {
  it("gives every provisional seat NO name, and every named person a name", () => {
    for (const p of TEAM) {
      if (p.provisional) {
        expect(p.name, `${p.slug} is a reserved seat`).toBeUndefined();
      } else {
        expect(p.name, `${p.slug} is confirmed`).toBeTruthy();
      }
    }
  });

  it("invents no biography, statement, client, award, credit or contact on a seat", () => {
    for (const p of TEAM.filter((x) => x.provisional)) {
      expect(p.shortStatement, p.slug).toBeUndefined();
      expect(p.bio, p.slug).toBeUndefined();
      expect(p.portrait, p.slug).toBeUndefined();
      expect(p.location, p.slug).toBeUndefined();
      expect(p.email, p.slug).toBeUndefined();
      expect(p.portfolioUrl, p.slug).toBeUndefined();
      expect(p.clients, p.slug).toHaveLength(0);
      expect(p.awards, p.slug).toHaveLength(0);
      expect(p.credits, p.slug).toHaveLength(0);
      expect(p.education, p.slug).toHaveLength(0);
      expect(p.experience, p.slug).toHaveLength(0);
      expect(p.languages, p.slug).toHaveLength(0);
    }
  });

  it("declares the roster provisional while no person is confirmed", () => {
    expect(hasTeam()).toBe(true);
    // the notice is what stops the seat count reading as a headcount claim
    expect(hasConfirmedTeam()).toBe(TEAM.some((p) => !p.provisional && !!p.name));
    if (!hasConfirmedTeam()) {
      expect(en.daoRoutes.team.provisionalRoster.length).toBeGreaterThan(20);
      expect(ka.daoRoutes.team.provisionalRoster).toMatch(/[Ⴀ-ჿ]/);
    }
  });

  it("prints no English marked blank - both read in the page's own language", () => {
    const jsx = read("src/components/dao/TeamContactSheet.tsx");
    // the two blanks a reserved seat actually shows. Hardcoding them left
    // "NAME PENDING" and "PORTRAIT PENDING" in Latin on the whole /ka route.
    expect(jsx).not.toMatch(/>\s*NAME PENDING\s*</);
    expect(jsx).not.toMatch(/>\s*PORTRAIT PENDING\s*</);
    expect(jsx).toContain("pending={R.namePending}");
    expect(jsx).toContain("pending={R.portraitPending}");
    for (const m of [en, ka]) {
      expect(m.daoRoutes.team.namePending.length).toBeGreaterThan(3);
      expect(m.daoRoutes.team.portraitPending.length).toBeGreaterThan(3);
    }
    expect(ka.daoRoutes.team.namePending).toMatch(/[Ⴀ-ჿ]/);
    expect(ka.daoRoutes.team.portraitPending).toMatch(/[Ⴀ-ჿ]/);
  });

  it("carries no leftover placeholder names from the review mock", () => {
    const src = read("src/content/team.ts");
    for (const banned of [
      "Nino",
      "Abashidze",
      "Levan",
      "Kharabadze",
      "Tamar",
      "Gelashvili",
      "Saba",
      "Turmanidze",
      "Kvirikashvili",
      "Rusieli",
      "8thstate.ge",
    ]) {
      expect(src, `${banned} must not appear`).not.toContain(banned);
    }
  });

  it("passes its own schema", () => {
    for (const p of TEAM) expect(() => teamMemberSchema.parse(p)).not.toThrow();
  });
});

describe("selected work joins the real archive only", () => {
  it("only ever references a slug that exists in the archive", () => {
    const real = new Set(PROJECTS.map((p) => p.slug));
    for (const p of TEAM) {
      for (const c of p.selectedWork) {
        expect(real.has(c.slug), `${p.slug} credits unknown project ${c.slug}`).toBe(true);
      }
    }
  });

  it("attaches no project to a reserved seat", () => {
    for (const p of TEAM.filter((x) => x.provisional)) {
      expect(p.selectedWork, `${p.slug} must claim no credits`).toHaveLength(0);
    }
  });

  it("drops an unmatched slug rather than rendering a dead link", () => {
    // the join lives in the page; this asserts the shape it relies on
    const src = read("src/app/[locale]/team/page.tsx");
    expect(src).toContain("PROJECTS.find");
    expect(src).toContain("if (!p) return null");
    expect(src).toContain("filter((x): x is TeamWorkCredit => x !== null)");
  });

  it("routes a credit at the existing /work/<slug> route", () => {
    const src = read("src/components/dao/TeamContactSheet.tsx");
    expect(src).toContain("localeHref(locale, `/work/${p.slug}`)");
  });
});

describe("practice speaks the Services vocabulary", () => {
  it("resolves canonical capability ids to their Services names", () => {
    const src = read("src/app/[locale]/team/page.tsx");
    expect(src).toContain("isCapabilityId(e) ? t(capabilityById(e).name, locale) : e");
  });

  it("uses only real capability ids where an id is given", () => {
    for (const p of TEAM) {
      for (const e of p.expertise) {
        if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e)) expect(isCapabilityId(e)).toBe(true);
      }
    }
  });
});

describe("roster helpers", () => {
  it("orders by the order field", () => {
    const o = teamSorted().map((p) => p.order);
    expect(o).toEqual([...o].sort((a, b) => a - b));
  });

  it("flattens prev/next in the order the sections render", () => {
    expect(teamInSectionOrder().map((p) => p.slug)).toEqual(
      teamByDepartment().flatMap((d) => d.people.map((p) => p.slug)),
    );
  });

  it("gives every member a unique, url-safe slug", () => {
    const slugs = TEAM.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(teamMemberBySlug(s)?.slug).toBe(s);
    }
  });

  it("gives every member a unique id", () => {
    expect(new Set(TEAM.map((p) => p.id)).size).toBe(TEAM.length);
  });
});

describe("the frame is a complete four-sided perimeter", () => {
  const css = read("src/app/dao-routes.css");
  const rule = css.match(/\.dtm__frame::after,\s*\.dtm__wframe::after \{[\s\S]*?\n\}/)![0];

  it("composes four mask layers, two per axis", () => {
    const images = rule.match(/mask-image:[\s\S]*?;/)![0];
    expect((images.match(/ink-rule-h\.svg/g) || []).length).toBe(2);
    expect((images.match(/ink-rule-v\.svg/g) || []).length).toBe(2);
  });

  it("pins each side to a fixed thin band, so weight never depends on aspect", () => {
    // prettier wraps these multi-layer lists, so compare on collapsed whitespace
    const flat = rule.replace(/\s+/g, " ");
    expect(flat).toContain("mask-size: 100% 6px, 100% 6px, 6px 100%, 6px 100%");
    expect(flat).toContain("mask-position: left top, left bottom, left top, right top");
  });

  it("stretches each run along its own axis - the letterboxing bug", () => {
    // without this the mask scales to FIT and each side stops short of the
    // corners, which is what made the frame look partial
    for (const f of [
      "public/assets/graphics/ink-rule-h.svg",
      "public/assets/graphics/ink-rule-v.svg",
    ]) {
      expect(read(f), f).toContain('preserveAspectRatio="none"');
    }
  });

  it("draws one continuous pen run per asset, overshooting both ends", () => {
    for (const [f, axis] of [
      ["public/assets/graphics/ink-rule-h.svg", "h"],
      ["public/assets/graphics/ink-rule-v.svg", "v"],
    ] as const) {
      const svg = read(f);
      expect((svg.match(/<path/g) || []).length, `${f} is a single run`).toBe(1);
      const d = svg.match(/<path d="([^"]+)"/)![1];
      const pts = [...d.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((mm) => [
        +mm[1],
        +mm[2],
      ]);
      const along = pts.map((p) => (axis === "h" ? p[0] : p[1]));
      // the run carries past both nominal ends, so the corners cross
      expect(Math.min(...along), `${f} overshoots the start`).toBeLessThan(0);
      expect(Math.max(...along), `${f} overshoots the end`).toBeGreaterThan(300);
    }
  });

  it("casts no shadow and draws no border", () => {
    expect(rule).not.toContain("box-shadow");
    expect(rule).not.toMatch(/\bborder\s*:/);
    const frame = css.match(/^\.dtm__frame \{[\s\S]*?\n\}/m)![0];
    expect(frame).not.toContain("box-shadow");
  });

  it("inks to brand red on hover and while open", () => {
    expect(css).toContain(".dtm__person:hover .dtm__frame::after");
    expect(css).toContain(".dtm__person.is-active .dtm__frame::after");
    expect(css).toMatch(/background: var\(--dao-red\)/);
  });

  it("uses the same frame on the Selected Work thumbnails", () => {
    expect(rule).toContain(".dtm__wframe::after");
  });
});

describe("hover stays restrained", () => {
  const css = read("src/app/dao-routes.css");
  const hover = css.slice(css.indexOf("@media (hover: hover)", css.indexOf(".dtm__view")));
  const block = hover.slice(0, hover.indexOf("\n}\n}") + 4);

  it("never lifts, scales or zooms the card", () => {
    expect(block).not.toMatch(/translateY\(-/);
    expect(block).not.toMatch(/scale\(/);
    expect(block).not.toContain("box-shadow");
  });

  it("is gated behind a real hover capability", () => {
    expect(css).toContain("@media (hover: hover)");
  });

  it("still reaches the keyboard without hover", () => {
    expect(css).toContain(".dtm__person:focus-visible .dtm__frame::after");
    expect(css).toContain(".dtm__person:focus-visible .dtm__view");
  });
});

describe("the role rule is the thin pencil stroke", () => {
  const css = read("src/app/dao-routes.css");
  const rule = css.match(/\.dtm__role::after \{[\s\S]*?\n\}/)![0];

  it("is 2px and masked by the pencil rule, not the paint stroke", () => {
    expect(rule).toContain("height: 2px");
    expect(rule).toContain("pencil-rule-h.webp");
    expect(rule).not.toContain("paint-stroke");
  });

  it("uses the functional face at the editorial weight", () => {
    const role = css.match(/^\.dtm__role \{[\s\S]*?\n\}/m)![0];
    expect(role).toContain("font-family: var(--dao-f-ui)");
    expect(role).toContain("font-weight: var(--dao-w-editorial)");
  });
});

/**
 * The card-to-profile morph.
 *
 * SUPERSEDES the earlier "inserted sheet, not a modal" contract. That version
 * asserted the opposite of every line below - a grid-column: 1 / -1 insert with
 * no overlay, no fixed positioning, no scroll lock and no dialog role - and it
 * described the interaction the studio has since replaced, not a weaker version
 * of this one. The assertions are inverted here rather than dropped, so the
 * change of model stays legible in the history.
 *
 * Deliberately no frame-by-frame assertions: what is pinned is the mechanism -
 * measured origin, geometry interpolation, reverse sequence, restoration - not
 * the intermediate values of an animation.
 */
describe("the roster is one continuous grid", () => {
  const jsx = read("src/components/dao/TeamContactSheet.tsx");
  const css = read("src/app/dao-routes.css");

  it("renders no per-department section, heading, number, count or rule", () => {
    for (const cls of [
      "dtm__section",
      "dtm__depthead",
      "dtm__deptno",
      "dtm__deptname",
      "dtm__deptc",
      "dtm__deptrule",
    ]) {
      expect(jsx, cls).not.toContain(cls);
      // removed with their markup rather than left orphaned in the stylesheet
      expect(css, cls).not.toContain("." + cls);
    }
  });

  it("derives the grid from the same flat order prev/next walks", () => {
    expect(jsx).toContain("const roster = order");
    expect(jsx).toContain("{roster.map((card) => {");
    expect(jsx).not.toContain("sections.map((section)");
  });

  it("keeps department on the person, and states it in the profile", () => {
    // the schema is untouched...
    expect(
      teamMemberSchema.parse({ id: "x", slug: "x", department: "direction", order: 1 }).department,
    ).toBe("direction");
    // ...the sections are still built, because the flat order comes from them...
    expect(teamByDepartment().length).toBeGreaterThan(1);
    // ...and the profile still prints it
    expect(jsx).toContain('<span className="dtm__dept">{up(card.departmentName)}</span>');
  });

  it("hides the sheet's scrollbar without disabling the scroll", () => {
    const doss = css.match(/^\.dtm__dossier \{[\s\S]*?\n\}/m)![0];
    // §01: hidden in all three engines - standard, WebKit/Chromium, legacy Edge
    expect(doss).toContain("scrollbar-width: none");
    expect(doss).toContain("-ms-overflow-style: none");
    expect(css).toContain(".dtm__dossier::-webkit-scrollbar");
    // the scroll itself is untouched
    expect(doss).toContain("overflow-y: auto");
    expect(doss).not.toContain("overflow-y: hidden");
    expect(doss).not.toContain("overflow: hidden");
  });
});

describe("the profile morphs out of the card that opened it", () => {
  const jsx = read("src/components/dao/TeamContactSheet.tsx");
  const css = read("src/app/dao-routes.css");
  const flat = css.replace(/\s+/g, " ");

  it("no longer inserts itself into the roster grid", () => {
    // the old model, gone: no grid row, and nothing that could push the roster
    expect(css).not.toContain(".dtm__insert");
    expect(jsx).not.toContain("dtm__insert");
    expect(flat).not.toMatch(/\.dtm__(stage|morph|dossier)[^{]*\{[^}]*grid-column: 1 \/ -1/);
  });

  it("opens as a centred sheet fixed against the viewport", () => {
    const stage = css.match(/^\.dtm__stage \{[\s\S]*?\n\}/m)![0];
    expect(stage).toContain("position: fixed");
    expect(stage).toContain("inset: 0");
    const morph = css.match(/^\.dtm__morph \{[\s\S]*?\n\}/m)![0];
    expect(morph).toContain("position: fixed");
    expect(morph).toContain("left: 50%");
    expect(morph).toContain("top: 50%");
    expect(morph).toContain("translate(-50%, -50%)");
    // large, but bounded on both axes and never full-bleed. The height is a CAP
    // rather than a fixed size, so a short profile does not open onto a void.
    expect(morph).toMatch(/^ {2}width: min\(8[2-9]vw/m);
    expect(morph).toMatch(/^ {2}height: auto;/m);
    expect(morph).toMatch(/^ {2}max-height: min\(8[4-9]vh/m);
    // the sheet scrolls itself inside that cap
    const doss = css.match(/^\.dtm__dossier \{[\s\S]*?\n\}/m)![0];
    expect(doss).toContain("overflow-y: auto");
    expect(doss).toContain("min-height: 0");
    // and JS resolves the same rest box, or dropping the inline geometry at the
    // end of the travel would jump
    expect(jsx).toContain("Math.min(vw * 0.86, 1180)");
    expect(jsx).toContain("Math.min(vh * 0.86, 900)");
  });

  it("measures the clicked card and animates from that geometry", () => {
    // the origin is read off the DOM, not guessed
    expect(jsx).toContain("getBoundingClientRect()");
    expect(jsx).toContain("const boxOf = (slug: string): Box | null");
    expect(jsx).toContain('triggers.current[slug]?.querySelector(".dtm__frame")');
    // and handed to the open call, so the sheet starts life at the card's box
    expect(jsx).toContain("openFrom(card.slug, boxOf(card.slug), true)");
    // interpolated as a box, not a scale: a 4:5 card and a landscape sheet
    // cannot share a uniform scale without distorting the portrait
    const morph = css.match(/^\.dtm__morph \{[\s\S]*?\n\}/m)![0];
    for (const axis of ["left", "top", "width", "height"]) {
      expect(morph, axis).toContain(axis + " 520ms");
    }
    // two frames, so the browser has a start value to transition away from -
    // the first measures the sheet, the second hands the geometry over
    expect(jsx).toContain("const id = requestAnimationFrame(() => {");
    expect(jsx).toContain("next = requestAnimationFrame(() => {");
    expect(jsx).toContain('if (!wantClose.current) setPhase("settling");');
  });

  it("reveals the content only as the geometry settles", () => {
    expect(flat).toMatch(/\.dtm__morph > \.dtm__dossier \{ opacity: 0;/);
    expect(flat).toContain('.dtm__stage[data-dtm-phase="open"] .dtm__morph > .dtm__dossier');
    // the sheet holds its measured size through the travel and is clipped rather
    // than reflowed, which is what lets the two read as one object
    expect(css.match(/^\.dtm__morph \{[\s\S]*?\n\}/m)![0]).toContain("overflow: hidden");
    expect(jsx).toContain('flex: "0 0 auto"');
    expect(jsx).toContain('height: "auto"');
    // and the PAPER travels while only the printing arrives late, so there IS
    // something to see crossing the screen
    expect(css.match(/^\.dtm__morph \{[\s\S]*?\n\}/m)![0]).toContain("background: #fff");
    expect(css).toContain(".dtm__morph::before");
    expect(css.match(/^\.dtm__dossier \{[\s\S]*?\n\}/m)![0]).not.toContain("background");
  });

  it("keeps the originating seat in the layout, only unseen", () => {
    // visibility, never display - the grid must not reflow behind the sheet
    const lifted = css.match(/^\.dtm__person\.is-lifted \{[\s\S]*?\n\}/m)![0];
    expect(lifted).toContain("visibility: hidden");
    expect(lifted).not.toContain("display: none");
    expect(jsx).toContain('isOpen && "is-lifted"');
  });

  it("reverses the same transition on close, rather than unmounting", () => {
    // a closing phase exists, the origin is re-measured, and the unmount waits
    // for the travel to finish
    expect(jsx).toContain('setPhase("closing")');
    expect(jsx).toContain('if (phase !== "closing") return');
    expect(jsx).toContain('addEventListener("transitionend"');
    // a transition that never fires must not strand the sheet open
    expect(jsx).toMatch(/setTimeout\(finish, \d+\)/);
    // and the content retracts before the geometry travels back
    expect(flat).toMatch(
      /\.dtm__stage\[data-dtm-phase="closing"\] \.dtm__morph \{ transition-delay:/,
    );
  });

  it("locks the page behind it and restores the exact scroll position", () => {
    // the measured 0 -> 1041 jump came from focus() scrolling the sheet into
    // view. preventScroll is the fix, and it is required on both moves.
    expect(jsx).toContain("sheetRef.current?.focus({ preventScroll: true })");
    expect(jsx).toContain("triggers.current[slug]?.focus({ preventScroll: true })");
    // the two moves that could scroll the ROSTER must both be guarded. The
    // focus trap's own first/last.focus() are deliberately not - moving focus
    // inside a scrollable sheet should bring the target into view.
    expect(jsx).not.toMatch(/(triggers\.current\[[^\]]+\]|sheetRef\.current)\?\.focus\(\)/);
    expect(jsx).toContain('html.style.overflow = "hidden"');
    expect(jsx).toContain("html.style.overflow = prev");
    expect(jsx).toContain("scrollAt.current = window.scrollY");
    expect(jsx).toContain("window.scrollTo({ top: y");
  });

  it("is a dialog, and holds the keyboard while it is up", () => {
    expect(jsx).toContain('role="dialog"');
    expect(jsx).toContain('aria-modal="true"');
    expect(jsx).toContain('e.key === "Escape"');
    expect(jsx).toContain('if (e.key !== "Tab") return');
    expect(jsx).toContain("aria-expanded={isOpen}");
    expect(jsx).toContain("tabIndex={-1}");
  });

  it("does not depend on a popstate that may never arrive", () => {
    // history.back() is not reliably followed by a popstate here - the router
    // rewrites the URL right after our pushState, and the back is sometimes
    // swallowed. The close therefore runs locally and the URL is handed back
    // alongside it, rather than as its trigger.
    const c = jsx.slice(jsx.indexOf("const close = useCallback("));
    const body = c.slice(0, c.indexOf("\n  }, ["));
    expect(body).toContain("window.history.back()");
    expect(body).toContain("beginClose(slug)");
    // no early return between the two: the close is not conditional on the pop
    const back = body.indexOf("window.history.back()");
    const begin = body.indexOf("beginClose(slug)");
    expect(begin).toBeGreaterThan(back);
    expect(body.slice(back, begin)).not.toContain("return;");
    // and a pop of our own can never be mistaken for a Forward into a profile
    expect(jsx).toContain("backPending");
    expect(jsx).toContain("} else if (!ours) {");
  });

  it("gives Back the profile, not the Team page", () => {
    // opening pushes a real entry, so Back closes; stepping replaces it, so
    // prev/next never stack history
    expect(jsx).toContain("window.history.pushState");
    expect(jsx).toContain("window.history.replaceState");
    expect(jsx).toContain('addEventListener("popstate"');
    expect(jsx).toContain('searchParams.set("person"');
    // and the URL never leaves the locale-correct Team route
    expect(jsx).toContain("${url.pathname}${url.search}");
  });

  it("steps between people without collapsing back to the roster", () => {
    // step() leaves the sheet where it is - the phase never leaves "open"
    const step = jsx.slice(jsx.indexOf("const step = (dir: 1 | -1)"));
    const body = step.slice(0, step.indexOf("\n  };"));
    expect(body).toContain('setPhase("open")');
    expect(body).not.toContain('setPhase("closing")');
    expect(body).toContain("window.history.replaceState");
    expect(body).not.toContain("pushState");
  });

  it("opens a deep link centred, without faking a card origin", () => {
    // no origin box, so no travel - openFrom lands straight on "open"
    expect(jsx).toContain('setPhase(origin && !reduced ? "opening" : "open")');
    expect(jsx).toContain("openFrom(q, null, false)");
    // read on the client after hydration, so /team stays statically rendered
    expect(jsx).not.toContain("useSearchParams");
    expect(jsx).toContain('new URLSearchParams(window.location.search).get("person")');
  });

  it("drops the morph under reduced motion but keeps the interaction", () => {
    // a real branch, not a shorter duration
    expect(jsx).toContain("usePrefersReducedMotion");
    expect(jsx).toContain('if (reduced || !origin || phase === "opening")');
    const rm = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    expect(rm.replace(/\s+/g, " ")).toMatch(/\.dtm__morph, \.dtm__backdrop \{ transition: none/);
  });

  it("wears a plain rectangular edge - no torn top, no shadow, no radius", () => {
    const d = css.match(/^\.dtm__dossier \{[\s\S]*?\n\}/m)![0];
    expect(d).not.toContain("box-shadow");
    expect(d).not.toContain("border-radius");
    // the torn edge and the dashed rule under the name are both gone, and
    // neither was replaced by another dashed line
    expect(css).not.toContain(".dtm__tear");
    expect(jsx).not.toContain("dtm__tear");
    // the backdrop darkens a little and does not blur
    const b = css.match(/^\.dtm__backdrop \{[\s\S]*?\n\}/m)![0];
    expect(b).not.toContain("backdrop-filter");
    expect(b).toMatch(/background: rgba\(19, 18, 16, 0\.[12]\d\)/);
  });

  it("uses the site CTA language for close and stepping, not modal buttons", () => {
    expect(css).toContain(".dtm__tcta");
    const tcta = css.match(/\.dtm__tcta::after \{[\s\S]*?\n\}/)![0];
    expect(tcta).toContain("pencil-rule-h.webp");
  });

  it("goes near-full-screen on a phone, same object and same travel", () => {
    const m = css.slice(css.indexOf("@media (max-width: 720px)"));
    expect(m).toContain(".dtm__morph");
    expect(m.replace(/\s+/g, " ")).toMatch(/\.dtm__morph \{ width: calc\(100vw - 20px\)/);
    // dvh, so a phone's collapsing toolbar cannot clip the close control
    expect(m).toContain("100dvh");
  });
});

describe("every profile block is conditional", () => {
  const jsx = read("src/components/dao/TeamContactSheet.tsx");

  it("guards each optional field before rendering it", () => {
    for (const guard of [
      "card.shortStatement &&",
      "card.bio &&",
      "card.expertise.length > 0 &&",
      "card.experience.length > 0 &&",
      "card.credits.length > 0 &&",
      "card.clients.length > 0 &&",
      "card.awards.length > 0 &&",
      "card.education.length > 0 &&",
      "card.languages.length > 0 &&",
      "card.location &&",
      "card.email ||",
      // SUPERSEDED: the link row used to be one block guarded by card.links.
      // The refinement splits it - CONTACT carries email/phone/location, and the
      // professional links are their own column beside it - so the guards are
      // hasContact and professional.length instead.
      "hasContact &&",
      "professional.length > 0 &&",
      "card.portfolioUrl &&",
      "w.length > 0 &&",
    ]) {
      expect(jsx, guard).toContain(guard);
    }
  });

  it("says so, rather than opening onto a void, when a seat has nothing", () => {
    expect(jsx).toContain("!hasContent(card) &&");
    expect(en.daoRoutes.team.profilePending.length).toBeGreaterThan(20);
    expect(ka.daoRoutes.team.profilePending).toMatch(/[Ⴀ-ჿ]/);
  });

  it("builds the professional link row only from the platforms a person has", () => {
    const page = read("src/app/[locale]/team/page.tsx");
    for (const k of ["vimeoUrl", "instagramUrl", "linkedinUrl", "imdbUrl"]) {
      expect(page, k).toContain(`if (p.${k})`);
    }
    // §09/§10: the portfolio and the email are deliberately NOT in that row -
    // the portfolio is its own CTA and the email belongs to CONTACT, so neither
    // is duplicated. They are passed straight through instead.
    expect(page).toContain("portfolioUrl: p.portfolioUrl");
    expect(page).toContain("email: p.email");
    expect(page).toContain("phone: p.phone");
    expect(page).not.toContain('key: "portfolio"');
    expect(page).not.toContain('key: "email"');
  });
});

describe("page introduction and locale", () => {
  it("states the people, not a Meet Our Team banner", () => {
    expect(en.daoRoutes.team.titleLine1).toBe("The people");
    expect(en.daoRoutes.team.titleLine2).toBe("behind the work");
    for (const m of [en, ka]) {
      expect(m.daoRoutes.team.title.toLowerCase()).not.toContain("meet");
      expect(m.daoRoutes.team.intro.length).toBeGreaterThan(30);
    }
    expect(ka.daoRoutes.team.titleLine1).toMatch(/[Ⴀ-ჿ]/);
  });

  it("localises every string the sheet uses", () => {
    const keys = [
      "kicker",
      "titleLine1",
      "titleLine2",
      "intro",
      "provisionalRoster",
      "profilePending",
      "namePending",
      "rolePending",
      "viewProfile",
      "profile",
      "close",
      "previous",
      "nextPerson",
      "biography",
      "practice",
      "experience",
      "credits",
      "clients",
      "awards",
      "education",
      "languages",
      "basedIn",
      "selectedWork",
      "portfolio",
      "email",
    ] as const;
    for (const k of keys) {
      expect(en.daoRoutes.team[k], `en.${k}`).toBeTruthy();
      expect(ka.daoRoutes.team[k], `ka.${k}`).toBeTruthy();
    }
  });
});

describe("Studio keeps its route to the team", () => {
  it("still links to /team from the Studio slate", () => {
    const studio = read("src/app/[locale]/studio/page.tsx");
    expect(studio).toContain('localeHref(locale, "/team")');
    expect(studio).toContain("data-dao-team-cta");
  });
});

/* ------------------------------------------------------------------------- */
/* Refinement pass: one close, smaller portraits, sectioned profile          */
/* ------------------------------------------------------------------------- */

describe("§01 there is exactly one close control", () => {
  const jsx = read("src/components/dao/TeamContactSheet.tsx");
  const css = read("src/app/dao-routes.css");

  it("renders one close, in the top navigation only", () => {
    expect((jsx.match(/onClick=\{\(\) => close\(\)\}/g) || []).length).toBe(1);
    expect(jsx).toContain("dtm__tcta--close");
  });

  it("has no bottom navigation row left, in markup or CSS", () => {
    expect(jsx).not.toContain("dtm__dfoot");
    expect(css).not.toContain("dtm__dfoot");
  });

  it("keeps previous and next beside it", () => {
    expect(jsx).toContain("R.previous");
    expect(jsx).toContain("R.nextPerson");
  });
});

describe("§02 the portrait footprint is reduced, not the picture inside it", () => {
  const css = read("src/app/dao-routes.css");

  it("lays the roster out four to a row and caps the frame", () => {
    const grid = css.match(/^\.dtm__grid \{[\s\S]*?\n\}/m)![0];
    expect(grid).toContain("repeat(4, minmax(0, 1fr))");
    expect(css).toMatch(/\.dtm__grid \.dtm__frame \{\s*max-width: 286px;/);
  });

  it("reduces the layout footprint of the profile portrait", () => {
    const top = css.match(/^\.dtm__dtop \{[\s\S]*?\n\}/m)![0];
    expect(top).toContain("264px minmax(0, 1fr)");
    expect(top).not.toContain("392px");
  });

  it("reduces the mobile roster and profile portraits too", () => {
    const m720 = css.slice(css.indexOf("@media (max-width: 720px)"));
    expect(m720).toContain("80px minmax(0, 1fr)");
    expect(m720).toMatch(/\.dtm__bigframe \{\s*max-width: 214px;/);
  });

  it("keeps the frame thin and complete after the reduction", () => {
    const rule = css.match(/\.dtm__frame::after,\s*\.dtm__wframe::after \{[\s\S]*?\n\}/)![0];
    const flat = rule.replace(/\s+/g, " ");
    // still four layers at the same 6px band - the reduction is layout, not weight
    expect(flat).toContain("mask-size: 100% 6px, 100% 6px, 6px 100%, 6px 100%");
    expect(rule).not.toContain("box-shadow");
  });
});

describe("§03-§12 the profile is a sectioned dossier", () => {
  const jsx = read("src/components/dao/TeamContactSheet.tsx");

  it("carries About, Experience, Practice, Selected Work, Contact and Links", () => {
    for (const k of [
      "R.about",
      "R.experience",
      "R.practice",
      "R.selectedWork",
      "R.contact",
      "R.links",
    ]) {
      expect(jsx, k).toContain(k);
    }
  });

  it("keeps the short overview separate from the biography", () => {
    // the overview sits in the header; ABOUT is its own block strictly below it,
    // and the biography renders inside that block rather than in the header
    const overview = jsx.indexOf("card.shortStatement");
    const about = jsx.indexOf("R.about");
    const bio = jsx.indexOf("{card.bio &&");
    expect(overview).toBeGreaterThan(-1);
    expect(bio).toBeGreaterThan(overview);
    expect(about).toBeGreaterThan(bio);
    // ABOUT and the biography belong to the same block
    expect(about - bio).toBeLessThan(400);
  });

  it("lays Experience out as records that work at any count", () => {
    expect(jsx).toContain("card.experience.map");
    expect(jsx).toContain("dtm__exprole");
    expect(jsx).toContain("dtm__exporg");
    expect(jsx).toContain("dtm__expmeta");
    // each part is optional, so a half-known post still renders
    expect(jsx).toContain("x.organization &&");
    expect(jsx).toContain("x.description &&");
  });

  it("supports a structured experience record in the schema", () => {
    const types = read("src/content/types.ts");
    expect(types).toContain("teamExperienceSchema");
    for (const f of ["role", "organization", "period", "location", "description"]) {
      expect(types, f).toMatch(new RegExp(`${f}:`));
    }
    expect(types).toContain("phone: z.string()");
  });
});

describe("§10/§11 the personal portfolio and the 8th State archive stay separate", () => {
  const jsx = read("src/components/dao/TeamContactSheet.tsx");

  it("opens the portfolio externally, in a new tab, safely", () => {
    const cta = jsx.slice(jsx.indexOf('className="dtm__portfolio"'));
    const block = cta.slice(0, cta.indexOf(">") + 1);
    expect(block).toContain("href={card.portfolioUrl}");
    expect(block).toContain('target="_blank"');
    expect(block).toContain('rel="noopener noreferrer"');
  });

  it("never routes the portfolio into /work", () => {
    const cta = jsx.slice(
      jsx.indexOf('className="dtm__portfolio"'),
      jsx.indexOf("R.viewPortfolio"),
    );
    expect(cta).not.toContain("/work");
    expect(cta).not.toContain("localeHref");
  });

  it("says in its accessible name that it leaves the site", () => {
    expect(jsx).toContain("R.opensExternal");
    expect(en.daoRoutes.team.opensExternal).toMatch(/external/i);
    expect(ka.daoRoutes.team.opensExternal).toMatch(/[Ⴀ-ჿ]/);
  });

  it("hides the CTA entirely when the person has no portfolio", () => {
    expect(jsx).toContain("card.portfolioUrl && (");
  });

  it("keeps Selected Work internal, and labels what it is", () => {
    // Scoped to the work card itself. The CONTACT block further down DOES carry
    // target=_blank, and that is correct there - these links must not.
    const start = jsx.indexOf("R.selectedWork");
    const card = jsx.slice(start, jsx.indexOf("dtm__wmeta", start));
    expect(card).toContain("localeHref(locale, `/work/${p.slug}`)");
    expect(card).not.toContain("target=");
    expect(card).not.toContain("portfolioUrl");
    expect(en.daoRoutes.team.selectedWorkNote).toMatch(/8th State/);
  });
});
