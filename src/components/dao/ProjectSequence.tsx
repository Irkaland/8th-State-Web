"use client";

import Link from "next/link";
import { cn, up } from "@/lib/cn";
import { setFocusIntent } from "@/lib/route-focus";

export type SequenceNeighbour = { slug: string; title: string; href: string };

/**
 * Project PREV / NEXT (FINAL UX §05) - a FINITE sequence, never a carousel.
 *
 * Work is an editorial archive, so it has a first entry and a last one and the
 * controls say so: the first project offers only NEXT, the last offers PREV
 * plus an explicit end-of-archive route back to /work. The reader always knows
 * where they are in the run - `PRJ-04 / 12` - which a wrapping carousel can
 * never tell them.
 *
 * Team keeps its wrap, deliberately: a roster is a wheel with no first or last
 * person, an archive is a sequence with both. The asymmetry is the point.
 *
 * §10: moving between projects focuses the NEW project's H1 rather than <main>,
 * because the whole change is the title - the reader is comparing entries, not
 * arriving somewhere new. The intent is declared here and consumed by
 * RouteFocus once the route has actually changed.
 */
export function ProjectSequence({
  prev,
  next,
  position,
  positionLabel,
  labels,
  workHref,
}: {
  prev: SequenceNeighbour | null;
  next: SequenceNeighbour | null;
  /** the printed position, e.g. "PRJ-04 / 12" */
  position: string;
  /** the same thing said in words, for a screen reader */
  positionLabel: string;
  labels: { previous: string; next: string; endOfArchive: string; viewAllWork: string };
  workHref: string;
}) {
  const focusHeading = () => setFocusIntent("heading");

  return (
    <nav className="dpj__seq" aria-label={positionLabel}>
      <span className="dpj__seqpos">
        <span aria-hidden="true">{position}</span>
        <span className="sr-only">{positionLabel}</span>
      </span>

      <div className="dpj__seqends">
        {prev ? (
          <Link href={prev.href} className="dpj__seqlink dpj__seqlink--prev" onClick={focusHeading}>
            <span className="dpj__seqk">
              <span aria-hidden="true">←</span> {up(labels.previous)}
            </span>
            <span className="dpj__seqtitle">{prev.title}</span>
          </Link>
        ) : (
          <span className="dpj__seqlink dpj__seqlink--none" aria-hidden="true" />
        )}

        {next ? (
          <Link href={next.href} className="dpj__seqlink dpj__seqlink--next" onClick={focusHeading}>
            <span className="dpj__seqk">
              {up(labels.next)} <span aria-hidden="true">→</span>
            </span>
            <span className="dpj__seqtitle">{next.title}</span>
          </Link>
        ) : (
          /* the last entry: the sequence ENDS, and says so with a real way out
             rather than silently wrapping to the first project again */
          <Link
            href={workHref}
            className={cn("dpj__seqlink", "dpj__seqlink--end")}
            /* an ordinary route change - <main> takes focus, not a heading */
          >
            <span className="dpj__seqk">{up(labels.endOfArchive)}</span>
            <span className="dpj__seqtitle">
              {up(labels.viewAllWork)} <span aria-hidden="true">→</span>
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
