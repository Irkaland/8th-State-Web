"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { up } from "@/lib/cn";

/**
 * /studio-lab v7 IA (contract #10): RESEARCH / EXPERIMENTS / EDUCATION are
 * three equal Field Notes filter states - the mint stroke marks the active
 * one and the cards recompose (400ms UI family). LAB WORK stays a separate
 * destination (/work?category=studio-lab). No two controls share one
 * action. Cards are whole-target interactive: hover lifts the sheet 2px
 * and deepens its shadow; the category marker tints per filter (research =
 * mint, education = yellow, experiment = olive). Clicking a card focuses
 * its filter until real study content exists - nothing is invented.
 */
type LabFilter = "research" | "experiments" | "education";

const LabContext = createContext<{
  filter: LabFilter;
  setFilter: (f: LabFilter) => void;
} | null>(null);

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<LabFilter>("research");
  return <LabContext.Provider value={{ filter, setFilter }}>{children}</LabContext.Provider>;
}

const TINTS: Record<LabFilter, string> = {
  research: "var(--dao-mint)",
  education: "var(--dao-yellow)",
  experiments: "var(--dao-green)",
};

export function LabFilterRow({ locale, messages }: { locale: Locale; messages: Messages }) {
  const ctx = useContext(LabContext)!;
  const R = messages.daoRoutes.lab;
  const filters: { id: LabFilter; label: string }[] = [
    { id: "research", label: R.research },
    { id: "experiments", label: R.experiments },
    { id: "education", label: R.education },
  ];

  const select = (id: LabFilter) => {
    ctx.setFilter(id);
    document.getElementById("field-notes")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="dlb__filterrow" role="group" aria-label={R.fieldNotes}>
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          className="dlb__filter"
          aria-pressed={ctx.filter === f.id}
          onClick={() => select(f.id)}
        >
          {up(f.label)}
          <span className="dao-strike" aria-hidden="true" />
        </button>
      ))}
      <span className="dlb__filtersep" aria-hidden="true">
        /
      </span>
      <Link href={localeHref(locale, "/work?category=studio-lab")} className="dlb__labworklink">
        {up(R.labWork)} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

export function LabNotesGrid({ messages }: { messages: Messages }) {
  const ctx = useContext(LabContext)!;
  const R = messages.daoRoutes.lab;
  const cr = messages.daoRoutes.contentRequired;

  const notes: {
    id: string;
    name: string;
    tag: string;
    filter: LabFilter;
    tall?: boolean;
    star?: boolean;
    rotate: number;
  }[] = [
    { id: "n1", name: R.note1, tag: R.note1Tag, filter: "research", rotate: -1.6, star: true },
    { id: "n2", name: R.note2, tag: R.note2Tag, filter: "education", rotate: 1.2 },
    { id: "n3", name: R.note3, tag: R.note3Tag, filter: "experiments", rotate: 0.8, tall: true },
  ];
  const visible = notes.filter((n) => n.filter === ctx.filter);
  const tint = TINTS[ctx.filter];

  return (
    <div className="dlb__notesgrid dlb__notesgrid--filtered" data-filter={ctx.filter}>
      {visible.map((n, i) => (
        <button
          key={`${ctx.filter}-${n.id}`}
          type="button"
          className="dao-sheet dlb__note dlb__note--card"
          style={{
            transform: `rotate(${n.rotate}deg)`,
            ["--tint" as string]: tint,
            ["--d" as string]: `${i * 120}ms`,
          }}
          onClick={() => ctx.setFilter(n.filter)}
          aria-label={`${n.name} - ${n.tag}`}
        >
          <span className="dlb__noteimg" style={{ aspectRatio: n.tall ? "4/5" : "4/3.4" }} />
          <span className="dlb__notecap">
            <span className="dlb__notename">
              {n.name} - {cr}
            </span>
            <span className="dlb__noteid" style={{ color: "var(--dao-green-ink)" }}>
              <span className="dlb__notedot" aria-hidden="true" />
              {n.tag}
            </span>
          </span>
          {n.star && <span className="dlb__notestar dao-mask" aria-hidden="true" />}
        </button>
      ))}
      {/* the designed CONTENT REQUIRED state keeps the notebook honest */}
      <div className="dlb__annotation" style={{ maxWidth: 380 }}>
        <span className="dao-kicker" style={{ color: "var(--dao-green-ink)" }}>
          {up(R.annotation)}
        </span>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--dao-ink)" }}>
          {cr} - {R.fieldNotesNote}.
        </p>
      </div>
    </div>
  );
}
