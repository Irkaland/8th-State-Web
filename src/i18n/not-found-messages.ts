import type { Locale } from "./locales";

// The 404 route is a client component (it derives the locale from the real
// browser pathname), so it must not import the full dictionaries - that
// would put every EN + KA string into the shared client graph (perf phase
// 2A). These are the exact daoRoutes.notFound strings from en.ts / ka.ts,
// and nothing else. Keep the copies in sync when editing either dictionary.
export type NotFoundMessages = {
  line: string;
  desc: string;
  home: string;
  work: string;
  contact: string;
  fr: string;
};

const en: NotFoundMessages = {
  line: "This frame is not in the reel.",
  desc: "The page moved, or never existed. The bird got out of its frame - these routes are still available.",
  home: "Home",
  work: "Work",
  contact: "Contact",
  fr: "FR 0404 - MISSING",
};

const ka: NotFoundMessages = {
  line: "ეს კადრი რგოლში არ არის.",
  desc: "გვერდი გადავიდა ან არასდროს არსებობდა. ჩიტი კადრიდან გაფრინდა - ეს მარშრუტები კი ხელმისაწვდომია.",
  home: "მთავარი",
  work: "ნამუშევრები",
  contact: "კონტაქტი",
  fr: "FR 0404 - MISSING",
};

const DICTS: Record<Locale, NotFoundMessages> = { en, ka };

export function getNotFoundMessages(locale: Locale): NotFoundMessages {
  return DICTS[locale];
}
