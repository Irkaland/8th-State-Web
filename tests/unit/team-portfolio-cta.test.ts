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

  it("carries the arrow and an accessible name that says it leaves the site", () => {
    const cta = jsx.slice(jsx.indexOf('className="dtm__portfolio"'));
    expect(cta.slice(0, 600)).toContain("↗");
    expect(cta.slice(0, 600)).toContain("R.opensExternal");
    expect(en.daoRoutes.team.opensExternal).toMatch(/external/i);
    expect(ka.daoRoutes.team.opensExternal.length).toBeGreaterThan(5);
  });

  it("is styled in the editorial CTA language, not a rounded button", () => {
    const css = readSrc("src/app/dao-routes.css");
    // the LinkedIn action is a peer of the portfolio and shares its rule
    const rule = css.match(/\.dtm__portfolio,\s*\.dtm__linkedin,\s*\.dtm__jump \{[\s\S]*?\n\}/)![0];
    expect(rule).toContain("var(--dao-f-ui)");
    expect(rule).toContain("text-transform: uppercase");
    expect(rule).not.toContain("border-radius");
    expect(rule).not.toContain("background:");
    // the pencil mask is on the rule shared with the secondary jump link...
    const shared = css.match(
      /\.dtm__portfolio::after,\s*\.dtm__linkedin::after,\s*\.dtm__jump::after \{[\s\S]*?\n\}/,
    )![0];
    expect(shared).toContain("pencil-rule-h.webp");
    expect(shared).toContain("height: 2px");
    // ...and the portfolio overrides it to sit drawn, in red, at rest - which is
    // what makes it read as the primary CTA rather than a hover affordance
    const drawn = css.match(/\.dtm__portfolio::after,\s*\.dtm__linkedin::after \{[\s\S]*?\n\}/)![0];
    expect(drawn).toContain("clip-path: inset(0 0 0 0)");
    expect(drawn).toContain("var(--dao-red)");
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
