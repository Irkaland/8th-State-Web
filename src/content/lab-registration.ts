import type { LocalizedText } from "./localized";
import { LAB_COURSES, type LabCourseId } from "./lab-courses";

/**
 * THE STUDIO LAB REGISTRATION FILE - copy and field model.
 *
 * WHERE THIS SITS
 * ---------------
 * `lab-courses.ts` is the course system: what the Lab teaches, who teaches it,
 * and what each sheet says. This file is the one thing a visitor SENDS BACK -
 * the registration file the approved design opens over the page. It reads the
 * course list from there rather than restating it, so the selector, the course
 * pages and the programme index can never disagree about which four courses
 * exist or who teaches them.
 *
 * GEORGIAN
 * --------
 * The site is EN/KA and the Studio Lab already speaks Georgian throughout, so
 * this file does too - but only where the Georgian is genuinely the studio's.
 *
 * Three kinds of string live here:
 *
 *   1  Georgian that ALREADY EXISTS in the repository's approved Lab copy -
 *      `რეგისტრაცია`, `ტელეფონი`, `ელფოსტა`, the course names, the lecturer
 *      names. Reused verbatim.
 *   2  Plain UI nouns whose Georgian is unambiguous and already implied by the
 *      approved copy - `სახელი` and `გვარი` are the two halves of the existing
 *      `სახელი და გვარი`. Written out.
 *   3  New SENTENCES the design introduces: the consent statement, the two
 *      error messages, the confirmation paragraph and the enrolment note.
 *      These carry `pendingKa()` and render their English in both locales.
 *
 * Group 3 is deliberate and is NOT a shortcut. A consent statement is the one
 * string on this page with legal weight, and machine-translating it - or any
 * of the sentences around it - would put words the studio never approved in
 * front of a Georgian client. The site already handles unapproved copy exactly
 * this way (see `pending()` in services-departments.ts). Every one of them is
 * greppable by `pendingKa` and they are listed in the handover.
 */

/** Copy with no approved Georgian yet. Renders English in both locales, on purpose. */
const pendingKa = (en: string): LocalizedText => ({ en, ka: en });

/**
 * ART DIRECTION, NOT COPY.
 *
 * The file's own labels - the numbered field names, the two choice rows, the
 * course line, the desk note, the consent statement and REGISTRATION - are part
 * of the Lab's printed identity and stay English in every locale by design.
 * That is a decision about the design, not a missing translation: it is the
 * difference between this and `pendingKa` above, which marks copy that is
 * waiting for a translator. Course names, lecturers, the confirmation screen
 * and every other string in the file localise normally.
 */
const fixedEn = (en: string): LocalizedText => ({ en, ka: en });

export type LabContactMethod = "email" | "phone" | "whatsapp";
export type LabLanguagePref = "georgian" | "english";

/** One selectable option in the two choice rows (05 and 06). */
export type LabChoice<T extends string> = { id: T; label: LocalizedText };

/**
 * The registration file's field list, in the approved order.
 *
 * This is the list section 10 prints as "THE FILE ASKS FOR" AND the list the
 * dialog renders - one array, so the promise on the page and the form behind
 * it cannot drift apart. The previous section-10 list described a different,
 * older nine-field sheet (age, experience level, portfolio) that no form ever
 * implemented; it is replaced here by the eight the approved file actually asks.
 */
export const LAB_REG_FIELDS: LocalizedText[] = [
  fixedEn("First name"),
  fixedEn("Last name"),
  fixedEn("Email"),
  fixedEn("Phone"),
  fixedEn("Preferred contact method"),
  fixedEn("Language preference"),
  fixedEn("Course"),
  fixedEn("A short note - optional"),
];

export const LAB_CONTACT_METHODS: LabChoice<LabContactMethod>[] = [
  { id: "email", label: fixedEn("Email") },
  { id: "phone", label: fixedEn("Phone") },
  { id: "whatsapp", label: fixedEn("WhatsApp") },
];

export const LAB_LANGUAGES: LabChoice<LabLanguagePref>[] = [
  { id: "georgian", label: fixedEn("Georgian") },
  { id: "english", label: fixedEn("English") },
];

/**
 * The four courses as the selector offers them: "01 - Photography: Theory &
 * Practice". Read from LAB_COURSES so a course cannot exist in one place and
 * not the other, and so the lecturer and format the file prints back are the
 * course sheet's own.
 */
export function labRegCourseOptions(): {
  id: LabCourseId;
  no: string;
  name: LocalizedText;
  lecturer: string;
  format: LocalizedText;
  formatTbd: boolean;
}[] {
  return LAB_COURSES.map((c) => ({
    id: c.id,
    no: c.no,
    name: c.name,
    lecturer: c.lecturer,
    format: c.format,
    formatTbd: c.formatTbd,
  }));
}

export const LAB_REG_COPY = {
  /** the masthead of the file itself */
  fileMark: { en: "Studio Lab - Registration file", ka: "სტუდიო ლაბი - სარეგისტრაციო ფაილი" },
  close: { en: "Close", ka: "დახურვა" },
  /** the dialog's accessible name */
  dialogLabel: { en: "Studio Lab registration file", ka: "სტუდიო ლაბის სარეგისტრაციო ფაილი" },

  courseEyebrow: fixedEn("Course"),
  courseUnset: fixedEn("Select a course"),
  coursePlaceholder: fixedEn("- Select a course -"),
  fieldCourse: fixedEn("00 / Course"),
  lecturerLabel: { en: "Lecturer", ka: "ლექტორი" },
  formatLabel: { en: "Format", ka: "ფორმატი" },

  fieldFirst: fixedEn("01 / First name"),
  fieldLast: fixedEn("02 / Last name"),
  fieldEmail: fixedEn("03 / Email"),
  fieldPhone: fixedEn("04 / Phone"),
  fieldContact: fixedEn("05 / Preferred contact method"),
  fieldLang: fixedEn("06 / Language preference"),
  fieldNote: fixedEn("07 / A short note - optional"),

  notePlaceholder: fixedEn("Tell us briefly why you want to join this course."),

  /** §J: the consent statement. Legal weight, and part of the printed file. */
  consent: fixedEn(
    "I agree that 8th State Production may use the information provided here to contact me regarding this Studio Lab registration.",
  ),
  submit: fixedEn("Registration"),

  errMissing: pendingKa("Please complete all required fields (*) and the consent mark."),
  errSend: pendingKa(
    "We couldn't send your registration. Your information is still here - please try again.",
  ),

  deskNote: fixedEn(
    "Your file goes directly to the Studio Lab desk. Registration received is not enrolment - the Lab confirms personally.",
  ),

  /** the success state */
  sentEyebrow: { en: "File received", ka: "ფაილი მიღებულია" },
  sentTitle: { en: "Registration received", ka: "რეგისტრაცია მიღებულია" },
  sentBody: pendingKa(
    "Thank you. We've received your registration. The Studio Lab team will contact you using your selected contact method.",
  ),
  sentBack: { en: "Back to Studio Lab", ka: "დაბრუნება სტუდიო ლაბში" },

  /** section 10's own note, replacing the older payment line */
  enrolmentNote: fixedEn(
    "Registration received is not enrolment - the Lab confirms every place personally.",
  ),
  /** the label above the printed field list in section 10 */
  fileAsks: { en: "The file asks for", ka: "ფაილი ითხოვს" },
  /** the button that opens the file for one specific course */
  registerFor: { en: "Register", ka: "რეგისტრაცია" },
} as const;
