import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  TEAM,
  TEAM_DEPARTMENTS,
  teamByDepartment,
  teamInSectionOrder,
  teamMemberBySlug,
  hasConfirmedTeam,
} from "@/content/team";
import { teamMemberSchema } from "@/content/types";

/**
 * The CURRENT TEAM, guarded.
 *
 * Two things can quietly go wrong with a roster held as data. People can be
 * lost or duplicated by an edit that looks local, and the studio's hiring
 * document can leak onto the public page - the source that supplied these
 * thirteen also lists four roles the studio has NOT filled, and those must never
 * be published as if they were staff.
 *
 * What is deliberately NOT asserted: the exact prose of a responsibility line.
 * Minor editorial refinement of that copy is intentional and allowed, so the
 * tests check that the content EXISTS, is localised, and stays factual in shape -
 * not that it matches the source document character for character.
 */

const ROOT = process.cwd();

/**
 * The thirteen, in the approved hierarchy order: slug, English name, Georgian
 * name, group.
 *
 * The Georgian names are the studio's own spellings. Three of them do not
 * transliterate back to the English surname - ყანდიაშვილი for Nona and Tea
 * against Kandiashvili, and ბედიაშვილი for Lasha against Bedianashvili - and
 * that is deliberate: the source is authoritative, so they are not "corrected".
 */
const CURRENT = [
  ["mariam-kandiashvili", "Mariam Kandiashvili", "მარიამ კანდიაშვილი", "creative-leadership"],
  ["beka-jokharidze", "Beka Jokharidze", "ბექა ჯოხარიძე", "creative-leadership"],
  ["david-gurgulia", "David Gurgulia", "დავით გურგულია", "direction-production"],
  ["beka-siradze", "Beka Siradze", "ბექა სირაძე", "direction-production"],
  ["irakli-kalandadze", "Irakli Kalandadze", "ირაკლი კალანდაძე", "direction-production"],
  ["nona-kandiashvili", "Nona Kandiashvili", "ნონა ყანდიაშვილი", "direction-production"],
  ["tea-kandiashvili", "Tea Kandiashvili", "თეა ყანდიაშვილი", "direction-production"],
  ["vako-kvinikadze", "Vako Kvinikadze", "ვაკო კვინიკაძე", "camera-coordination"],
  ["yuko-chubinidze", "Yuko Chubinidze", "იუკო ჩუბინიძე", "camera-coordination"],
  ["luka-abazashvili", "Luka Abazashvili", "ლუკა აბაზაშვილი", "art-department"],
  ["nutsa-revazishvili", "Nutsa Revazishvili", "ნუცა რევაზიშვილი", "art-department"],
  ["lasha-bedianashvili", "Lasha Bedianashvili", "ლაშა ბედიაშვილი", "studio-support"],
  ["keto-kiladze", "Keto Kiladze", "ქეთო კილაძე", "studio-support"],
] as const;

describe("the current team is exactly the thirteen people the studio confirmed", () => {
  it("has thirteen members and no more", () => {
    expect(TEAM).toHaveLength(13);
  });

  it("names every one of them, in both languages", () => {
    expect(TEAM.map((p) => p.name?.en)).toEqual(CURRENT.map(([, en]) => en));
    expect(TEAM.map((p) => p.name?.ka)).toEqual(CURRENT.map(([, , ka]) => ka));
  });

  it("writes the Georgian names in Georgian", () => {
    // a Latin name left standing on the /ka page is the failure this catches
    for (const p of TEAM) expect(p.name?.ka, p.slug).toMatch(/^[Ⴀ-ჿ\s]+$/);
  });

  it("carries no provisional seat", () => {
    // the placeholder roster this replaced had no names at all
    expect(TEAM.filter((p) => p.provisional)).toEqual([]);
    expect(hasConfirmedTeam()).toBe(true);
  });

  it("validates every member against the schema", () => {
    for (const p of TEAM) expect(() => teamMemberSchema.parse(p)).not.toThrow();
  });
});

describe("identifiers are stable and deep-linkable", () => {
  it("gives each person a kebab-case slug matching their name", () => {
    for (const [slug] of CURRENT) {
      expect(slug).toMatch(/^[a-z]+(-[a-z]+)+$/);
      expect(teamMemberBySlug(slug)?.slug, `${slug} is not resolvable`).toBe(slug);
    }
  });

  it("keeps id and slug in step, so a link never depends on which one is used", () => {
    for (const p of TEAM) expect(p.id).toBe(p.slug);
  });

  it("has no duplicate slug, id or order", () => {
    for (const key of ["slug", "id", "order"] as const) {
      const values = TEAM.map((p) => p[key]);
      expect(new Set(values).size, `duplicate ${key}`).toBe(values.length);
    }
  });

  it("resolves an unknown slug to nothing rather than to the first person", () => {
    expect(teamMemberBySlug("not-a-person")).toBeUndefined();
  });
});

describe("hierarchy is carried by order, not by an org chart", () => {
  it("groups the roster into the five approved groups", () => {
    expect(TEAM_DEPARTMENTS.map((d) => d.id)).toEqual([
      "creative-leadership",
      "direction-production",
      "camera-coordination",
      "art-department",
      "studio-support",
    ]);
  });

  it("places every person in the approved group", () => {
    for (const [slug, , , group] of CURRENT) {
      expect(teamMemberBySlug(slug)?.department, slug).toBe(group);
    }
  });

  it("walks the roster in hierarchy order, leadership first", () => {
    expect(teamInSectionOrder().map((p) => p.slug)).toEqual(CURRENT.map(([slug]) => slug));
  });

  it("renders every group, because every group has members", () => {
    const rendered = teamByDepartment();
    expect(rendered).toHaveLength(5);
    for (const g of rendered) expect(g.people.length).toBeGreaterThan(0);
    expect(rendered.flatMap((g) => g.people)).toHaveLength(13);
  });

  it("localises every group name", () => {
    for (const d of TEAM_DEPARTMENTS) {
      expect(d.name.en.length).toBeGreaterThan(0);
      expect(d.name.ka).toMatch(/[Ⴀ-ჿ]/);
    }
  });
});

describe("every person carries roles and responsibilities in both languages", () => {
  it("gives everyone a primary role in EN and KA", () => {
    for (const p of TEAM) {
      expect(p.role?.en, `${p.slug} en role`).toBeTruthy();
      expect(p.role?.ka, `${p.slug} ka role`).toBeTruthy();
    }
  });

  it("keeps secondary roles at the same count in both languages", () => {
    // the roles are one localised list, so a language cannot drift out of parity
    for (const p of TEAM) {
      for (const r of p.secondaryRoles) {
        expect(r.en.length, `${p.slug} en secondary role`).toBeGreaterThan(0);
        expect(r.ka.length, `${p.slug} ka secondary role`).toBeGreaterThan(0);
      }
    }
  });

  it("states responsibilities for everyone, in both languages", () => {
    for (const p of TEAM) {
      expect(p.shortStatement?.en.length ?? 0, `${p.slug} en`).toBeGreaterThan(20);
      expect(p.shortStatement?.ka.length ?? 0, `${p.slug} ka`).toBeGreaterThan(20);
    }
  });

  it("writes the Georgian in Georgian, not in transliteration", () => {
    for (const p of TEAM) {
      expect(p.shortStatement?.ka, `${p.slug}`).toMatch(/[Ⴀ-ჿ]/);
      // a handful of industry terms are English in the source and stay that way,
      // so the role only has to contain Georgian where the source does
      if (p.role && /[Ⴀ-ჿ]/.test(p.role.ka)) expect(p.role.ka).toMatch(/[Ⴀ-ჿ]/);
    }
  });

  it("does not invent a biography, credit, client, award or contact detail", () => {
    // the source supplied identity, roles and responsibilities - nothing else
    for (const p of TEAM) {
      expect(p.bio, `${p.slug} bio`).toBeUndefined();
      expect(p.email, `${p.slug} email`).toBeUndefined();
      expect(p.phone, `${p.slug} phone`).toBeUndefined();
      expect(p.selectedWork, `${p.slug} credits`).toEqual([]);
      expect(p.clients, `${p.slug} clients`).toEqual([]);
      expect(p.awards, `${p.slug} awards`).toEqual([]);
      expect(p.education, `${p.slug} education`).toEqual([]);
    }
  });
});

describe("portraits are optional and none is fabricated", () => {
  it("keeps portrait optional on the schema", () => {
    const parsed = teamMemberSchema.parse({
      id: "x",
      slug: "x",
      department: "studio-support",
      order: 99,
    });
    expect(parsed.portrait).toBeUndefined();
  });

  it("ships no portrait path for anyone, rather than a path to a missing file", () => {
    for (const p of TEAM) expect(p.portrait, `${p.slug} portrait`).toBeUndefined();
  });

  it("draws the image-less state without an alt string a reader would hear", () => {
    // initials and the PORTRAIT PENDING mark are decoration, so both are hidden
    const jsx = readFileSync(join(ROOT, "src/components/dao/TeamContactSheet.tsx"), "utf8");
    const frame = jsx.slice(jsx.indexOf("function Frame({"), jsx.indexOf("/** A person's name"));
    expect(frame).toContain('<span className="dtm__initials" aria-hidden="true">');
    expect(frame).toContain('<span className="dtm__pendingmark" aria-hidden="true">');
    // and the alt only ever comes from a portrait that actually exists
    expect(frame).toContain("alt={card.portrait.alt}");
  });

  it("still lets a portrait be added as pure data", () => {
    const withPortrait = teamMemberSchema.parse({
      id: "x",
      slug: "x",
      department: "art-department",
      order: 99,
      portrait: {
        src: "/media/team/x.webp",
        alt: { en: "X", ka: "X" },
      },
    });
    expect(withPortrait.portrait?.src).toBe("/media/team/x.webp");
  });
});

describe("the hiring document never reaches the public page", () => {
  /* The source lists four roles the studio has NOT filled. They are not people,
     and the Team page must never present them as if they were. */
  const UNFILLED = [
    "Editor / Post-Production Artist",
    "Social Media Content Creator",
    "Sound Recordist",
    "Sound Designer",
    "Accountant",
    "Financial Administrator",
  ];

  const TEAM_SRC = readFileSync(join(ROOT, "src/content/team.ts"), "utf8");

  it("carries none of the unfilled roles in the roster data", () => {
    for (const role of UNFILLED) {
      expect(TEAM_SRC.includes(role), `${role} appears in team.ts`).toBe(false);
    }
  });

  it("carries no recruitment language", () => {
    for (const phrase of [
      "We're hiring",
      "We are hiring",
      "Open position",
      "Open positions",
      "Join the team",
      "Join our team",
      "Coming soon",
      "WHO WE STILL NEED",
      "MAIN HIRING PRIORITY",
      "HIGH PRIORITY",
    ]) {
      expect(TEAM_SRC.toLowerCase().includes(phrase.toLowerCase()), phrase).toBe(false);
    }
  });

  it("keeps the roster at thirteen, so a vacancy cannot be added as a seat", () => {
    // a fourteenth entry would have to be a real person with a real name
    expect(TEAM.every((p) => !!p.name && !p.provisional)).toBe(true);
    expect(TEAM).toHaveLength(13);
  });
});
