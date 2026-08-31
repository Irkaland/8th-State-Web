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
  { en: "First name", ka: "სახელი" },
  { en: "Last name", ka: "გვარი" },
  { en: "Email", ka: "ელფოსტა" },
  { en: "Phone", ka: "ტელეფონი" },
  { en: "Preferred contact method", ka: "სასურველი კონტაქტის საშუალება" },
  { en: "Language preference", ka: "სასურველი ენა" },
  { en: "Course", ka: "კურსი" },
  { en: "A short note - optional", ka: "მოკლე შენიშვნა - სურვილისამებრ" },
];

export const LAB_CONTACT_METHODS: LabChoice<LabContactMethod>[] = [
  { id: "email", label: { en: "Email", ka: "ელფოსტა" } },
  { id: "phone", label: { en: "Phone", ka: "ტელეფონი" } },
  { id: "whatsapp", label: { en: "WhatsApp", ka: "WhatsApp" } },
];

export const LAB_LANGUAGES: LabChoice<LabLanguagePref>[] = [
  { id: "georgian", label: { en: "Georgian", ka: "ქართული" } },
  { id: "english", label: { en: "English", ka: "ინგლისური" } },
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

  courseEyebrow: { en: "Course", ka: "კურსი" },
  courseUnset: { en: "Select a course", ka: "აირჩიე კურსი" },
  coursePlaceholder: { en: "- Select a course -", ka: "- აირჩიე კურსი -" },
  fieldCourse: { en: "00 / Course", ka: "00 / კურსი" },
  lecturerLabel: { en: "Lecturer", ka: "ლექტორი" },
  formatLabel: { en: "Format", ka: "ფორმატი" },

  fieldFirst: { en: "01 / First name", ka: "01 / სახელი" },
  fieldLast: { en: "02 / Last name", ka: "02 / გვარი" },
  fieldEmail: { en: "03 / Email", ka: "03 / ელფოსტა" },
  fieldPhone: { en: "04 / Phone", ka: "04 / ტელეფონი" },
  fieldContact: {
    en: "05 / Preferred contact method",
    ka: "05 / სასურველი კონტაქტის საშუალება",
  },
  fieldLang: { en: "06 / Language preference", ka: "06 / სასურველი ენა" },
  fieldNote: { en: "07 / A short note - optional", ka: "07 / მოკლე შენიშვნა - სურვილისამებრ" },

  notePlaceholder: pendingKa("Tell us briefly why you want to join this course."),

  /** §J: the consent statement. Legal weight - English until a translator signs it off. */
  consent: pendingKa(
    "I agree that 8th State Production may use the information provided here to contact me regarding this Studio Lab registration.",
  ),
  submit: { en: "Registration", ka: "რეგისტრაცია" },

  errMissing: pendingKa("Please complete all required fields (*) and the consent mark."),
  errSend: pendingKa(
    "We couldn't send your registration. Your information is still here - please try again.",
  ),

  deskNote: pendingKa(
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
  enrolmentNote: pendingKa(
    "Registration received is not enrolment - the Lab confirms every place personally.",
  ),
  /** the label above the printed field list in section 10 */
  fileAsks: { en: "The file asks for", ka: "ფაილი ითხოვს" },
  /** the button that opens the file for one specific course */
  registerFor: { en: "Register", ka: "რეგისტრაცია" },
} as const;
