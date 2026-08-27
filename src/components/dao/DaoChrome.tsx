"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Messages } from "@/i18n";
import { type Locale, localeHref, stripLocale, switchLocalePath } from "@/i18n/locales";
import { cn } from "@/lib/cn";
import { focusableWithin, isFocusable } from "@/lib/focusable";
import { NAV_OPEN_KEY, safeSession } from "@/lib/session-lifecycle";
import { useLiveSearch } from "@/lib/use-live-search";

/**
 * Persistent chrome (celestial-sun chip + EN/KA + burger paper chip) and the
 * fullscreen ink-sheet navigation (handoff 1b / 2c / 2d).
 * Open 450ms, close 320ms; links rise from masks with 60ms stagger;
 * WORK expands its approved categories; focus is trapped while open.
 */
export function DaoChrome({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.dao.nav;
  const pathname = usePathname() || "/";
  // §15: the switcher must not drop an active Work filter
  const search = useLiveSearch();
  // §14: a locale switch crosses the [locale] layout segment, so this
  // component remounts and React state is lost. The intent is handed over
  // through sessionStorage instead: set on the way out, consumed once on the
  // way in, so the sheet is already open when the Georgian page paints and the
  // visitor never has to reopen it.
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [workOpen, setWorkOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [preview, setPreview] = useState<{ key: string; top: number; rot: number } | null>(null);
  // §Perf Phase 1: preview media mounts only once the sheet can actually
  // display it (open on a ≥900px viewport - below that the preview is
  // display:none, dao.css). Until then not a single preview byte is
  // requested; once mounted the sources stay mounted so hover swaps remain
  // instant for the rest of the page load.
  const [previewsReady, setPreviewsReady] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  // §02: opening the sheet moves focus to the first destination for the focus
  // trap. That programmatic focus must NOT raise a preview - only a real
  // keyboard move (Tab/Shift+Tab) arms focus-driven previews. Pointer hover is
  // always user-initiated and never gated.
  const keyboardNav = useRef(false);

  // v7 #3: curtain-up close - links exit masks first, sheet travels up with
  // its torn edge (~640ms total, phases overlap; CSS carries the phases).
  const close = useCallback(() => {
    setClosing(true);
    setOpen(false);
    setWorkOpen(false);
    // §02: the hovered-row preview is per-visit state. Left set, it would
    // reappear the instant the sheet opens again, before the cursor has
    // reached any row - the sheet must always open with no preview.
    setPreview(null);
    window.setTimeout(() => setClosing(false), 660);
    burgerRef.current?.focus();
  }, []);

  // §14: reopen the sheet after a locale switch that happened while it was
  // open. Consumed exactly once - a later ordinary navigation must not
  // resurrect it.
  //
  // This reads an external store (sessionStorage) that cannot be touched
  // during render: the server renders the sheet closed, so a lazy useState
  // initialiser reading it on the client would hydrate a different tree.
  // Syncing it in on mount is the correct place, which is exactly the
  // "subscribe to an external system" case the rule is written around; it runs
  // once, on one navigation in the whole session.
  useEffect(() => {
    const store = safeSession();
    if (!store) return;
    let handoff = false;
    try {
      handoff = store.getItem(NAV_OPEN_KEY) === "1";
      if (handoff) store.removeItem(NAV_OPEN_KEY);
    } catch {
      /* private mode - the sheet simply opens closed */
    }
    if (!handoff) return;
    const wide = window.matchMedia("(min-width: 900px)").matches;
    /* eslint-disable react-hooks/set-state-in-effect -- restoring state handed
       over by the previous locale's tree; see the note above */
    setPreviewsReady(wide);
    setOpen(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Pause signal for auto-advancing scenes while the menu is open.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-dao-nav-open", open);
    return () => document.documentElement.removeAttribute("data-dao-nav-open");
  }, [open]);

  const armPreviews = useCallback(() => {
    if (window.matchMedia("(min-width: 900px)").matches) setPreviewsReady(true);
  }, []);

  const toggle = () => {
    if (open) {
      close();
    } else {
      armPreviews();
      setOpen(true);
    }
  };

  // Esc closes; focus is trapped while open.
  useEffect(() => {
    if (!open) return;
    const nav = navRef.current;
    // first destination link (WORK), not the numeral categories toggle -
    // same landing focus as before the toggle existed
    const first = nav?.querySelector<HTMLElement>(".dao-nav__link") ?? undefined;
    keyboardNav.current = false;
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !nav) return;
      // a real keyboard move - focus may raise previews from here on
      keyboardNav.current = true;
      // §P0: focusableWithin() asks whether each candidate can ACTUALLY take
      // focus. The previous filter was `offsetParent !== null`, which does not
      // exclude `inert` - so while the Work categories were collapsed their five
      // links stayed in this list, Tab was preventDefault()ed, .focus() silently
      // did nothing on an inert target, and focus never left the WORK link.
      const focusables = focusableWithin(nav);
      // §01: the single EN/KA switcher lives in the top-right chrome (the
      // burger sheet carries none) - keep it reachable inside the trap.
      const lang = focusableWithin(document.querySelector(".dao-chrome") ?? document).filter((el) =>
        el.closest(".dao-lang"),
      );
      const burger = burgerRef.current;
      const all = [...focusables, ...lang, ...(burger && isFocusable(burger) ? [burger] : [])];
      if (all.length === 0) return;
      const idx = all.indexOf(document.activeElement as HTMLElement);
      let next: number;
      if (e.shiftKey) next = idx <= 0 ? all.length - 1 : idx - 1;
      else next = idx === -1 || idx === all.length - 1 ? 0 : idx + 1;
      e.preventDefault();
      // Defensive: if the chosen target still refuses focus for a reason the
      // predicate cannot see, walk on rather than swallowing the keystroke and
      // parking the visitor. A full lap without a move means there is nothing
      // to focus, and the trap simply does not act.
      for (let step = 0; step < all.length; step += 1) {
        const target = all[(next + step * (e.shiftKey ? -1 : 1) + all.length * 2) % all.length];
        target?.focus();
        if (document.activeElement === target) return;
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  // Chrome inverts against light grounds. The ground is probed at the
  // chrome line itself (y≈56px) so short bands at page ends are detected
  // correctly - an intersection band cannot see sections that never reach
  // the top of the viewport (§05/§14). rAF-throttled; nested scenes win by
  // document order (deepest last).
  useEffect(() => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      const sections = document.querySelectorAll<HTMLElement>("[data-dao-scene]");
      let scene = "dark";
      const probeY = 56;
      // Brand pass §15-§18: section boundaries no longer carry a torn edge
      // painted in the previous ground, so the probe no longer has to wait
      // for a tear's midpoint to clear the chrome line - the section that
      // actually covers the chrome line owns the chrome, exactly.
      sections.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= probeY && r.bottom >= probeY) {
          scene = s.getAttribute("data-dao-scene") ?? scene;
        }
      });
      setLight(scene === "light");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // v7 #5 / §03-§04: global chrome auto-hide. After 1.8s without scroll /
  // pointer / touch / key input the chrome withdraws (600ms out, 250ms in via
  // CSS on html[data-dao-idle]). Never hides while the menu is open or while a
  // chrome control has focus. Debounced through one shared timer - no flicker
  // under intermittent scroll.
  //
  // §03: the same choreography now genuinely applies on touch. It did not
  // before, for one reason: the "pointer is resting in the top 120px" guard
  // read the last pointermove position, and on a touch device pointermove
  // fires from the FINGER. Any tap or swipe that started near the top - the
  // brand, the burger, the language switcher, i.e. exactly what people touch -
  // pinned pointerY low, and because no mouse ever moves afterwards to reset
  // it, hide() bailed out forever and the chrome stayed up permanently. The
  // guard is a hover affordance, so it is now limited to real mouse pointers
  // and cleared when a touch ends.
  useEffect(() => {
    const root = document.documentElement;
    if (open) {
      root.removeAttribute("data-dao-idle");
      return;
    }
    let timer: number | undefined;
    let pointerY = Infinity;
    let lastArm = 0;

    // Keyboard focus holds the chrome open; pointer focus must NOT.
    // Tapping a control leaves focus on it, and on Chromium/Android that focus
    // is sticky - with a plain activeElement check, opening the burger once and
    // closing it again pinned the chrome on screen for the rest of the session,
    // because nothing ever moves the focus off it. :focus-visible is exactly
    // the distinction ("would the browser draw a focus ring here?"), and if an
    // engine cannot answer we keep the control visible, which is the safe way
    // to be wrong.
    const keyboardFocusInChrome = () => {
      const ae = document.activeElement;
      if (!ae || !ae.closest) return false;
      if (!ae.closest(".dao-chrome") && !ae.closest(".dao-returntab")) return false;
      try {
        return ae.matches(":focus-visible");
      } catch {
        return true;
      }
    };

    const hide = () => {
      if (keyboardFocusInChrome()) return;
      // only a resting MOUSE holds the chrome open
      if (pointerY < 120) return;
      root.setAttribute("data-dao-idle", "");
    };
    const arm = () => {
      // Throttled: raw pointermove/scroll streams re-arm at most every 150ms
      // (the reveal itself is instant because the attribute clears first).
      const now = performance.now();
      if (root.hasAttribute("data-dao-idle")) root.removeAttribute("data-dao-idle");
      if (now - lastArm < 150) return;
      lastArm = now;
      window.clearTimeout(timer);
      timer = window.setTimeout(hide, 1800);
    };
    const onPointer = (e: PointerEvent) => {
      // a finger or pen is a transient contact, not a resting cursor
      pointerY = e.pointerType === "mouse" ? e.clientY : Infinity;
      arm();
    };
    const onPointerGone = () => {
      pointerY = Infinity;
      arm();
    };

    arm();
    const opts = { passive: true } as const;
    window.addEventListener("scroll", arm, opts);
    window.addEventListener("pointermove", onPointer, opts);
    window.addEventListener("pointerdown", onPointer, opts);
    // touchend/pointerup release the guard so the idle timer can complete
    window.addEventListener("pointerup", onPointerGone, opts);
    window.addEventListener("pointercancel", onPointerGone, opts);
    window.addEventListener("touchstart", arm, opts);
    window.addEventListener("touchend", onPointerGone, opts);
    window.addEventListener("keydown", arm);
    window.addEventListener("focusin", arm);
    return () => {
      window.clearTimeout(timer);
      root.removeAttribute("data-dao-idle");
      window.removeEventListener("scroll", arm);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("pointerup", onPointerGone);
      window.removeEventListener("pointercancel", onPointerGone);
      window.removeEventListener("touchstart", arm);
      window.removeEventListener("touchend", onPointerGone);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("focusin", arm);
    };
  }, [open]);

  const href = (path: string) => localeHref(locale, path);
  // --d opens with forward stagger; --dx closes with reverse stagger (v7 #3)
  const stagger = (i: number) => ({
    ["--d" as string]: `${120 + i * 60}ms`,
    ["--dx" as string]: `${(7 - i) * 40}ms`,
  });

  // v7 #4: preview follows the hovered row (vertically centred on it) and
  // alternates ±1.5° rotation per link. Its top edge is clamped so the card
  // always starts below the EN/KA + burger line with a deliberate gap.
  const PREVIEW_MIN_TOP = 112;
  const hoverPreview = (key: string, index: number) => (e: React.SyntheticEvent<HTMLElement>) => {
    // covers the rare resize across 900px while the sheet is already open
    armPreviews();
    const rect = e.currentTarget.getBoundingClientRect();
    setPreview({ key, top: rect.top + rect.height / 2, rot: index % 2 ? 1.5 : -1.5 });
  };
  // §02: leaving a row retires its own preview. Moving to another row clears
  // and sets in the same batch, so the crossfade between rows is unchanged.
  const leavePreview = (key: string) => () => setPreview((p) => (p && p.key === key ? null : p));
  // §02: focus only raises a preview once the visitor is actually navigating by
  // keyboard - never on the programmatic focus that opening the sheet performs,
  // which would otherwise show a preview before the cursor reaches any row.
  const focusPreview = (key: string, index: number) => (e: React.SyntheticEvent<HTMLElement>) => {
    if (!keyboardNav.current) return;
    hoverPreview(key, index)(e);
  };

  const previews: Record<string, string> = {
    work: "/media/aom-cover.jpg",
    services: "/media/bts-set.jpg",
    studio: "/media/bts-camera.jpg",
    lab: "/media/aom-gallery-2.jpg",
    process: "/media/georgia-set.jpg",
    georgia: "/media/georgia-hero.jpg",
    contact: "/media/aom-hero.jpg",
    start: "/media/bts-set.jpg",
  };

  // §04/§05: the brand mark is an explicit client-side Home destination
  // (never history.back, never a raw document load - a hard load would
  // replay the Studio Ident). Already on Home: return to the top of the
  // Master Showreel (smooth via the html scroll-behavior; instant under
  // reduced motion). From any other route the Link navigates client-side
  // and Next resets scroll to the top.
  const onBrand = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (open || closing) close();
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (stripLocale(pathname) === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0 });
    }
  };

  // §13/§14: one language switcher only - the top-right control. It stays
  // functional while the sheet is open, and a switch now KEEPS the sheet open
  // instead of closing it. switchLocalePath already preserves the current
  // route, so /work -> /ka/work; the href is a client-side Link, never a hard
  // load, so the ident does not replay.
  const onLang = () => {
    if (!open && !closing) return;
    const store = safeSession();
    try {
      store?.setItem(NAV_OPEN_KEY, "1");
    } catch {
      /* private mode - the sheet will just be closed after the switch */
    }
  };

  return (
    <>
      <div className={cn("dao-chrome", light && !open && "dao-chrome--light")}>
        <Link
          href={localeHref(locale, "/")}
          className="dao-chrome__brand"
          aria-label="8th State Production"
          onClick={onBrand}
        >
          <span className="dao-chrome__mark dao-mask" aria-hidden="true" />
          <span className="dao-chrome__word">8TH STATE</span>
        </Link>
        <div className="dao-chrome__right">
          <span className="dao-lang">
            <Link
              href={switchLocalePath(pathname, "en", search)}
              aria-current={locale === "en" ? "true" : undefined}
              aria-label={messages.common.switchToEnglish}
              onClick={onLang}
            >
              EN
            </Link>
            <Link
              href={switchLocalePath(pathname, "ka", search)}
              aria-current={locale === "ka" ? "true" : undefined}
              aria-label={messages.common.switchToGeorgian}
              onClick={onLang}
            >
              KA
            </Link>
          </span>
          <button
            ref={burgerRef}
            type="button"
            className="dao-burger"
            aria-expanded={open}
            aria-controls="dao-nav"
            aria-label={open ? m.close : m.open}
            onClick={toggle}
          >
            <span className="dao-burger__line" aria-hidden="true" />
            <span className="dao-burger__line" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id="dao-nav"
        ref={navRef}
        className={cn("dao-nav", open && "is-open", closing && "is-closing")}
        role="dialog"
        aria-modal="true"
        aria-label={messages.nav.menu}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="dao-weave" aria-hidden="true" />
        <div className="dao-nav__serpent dao-mask" aria-hidden="true" />
        <nav className="dao-nav__list" aria-label={messages.nav.primary}>
          {/* 01 WORK - the label itself opens the full archive (/work, ALL
              active - never a remembered category). The numeral carries the
              categories toggle so the approved sub-list stays reachable
              without adding a visible control. */}
          <span className="dao-nav__mask">
            <span className="dao-nav__row" style={stagger(0)}>
              <button
                type="button"
                className="dao-nav__num dao-nav__num--toggle"
                aria-expanded={workOpen}
                aria-label={m.expandWork}
                onClick={() => setWorkOpen((v) => !v)}
              >
                01
              </button>
              <Link
                href={href("/work")}
                className="dao-nav__link"
                onMouseEnter={hoverPreview("work", 0)}
                onFocus={focusPreview("work", 0)}
                onMouseLeave={leavePreview("work")}
                onBlur={leavePreview("work")}
                onClick={close}
                style={{ position: "relative" }}
              >
                {/* §11: the blue rule under WORK is gone. It painted whenever the
                    categories were expanded, which read as a stray underline on the
                    label rather than as state. Nothing is lost: the expanded state is
                    carried by aria-expanded on the numeral toggle and, visually, by
                    the category list itself appearing. No focus affordance was ever
                    attached to it - focus is .dao-nav__link:focus-visible. */}
                {m.work}
              </Link>
              <span className="dao-nav__ka" aria-hidden="true">
                {m.workKa}
              </span>
            </span>
          </span>
          <div className={cn("dao-nav__cats", workOpen && "is-open")} inert={!workOpen}>
            <Link href={href("/work?category=film-video")} className="dao-nav__cat" onClick={close}>
              {m.catFilm}
              <span className="dao-strike" style={{ background: "var(--dao-blue)", height: 3 }} />
            </Link>
            <Link
              href={href("/work?category=photography")}
              className="dao-nav__cat"
              onClick={close}
            >
              {m.catPhoto}
              <span className="dao-strike" style={{ background: "var(--dao-blue)", height: 3 }} />
            </Link>
            <Link
              href={href("/work?category=production-spatial")}
              className="dao-nav__cat"
              onClick={close}
            >
              {m.catSpatial}
              <span className="dao-strike" style={{ background: "var(--dao-blue)", height: 3 }} />
            </Link>
            <Link
              href={href("/work?category=studio-lab")}
              className="dao-nav__cat dao-nav__cat--lab"
              onClick={close}
            >
              {m.catLab}
              <span className="dao-strike" style={{ background: "var(--dao-green)", height: 3 }} />
            </Link>
            <Link href={href("/work")} className="dao-nav__cat" onClick={close}>
              {m.catArchive}
              <span className="dao-strike" style={{ background: "var(--dao-blue)", height: 3 }} />
            </Link>
          </div>

          <NavRow
            n="02"
            label={m.services}
            ka={m.servicesKa}
            href={href("/services")}
            style={stagger(1)}
            dim={workOpen}
            onHover={hoverPreview("services", 1)}
            onFocusPreview={focusPreview("services", 1)}
            onLeave={leavePreview("services")}
            onClick={close}
          />
          <NavRow
            n="03"
            label={m.studio}
            ka={m.studioKa}
            href={href("/studio")}
            style={stagger(2)}
            dim={workOpen}
            onHover={hoverPreview("studio", 2)}
            onFocusPreview={focusPreview("studio", 2)}
            onLeave={leavePreview("studio")}
            onClick={close}
          />
          <NavRow
            n="04"
            label={m.lab}
            ka={m.labKa}
            href={href("/studio-lab")}
            style={stagger(3)}
            dim={workOpen}
            lab
            onHover={hoverPreview("lab", 3)}
            onFocusPreview={focusPreview("lab", 3)}
            onLeave={leavePreview("lab")}
            onClick={close}
          />
          <NavRow
            n="05"
            label={m.process}
            ka={m.processKa}
            href={href("/process")}
            style={stagger(4)}
            dim={workOpen}
            onHover={hoverPreview("process", 4)}
            onFocusPreview={focusPreview("process", 4)}
            onLeave={leavePreview("process")}
            onClick={close}
          />
          <NavRow
            n="06"
            label={m.georgia}
            ka={m.georgiaKa}
            href={href("/georgia-production")}
            style={stagger(5)}
            dim={workOpen}
            small
            onHover={hoverPreview("georgia", 5)}
            onFocusPreview={focusPreview("georgia", 5)}
            onLeave={leavePreview("georgia")}
            onClick={close}
          />
          <NavRow
            n="07"
            label={m.contact}
            ka={m.contactKa}
            href={href("/contact")}
            style={stagger(6)}
            dim={workOpen}
            onHover={hoverPreview("contact", 6)}
            onFocusPreview={focusPreview("contact", 6)}
            onLeave={leavePreview("contact")}
            onClick={close}
          />
          <NavRow
            n="08"
            label={m.start}
            ka={m.startKa}
            href={href("/start-a-project")}
            style={stagger(7)}
            dim={workOpen}
            onHover={hoverPreview("start", 7)}
            onFocusPreview={focusPreview("start", 7)}
            onLeave={leavePreview("start")}
            onClick={close}
          />
        </nav>

        <div
          className={cn("dao-nav__preview", preview && open && "is-live")}
          style={
            preview
              ? {
                  ["--py" as string]: `${Math.max(Math.round(preview.top - 95), PREVIEW_MIN_TOP)}px`,
                  ["--pr" as string]: `${preview.rot}deg`,
                }
              : undefined
          }
          aria-hidden="true"
        >
          <span className="dao-nav__previewinner">
            {/* optimized responsive sources at the preview's real display
                size (max 300×190, dao.css) - same files, same cover crop,
                same crossfade; DPR handled by the srcset (sizes=300px).
                Default (lazy/low-priority) loading is deliberate: the open
                sheet puts them in-viewport so they still fetch immediately,
                but at low network priority - router RSC fetches always win
                the connection pool, so a click during the curtain can never
                queue behind preview bytes. */}
            {previewsReady &&
              Object.entries(previews).map(([key, src]) => (
                <Image
                  key={key}
                  src={src}
                  alt=""
                  width={600}
                  height={380}
                  sizes="300px"
                  unoptimized={src === "/media/aom-cover.jpg"}
                  className={preview?.key === key ? "is-on" : ""}
                />
              ))}
          </span>
        </div>

        {/* §01: no second EN/KA inside the sheet - the top-right chrome
            control (z-index above the sheet) is the single switcher in both
            menu-open and menu-closed states */}
      </div>
    </>
  );
}

function NavRow({
  n,
  label,
  ka,
  href,
  style,
  dim,
  lab,
  /* §Refinement 07: only the ONE label that cannot fit at the shared size -
     GEORGIA PRODUCTION - and even then only in the Georgian document. See the
     .dao-nav__link--sm rule. */
  small,
  onHover,
  onFocusPreview,
  onLeave,
  onClick,
}: {
  n: string;
  label: string;
  ka: string;
  href: string;
  style?: React.CSSProperties;
  dim?: boolean;
  lab?: boolean;
  small?: boolean;
  onHover?: (e: React.SyntheticEvent<HTMLElement>) => void;
  onFocusPreview?: (e: React.SyntheticEvent<HTMLElement>) => void;
  onLeave?: () => void;
  onClick?: () => void;
}) {
  return (
    <span className="dao-nav__mask">
      <span
        className={cn("dao-nav__row", dim && "is-dim", lab && "dao-nav__row--lab")}
        style={style}
      >
        <span className="dao-nav__num" aria-hidden="true">
          {n}
        </span>
        {/* client-side Link, never a raw <a>: a raw anchor forces a full
            document load, which replays the Studio Ident on every burger
            navigation (§01) */}
        <Link
          href={href}
          className={cn("dao-nav__link", lab && "dao-nav__link--lab", small && "dao-nav__link--sm")}
          onMouseEnter={onHover}
          onFocus={onFocusPreview}
          onMouseLeave={onLeave}
          onBlur={onLeave}
          onClick={onClick}
        >
          {label}
          {/* Studio Lab keeps its green rule. The bloom that used to sit between
              the two labels is gone - the row gap alone separates them now. */}
          {lab && (
            <span
              className="dao-strike"
              style={{
                background: "var(--dao-green)",
                bottom: "0.02em",
                // §08: thinner with the shared .dao-strike base
                height: "0.1em",
                left: "-2%",
                width: "104%",
              }}
              aria-hidden="true"
            />
          )}
        </Link>
        <span className="dao-nav__ka" lang={/[ა-ჰ]/.test(ka) ? "ka" : "en"} aria-hidden="true">
          {ka}
        </span>
      </span>
    </span>
  );
}
