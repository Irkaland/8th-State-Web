import en from "./messages/en";
import ka from "./messages/ka";
import type { Messages } from "./messages/en";
import { type Locale, DEFAULT_LOCALE, isLocale } from "./locales";

const DICTS: Record<Locale, Messages> = { en, ka };

export function getMessages(locale: string): Messages {
  return DICTS[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

/** Simple {name} interpolation. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type { Messages };
export type { Locale };
