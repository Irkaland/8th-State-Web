"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { MediaSlot } from "@/components/dao/MediaSlot";
import Link from "next/link";
import { format } from "@/i18n/format";
import type { TeamSheetMessages } from "@/i18n/slices";
import { type Locale, localeHref } from "@/i18n/locales";
import { cn, up } from "@/lib/cn";
import { IDENT_ATTR } from "@/lib/session-lifecycle";
import { Reveal } from "./Reveal";
import { TeamResume, type ResumeSet } from "./TeamResume";

/** One project a person is credited on, resolved against the real Work archive. */
export type TeamWorkCredit = {
  slug: string;
  title: string;
  client: string;
  year: string;
  /** absent until the studio supplies the master; the frame stays either way */
  cover?: string;
  alt: string;
  role?: string;
};

/**
 * A person, flattened to plain strings on the server so this client component
 * never has to carry the content layer or the locale helpers into the bundle.
 */
export type TeamCard = {
  slug: string;
  /** absent while the seat is provisional - the UI draws a marked blank */
  name?: string;
  provisional: boolean;
  department: string;
  departmentName: string;
  role?: string;
  secondaryRoles: string[];
  portrait?: { src: string; alt: string };
  shortStatement?: string;
  bio?: string;
  expertise: string[];
  /** structured so EXPERIENCE lays out as a record, at any count */
  experience: {
    role: string;
    organization?: string;
    period?: string;
    location?: string;
    description?: string;
  }[];
  /** 8th State projects with a confirmed credit - NOT the personal portfolio */
  selectedWork: TeamWorkCredit[];
  clients: string[];
  awards: string[];
  credits: string[];
  education: string[];
  languages: string[];
  location?: string;
  email?: string;
  phone?: string;
  /** the person's own site, off 8th State. Rendered as VIEW PORTFOLIO. */
  portfolioUrl?: string;
  /** rendered as LINKEDIN PROFILE beside it, and never also in the links row */
  linkedinUrl?: string;
  /** the CV, per language, as supplied. Absent = no RESUME control at all. */
  resume?: ResumeSet;
  /** vimeo / instagram / linkedin / imdb - the professional link row */
  links: { key: string; label: string; href: string }[];
};

export type TeamSection = { id: string; name: string; people: TeamCard[] };

/** A viewport-space rectangle, in px - the geometry the morph interpolates. */
type Box = { left: number; top: number; width: number; height: number };

/** the four properties the morph actually travels on */
const GEOMETRY = ["left", "top", "width", "height"];

/**
 * The sheet's own box, in viewport px - the CSS rest state, resolved.
 *
 * The travel needs px at both ends, and the rest state is a cap rather than a
 * fixed size, so the height has to be measured from the laid-out content. These
 * numbers must stay in step with .dtm__morph in dao-routes.css: dropping the
 * inline geometry when the travel ends is only seamless because both agree.
 */
const sheetWidth = (): number => {
  const vw = window.innerWidth;
  return vw <= 720 ? vw - 20 : Math.min(vw * 0.92, 1180);
};

/**
 * The approved dossier is a FIXED sheet, not a content-sized one: a personnel
 * file is the same size whoever it is about, and a reader stepping through the
 * roster should not watch the paper change shape under them. Content scrolls
 * inside it instead.
 *
 * Nothing about it is measured from the content any more, which also removes
 * the frame of layout reading the old version did on every open.
 */
const sheetBox = (): Box => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = sheetWidth();
  const height = vw <= 720 ? vh - 40 : Math.min(vh * 0.9, 860);
  return { left: (vw - width) / 2, top: (vh - height) / 2, width, height };
};

/**
 * §11: the morph is geometry, so reduced motion has to be a real branch rather
 * than a shorter duration - the sheet is placed at its destination and revealed.
 * Read live, so a preference changed mid-session takes effect.
 */
const MOTION_Q = "(prefers-reduced-motion: reduce)";

function subscribeMotion(cb: () => void): () => void {
  const q = window.matchMedia(MOTION_Q);
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
}

function usePrefersReducedMotion(): boolean {
  // an external browser preference, so it is read as an external store: no
  // effect, no cascading render, and it stays false on the server
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_Q).matches,
    () => false,
  );
}

/** The initials a provisional seat shows in place of a portrait. */
function initialsOf(card: TeamCard): string {
  if (!card.name) return "—";
  return card.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The hand-drawn portrait frame.
 *
 * §01: a COMPLETE four-sided perimeter. It is composed from four mask layers -
 * two horizontal pen runs and two vertical ones - rather than from one
 * fixed-aspect frame asset, because a single mask stretched into 4:5 scales its
 * two axes by different factors and comes out with heavy top and bottom rules and
 * near-invisible sides. Each layer here is stretched along its own length only
 * and pinned to a fixed 6px band, so every side keeps the same thin weight at any
 * card aspect and the rectangle closes by construction. The runs overshoot their
 * ends, so the corners cross the way a hand-ruled box does.
 */
function Frame({
  card,
  sizes,
  priority,
  pending,
}: {
  card: TeamCard;
  sizes: string;
  priority?: boolean;
  /** localised "portrait pending" - the mark must not be English on /ka */
  pending: string;
}) {
  return (
    <span className="dtm__frame">
      <span className="dtm__framein">
        {card.portrait ? (
          <Image
            src={card.portrait.src}
            alt={card.portrait.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        ) : (
          <>
            <span className="dtm__initials" aria-hidden="true">
              {initialsOf(card)}
            </span>
            <span className="dtm__pendingmark" aria-hidden="true">
              {up(pending)}
            </span>
          </>
        )}
      </span>
    </span>
  );
}

/**
 * The dossier's ruled line - drawn, never a border.
 *
 * A personnel file is ruled by hand, so the divider under the file bar and the
 * one above the overview are the same imperfect stroke the rest of the site
 * uses rather than a 1px CSS edge.
 */
function Rule({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 4" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 2.4 C60 1.5 130 3.1 190 2.1 C260 1.2 330 3 400 2.3"
        stroke="#131210"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** A person's name, or an unmistakably temporary marked blank. */
function NameOrSlot({
  card,
  className,
  pending,
}: {
  card: TeamCard;
  className?: string;
  /** localised "name pending" - the blank must read in the page's own language */
  pending: string;
}) {
  if (card.name) return <span className={className}>{card.name}</span>;
  return (
    <span className={cn(className, "dtm__slot")}>
      <b aria-hidden="true">[</b> {up(pending)} <b aria-hidden="true">]</b>
    </span>
  );
}

/**
 * Does this person have anything beyond an identity to show?
 *
 * Drives the reserved-seat notice: every profile block is conditional, so a seat
 * with no confirmed content would open onto a blank column without this.
 */
function hasContent(c: TeamCard): boolean {
  return Boolean(
    c.shortStatement ||
    c.bio ||
    c.location ||
    c.expertise.length ||
    c.experience.length ||
    c.selectedWork.length ||
    c.clients.length ||
    c.awards.length ||
    c.credits.length ||
    c.education.length ||
    c.languages.length ||
    c.links.length,
  );
}

/** A labelled block that simply does not exist when its field is empty. */
function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("dtm__field", wide && "dtm__field--wide")}>
      <span className="dtm__fieldk">{up(label)}</span>
      <div className="dtm__fieldv">{children}</div>
    </div>
  );
}

/**
 * Act: the Team contact sheet.
 *
 * Clicking a frame never leaves /team. The clicked card's bounds are measured,
 * a sheet is mounted at exactly that geometry, and its left/top/width/height are
 * then interpolated to a centred editorial sheet over the roster - so what the
 * reader follows is one object growing out of one card, not a panel appearing on
 * top of a page. Closing runs the same journey backwards and hands focus back to
 * the card it came from, which stays reserved in the grid throughout.
 *
 * The geometry is animated as a BOX rather than a transform: a 4:5 portrait card
 * and a landscape sheet cannot share a uniform scale without distorting the
 * portrait on the way.
 *
 * This SUPERSEDES an earlier model in which the profile was inserted into the
 * grid as a full-width row and pushed the roster down. That version was
 * deliberately not a dialog; this one is - overlay, scroll lock, focus trap,
 * aria-modal - while keeping the editorial character the earlier one had: a
 * light ink wash rather than a dark scrim, and a plain rectangular paper edge.
 */
export function TeamContactSheet({
  locale,
  messages,
  sections,
  order,
  provisionalRoster,
}: {
  locale: Locale;
  messages: TeamSheetMessages;
  sections: TeamSection[];
  /** flat roster in the order the sections render it - drives prev/next */
  order: string[];
  /** true while no confirmed person exists, so the roster declares itself */
  provisionalRoster: boolean;
}) {
  const R = messages;
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  /**
   * Where the morph is in its cycle.
   *
   *   opening   mounted AT the clicked card's geometry, one frame, not yet moving
   *   settling  travelling from that geometry to the sheet's measured box
   *   open      arrived; the inline geometry is dropped and the CSS holds it
   *   closing   travelling back to the card
   *
   * The phase drives both the geometry (which end of the journey the box is at)
   * and the content opacity, so the sheet reads as one object growing out of the
   * card rather than a panel appearing over it. "settling" is a state rather
   * than an implicit gap between two frames so that the sheet's own size can be
   * pinned for the whole journey - and so the journey is observable.
   */
  const [phase, setPhase] = useState<"opening" | "settling" | "open" | "closing">("open");
  /**
   * A close has been asked for and not yet finished.
   *
   * This is the INTENT, recorded synchronously - not the committed phase. A
   * transitionend can be delivered in the same React batch as a close request
   * (Escape pressed mid-travel), and a phase read from state or from a ref
   * synced in an effect is still the pre-close value at that moment. The
   * travel-end handler would then queue setPhase("open") AFTER
   * setPhase("closing"), quietly cancelling the close and leaving the sheet up
   * with its URL already gone.
   */
  const wantClose = useRef(false);
  /** the card geometry the morph starts from and returns to, in viewport px */
  const [from, setFrom] = useState<Box | null>(null);
  /** the sheet's own measured box - the other end of the travel */
  const [to, setTo] = useState<Box | null>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const morphRef = useRef<HTMLDivElement | null>(null);
  /** the scroll position the roster was at when the sheet opened */
  const scrollAt = useRef(0);
  /** true while we are closing in response to popstate, so we do not re-navigate */
  const fromHistory = useRef(false);
  /**
   * We have asked the browser to pop our entry and are waiting to hear about it.
   *
   * history.back() does not reliably produce a popstate here - the App Router
   * rewrites the URL immediately after our pushState, and the back is sometimes
   * swallowed. Any popstate that arrives while this is set is therefore ours,
   * never the user asking to go forward into a profile.
   */
  const backPending = useRef(false);
  /**
   * Whether WE pushed the history entry the profile is standing on.
   *
   * This used to be read back out of history.state, which the App Router
   * rewrites for its own bookkeeping - our marker was being dropped, so the same
   * Escape took a different branch from one run to the next. A ref is ours alone.
   */
  const pushed = useRef(false);
  /** the card that should take focus back once the sheet has finished leaving */
  const returnTo = useRef<string | null>(null);
  /** set once focus has been moved into a freshly opened sheet */
  const moved = useRef<string | null>(null);

  const reduced = usePrefersReducedMotion();

  /**
   * True only for the end of the morph's OWN geometry transition.
   *
   * transitionend bubbles, so the dossier's opacity fade - which is deliberately
   * shorter than the travel - arrives on the morph as well. Taking it at face
   * value unmounted the sheet a third of the way home.
   */
  const isTravelEnd = (e: TransitionEvent, el: Element) =>
    e.target === el && GEOMETRY.includes(e.propertyName);

  /** The card's own frame box - what the sheet grows out of and back into. */
  const boxOf = (slug: string): Box | null => {
    const el = triggers.current[slug]?.querySelector(".dtm__frame");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  /* ---------------------------------------------------------------- open --- */

  const openFrom = useCallback(
    (slug: string, origin: Box | null, push: boolean) => {
      wantClose.current = false;
      // the page scrolls smoothly site-wide, so a click can land while a scroll
      // is still in flight. Stop it here, or the roster keeps sliding underneath
      // a sheet that is already locked over it.
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
      scrollAt.current = window.scrollY;
      setFrom(origin);
      setOpenSlug(slug);
      // With no origin box (a deep link) there is nothing to animate out of, so
      // the sheet is placed at its final geometry and simply revealed - §09 asks
      // for a restrained reveal rather than a faked card origin.
      setPhase(origin && !reduced ? "opening" : "open");
      if (push) {
        const url = new URL(window.location.href);
        url.searchParams.set("person", slug);
        // a real history entry, so Back closes the profile instead of leaving
        window.history.pushState(null, "", `${url.pathname}${url.search}`);
        pushed.current = true;
      }
    },
    [reduced],
  );

  // §03: hand the geometry over on the frame after mount, so the browser has a
  // start value to transition FROM. Without the double frame the element is born
  // at its target and there is nothing to animate.
  useEffect(() => {
    if (phase !== "opening") return;
    let next = 0;
    const id = requestAnimationFrame(() => {
      // the sheet is a fixed size now, so its destination is known without
      // measuring the profile first
      setTo(sheetBox());
      next = requestAnimationFrame(() => {
        if (!wantClose.current) setPhase("settling");
      });
    });
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(next);
    };
  }, [phase, openSlug]);

  // "settling" is the travel itself. Keeping it a state rather than an implicit
  // gap between two frames means the sheet's own size is pinned for the whole
  // journey, and that the journey is observable.
  useEffect(() => {
    if (phase !== "settling") return;
    const el = morphRef.current;
    let done = false;
    const finish = () => {
      // a close asked for mid-travel wins: do not settle over the top of it
      if (done || wantClose.current) return;
      done = true;
      setPhase("open");
    };
    const on = (e: TransitionEvent) => {
      if (el && isTravelEnd(e, el)) finish();
    };
    el?.addEventListener("transitionend", on);
    const t = window.setTimeout(finish, 900);
    return () => {
      el?.removeEventListener("transitionend", on);
      window.clearTimeout(t);
    };
  }, [phase]);

  /* --------------------------------------------------------------- close --- */

  const finishClose = useCallback((slug: string | null) => {
    wantClose.current = false;
    pushed.current = false;
    setOpenSlug(null);
    setFrom(null);
    setTo(null);
    setPhase("open");
    moved.current = null;
    // §07: the originating card comes back and takes focus - but only once the
    // render that drops is-lifted has landed. A visibility:hidden button cannot
    // take focus, so this is handed to an effect rather than a frame callback.
    returnTo.current = slug;
  }, []);

  useEffect(() => {
    if (openSlug || !returnTo.current) return;
    const slug = returnTo.current;
    returnTo.current = null;
    // preventScroll is what keeps §05 true - a plain focus() scrolls the card
    // into view and takes the roster with it
    triggers.current[slug]?.focus({ preventScroll: true });
  }, [openSlug]);

  /**
   * Send the sheet back to its card - or straight out, when there is nothing to
   * reverse.
   *
   * Closing while the sheet is still standing ON the card (a very fast Escape,
   * before the travel has begun) would set the geometry it already has, so no
   * transition fires and the only thing left to end it is the backstop timer.
   * That case unmounts at once instead.
   */
  const beginClose = useCallback(
    (slug: string) => {
      wantClose.current = true;
      const origin = boxOf(slug);
      if (reduced || !origin || phase === "opening") {
        finishClose(slug);
        return;
      }
      // §07: retract the content, then travel the geometry back to the card
      setFrom(origin);
      setPhase("closing");
    },
    [reduced, phase, finishClose],
  );

  const close = useCallback(() => {
    const slug = openSlug;
    if (!slug) return;
    // Hand the URL back, then close - in that order, but NOT conditionally on
    // the first succeeding. Waiting for the popstate from our own history.back()
    // left the sheet open indefinitely whenever the browser swallowed it.
    if (!fromHistory.current) {
      if (pushed.current) {
        pushed.current = false;
        backPending.current = true;
        window.history.back();
      } else {
        // a deep link - there is no entry of ours to pop, so just drop the query
        const url = new URL(window.location.href);
        url.searchParams.delete("person");
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      }
    }
    beginClose(slug);
  }, [openSlug, beginClose]);

  // the close transition ends -> unmount and restore
  useEffect(() => {
    if (phase !== "closing") return;
    const el = morphRef.current;
    const slug = openSlug;
    let done = false;
    const finish = () => {
      // the same guard in the other direction: a stale end must not unmount a
      // sheet that has since been re-opened or stepped
      if (done || !wantClose.current) return;
      done = true;
      finishClose(slug);
    };
    const on = (e: TransitionEvent) => {
      if (el && isTravelEnd(e, el)) finish();
    };
    el?.addEventListener("transitionend", on);
    // a transition that never fires must not strand the sheet open. The travel is
    // 140ms of delay plus 520ms of motion, so the backstop sits past both.
    const t = window.setTimeout(finish, 900);
    return () => {
      el?.removeEventListener("transitionend", on);
      window.clearTimeout(t);
    };
  }, [phase, openSlug, finishClose]);

  /* ------------------------------------------------------ deep link / URL --- */

  // §09: read ?person= on the client only, after hydration, so /team stays
  // statically rendered. No push here - the entry already exists.
  //
  // §P0: this now actually runs for a real visitor. The proxy used to redirect a
  // document load of /team to the locale home AND clear the query, so a shared
  // or bookmarked profile link could never reach this effect; it only ever fired
  // under the test bypass header.
  //
  // The slug is validated against `order` - the roster this component was handed -
  // rather than by interpolating it into a CSS selector. `?person="]` produced an
  // invalid selector and threw inside the animation frame, which is both a crash
  // and an unnecessary way to ask "is this a real person?" when the answer is
  // already in memory. An unknown id simply opens nothing: the Team route renders
  // normally, which is the honest safe state.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("person");
    if (!q) return;
    if (!order.includes(q)) {
      /**
       * FINAL UX §11: an unknown person renders the roster - which IS the
       * recovery - but the URL must not go on claiming a person the page is not
       * showing. The dead parameter is cleared with replaceState: no redirect,
       * no 404 (the route itself is perfectly valid), no extra history entry,
       * and Back still leads where the reader came from.
       */
      const url = new URL(window.location.href);
      url.searchParams.delete("person");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
      return;
    }
    const id = requestAnimationFrame(() => openFrom(q, null, false));
    return () => cancelAnimationFrame(id);
  }, [openFrom, order]);

  // §10: Back closes the profile and returns to the roster
  useEffect(() => {
    const onPop = () => {
      fromHistory.current = true;
      const ours = backPending.current;
      backPending.current = false;
      if (openSlug) {
        // §10: whatever the URL now says, a history move while the profile is up
        // means go back to the roster. Deciding from the query instead let the
        // router's own rewrites re-open the sheet in the middle of closing it.
        pushed.current = false;
        beginClose(openSlug);
      } else if (!ours) {
        // a genuine Forward, back into a profile. Our own pop never lands here.
        // Validated against the roster for the same reason as the deep link above.
        const q = new URLSearchParams(window.location.search).get("person");
        if (q && order.includes(q)) openFrom(q, null, false);
      }
      fromHistory.current = false;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openSlug, openFrom, beginClose, order]);

  /* ------------------------------------------------- scroll lock (§05) ----- */

  useEffect(() => {
    if (!openSlug) return;
    const y = scrollAt.current;
    const html = document.documentElement;
    const prev = html.style.overflow;
    // the sheet is fixed, so locking the document keeps the roster exactly where
    // it was; scrollY is untouched by overflow:hidden, and is restored anyway
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
      if (Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: "instant" });
    };
  }, [openSlug]);

  /* ------------------------------------------------- keyboard + focus ----- */

  useEffect(() => {
    if (!openSlug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // §P0: a deep-linked profile now opens BEHIND the Studio Ident, because
        // a hard load of /team?person=... stays on /team instead of being sent
        // Home. Any keypress skips the ident - so an Escape pressed to get past
        // the intro would otherwise also close the profile the visitor followed
        // a link to reach, and they would never see it. While the ident holds
        // the stage, Escape belongs to the ident alone.
        if (document.documentElement.hasAttribute(IDENT_ATTR)) return;
        e.stopPropagation();
        close();
        return;
      }
      // §15: a modal sheet keeps Tab inside itself
      if (e.key !== "Tab") return;
      const root = morphRef.current;
      if (!root) return;
      const items = [
        ...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openSlug, close]);

  // focus lands in the sheet once per person, and never scrolls the roster
  useEffect(() => {
    if (!openSlug || moved.current === openSlug) return;
    moved.current = openSlug;
    requestAnimationFrame(() => sheetRef.current?.focus({ preventScroll: true }));
  }, [openSlug]);

  /* ----------------------------------------------------------- stepping --- */

  // §08: prev/next swaps the person WITHOUT collapsing the sheet - the phase
  // stays "open", so only the content transitions.
  const step = (dir: 1 | -1) => {
    if (!openSlug) return;
    const i = order.indexOf(openSlug);
    // FINAL UX: the roster WRAPS. An archive is a sequence with a first and a
    // last entry, which is why /work/[slug] is finite; a roster is a wheel, and
    // a reader stepping through colleagues should not hit a wall at the
    // thirteenth. The asymmetry between the two is deliberate.
    const next = order[(i + dir + order.length) % order.length];
    if (!next || next === openSlug) return;
    setOpenSlug(next);
    setPhase("open");
    setFrom(null);
    // Route focus rule: focus STAYS on the pressed control. The reader is
    // comparing people with one repeated keystroke, and throwing focus into the
    // sheet on every step would make them tab back out to press it again.
    // `moved` is left pointing at the newly opened person so the focus effect
    // below treats this swap as already handled.
    moved.current = next;
    const url = new URL(window.location.href);
    url.searchParams.set("person", next);
    // replace, not push: stepping must not stack history entries, so Back after
    // A -> B -> C closes the file and returns to /team rather than walking back
    // through the people one at a time
    window.history.replaceState({ dtmPerson: next }, "", `${url.pathname}${url.search}`);
  };

  const index = openSlug ? order.indexOf(openSlug) : -1;
  /**
   * Every person, in one list.
   *
   * `order` is the flat roster the profile's prev/next already steps through, so
   * deriving the grid from it keeps the visual sequence and the keyboard sequence
   * identical by construction - they cannot drift apart.
   */
  const roster = order
    .map((slug) => sections.flatMap((s) => s.people).find((c) => c.slug === slug))
    .filter((c): c is TeamCard => c !== undefined);

  const openCard = openSlug
    ? (sections.flatMap((s) => s.people).find((c) => c.slug === openSlug) ?? null)
    : null;

  const profile = (card: TeamCard) => {
    const w = card.selectedWork;
    /* §09/§10/§11: three distinct things, kept apart. CONTACT is how to reach the
       person, VIEW PORTFOLIO is their own site away from 8th State, and SELECTED
       WORK is the 8th State archive. They never share a block. */
    const professional = card.links.filter((l) => l.key !== "portfolio" && l.key !== "email");
    const hasContact = Boolean(card.email || card.phone || card.location || professional.length);

    /**
     * §02/§04: a fixed stage over the Team page, not an inserted grid row. The
     * morphing element carries explicit viewport geometry: during "opening" and
     * "closing" that geometry IS the clicked card's box, and at "open" it is the
     * centred sheet. Transitioning left/top/width/height rather than a transform
     * keeps the portrait undistorted through the travel, which a non-uniform
     * scale between a 4:5 card and a landscape sheet would not.
     */
    const atOrigin = phase === "opening" || phase === "closing";
    const travelling = phase !== "open";
    /**
     * The morph's box, when it is not simply at rest.
     *
     * At the two ends of the journey it is the card's box; mid-journey it is the
     * sheet's measured box in px. At rest the inline style is dropped entirely
     * and the CSS takes over - which is seamless only because sheetBox() and
     * .dtm__morph resolve to the same numbers.
     */
    const box = atOrigin ? from : phase === "settling" ? to : null;
    const geom: React.CSSProperties = box
      ? {
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          // the rest position centres with a translate; here the box is already
          // absolute, so the centring has to come off
          transform: "none",
        }
      : {};
    /**
     * Through the travel the dossier holds the sheet's width with its height
     * free, so the morph's shrinking box clips it rather than reflowing it - and
     * so the opening frame can measure the height the content actually wants.
     */
    const held: React.CSSProperties = travelling
      ? {
          flex: "0 0 auto",
          width: to ? to.width : sheetWidth(),
          height: "auto",
          maxHeight: to ? to.height : undefined,
        }
      : {};

    return (
      <div className="dtm__stage" data-dtm-phase={phase}>
        {/*
          The ONLY live region on this route, and the only one on the site. It
          exists for one reason: prev/next swaps the person inside a dialog that
          stays mounted, so nothing else would tell a screen-reader user that
          the content changed. It says the minimum useful thing and nothing
          else - no role, no department, no repeated heading. The dialog is
          labelled by the visible name, so opening it needs no announcement of
          its own; dialog semantics already cover that.
        */}
        <span className="sr-only" role="status" aria-live="polite">
          {format(R.personnelSwap, {
            name: card.name ?? R.namePending,
            n: index + 1,
            total: order.length,
          })}
        </span>
        {/* the roster stays legible behind it - §04 asks for presence, not a
            generic dark backdrop */}
        <button
          type="button"
          className="dtm__backdrop"
          tabIndex={-1}
          aria-hidden="true"
          onClick={close}
        />
        <div
          className={cn("dtm__morph", travelling && "is-travelling")}
          style={geom}
          ref={morphRef}
        >
          <article
            className={cn("dtm__dossier", phase !== "opening" && "is-in")}
            style={held}
            ref={sheetRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            /* Labelled BY the visible name rather than by a manufactured
               string, so a screen reader announces exactly what a sighted
               reader sees and the two cannot drift apart when the copy
               changes. */
            aria-labelledby="dtm-file-name"
          >
            {/* §01: the ONLY close control, beside prev/next. There is deliberately
              no second one at the foot of the sheet. */}
            {/* ---- the file bar: the way out on the left, the position in the
                 roster on the right. Closing IS going back to the sheet, so
                 that control says so in words rather than as a bare cross. */}
            <div className="dtm__slug">
              <button
                type="button"
                className="dtm__tcta dtm__tcta--back mo-h"
                onClick={() => close()}
              >
                <span aria-hidden="true">&larr;</span> {up(R.backToSheet)}
              </button>
              <span className="dtm__nav">
                <span className="dtm__no">
                  {up(R.personnel)} · {String(index + 1).padStart(2, "0")} /{" "}
                  {String(order.length).padStart(2, "0")}
                </span>
                {/* a wheel has no ends, so neither control is ever disabled -
                    and each is a >=44px target in its own right */}
                <button type="button" className="dtm__tcta mo-h" onClick={() => step(-1)}>
                  <span aria-hidden="true">&larr;</span> {up(R.previous)}
                </button>
                <button type="button" className="dtm__tcta mo-h" onClick={() => step(1)}>
                  {up(R.nextPerson)} <span aria-hidden="true">&rarr;</span>
                </button>
              </span>
            </div>
            <Rule className="dtm__slugrule" />

            {/* ---- header: portrait against identity ---- */}
            <div className="dtm__dtop">
              <div className="dtm__bigframe">
                <Frame
                  card={card}
                  sizes="(max-width: 720px) 84vw, 40vw"
                  pending={R.portraitPending}
                />
                {/* the plate's own caption, as a contact sheet marks a frame */}
                <span className="dtm__framecap">
                  <span>
                    FR. {String(index + 1).padStart(2, "0")} — {up(R.selectedFrame)}
                  </span>
                  <span>8TH STATE</span>
                </span>
              </div>

              <div className="dtm__id">
                {/* the index line: where this file sits in the roster, printed
                    the way a personnel file is filed */}
                <span className="dtm__breadcrumb">
                  {up(R.mastLabel)} / {String(index + 1).padStart(2, "0")} ·{" "}
                  {up(card.departmentName)} · {up(R.profileIndex)}
                </span>
                <h2 id="dtm-file-name" className="dtm__dname mo-a">
                  <span>
                    <NameOrSlot card={card} pending={R.namePending} />
                  </span>
                </h2>
                {card.role && <span className="dtm__role">{up(card.role)}</span>}
                {card.secondaryRoles.map((r) => (
                  <span key={r} className="dtm__role dtm__role--2">
                    {up(r)}
                  </span>
                ))}

                {/* §04: the short overview - a concise introduction, not the bio */}
                {card.shortStatement && (
                  <>
                    <Rule className="dtm__idrule" />
                    <p className="dtm__statement">{card.shortStatement}</p>
                  </>
                )}

                {/* §14: a reserved seat says so in one line rather than opening onto
                  a column of empty labelled blocks. */}
                {!hasContent(card) && <p className="dtm__awaiting">{R.profilePending}</p>}

                {/* §10: THE PROFILE FOOTER - external actions, per person.
                    Every action here is driven by a URL on the person's own
                    record; nothing is hardcoded, and a person with no URLs
                    renders no row at all rather than an empty one. */}
                {/* The file's closing metadata, above the actions - where the
                    approved dossier prints it, rather than at the very foot of
                    the sheet under every block.

                    The design also prints "FULL PROFILE - BIOGRAPHY, PRACTICE
                    AND CREDITS PUBLISH ONCE THE STUDIO CONFIRMS THEM" here. It
                    is not shipped, for the reason a previous pass recorded: it
                    is a note to the studio rather than production copy - and it
                    reads stranger still on the two people who now carry a
                    statement, a portfolio and a CV. A seat that genuinely has
                    nothing already says so, in its own line, above. */}
                <span className="dtm__filenote">8TH STATE PRODUCTION · {up(R.city)}</span>

                {(card.portfolioUrl || card.linkedinUrl || card.resume || hasContact) && (
                  <span className="dtm__actions">
                    {/* the person's OWN external site. Never /work. */}
                    {card.portfolioUrl && (
                      <a
                        className="dtm__portfolio"
                        href={card.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${R.viewPortfolio} - ${card.name ?? R.namePending} (${R.opensExternal})`}
                      >
                        {up(R.viewPortfolio)} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                    {card.linkedinUrl && (
                      <a
                        className="dtm__linkedin"
                        href={card.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${R.viewLinkedin} - ${card.name ?? R.namePending} (${R.opensExternal})`}
                      >
                        {up(R.viewLinkedin)} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                    {/* ONE control, whatever number of editions exist behind it */}
                    {card.resume && (
                      <TeamResume
                        name={card.name ?? R.namePending}
                        resume={card.resume}
                        className="dtm__resume"
                        copy={{
                          resume: R.resume,
                          chooseLanguage: R.chooseLanguage,
                          viewerKicker: R.resume,
                          close: R.close,
                          cannotDisplay: R.resumeCannotDisplay,
                          openInTab: R.resumeOpenInTab,
                          english: R.resumeEnglish,
                          spanish: R.resumeSpanish,
                        }}
                      />
                    )}
                    {hasContact && (
                      <a className="dtm__jump" href={`#contact-${card.slug}`}>
                        {up(R.contact)} <span aria-hidden="true">→</span>
                      </a>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* ---- §05 ABOUT ---- */}
            {card.bio && (
              <section className="dtm__block">
                <span className="dtm__blockk">{up(R.about)}</span>
                <p className="dtm__bio">{card.bio}</p>
              </section>
            )}

            {/* ---- §06/§07 EXPERIENCE against PRACTICE ---- */}
            {(card.experience.length > 0 || card.expertise.length > 0) && (
              <section className="dtm__block dtm__block--split">
                {card.experience.length > 0 && (
                  <div className="dtm__col">
                    <span className="dtm__blockk">{up(R.experience)}</span>
                    <ol className="dtm__exp">
                      {card.experience.map((x, i) => (
                        <li key={`${x.role}-${i}`} className="dtm__exprow">
                          <span className="dtm__exprole">{x.role}</span>
                          {x.organization && <span className="dtm__exporg">{x.organization}</span>}
                          {(x.period || x.location) && (
                            <span className="dtm__expmeta">
                              {[x.period, x.location].filter(Boolean).join(" · ")}
                            </span>
                          )}
                          {x.description && <span className="dtm__expdesc">{x.description}</span>}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {card.expertise.length > 0 && (
                  <div className="dtm__col">
                    <span className="dtm__blockk">{up(R.practice)}</span>
                    <ul className="dtm__tags">
                      {card.expertise.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* ---- §08 the rest of the record, each present only when real ---- */}
            {(card.education.length > 0 ||
              card.languages.length > 0 ||
              card.clients.length > 0 ||
              card.awards.length > 0 ||
              card.credits.length > 0) && (
              <section className="dtm__block dtm__block--record">
                {card.education.length > 0 && (
                  <Field label={R.education}>
                    {card.education.map((x) => (
                      <p key={x}>{x}</p>
                    ))}
                  </Field>
                )}
                {card.languages.length > 0 && (
                  <Field label={R.languages}>{card.languages.join(" · ")}</Field>
                )}
                {card.clients.length > 0 && (
                  <Field label={R.clients}>{card.clients.join(" · ")}</Field>
                )}
                {card.awards.length > 0 && (
                  <Field label={R.awards}>
                    {card.awards.map((x) => (
                      <p key={x}>{x}</p>
                    ))}
                  </Field>
                )}
                {card.credits.length > 0 && (
                  <Field label={R.credits}>
                    {card.credits.map((x) => (
                      <p key={x}>{x}</p>
                    ))}
                  </Field>
                )}
              </section>
            )}

            {/* ---- §11 SELECTED WORK: the 8th State archive, never the personal site ---- */}
            {w.length > 0 && (
              <section className="dtm__block">
                <span className="dtm__blockk">{up(R.selectedWork)}</span>
                <span className="dtm__blocknote">{R.selectedWorkNote}</span>
                <div className="dtm__workrow">
                  {w.map((p, i) => (
                    <Link
                      key={p.slug}
                      href={localeHref(locale, `/work/${p.slug}`)}
                      className="dtm__wcard"
                    >
                      <span className="dtm__wframe">
                        <span className="dtm__framein">
                          <MediaSlot
                            src={p.cover}
                            alt={p.alt}
                            mark={R.imagePending}
                            sizes="(max-width: 720px) 40vw, 220px"
                          />
                        </span>
                        <span className="dtm__wno" aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </span>
                      <span className="dtm__wtitle">{p.title}</span>
                      <span className="dtm__wmeta">
                        {p.role ? `${p.role} · ` : ""}
                        {p.client} · {p.year}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ---- §09 CONTACT against the professional links ---- */}
            {hasContact && (
              <section className="dtm__block dtm__block--split" id={`contact-${card.slug}`}>
                <div className="dtm__col">
                  <span className="dtm__blockk">{up(R.contact)}</span>
                  <span className="dtm__contact">
                    {card.email && <a href={`mailto:${card.email}`}>{card.email}</a>}
                    {card.phone && (
                      <a href={`tel:${card.phone.replace(/\s+/g, "")}`}>{card.phone}</a>
                    )}
                    {card.location && <span className="dtm__where">{card.location}</span>}
                  </span>
                </div>
                {professional.length > 0 && (
                  <div className="dtm__col">
                    <span className="dtm__blockk">{up(R.links)}</span>
                    <span className="dtm__links">
                      {professional.map((l) => (
                        <a
                          key={l.key}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${l.label} (${R.opensExternal})`}
                        >
                          {up(l.label)} <span aria-hidden="true">↗</span>
                        </a>
                      ))}
                    </span>
                  </div>
                )}
              </section>
            )}
          </article>
        </div>
      </div>
    );
  };

  return (
    <div className="dtm__sheet">
      {provisionalRoster && (
        <p className="dtm__provisional">
          <span aria-hidden="true">※</span> {R.provisionalRoster}
        </p>
      )}

      {/*
        ONE ROSTER.
        The people used to be grouped into per-department sections, each with a
        number, a heading, a count at the far right and a rule - which split the
        page into a stack of small directories. The studio reads as one company,
        so the roster is now a single continuous contact sheet. Department is
        still carried on every person and is still stated inside their profile;
        it is simply no longer a divider in the landing grid.
      */}
      <div className={cn("dtm__grid", openSlug && "is-open")}>
        {roster.map((card) => {
          const isOpen = openSlug === card.slug;
          const n = order.indexOf(card.slug) + 1;
          return (
            <Reveal
              key={card.slug}
              as="div"
              className="dtm__cell"
              style={{ ["--d" as string]: `${(order.indexOf(card.slug) % 4) * 70}ms` }}
            >
              <button
                type="button"
                data-dtm-card={card.slug}
                ref={(el) => {
                  triggers.current[card.slug] = el;
                }}
                className={cn(
                  "dtm__person",
                  // C - the frame arrives with the sheet as it is read down.
                  // This is the prototype's tm-reveal, in the site's own
                  // language rather than a second implementation.
                  "mo-c",
                  isOpen && "is-active",
                  // §06: the seat stays in the grid at full size, only unseen,
                  // so nothing reflows while its content is out on the stage
                  isOpen && "is-lifted",
                  openSlug && !isOpen && "is-dim",
                )}
                aria-expanded={isOpen}
                onClick={() => (isOpen ? close() : openFrom(card.slug, boxOf(card.slug), true))}
              >
                <Frame
                  card={card}
                  sizes="(max-width: 720px) 40vw, 22vw"
                  priority={n <= 3}
                  pending={R.portraitPending}
                />
                <span className="dtm__pbody">
                  {/* the index row - frame number against department, the way
                      a contact sheet annotates a strip. D registers the
                      number, F settles the department's tracking. */}
                  <span className="dtm__prow">
                    <span className="dtm__pno mo-d" aria-hidden="true">
                      {String(n).padStart(2, "0")}
                    </span>
                    <span className="dtm__dept mo-f">{up(card.departmentName)}</span>
                  </span>
                  <span className="dtm__pname">
                    <NameOrSlot card={card} pending={R.namePending} />
                  </span>
                  {card.role && <span className="dtm__role">{up(card.role)}</span>}
                  {!card.role && (
                    <span className="dtm__role dtm__role--pending">{up(R.rolePending)}</span>
                  )}
                  {card.secondaryRoles[0] && (
                    <span className="dtm__role dtm__role--2">{up(card.secondaryRoles[0])}</span>
                  )}
                  <span className="dtm__view" aria-hidden="true">
                    {up(R.viewProfile)} →
                  </span>
                </span>
              </button>
            </Reveal>
          );
        })}
      </div>
      {/* one stage, outside the grid, so the fixed sheet is laid out against the
          viewport rather than against a grid cell */}
      {openCard && profile(openCard)}
    </div>
  );
}
