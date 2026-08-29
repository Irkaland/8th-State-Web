import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import en from "@/i18n/messages/en";
import ka from "@/i18n/messages/ka";

/**
 * §P8: the structural facts this phase established.
 *
 * Two kinds of dead weight were removed, and both can come back by accident:
 * a deleted module gets re-imported by something that "needs a schema", and a
 * deleted translation key gets pasted back when someone copies a neighbouring
 * group. Neither is caught by a build - an unused module compiles perfectly
 * well, and an unused key type-checks in both locales.
 *
 * What is deliberately NOT asserted here: file lengths. The two large client
 * components were left intact on purpose, and a line-count test would turn
 * that judgement into a threshold nobody can move without a reason.
 */

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const walk = (dir: string, out: string[] = []): string[] => {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const entry of readdirSync(abs)) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(rel);
  }
  return out;
};

describe("§P8 removed modules stay removed", () => {
  /* Each was proved unreachable from every Next entry point before deletion:
     the legacy five-step brief system, and two orphans with no importer at
     all. The live brief at /start-a-project shares nothing with them. */
  const DELETED = [
    "src/lib/brief-schema.ts",
    "src/lib/draft.ts",
    "src/lib/reference.ts",
    "src/content/brief-options.ts",
    "src/content/taxonomy.ts",
    "src/lib/use-callback-ref.ts",
  ];

  for (const path of DELETED) {
    it(`${path} is gone`, () => {
      expect(existsSync(join(ROOT, path)), `${path} came back`).toBe(false);
    });
  }

  it("nothing imports the removed modules", () => {
    const names = DELETED.map((p) => p.replace(/^src\//, "").replace(/\.ts$/, ""));
    const offenders: string[] = [];
    for (const file of [...walk("src"), ...walk("tests")]) {
      const text = read(file);
      for (const name of names) {
        const bare = name.split("/").pop()!;
        const re = new RegExp(`from\\s+["'](@/${name}|[./]+${bare})["']`);
        if (re.test(text)) offenders.push(`${file} -> ${name}`);
      }
    }
    expect(offenders, offenders.join(", ")).toEqual([]);
  });

  it("the live brief still stands on its own imports", () => {
    // it takes a message slice and nothing from the deleted schema/draft layer
    const brief = read("src/components/dao/DaoBrief.tsx");
    expect(brief).toContain("BriefMessages");
    expect(brief).not.toMatch(/brief-schema|@\/lib\/draft|brief-options|@\/lib\/reference/);
  });
});

describe("§P8 removed translation keys stay removed", () => {
  /* A representative sample of the 107 leaves taken out - the legacy brief
     form's field/hint/validation vocabulary and the superseded homepage
     eyebrows. The compiler proved no source read them; these hold the line. */
  const GONE: [string, string[]][] = [
    ["brief.fields", ["fullName", "company", "countryCity", "projectType"]],
    ["brief.hints", ["single", "multiple", "ifKnown", "budgetNote"]],
    ["brief.validation", ["required", "minName", "consent"]],
    ["brief.buttons", ["continue", "edit", "submitting"]],
    ["home.hero", ["eyebrow", "showreel"]],
    ["common", ["exploreWork", "viewCaseStudy", "requestPrivatePortfolio"]],
  ];

  const at = (dict: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], dict);

  for (const [group, keys] of GONE) {
    it(`${group} no longer carries ${keys.length} dead keys`, () => {
      for (const locale of [["en", en], ["ka", ka]] as const) {
        const node = at(locale[1], group) as Record<string, unknown> | undefined;
        if (!node) continue; // the whole group went with them
        for (const k of keys) {
          expect(node[k], `${locale[0]}.${group}.${k} came back`).toBeUndefined();
        }
      }
    });
  }

  it("both locales still describe exactly the same shape", () => {
    // deleting from one locale only is the failure mode that matters most
    const paths = (o: unknown, prefix = ""): string[] => {
      if (o === null || typeof o !== "object") return [prefix];
      if (Array.isArray(o)) return [`${prefix}[]`];
      return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
        paths(v, prefix ? `${prefix}.${k}` : k),
      );
    };
    const e = paths(en).sort();
    const g = paths(ka).sort();
    expect(e.filter((p) => !g.includes(p)), "missing from ka").toEqual([]);
    expect(g.filter((p) => !e.includes(p)), "missing from en").toEqual([]);
  });

  it("keeps the keys that are read indirectly", () => {
    // daoRoutes.team.* is indexed by a computed key list in another unit test;
    // the compiler caught this when they were first proposed for deletion
    for (const k of ["biography", "basedIn", "roleLabel", "countLabel"] as const) {
      expect(en.daoRoutes.team[k], `en.daoRoutes.team.${k}`).toBeTruthy();
      expect(ka.daoRoutes.team[k], `ka.daoRoutes.team.${k}`).toBeTruthy();
    }
  });
});
