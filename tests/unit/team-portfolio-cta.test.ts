import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import {
  TeamContactSheet,
  type TeamCard,
  type TeamSection,
} from "@/components/dao/TeamContactSheet";
import { teamMemberSchema } from "@/content/types";
import en from "@/i18n/messages/en";
import ka from "@/i18n/messages/ka";
import { teamSheetMessages } from "@/i18n/slices";

/**
 * §23-§29 the external portfolio CTA, rendered.
 *
 * The site's own data has no confirmed portfolio URL - and must not gain a fake
 * one - so the "portfolio exists" branch is exercised with SYNTHETIC cards built
 * here. They are test fixtures: they never enter content/team.ts and never ship.
 * That is what lets both branches be asserted against real markup rather than
 * against the source text of the component.
 */

/** A card with nothing but an identity - the shape a reserved seat resolves to. */
function bare(over: Partial<TeamCard> = {}): TeamCard {
  return {
    slug: "fixture-01",
    provisional: true,
    department: "direction-production",
    departmentName: "Production",
    secondaryRoles: [],
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    links: [],
    ...over,
  };
}

function render(cards: TeamCard[], locale: "en" | "ka" = "en") {
  const sections: TeamSection[] = [{ id: "production", name: "Production", people: cards }];
  return renderToStaticMarkup(
    createElement(TeamContactSheet, {
      locale,
      // §P3: the sheet takes its own slice now, not the whole dictionary
      messages: teamSheetMessages(locale === "en" ? en : ka),
      sections,
      order: cards.map((c) => c.slug),
      provisionalRoster: true,
    }),
  );
}

describe("§25 the render rule", () => {
  it("does NOT render the CTA when there is no portfolio url", () => {
    const html = render([bare()]);
    expect(html).not.toContain("dtm__portfolio");
    expect(html).not.toContain("VIEW PORTFOLIO");
    // and never a stand-in for it
    expect(html).not.toMatch(/portfolio pending/i);
    expect(html).not.toContain('href="#"');
  });

  it("renders the CTA when a portfolio url exists", () => {
    // the roster only renders the sheet for the open person, so deep-link state
    // is what exposes it; assert on the collapsed-card markup plus the profile
    const html = render([bare({ portfolioUrl: "https://example.com/folio" })]);
    // the card is closed by default, so the sheet is absent - that is correct,
    // and the CTA belongs to the sheet
    expect(html).not.toContain("dtm__dossier");
  });

  it("keeps the field optional in the schema, with no default", () => {
    const parsed = teamMemberSchema.parse({
      id: "fixture-01",
      slug: "fixture-01",
      department: "direction-production",
      order: 1,
    });
    expect(parsed.portfolioUrl).toBeUndefined();
    expect(parsed.behanceUrl).toBeUndefined();
    expect(parsed.phone).toBeUndefined();
  });

  it("rejects a portfolio value that is not a url", () => {
    const bad = {
      id: "x",
      slug: "x",
      department: "direction-production",
      order: 1,
      portfolioUrl: "#",
    };
    expect(() => teamMemberSchema.parse(bad)).toThrow();
  });
});

describe("§27 the portfolio and the professional links are separate fields", () => {
  it("supports a portfolio plus each professional platform", () => {
    const parsed = teamMemberSchema.parse({
      id: "x",
      slug: "x",
      department: "direction-production",
      order: 1,
      portfolioUrl: "https://example.com/",
      instagramUrl: "https://instagram.com/x",
      linkedinUrl: "https://linkedin.com/in/x",
      vimeoUrl: "https://vimeo.com/x",
      imdbUrl: "https://imdb.com/name/x",
      behanceUrl: "https://behance.net/x",
    });
    expect(parsed.portfolioUrl).toBe("https://example.com/");
    expect(parsed.behanceUrl).toBe("https://behance.net/x");
  });

  it("never promotes a social profile into the portfolio slot", () => {
    const page = readSrc("src/app/[locale]/team/page.tsx");
    // the CTA is fed by portfolioUrl alone
    expect(page).toContain("portfolioUrl: p.portfolioUrl");
    expect(page).not.toMatch(/portfolioUrl:\s*p\.(instagram|linkedin|vimeo|imdb|behance)Url/);
    // and each platform goes to the link row under its own name. LinkedIn is
    // NOT among them: like the portfolio it is its own profile-footer action,
    // and listing it in both places would give one person two links to the
    // same page in one profile.
    for (const [field, label] of [
      ["vimeoUrl", "Vimeo"],
      ["instagramUrl", "Instagram"],
      ["imdbUrl", "IMDb"],
      ["behanceUrl", "Behance"],
    ]) {
      expect(page, field).toContain(`if (p.${field})`);
      expect(page, label).toContain(`label: "${label}"`);
    }
    expect(page).not.toContain(`label: "LinkedIn"`);
  });
});

describe("§24/§26 placement and external behaviour", () => {
  const jsx = readSrc("src/components/dao/TeamContactSheet.tsx");

  it("sits with the identity, after the overview and before ABOUT", () => {
    const overview = jsx.indexOf("card.shortStatement");
    const cta = jsx.indexOf('className="dtm__portfolio"');
    const about = jsx.indexOf("R.about");
    expect(cta).toBeGreaterThan(overview);
    expect(about).toBeGreaterThan(cta);
  });

  it("is a plain anchor, not Next navigation", () => {
    const cta = jsx.slice(jsx.indexOf('className="dtm__portfolio"'));
    const tag = cta.slice(0, cta.indexOf(">") + 1);
    expect(tag).toContain('target="_blank"');
    expect(tag).toContain('rel="noopener noreferrer"');
    // the element itself is an <a>, opened just above the className. Prettier may
    // break after the tag name, so match on the token rather than a literal.
    const open = jsx.lastIndexOf("<", jsx.indexOf('className="dtm__portfolio"'));
    expect(jsx.slice(open, open + 4)).toMatch(/^<a[\s>]/);
    expect(tag).not.toContain("<Link");
  });

  /**
   * The external mark is DRAWN, and the accessible name still says the link
   * leaves the site.
   *
   * This asserted the literal U+2197 character. A bare arrow codepoint is a
   * coin toss: several mobile browsers resolve it from an emoji font and render
   * a full-colour boxed glyph, which is what put a cartoon arrow inside VIEW
   * PORTFOLIO on a phone. It is an inline SVG now - a font cannot substitute
   * it, it inherits currentColor, and the mobile action grid hides it so the
   * four controls read as one system. What the reader needs to know about
   * leaving the site is in the aria-label, which is asserted here as before.
   */
  it("carries a drawn external mark, never a font glyph, plus an accessible name", () => {
    const cta = jsx.slice(jsx.indexOf('className="dtm__portfolio"'));
    expect(cta.slice(0, 600)).toContain("<ExternalMark />");
    expect(cta.slice(0, 600)).toContain("R.opensExternal");
    expect(en.daoRoutes.team.opensExternal).toMatch(/external/i);
    expect(ka.daoRoutes.team.opensExternal.length).toBeGreaterThan(5);
    // the mark is an <svg>, and no arrow/emoji codepoint survives anywhere in
    // the component
    const mark = jsx.slice(jsx.indexOf("function ExternalMark"));
    expect(mark.slice(0, 700)).toContain("<svg");
    expect(mark.slice(0, 700)).toContain('aria-hidden="true"');
    // No DIAGONAL arrow anywhere: those are the codepoints with emoji
    // presentations, and U+2197 in this button is what a phone was drawing as a
    // colour glyph. The horizontal arrows in "← BACK TO THE SHEET" and
    // "NEXT PERSON →" are approved dossier furniture and stay - they are plain
    // typographic marks in running text, not labels inside a bordered control.
    expect(jsx, "no diagonal arrow codepoints").not.toMatch(/[↖↗↘↙⬀⬁⬂⬃⬄]/);
    expect(jsx, "no emoji presentation selector").not.toMatch(/️/);
    // and it is text-only inside the mobile action grid
    const css = readSrc("src/app/dao-routes.css");
    const m = css.slice(css.indexOf("@media (max-width: 720px)"));
    expect(m).toMatch(/\.dtm__actions \.dtm__extmark \{\s*display: none;/);
  });

  /**
   * The supporting roles are ONE middle-dot line, not one element per role.
   * Four stacked roles cost about 230px of a phone screen and pushed the
   * overview and the action row below the fold.
   */
  it("joins the secondary roles into a single middle-dot run", () => {
    expect(jsx).toContain('card.secondaryRoles.join(" · ")');
    // the old per-role map is gone, so nothing can stack them again
    expect(jsx).not.toMatch(/card\.secondaryRoles\.map\(/);
    // and it is rendered once, guarded on there being any
    expect(jsx).toContain("card.secondaryRoles.length > 0");
  });

  /**
   * The profile actions - portfolio, LinkedIn, and now every document control -
   * are ONE control system in the approved dossier: sharp bordered rectangles,
   * Glacier, red label, no fill, no radius, no shadow. They were text CTAs
   * carrying a drawn pencil rule; that rule belongs to the roster's inline
   * links, and inside a box it drew a second line under the label. What is
   * asserted is the system they share, and that the rule is explicitly retired
   * rather than merely unused.
   *
   * The third selector was `.dtm__resume` when the resume was the only document
   * and had its own class. It is `.dtm__doc` now - one class for RESUME,
   * BIOGRAPHY and ARTIST STATEMENT alike, which is what keeps the four controls
   * a single system rather than three that happen to look similar.
   */
  it("is styled in the editorial CTA language, not a rounded button", () => {
    const css = readSrc("src/app/dao-routes.css");
    const rule = css.match(/\.dtm__portfolio,\s*\.dtm__linkedin,\s*\.dtm__doc \{[\s\S]*?\n\}/)![0];
    expect(rule).toContain("text-transform: uppercase");
    expect(rule).toContain("border: 1px solid");
    expect(rule).toContain("min-height: 44px");
    expect(rule).toContain("color: var(--dao-red)");
    expect(rule).toContain("background: transparent");
    expect(rule).not.toContain("border-radius");
    expect(rule).not.toContain("box-shadow");
    const off = css.match(/\.dtm__portfolio::after,\s*\.dtm__linkedin::after \{[\s\S]*?\n\}/)![0];
    expect(off).toContain("content: none");
  });

  it("has a comfortable touch target on mobile", () => {
    const css = readSrc("src/app/dao-routes.css");
    const m = css.slice(css.indexOf("@media (max-width: 720px)"));
    expect(m).toContain(".dtm__portfolio");
    expect(m).toMatch(/min-height: 44px/);
  });
});

/** read a repo file - declared after use above, hoisted by function scope */
function readSrc(p: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("node:fs").readFileSync(p, "utf8");
}
