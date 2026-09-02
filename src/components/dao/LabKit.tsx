import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { EditorialArrow } from "./EditorialArrow";

/**
 * Studio Lab - the drawn marks the approved design is built from.
 *
 * Everything here is a server component and none of it ships JavaScript: every
 * interaction in the handoff (row shift, CTA arrow drift) is a CSS transition,
 * so the Lab adds nothing to the bundle.
 *
 * The numbers are the handoff's, not invented: rules are 400x4 SVG paths at 1px
 * non-scaling stroke, icons are a 32x24 viewBox at 1.15-1.25 stroke, and the
 * per-mark opacities come straight from the deliverables.
 */

/* ----------------------------------------------------------- pencil rule - */

/**
 * The four wobble variants the design alternates between.
 *
 * A straight border is never used. Each path is drawn across a 400-wide box and
 * stretched with preserveAspectRatio="none", so the wobble keeps its shape at
 * any width while `vector-effect` holds the stroke at a true 1px.
 */
const WOBBLE = {
  a: "M0 2.4 C60 1.5 130 3.1 190 2.1 C260 1.2 330 3 400 2.3",
  b: "M0 2.1 C70 3 140 1.4 210 2.5 C280 3.3 340 1.7 400 2.4",
  c: "M0 2.6 C55 1.6 125 3.2 200 2 C275 1.1 345 2.9 400 2.1",
  d: "M0 2.2 C80 3.1 160 1.3 240 2.4 C310 3.2 360 1.8 400 2.5",
} as const;

export type Wobble = keyof typeof WOBBLE;

export function PencilRule({
  variant = "a",
  opacity = 0.3,
  short,
  className,
}: {
  variant?: Wobble;
  /** .24 inner lists · .28-.30 rows · .34-.36 section heads */
  opacity?: number;
  /** 3px box instead of 4px - the inner-list rule */
  short?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={cn("dsl-rule", short && "dsl-rule--short", className)}
      viewBox="0 0 400 4"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={WOBBLE[variant]}
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity={opacity}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ------------------------------------------------------- discipline icons - */

/**
 * The three discipline marks, drawn once.
 *
 * These are the approved hand-drawn paths from the design logic (ICON.cam /
 * art / film). They are deliberately imperfect - each is rotated a degree or
 * two - and they are never swapped for an icon-library glyph.
 */
const ICON = {
  photography:
    "M2.7 7.2 L10.1 6.7 L12 3.5 L20.3 3.2 L22.2 6.4 L29.4 6.9 L29 20.9 L3.1 21.2 Z M16 9.1 C19.6 8.8 21.3 11.5 21.1 13.9 C20.9 16.6 18.3 18.3 15.8 18.1 C13.3 17.9 11.5 15.7 11.7 13.2 C11.9 10.7 13.7 9.3 16 9.1 M25.4 9.6 L26.9 9.5",
  art: "M3.2 3.6 L28.5 3.1 L28.9 20.7 L2.8 21.1 Z M6.3 16.6 C8.2 11 11.8 8.6 13.3 11.1 C14.8 13.6 11.2 16.9 10.1 14.1 C9.2 11.7 13.6 8.9 17.6 9.7 C21.2 10.4 23.8 13.6 25.4 16.8",
  film: "M4.1 3.2 L28.2 3.5 L27.8 20.5 L3.7 20.2 Z M8.9 3.3 L8.7 20.3 M23.3 3.4 L23.1 20.4 M5.4 6.3 L7.2 6.2 M5.3 11.5 L7.1 11.4 M5.2 16.7 L7 16.6 M24.9 6.4 L26.7 6.3 M24.8 11.6 L26.6 11.5 M24.7 16.8 L26.5 16.7",
} as const;

export type IconKey = keyof typeof ICON;

export function DisciplineIcon({
  icon,
  rot = 0,
  weight = 1.25,
  className,
}: {
  icon: IconKey;
  /** the approved per-discipline tilt: -1.5 / 1 / -1 */
  rot?: number;
  /** 1.25 in listings, 1.15 where the mark is drawn large */
  weight?: number;
  className?: string;
}) {
  return (
    <svg
      className={cn("dsl-icon", className)}
      viewBox="0 0 32 24"
      style={{ ["--rot" as string]: `${rot}deg` }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={ICON[icon]}
        stroke="currentColor"
        strokeWidth={weight}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------- the arrow - */

/**
 * The drawn arrow that follows every call to action: the site's one mark
 * (EditorialArrow) at the size the Lab was approved at. Kept as a named export
 * because ten call sites ask for it by name; the geometry is no longer a second
 * copy of the path.
 */
export function LabArrow({ className, weight = 1.2 }: { className?: string; weight?: number }) {
  return <EditorialArrow className={cn("dsl-arrow", className)} weight={weight} />;
}

/** The small registration cross that marks a plate or a note. */
export function LabCross({ className }: { className?: string }) {
  return (
    <svg
      className={cn("dsl-cross", className)}
      viewBox="0 0 11 11"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5.6 0.8 L5.4 10.3 M0.7 5.7 L10.4 5.4"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------- the ground - */

/**
 * The page texture stack, in the handoff's order.
 *
 * 1. canvas-weave at 512px, .14, overlay
 * 2. paper-grain-strong at 352px, .30, multiply
 *
 * The oxide stain is an accent rather than a field, so it is placed per section
 * by `LabStain` and never tiled.
 */
export function LabTexture() {
  return (
    <>
      <div className="dsl-weave" aria-hidden="true" />
      <div className="dsl-grain" aria-hidden="true" />
    </>
  );
}

/** One oxide accent. Decorative only - never carries meaning. */
export function LabStain({ style }: { style?: CSSProperties }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- a decorative
       texture at a fixed art-directed size; next/image would add a layout
       wrapper the absolute positioning here has to fight. */
    <img src="/assets/textures/oxide-stain.webp" alt="" className="dsl-stain" style={style} />
  );
}

/** One botanical. Always static, always behind, never interactive. */
export function LabBotanical({
  src,
  className,
  style,
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- see LabStain */
    <img src={src} alt="" className={cn("dsl-bot", className)} style={style} />
  );
}

/* ------------------------------------------------------------ section head - */

/**
 * `NN - LABEL` on the left, context on the right, pencil rule 14px below.
 *
 * The number is decorative: it is part of the printed index, not of the
 * heading, so it is hidden from assistive tech and the label carries the name.
 */
export function LabSectionHead({
  n,
  label,
  context,
  variant = "a",
  headingId,
}: {
  n: string;
  label: string;
  context: string;
  variant?: Wobble;
  /** when set, the label is rendered as the section's own h2 */
  headingId?: string;
}) {
  return (
    <>
      <div className="dsl-head">
        <span className="dsl-head__l">
          <span aria-hidden="true">{n} - </span>
          {headingId ? (
            <h2 className="dsl-head__h" id={headingId}>
              {label}
            </h2>
          ) : (
            <span>{label}</span>
          )}
        </span>
        <span className="dsl-head__r">{context}</span>
      </div>
      <PencilRule variant={variant} opacity={0.34} className="dsl-head__rule" />
    </>
  );
}

/* ------------------------------------------------------------ media figure - */

/**
 * An image slot at a contractual aspect ratio, with its Glacier caption row.
 *
 * No final imagery exists yet, so the slot renders as an explicit, composed
 * pending plate rather than a broken image: a drawn frame carrying the label
 * the design specified. When a real asset arrives it replaces the plate and the
 * caption row stays exactly as it is.
 */
export function MediaFigure({
  ratio,
  pending,
  caption,
  meta,
  className,
}: {
  /** "4 / 3" · "4 / 5" · "16 / 10" · "3 / 4" - contractual, never adjusted */
  ratio: string;
  pending: string;
  caption: string;
  meta?: string;
  className?: string;
}) {
  return (
    <figure className={cn("dsl-fig", className)}>
      <div className="dsl-fig__slot" style={{ ["--ar" as string]: ratio }}>
        <span className="dsl-fig__pending">{pending}</span>
      </div>
      <figcaption className="dsl-fig__cap">
        <span>{caption}</span>
        {meta ? <span>{meta}</span> : null}
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------- the index - */

/**
 * The editorial index that closes the Lab.
 *
 * Six words, no numbering. A row with drawn separators above 760px; a three
 * column grid below it, which is the approved mobile composition.
 */
export function LabIndex({ words }: { words: readonly string[] }) {
  return (
    <div className="dsl-index" aria-hidden="true">
      {words.map((w, i) => (
        <span key={w} className="dsl-index__cell">
          {i > 0 ? <span className="dsl-index__dot" /> : null}
          <span className="dsl-index__w">{w}</span>
        </span>
      ))}
    </div>
  );
}
