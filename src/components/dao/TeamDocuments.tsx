"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TeamDocument } from "@/content/team-documents";
import { up } from "@/lib/cn";

/**
 * THE DOSSIER'S DOCUMENTS, AND THE SHEET THEY OPEN IN.
 *
 * A personnel file offers documents. There are two kinds, and they are not the
 * same thing:
 *
 *   RESUME            a PDF the studio laid out and owns. Shown as the file it
 *                     is, in the browser's own viewer, inside our frame.
 *   BIOGRAPHY,        prose. Drawn as real markup from content/team-documents,
 *   ARTIST STATEMENT  in the art direction of the sheet it came from.
 *
 * What they share is the SHELL: one portalled dialog, one way in, one way out,
 * one set of accessibility guarantees. What they do not share is the inside -
 * Bekassio's burnt-orange field with his black sun is not Mariam's warm paper,
 * and flattening both into a generic article template would throw away the
 * thing that makes them her documents and his.
 *
 * THERE IS NO LANGUAGE MENU. The resume used to be a menu of editions - EN and
 * ES - which meant two clicks to reach the only document most readers wanted.
 * There is now one English CV, so RESUME opens it. A control that offers one
 * choice is not a choice; it is a delay.
 */

export type ResumeCopy = {
  resume: string;
  biography: string;
  artistStatement: string;
  close: string;
  /** the fallback line, for a browser that cannot draw a PDF inline */
  cannotDisplay: string;
  openInTab: string;
};

type OpenDoc = { kind: "resume"; src: string } | { kind: "native"; doc: TeamDocument };

/**
 * The document controls, derived from the person's own data.
 *
 * Nothing here asks who the person is. A control exists because the content
 * layer says the document exists, which is what lets a third team member with
 * no documents render none of them and a fourth gain a biography without a
 * component being touched.
 */
export function TeamDocumentControls({
  resumeSrc,
  biography,
  artistStatement,
  name,
  copy,
}: {
  resumeSrc?: string;
  biography?: TeamDocument;
  artistStatement?: TeamDocument;
  /** the person, for the sheet's title. Never used to build a path. */
  name: string;
  copy: ResumeCopy;
}) {
  const [open, setOpen] = useState<OpenDoc | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  const openFrom = (e: React.MouseEvent<HTMLButtonElement>, next: OpenDoc) => {
    opener.current = e.currentTarget;
    setOpen(next);
  };
  const close = () => {
    setOpen(null);
    // back to the control that opened it, not to the top of the document
    requestAnimationFrame(() => opener.current?.focus());
  };

  return (
    <>
      {resumeSrc && (
        <button
          type="button"
          className="dtm__doc dtm__doc--resume"
          onClick={(e) => openFrom(e, { kind: "resume", src: resumeSrc })}
        >
          {up(copy.resume)}
        </button>
      )}
      {biography && (
        <button
          type="button"
          className="dtm__doc"
          onClick={(e) => openFrom(e, { kind: "native", doc: biography })}
        >
          {up(copy.biography)}
        </button>
      )}
      {artistStatement && (
        <button
          type="button"
          className="dtm__doc"
          onClick={(e) => openFrom(e, { kind: "native", doc: artistStatement })}
        >
          {up(copy.artistStatement)}
        </button>
      )}

      {open && (
        <DocumentSheet
          name={name}
          kicker={
            open.kind === "resume"
              ? copy.resume
              : open.doc.id.includes("artist-statement")
                ? copy.artistStatement
                : copy.biography
          }
          label={open.kind === "resume" ? `${name} - ${copy.resume}` : open.doc.label}
          copy={copy}
          onClose={close}
          barAction={
            // only a PDF needs a way out to the file itself
            open.kind === "resume" ? (
              <a className="dtr__tab" href={open.src} target="_blank" rel="noopener noreferrer">
                {up(copy.openInTab)}
              </a>
            ) : null
          }
        >
          {open.kind === "resume" ? (
            <ResumeBody src={open.src} name={name} copy={copy} />
          ) : (
            <NativeBody doc={open.doc} />
          )}
        </DocumentSheet>
      )}
    </>
  );
}

/**
 * THE SHEET.
 *
 * One shell for every document: a dossier bar naming the person and which
 * document this is, the document itself, and one way out.
 *
 * Portalled to the body, and not for tidiness. The controls live inside the
 * profile sheet, and that sheet is a TRANSFORMED element - it travels from the
 * roster card by animating its own box. A transformed ancestor becomes the
 * containing block for `position: fixed`, so rendered in place this dialog
 * would be pinned to the sheet rather than to the viewport: on a phone it
 * opened a third of the way down the screen with the page showing above it.
 */
function DocumentSheet({
  name,
  kicker,
  label,
  copy,
  onClose,
  barAction,
  children,
}: {
  name: string;
  kicker: string;
  label: string;
  copy: ResumeCopy;
  onClose: () => void;
  /** an extra control in the dossier bar - the PDF fallback link, or nothing */
  barAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // stopped so it does not also close the profile sheet underneath
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
            <span className="dtr__ed">{up(kicker)}</span>
          </span>
          <span className="dtr__baractions">
            <span className="sr-only">{label}</span>
            {barAction}
            <button type="button" className="dtr__close" onClick={onClose}>
              {up(copy.close)} <span aria-hidden="true">✕</span>
            </button>
          </span>
        </div>
        <div className="dtr__doc">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * The CV, as the file it is.
 *
 * An <iframe> is the one method that needs no extra runtime and lets the
 * browser's own viewer page and scroll the whole document. Some mobile browsers
 * - iOS Safari in particular - refuse to scroll a PDF inside a frame, so the
 * bar also carries a plainly-labelled way to open the same file directly. That
 * is a fallback for a browser that cannot draw it, not the path the control
 * takes.
 */
function ResumeBody({ src, name, copy }: { src: string; name: string; copy: ResumeCopy }) {
  return (
    <>
      <iframe className="dtr__frame" src={src} title={`${name} - ${copy.resume}`} />
      <p className="dtr__fallback">
        {copy.cannotDisplay}{" "}
        <a href={src} target="_blank" rel="noopener noreferrer">
          {up(copy.openInTab)}
        </a>
      </p>
    </>
  );
}

/**
 * A biography or an artist statement, drawn rather than embedded.
 *
 * The art direction follows the source sheet - `data-design` selects it in CSS
 * - so Bekassio's documents keep his orange field, his condensed wordmark and
 * his sun, and Mariam's keep her paper and her pale wash. The prose itself is
 * the studio's, verbatim, from content/team-documents.
 *
 * On a phone this deliberately stops pretending to be A4. The identity is the
 * colour, the type and the composition; scaling a 595pt sheet down to 390px
 * would keep the proportions and lose the reading, which is the wrong trade.
 */
function NativeBody({ doc }: { doc: TeamDocument }) {
  return (
    <article className="dtd" data-design={doc.design} data-doc={doc.id}>
      {/* the sheet is the full width of the scrolled surface, so its ground and
          washes span the page edge to edge and scroll WITH the document; the
          column inside it holds the reading measure */}
      <div className="dtd__sheet">
        <div className="dtd__col">
          <header className="dtd__head">
            {doc.wordmark && <span className="dtd__wordmark">{up(doc.wordmark)}</span>}
            <h2 className="dtd__title">{doc.design === "bekassio" ? up(doc.title) : doc.title}</h2>
          </header>
          <div className="dtd__body">
            {doc.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {doc.mark === "sun" && <span className="dtd__sun dao-mask" aria-hidden="true" />}
        </div>
      </div>
    </article>
  );
}
