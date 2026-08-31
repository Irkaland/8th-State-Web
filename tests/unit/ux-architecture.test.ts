import { describe, expect, it, beforeEach } from "vitest";
import { WK_CTX_KEY, originCard, parseWorkContext, workBackHref } from "@/lib/work-context";
import {
  applyRouteFocus,
  clearFocusIntent,
  setFocusIntent,
  takeFocusIntent,
} from "@/lib/route-focus";
import {
  WHAT_WE_MAKE,
  serviceHref,
  whatWeMakeCapabilitiesAreCanonical,
} from "@/content/what-we-make";
import { DAO_SERVICES, isCapabilityId } from "@/content/dao-services";
import en from "@/i18n/messages/en";
import ka from "@/i18n/messages/ka";
import { readSource } from "./read-source";

/**
 * Source with its comments removed.
 *
 * Several of these assertions are "this mechanism is gone", and the files that
 * removed it say so in prose - dao.css explains why the return tab was retired,
 * MastheadBack explains why it is never history.back(). Reading the comments
 * would make those explanations fail the very rules they document, so the
 * assertions read the CODE.
 */
const code = (path: string) =>
  readSource(path)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

/**
 * FINAL UX ARCHITECTURE - the parts that are decidable without a browser.
 *
 * The journeys themselves (history, focus order, the menu, the contextual
 * backs) are exercised in tests/e2e/ux-architecture.spec.ts. What lives here is
 * the logic those journeys are built on, tested directly so a failure names the
 * rule rather than the symptom.
 */

/* ------------------------------------------------ §01 wk-ctx ------------- */

describe("§01 Work <-> Project return context", () => {
  it("keeps exactly the two fields it is allowed to keep", () => {
    const ctx = parseWorkContext(JSON.stringify({ search: "?category=photography", slug: "a" }));
    expect(ctx).toEqual({ search: "?category=photography", slug: "a" });
    // scrollY is the thing this design deliberately does NOT store, so even a
    // stamp that carries one must not surface it
    const withScroll = parseWorkContext(JSON.stringify({ search: "", slug: "a", scrollY: 1200 }));
    expect(Object.keys(withScroll ?? {}).sort()).toEqual(["search", "slug"]);
  });

  it("refuses anything that is not ours, without throwing", () => {
    for (const raw of [
      null,
      "",
      "not json",
      "null",
      "[]",
      '"a string"',
      JSON.stringify({ slug: "a" }),
      JSON.stringify({ search: "?x=1" }),
      JSON.stringify({ search: "?x=1", slug: "" }),
      // a "search" that is not a query string is not something we will paste
      // into an href
      JSON.stringify({ search: "https://evil.example", slug: "a" }),
      JSON.stringify({ search: 5, slug: "a" }),
    ]) {
      expect(parseWorkContext(raw as string | null), String(raw)).toBeNull();
    }
  });

  it("carries the filter back, in the reader's own locale", () => {
    const ctx = { search: "?capability=photography", slug: "aom" };
    expect(workBackHref("/work", ctx)).toBe("/work?capability=photography");
    // the query is locale-free, so it survives a mid-journey EN/KA switch
    expect(workBackHref("/ka/work", ctx)).toBe("/ka/work?capability=photography");
  });

  it("falls back to the canonical archive for a direct entry", () => {
    expect(workBackHref("/work", null)).toBe("/work");
    expect(workBackHref("/ka/work", null)).toBe("/ka/work");
    expect(workBackHref("/work", { search: "", slug: "aom" })).toBe("/work");
  });

  it("anchors the originating card only while it IS the project on screen", () => {
    const ctx = { search: "?category=film-video", slug: "aom" };
    expect(originCard("aom", ctx)).toBe("aom");
    // after prev/next the reader has left their origin, so the filter goes back
    // and the card anchor does not - anything else would be a fabricated context
    expect(originCard("volvo", ctx)).toBeNull();
    expect(originCard("aom", null)).toBeNull();
  });

  it("uses one key, and it is the documented one", () => {
    expect(WK_CTX_KEY).toBe("wk-ctx");
    // and nothing else in the app invents a second one
    const archive = readSource("src/components/dao/WorkArchive.tsx");
    const back = readSource("src/components/dao/WorkBackLink.tsx");
    for (const [name, src] of [
      ["WorkArchive", archive],
      ["WorkBackLink", back],
    ] as const) {
      expect(src, `${name} must not hardcode the key`).toContain("WK_CTX_KEY");
      expect(src, `${name} must not store a scroll offset`).not.toMatch(/scrollY:/);
    }
  });

  it("never scrolls in response to a history move", () => {
    // §01 is explicit: browser Back restores URL and scroll natively, and we do
    // not interfere. The card anchor is armed by the "<- WORK" control only.
    const archive = readSource("src/components/dao/WorkArchive.tsx");
    expect(archive).toContain("anchor");
    expect(archive).not.toMatch(/popstate/);
  });
});

/* ----------------------------------------------- §10 route focus --------- */

describe("§10 route-change focus", () => {
  beforeEach(() => {
    clearFocusIntent();
    document.body.innerHTML = "";
  });

  it("defaults to main, and holds a declared intent for the navigation it belongs to", () => {
    expect(takeFocusIntent()).toBe("main");
    setFocusIntent("heading");
    // The intent EXPIRES rather than being consumed by the first reader. During
    // a navigation the outgoing shell and the incoming one can both observe the
    // new pathname, so a consume-on-read intent is taken by whichever effect
    // runs first and the other - the one that belongs to the page now on screen -
    // is left with the default. That is exactly how project prev/next ended up
    // focusing <main> instead of the new title.
    expect(takeFocusIntent()).toBe("heading");
    expect(takeFocusIntent()).toBe("heading");
    clearFocusIntent();
    expect(takeFocusIntent()).toBe("main");
  });

  it("focuses main for ordinary navigation", () => {
    document.body.innerHTML = `<main id="main" tabindex="-1"><h1>Title</h1></main>`;
    const target = applyRouteFocus(document, "main");
    expect(target?.id).toBe("main");
    expect(document.activeElement).toBe(target);
  });

  it("focuses the new H1 for a project step, and gives the tabindex back on blur", () => {
    document.body.innerHTML = `<main id="main" tabindex="-1"><h1>Project</h1></main>`;
    const target = applyRouteFocus(document, "heading");
    expect(target?.tagName).toBe("H1");
    expect(document.activeElement).toBe(target);
    // The attribute has to STAY while the element holds focus. Removing it
    // immediately makes the element unfocusable, so the browser drops focus to
    // <body> - which is how "focus the new title" ended up focusing nothing.
    expect(target?.hasAttribute("tabindex")).toBe(true);
    target?.blur();
    expect(
      target?.hasAttribute("tabindex"),
      "a heading must not keep a tabindex once focus has left",
    ).toBe(false);
  });

  it("moves nothing when the reader has not conceptually moved", () => {
    document.body.innerHTML = `<main id="main" tabindex="-1"><h1>Title</h1></main>`;
    const before = document.activeElement;
    expect(applyRouteFocus(document, "none")).toBeNull();
    expect(document.activeElement).toBe(before);
  });

  it("falls back to main when a route has no H1 of its own", () => {
    document.body.innerHTML = `<main id="main" tabindex="-1"><p>no heading</p></main>`;
    expect(applyRouteFocus(document, "heading")?.id).toBe("main");
  });

  it("declines to act on a history traversal", () => {
    expect(readSource("src/lib/route-focus.ts")).toContain('addEventListener("popstate"');
    expect(readSource("src/components/dao/RouteFocus.tsx")).toContain("if (cameFromHistory())");
  });

  it("keeps both guards in module scope, because the shell remounts", () => {
    /**
     * A param-only navigation - /work/a to /work/b - builds a new cache node
     * for the segment, so the shell REMOUNTS. Held in refs, the first-render
     * guard suppressed every route change (focus never moved at all) and the
     * popstate flag was destroyed by the navigation it described. The lifetime
     * of both questions is the document, so that is where they live.
     */
    const wiring = readSource("src/components/dao/RouteFocus.tsx");
    expect(wiring, "a first-render ref cannot survive a remount").not.toMatch(/firsts*=s*useRef/);
    expect(wiring, "a popstate ref cannot survive a remount").not.toMatch(/fromHistorys*=s*useRef/);
    expect(readSource("src/lib/route-focus.ts")).toContain("export function isFirstPaint");
  });
});

/* ------------------------------------------- §03 ReturnTab is gone ------- */

describe("§03 one navigation vocabulary", () => {
  it("has no ReturnTab component, usage, style or message left", () => {
    expect(() => readSource("src/components/dao/ReturnTab.tsx")).toThrow();
    for (const file of [
      "src/components/dao/DaoShell.tsx",
      "src/components/dao/DaoChrome.tsx",
      "src/app/dao.css",
      "src/app/dao-routes.css",
    ]) {
      expect(code(file), `${file} still uses the return tab`).not.toMatch(/returntab|ReturnTab/i);
    }
    // the two labels it needed ("Home" / "Back") retire with it - a masthead
    // back names its real parent instead
    expect(JSON.stringify(en.daoRoutes)).not.toContain("returnTab");
    expect(JSON.stringify(ka.daoRoutes)).not.toContain("returnTab");
  });

  it("never resolves a contextual back through history", () => {
    expect(readSource("src/components/dao/MastheadBack.tsx")).toContain("next/link");
    expect(
      code("src/components/dao/MastheadBack.tsx"),
      "a contextual back is a route, not an undo",
    ).not.toMatch(/history\.back|router\.back/);
  });
});

/* ------------------------------------------- §02 footer placement -------- */

describe("§02 the footer is a decision, not a template", () => {
  /**
   * Does this route pass DaoShell the `footer` prop?
   *
   * Read from the opening <DaoShell> tag specifically, and however prettier has
   * chosen to wrap it that day. A bare search for the word would also match the
   * <footer> ELEMENT that Contact and the homepage render as their own designed
   * ending - which is precisely the distinction this test exists to make.
   */
  const has = (route: string) => {
    const src = code(route);
    const at = src.indexOf("<DaoShell");
    if (at < 0) return false;
    const tag = src.slice(at, src.indexOf(">", at));
    return /(\s)footer(\s|$)/.test(tag);
  };

  it("is on the eight informational and archival route families", () => {
    for (const route of [
      "src/app/[locale]/work/page.tsx",
      "src/app/[locale]/work/[slug]/page.tsx",
      "src/app/[locale]/services/page.tsx",
      "src/app/[locale]/georgia-production/page.tsx",
      "src/app/[locale]/process/page.tsx",
      "src/app/[locale]/studio-lab/page.tsx",
      "src/app/[locale]/studio-lab/[course]/page.tsx",
      "src/components/dao/LegalPage.tsx",
    ]) {
      expect(has(route), `${route} should carry the slim footer`).toBe(true);
    }
  });

  it("is absent from every page that already ends on something designed", () => {
    for (const route of [
      "src/app/[locale]/page.tsx",
      "src/app/[locale]/studio/page.tsx",
      "src/app/[locale]/team/page.tsx",
      "src/app/[locale]/start-a-project/page.tsx",
      "src/app/[locale]/contact/page.tsx",
      "src/app/[locale]/not-found.tsx",
    ]) {
      expect(has(route), `${route} has its own ending and must not be templated`).toBe(false);
    }
  });
});

/* --------------------------------------- §28/§29 What We Make ------------ */

describe("§28 the five top-level services", () => {
  it("are exactly the approved five, in the approved order", () => {
    expect(WHAT_WE_MAKE.map((s) => s.name.en)).toEqual([
      "Audiovisual Production",
      "Production Design",
      "Photography",
      "Creative & Art Direction",
      "Graphic & Broadcast Design",
    ]);
    expect(WHAT_WE_MAKE.map((s) => s.n)).toEqual(["01", "02", "03", "04", "05"]);
  });

  it("is bilingual everywhere, with no English left in the Georgian", () => {
    for (const s of WHAT_WE_MAKE) {
      for (const [field, text] of [
        ["name", s.name.ka],
        ["keywords", s.keywords.ka],
        ["keywordsShort", s.keywordsShort.ka],
        ["plate label", s.plate.label.ka],
      ] as const) {
        expect(text, `${s.id} ${field} is not Georgian`).toMatch(/[Ⴀ-ჿ]/);
      }
    }
  });

  it("joins the canonical taxonomy instead of duplicating it", () => {
    expect(whatWeMakeCapabilitiesAreCanonical()).toBe(true);
    for (const s of WHAT_WE_MAKE) {
      if (s.capability) expect(isCapabilityId(s.capability)).toBe(true);
    }
  });

  it("never ships a placeholder destination", () => {
    for (const s of WHAT_WE_MAKE) {
      const href = serviceHref(s);
      expect(href, `${s.id} routes nowhere real`).toMatch(/^\/services(#[a-z-]+)?$/);
      expect(href, `${s.id} still points at the prototype placeholder`).not.toBe("#services");
    }
  });

  it("anchors four rows on a real capability and is honest about the fifth", () => {
    const anchored = WHAT_WE_MAKE.filter((s) => s.capability);
    expect(anchored).toHaveLength(4);
    // GRAPHIC & BROADCAST DESIGN has no capability in the approved nine, and
    // /services is out of scope for redesign - so it routes to the catalogue
    // rather than to an anchor that would have to be invented
    const unanchored = WHAT_WE_MAKE.filter((s) => !s.capability);
    expect(unanchored.map((s) => s.id)).toEqual(["graphic-broadcast-design"]);
    expect(serviceHref(unanchored[0])).toBe("/services");
  });

  it("has a real anchor waiting on /services for every one it claims", () => {
    const page = readSource("src/app/[locale]/services/page.tsx");
    for (const s of WHAT_WE_MAKE) {
      if (!s.capability) continue;
      const cap = DAO_SERVICES.find((c) => c.id === s.capability)!;
      // the anchors are rendered from the canonical id, so the page has to be
      // emitting an id for the capability this row points at
      expect(page, `no anchor rendered for ${cap.id}`).toMatch(/id=\{(svc\("\d+"\)|s|cap)\.id\}/);
    }
    // and the offset for the fixed chrome is declared once
    expect(readSource("src/app/dao-routes.css")).toContain(".dsv [id] {");
  });

  it("uses real archive stills for its plates", () => {
    for (const s of WHAT_WE_MAKE) {
      expect(s.plate.src, `${s.id} plate`).toMatch(/^\/media\/[a-z0-9-]+\.jpg$/);
    }
  });
});
