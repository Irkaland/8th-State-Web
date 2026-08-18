"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Messages } from "@/i18n";
import { type Locale, localeHref, stripLocale, switchLocalePath } from "@/i18n/locales";
import { cn } from "@/lib/cn";

/**
 * Persistent chrome (serpent chip + EN/KA + burger paper chip) and the
 * fullscreen ink-sheet navigation (handoff 1b / 2c / 2d).
 * Open 450ms, close 320ms; links rise from masks with 60ms stagger;
 * WORK expands its approved categories; focus is trapped while open.
 */
export function DaoChrome({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.dao.nav;
  const pathname = usePathname() || "/";
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

  // v7 #3: curtain-up close - links exit masks first, sheet travels up with
  // its torn edge (~640ms total, phases overlap; CSS carries the phases).
  const close = useCallback(() => {
    setClosing(true);
    setOpen(false);
    setWorkOpen(false);
    window.setTimeout(() => setClosing(false), 660);
    burgerRef.current?.focus();
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
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !nav) return;
      const focusables = Array.from(
        nav.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ).filter((el) => el.offsetParent !== null);
      // §01: the single EN/KA switcher lives in the top-right chrome (the
      // burger sheet carries none) - keep it reachable inside the trap.
      const lang = Array.from(
        document.querySelectorAll<HTMLElement>(".dao-chrome .dao-lang a"),
      ).filter((el) => el.offsetParent !== null);
      const burger = burgerRef.current;
      const all = burger ? [...focusables, ...lang, burger] : [...focusables, ...lang];
      if (all.length === 0) return;
      const idx = all.indexOf(document.activeElement as HTMLElement);
      let next = idx;
      if (e.shiftKey) next = idx <= 0 ? all.length - 1 : idx - 1;
      else next = idx === all.length - 1 ? 0 : idx + 1;
      e.preventDefault();
      all[next]?.focus();
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
      // Every section boundary carries a torn edge (up to 58px) painted in
      // the PREVIOUS ground. A section only owns the chrome once the tear's
      // midpoint has passed the chrome line, so the controls never flip to
      // the wrong variant while a boundary is still under them mid-scroll.
      // (A section resting at top: 0 still owns it - 0 <= 56 - 29.)
      const tearHalf = 29;
      sections.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= probeY - tearHalf && r.bottom >= probeY) {
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

  // v7 #5: global chrome auto-hide. After 1.8s without scroll / pointer /
  // touch / key input the chrome withdraws (600ms out, 250ms in via CSS on
  // html[data-dao-idle]). Never hides while the menu is open, while a chrome
  // control has focus, or while the pointer rests in the top 120px. Debounced
  // through one shared timer - no flicker under intermittent scroll.
  useEffect(() => {
    const root = document.documentElement;
    if (open) {
      root.removeAttribute("data-dao-idle");
      return;
    }
    let timer: number | undefined;
    let pointerY = Infinity;
    let lastArm = 0;

    const hide = () => {
      const ae = document.activeElement;
      if (ae && (ae.closest(".dao-chrome") || ae.closest(".dao-returntab"))) return;
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
      pointerY = e.clientY;
      arm();
    };

    arm();
    const opts = { passive: true } as const;
    window.addEventListener("scroll", arm, opts);
    window.addEventListener("pointermove", onPointer, opts);
    window.addEventListener("touchstart", arm, opts);
    window.addEventListener("keydown", arm);
    window.addEventListener("focusin", arm);
    return () => {
      window.clearTimeout(timer);
      root.removeAttribute("data-dao-idle");
      window.removeEventListener("scroll", arm);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchstart", arm);
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

  // §01: one language switcher only - the top-right control. It stays
  // functional while the sheet is open, so a switch also closes the sheet.
  const onLang = () => {
    if (open || closing) close();
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
              href={switchLocalePath(pathname, "en")}
              aria-current={locale === "en" ? "true" : undefined}
              aria-label={messages.common.switchToEnglish}
              onClick={onLang}
            >
              EN
            </Link>
            <Link
              href={switchLocalePath(pathname, "ka")}
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
                onFocus={hoverPreview("work", 0)}
                onClick={close}
                style={{ position: "relative" }}
              >
                {m.work}
                <span
                  className={cn("dao-strike", workOpen && "dao-strike--on")}
                  style={{ background: "var(--dao-blue)", bottom: "6px", height: "12px" }}
                  aria-hidden="true"
                />
              </Link>
              <span className="dao-nav__ka" aria-hidden="true">
                {m.workKa}
              </span>
            </span>
          </span>
          <div className={cn("dao-nav__cats", workOpen && "is-open")} inert={!workOpen}>
            <Link href={href("/work?category=film-video")} className="dao-nav__cat" onClick={close}>
              {m.catFilm}
              <span className="dao-strike" style={{ background: "var(--dao-blue)", height: 5 }} />
            </Link>
            <Link
              href={href("/work?category=photography")}
              className="dao-nav__cat"
              onClick={close}
            >
              {m.catPhoto}
              <span className="dao-strike" style={{ background: "var(--dao-blue)", height: 5 }} />
            </Link>
            <Link
              href={href("/work?category=production-spatial")}
              className="dao-nav__cat"
              onClick={close}
            >
              {m.catSpatial}
              <span className="dao-strike" style={{ background: "var(--dao-blue)", height: 5 }} />
            </Link>
            <Link
              href={href("/work?category=studio-lab")}
              className="dao-nav__cat dao-nav__cat--lab"
              onClick={close}
            >
              {m.catLab}
              <span className="dao-strike" style={{ background: "var(--dao-green)", height: 5 }} />
            </Link>
            <Link href={href("/work")} className="dao-nav__cat" onClick={close}>
              {m.catArchive}
              <span className="dao-strike" style={{ background: "var(--dao-blue)", height: 5 }} />
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
            onClick={close}
          />
          <NavRow
            n="08"
            label={m.start}
            ka={m.startKa}
            href={href("/start-a-project")}
            style={stagger(7)}
            dim={workOpen}
            small
            onHover={hoverPreview("start", 7)}
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
  small,
  onHover,
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
          onFocus={onHover}
          onClick={onClick}
        >
          {label}
          {lab && (
            <>
              <span
                className="dao-strike"
                style={{
                  background: "var(--dao-green)",
                  bottom: "0.02em",
                  height: "0.16em",
                  left: "-2%",
                  width: "104%",
                }}
                aria-hidden="true"
              />
              <span
                className="dao-mask"
                aria-hidden="true"
                style={{
                  ["--m" as string]: "url(/assets/graphics/bloom.webp)",
                  position: "absolute",
                  right: "-0.9em",
                  top: "-0.14em",
                  width: "0.72em",
                  height: "0.72em",
                  background: "var(--dao-yellow)",
                  opacity: 0,
                  transition: "opacity 200ms ease",
                }}
                data-dao-bloom
              />
            </>
          )}
        </Link>
        <span className="dao-nav__ka" lang={/[ა-ჰ]/.test(ka) ? "ka" : "en"} aria-hidden="true">
          {ka}
        </span>
      </span>
    </span>
  );
}
