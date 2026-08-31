"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { up } from "@/lib/cn";

/**
 * THE RESUME CONTROL, AND THE FILE IT OPENS.
 *
 * One control per person - never one button per language - because a dossier
 * offers a document and then asks which edition of it you want, and two
 * side-by-side buttons for the same document read as two documents.
 *
 * RESUME opens a small menu attached to it; choosing a language opens the CV
 * INSIDE the site, in a sheet dressed like the rest of the personnel file. The
 * reader never leaves the profile they were reading, which is the whole point:
 * a new browser tab drops them out of the dossier and onto a bare PDF page with
 * none of the studio's language around it.
 *
 * WHAT RENDERS AND WHAT DOES NOT
 * ------------------------------
 * Everything here is driven by the `resume` object on the person's own record.
 * A person with no resume renders no control at all; a person with only one
 * language is offered only that language. No filename is written at a call
 * site, and nothing is invented for anyone the studio has not supplied.
 */

export type ResumeSet = { en?: string; es?: string };

export type ResumeCopy = {
  /** the control label - "Resume" */
  resume: string;
  /** the menu's accessible name - "Choose a resume language" */
  chooseLanguage: string;
  /** viewer title suffix - "Resume" */
  viewerKicker: string;
  close: string;
  /** the fallback line, for a browser that cannot draw a PDF inline */
  cannotDisplay: string;
  openInTab: string;
  english: string;
  spanish: string;
};

type Lang = "en" | "es";

export function TeamResume({
  name,
  resume,
  copy,
  className,
}: {
  /** the person, for the viewer's title. Never used to build a path. */
  name: string;
  resume: ResumeSet;
  copy: ResumeCopy;
  className?: string;
}) {
  const langs = (["en", "es"] as const).filter((l) => !!resume[l]);
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState<Lang | null>(null);

  const trigger = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const first = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  const closeMenu = useCallback((focus = true) => {
    setMenu(false);
    if (focus) requestAnimationFrame(() => trigger.current?.focus());
  }, []);

  // click outside and Escape close the menu; Escape is stopped so it does not
  // also reach the profile sheet and close that too
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || trigger.current?.contains(t)) return;
      setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeMenu();
      }
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [menu, closeMenu]);

  // the menu opens onto its first item, so the keyboard lands somewhere useful
  useEffect(() => {
    if (menu) requestAnimationFrame(() => first.current?.focus());
  }, [menu]);

  if (!langs.length) return null;

  const label = (l: Lang) => (l === "en" ? copy.english : copy.spanish);

  /** roving focus, so the menu behaves like a menu and not like two buttons */
  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [],
    );
    if (!items.length) return;
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? at + 1 : at - 1;
      items[(next + items.length) % items.length]!.focus();
    }
    if (e.key === "Home") {
      e.preventDefault();
      items[0]!.focus();
    }
    if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]!.focus();
    }
  };

  return (
    <>
      <span className="dtm__resumewrap">
        <button
          type="button"
          ref={trigger}
          className={className}
          aria-expanded={menu}
          aria-haspopup="menu"
          aria-controls={menu ? menuId : undefined}
          onClick={() => setMenu((v) => !v)}
        >
          {up(copy.resume)} <span aria-hidden="true">▾</span>
        </button>

        {menu && (
          <div
            className="dtm__resumemenu"
            id={menuId}
            role="menu"
            aria-label={copy.chooseLanguage}
            ref={menuRef}
            onKeyDown={onMenuKey}
          >
            {langs.map((l, i) => (
              <button
                key={l}
                type="button"
                role="menuitem"
                ref={i === 0 ? first : undefined}
                className="dtm__resumeitem"
                onClick={() => {
                  setMenu(false);
                  setOpen(l);
                }}
              >
                {up(label(l))}
              </button>
            ))}
          </div>
        )}
      </span>

      {open && resume[open] && (
        <ResumeViewer
          name={name}
          lang={open}
          src={resume[open]!}
          copy={copy}
          onClose={() => {
            setOpen(null);
            requestAnimationFrame(() => trigger.current?.focus());
          }}
        />
      )}
    </>
  );
}

/**
 * THE RESUME SHEET.
 *
 * The CV inside the studio's own interface rather than on a bare browser PDF
 * page: a dossier bar naming the person and the edition, the document itself,
 * and one way out. The PDF is the supplied file, untouched - it is displayed,
 * never converted.
 *
 * The document is drawn in an <iframe>, which is the one method that needs no
 * extra runtime and lets the browser's own viewer page and scroll the whole
 * file. Some mobile browsers - iOS Safari in particular - refuse to scroll a
 * PDF inside a frame, so the bar also carries a plainly-labelled way to open
 * the same file directly. That is a fallback for a browser that cannot draw it,
 * not the path the control takes.
 */
function ResumeViewer({
  name,
  lang,
  src,
  copy,
  onClose,
}: {
  name: string;
  lang: Lang;
  src: string;
  copy: ResumeCopy;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey, true);
    requestAnimationFrame(() => panel.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  /**
   * Portalled to the body, and not for tidiness.
   *
   * The RESUME control lives inside the profile sheet, and that sheet is a
   * TRANSFORMED element - it travels from the roster card by animating its own
   * box. A transformed ancestor becomes the containing block for `position:
   * fixed`, so rendered in place this dialog would be pinned to the sheet
   * rather than to the viewport: on a phone it opened a third of the way down
   * the screen with the page showing above it.
   */
  return createPortal(
    <div className="dtr">
      <div className="dtr__scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="dtr__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panel}
      >
        <span className="dtr__grain" aria-hidden="true" />
        <div className="dtr__bar">
          <span className="dtr__title" id={titleId}>
            <span className="dtr__name">{up(name)}</span>
            <span className="dtr__ed">
              {up(copy.viewerKicker)} · {up(lang)}
            </span>
          </span>
          <span className="dtr__baractions">
            {/* the fallback, for a browser that will not draw a PDF inline */}
            <a className="dtr__tab" href={src} target="_blank" rel="noopener noreferrer">
              {up(copy.openInTab)}
            </a>
            <button type="button" className="dtr__close" onClick={onClose}>
              {up(copy.close)} <span aria-hidden="true">✕</span>
            </button>
          </span>
        </div>
        <div className="dtr__doc">
          <iframe className="dtr__frame" src={src} title={`${name} - ${copy.viewerKicker}`} />
          <p className="dtr__fallback">
            {copy.cannotDisplay}{" "}
            <a href={src} target="_blank" rel="noopener noreferrer">
              {up(copy.openInTab)}
            </a>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
