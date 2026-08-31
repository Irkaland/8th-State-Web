"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { t } from "@/content/localized";
import type { Locale } from "@/i18n/locales";
import type { LabCourseId } from "@/content/lab-courses";
import {
  LAB_CONTACT_METHODS,
  LAB_LANGUAGES,
  LAB_REG_COPY,
  labRegCourseOptions,
  type LabContactMethod,
  type LabLanguagePref,
} from "@/content/lab-registration";
import { cn, up } from "@/lib/cn";
import { LabArrow } from "./LabKit";

/**
 * THE STUDIO LAB REGISTRATION FILE.
 *
 * One registration experience, opened from six places: the hero CTA, each row
 * of the current programme, the featured-course CTAs, the course sheets and
 * section 10. It is a single component rather than six forms because the whole
 * point of the approved design is that the reader is handed THE SAME file
 * wherever they ask for it, already turned to the right course.
 *
 * WHY A CONTEXT AND NOT A PROP
 * ----------------------------
 * /studio-lab and the course sheets are server components, and they should
 * stay that way - they are long, static, and the page is readable with
 * JavaScript off. The provider is the only client boundary: it renders the
 * server-rendered page as `children` and owns the dialog. `LabRegisterButton`
 * is a small client leaf that can then sit anywhere inside that server tree
 * and ask for the file by course id.
 *
 * WHAT THIS DOES NOT DO
 * ---------------------
 * It does not send anything. The repository has no form backend of any kind -
 * no API route, no Netlify Forms, no third-party endpoint - and the site's
 * other two forms (the brief at /start-a-project and the contact act) are
 * front-end only for the same reason. Rather than fake a POST or, worse, tell
 * a visitor their file was delivered when nothing left the browser, the submit
 * path stops at a single named boundary - `deliverRegistration` below - which
 * is where a real transport is dropped in. Until one exists the dialog reports
 * exactly what happened: the file was completed, not that it was sent.
 * See the handover note.
 */

export type LabRegistrationValues = {
  course: LabCourseId | "";
  first: string;
  last: string;
  email: string;
  phone: string;
  contact: LabContactMethod | "";
  lang: LabLanguagePref | "";
  note: string;
  consent: boolean;
};

/**
 * THE INTEGRATION BOUNDARY.
 *
 * The one place a real transport goes. It resolves `"pending"` today, which is
 * the honest answer: the registration is complete and nothing has been sent.
 * The dialog renders its confirmation from that value and never claims
 * delivery. When the studio supplies an endpoint, this function posts to it and
 * returns "sent" or "error" - and no other line in this file has to change.
 */
export type LabDeliveryResult = "sent" | "pending" | "error";

/**
 * The payload a transport would post. Built here rather than at the call site
 * so the shape is settled and reviewable now, and connecting a real endpoint
 * is a fetch() around an object that already exists.
 */
export function registrationPayload(values: LabRegistrationValues) {
  return {
    course: values.course,
    firstName: values.first.trim(),
    lastName: values.last.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    preferredContact: values.contact,
    language: values.lang,
    note: values.note.trim(),
    consent: values.consent,
  };
}

export async function deliverRegistration(
  values: LabRegistrationValues,
): Promise<LabDeliveryResult> {
  // The payload is assembled and validated; there is nowhere approved to send
  // it yet. Returning "pending" is what keeps the confirmation honest - see
  // the note at the top of this file.
  registrationPayload(values);
  return "pending";
}

type OpenFn = (course?: LabCourseId) => void;
const LabRegCtx = createContext<OpenFn | null>(null);

/** Opens the registration file. Null outside the provider, so the button can hide. */
export function useLabRegistration(): OpenFn | null {
  return useContext(LabRegCtx);
}

const EMPTY: LabRegistrationValues = {
  course: "",
  first: "",
  last: "",
  email: "",
  phone: "",
  contact: "",
  lang: "",
  note: "",
  consent: false,
};

export function LabRegistrationProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<LabRegistrationValues>(EMPTY);
  const [err, setErr] = useState<"" | "missing" | "send">("");
  const [done, setDone] = useState(false);

  /** the element that asked for the file, so focus can be handed back to it */
  const opener = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const heading = useRef<HTMLSpanElement | null>(null);
  const titleId = useId();

  const openFile = useCallback<OpenFn>((course) => {
    opener.current = (document.activeElement as HTMLElement) ?? null;
    setErr("");
    setDone(false);
    setValues((v) => ({ ...v, course: course ?? v.course }));
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // hand focus back to whatever opened the file, so a keyboard reader is not
    // dropped at the top of the document
    requestAnimationFrame(() => opener.current?.focus?.());
  }, []);

  // Escape closes, and the body does not scroll behind the file. Both are torn
  // down on unmount so a route change can never leave the page locked.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  // focus moves into the file when it opens, and onto the confirmation when the
  // form is replaced by it - the reader is never left on an unmounted control
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      (done ? heading.current : panel.current)?.focus?.();
    });
  }, [open, done]);

  const courses = useMemo(() => labRegCourseOptions(), []);
  const selected = courses.find((c) => c.id === values.course);
  const C = LAB_REG_COPY;
  const set = <K extends keyof LabRegistrationValues>(k: K, v: LabRegistrationValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = values;
    if (
      !v.course ||
      !v.first.trim() ||
      !v.last.trim() ||
      !v.email.trim() ||
      !v.phone.trim() ||
      !v.contact ||
      !v.lang ||
      !v.consent
    ) {
      setErr("missing");
      return;
    }
    const result = await deliverRegistration(v);
    if (result === "error") {
      setErr("send");
      return;
    }
    setErr("");
    setDone(true);
  };

  return (
    <LabRegCtx.Provider value={openFile}>
      {children}
      {open ? (
        <div className="dlr">
          {/* the scrim is not a control: Escape and the CLOSE button close the
              file, and a click here does too, but it is never in the tab order */}
          <div className="dlr__scrim" onClick={close} aria-hidden="true" />
          <div className="dlr__sheetwrap">
            <div
              className="dlr__sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              ref={panel}
            >
              <span className="dlr__grain" aria-hidden="true" />
              <span className="dlr__weave" aria-hidden="true" />
              <span className="dlr__serpent" aria-hidden="true" />

              <div className="dlr__mast">
                <span className="dlr__mark" id={titleId}>
                  {up(t(C.fileMark, locale))}
                </span>
                <button type="button" className="dlr__close" onClick={close}>
                  {up(t(C.close, locale))} ✕
                </button>
              </div>

              <div className="dlr__body">
                <div className="dlr__side">
                  <span className="dlr__eyebrow">
                    {up(t(C.courseEyebrow, locale))} / {selected ? selected.no : "—"}
                  </span>
                  <span className="dlr__course">
                    {selected ? t(selected.name, locale) : t(C.courseUnset, locale)}
                  </span>

                  <label className="dlr__field">
                    <span className="dlr__label">{up(t(C.fieldCourse, locale))} *</span>
                    <select
                      className="dlr__input"
                      value={values.course}
                      onChange={(e) => {
                        set("course", e.target.value as LabCourseId | "");
                        setErr("");
                      }}
                      required
                    >
                      <option value="">{t(C.coursePlaceholder, locale)}</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.no} — {t(c.name, locale)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selected ? (
                    <div className="dlr__meta">
                      <span>
                        {up(t(C.lecturerLabel, locale))} — {selected.lecturer}
                      </span>
                      <span className={cn(selected.formatTbd && "is-tbd")}>
                        {up(t(C.formatLabel, locale))} — {t(selected.format, locale)}
                      </span>
                    </div>
                  ) : null}

                  <span className="dlr__desk">{up(t(C.deskNote, locale))}</span>
                </div>

                <div className="dlr__main">
                  {done ? (
                    <div className="dlr__done">
                      <span className="dlr__eyebrow">{up(t(C.sentEyebrow, locale))}</span>
                      <span className="dlr__donetitle" tabIndex={-1} ref={heading}>
                        {up(t(C.sentTitle, locale))}
                      </span>
                      <p className="dlr__donecopy">{t(C.sentBody, locale)}</p>
                      <button type="button" className="dlr__back" onClick={close}>
                        {up(t(C.sentBack, locale))}
                      </button>
                    </div>
                  ) : (
                    <form className="dlr__form" onSubmit={submit} noValidate>
                      {err ? (
                        <p className="dlr__error" role="alert">
                          {up(t(err === "send" ? C.errSend : C.errMissing, locale))}
                        </p>
                      ) : null}

                      <div className="dlr__grid">
                        <Text
                          label={`${up(t(C.fieldFirst, locale))} *`}
                          value={values.first}
                          onChange={(v) => set("first", v)}
                          autoComplete="given-name"
                        />
                        <Text
                          label={`${up(t(C.fieldLast, locale))} *`}
                          value={values.last}
                          onChange={(v) => set("last", v)}
                          autoComplete="family-name"
                        />
                        <Text
                          label={`${up(t(C.fieldEmail, locale))} *`}
                          value={values.email}
                          onChange={(v) => set("email", v)}
                          type="email"
                          autoComplete="email"
                        />
                        <Text
                          label={`${up(t(C.fieldPhone, locale))} *`}
                          value={values.phone}
                          onChange={(v) => set("phone", v)}
                          type="tel"
                          autoComplete="tel"
                        />
                      </div>

                      <div className="dlr__choices">
                        <Choice
                          legend={`${up(t(C.fieldContact, locale))} *`}
                          options={LAB_CONTACT_METHODS.map((o) => ({
                            id: o.id,
                            label: t(o.label, locale),
                          }))}
                          value={values.contact}
                          onPick={(v) => set("contact", v as LabContactMethod)}
                        />
                        <Choice
                          legend={`${up(t(C.fieldLang, locale))} *`}
                          options={LAB_LANGUAGES.map((o) => ({
                            id: o.id,
                            label: t(o.label, locale),
                          }))}
                          value={values.lang}
                          onPick={(v) => set("lang", v as LabLanguagePref)}
                        />
                      </div>

                      <label className="dlr__field">
                        <span className="dlr__label">{up(t(C.fieldNote, locale))}</span>
                        <textarea
                          className="dlr__input dlr__textarea"
                          rows={2}
                          value={values.note}
                          onChange={(e) => set("note", e.target.value)}
                          placeholder={t(C.notePlaceholder, locale)}
                        />
                      </label>

                      <div className="dlr__foot">
                        <label className="dlr__consent">
                          <input
                            type="checkbox"
                            className="dlr__check"
                            checked={values.consent}
                            onChange={(e) => set("consent", e.target.checked)}
                          />
                          <span className="dlr__consenttext">{t(C.consent, locale)} *</span>
                        </label>
                        <button type="submit" className="dlr__submit">
                          {up(t(C.submit, locale))}
                          <LabArrow weight={1.4} />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </LabRegCtx.Provider>
  );
}

function Text({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="dlr__field">
      <span className="dlr__label">{label}</span>
      <input
        className="dlr__input"
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/**
 * A choice row - contact method, language.
 *
 * Real radios inside a fieldset rather than the design's row of styled
 * buttons: a button row tells a screen reader nothing about how many choices
 * there are or which is current, and these two rows are required fields. The
 * input itself is visually hidden and the label carries the approved chip, so
 * the composition is the design's and the semantics are a radio group's.
 */
function Choice({
  legend,
  options,
  value,
  onPick,
}: {
  legend: string;
  options: { id: string; label: string }[];
  value: string;
  onPick: (v: string) => void;
}) {
  const name = useId();
  return (
    <fieldset className="dlr__choice">
      <legend className="dlr__label">{legend}</legend>
      <div className="dlr__opts">
        {options.map((o) => (
          <label key={o.id} className={cn("dlr__opt", value === o.id && "is-on")}>
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={value === o.id}
              onChange={() => onPick(o.id)}
            />
            <span>{up(o.label)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The control that opens the file, already turned to a course.
 *
 * A real <button>, never an anchor and never nested inside one - the programme
 * row's course name is the link to its sheet, and this sits beside it as its
 * own control. Without JavaScript it renders as a link to the registration
 * section, which is where a reader with no dialog should land.
 */
export function LabRegisterButton({
  course,
  label,
  className,
  children,
}: {
  course?: LabCourseId;
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  const openFile = useLabRegistration();
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => openFile?.(course)}
    >
      {children}
    </button>
  );
}
