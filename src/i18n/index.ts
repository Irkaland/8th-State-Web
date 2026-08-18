import en from "./messages/en";
import ka from "./messages/ka";
import type { Messages } from "./messages/en";
import { type Locale, DEFAULT_LOCALE, isLocale } from "./locales";

const DICTS: Record<Locale, Messages> = { en, ka };

export function getMessages(locale: string): Messages {
  return DICTS[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

// format() moved to ./format (client-safe, dictionary-free); re-exported so
// server-side callers keep their import path.
export { format } from "./format";

export type { Messages };
export type { Locale };
