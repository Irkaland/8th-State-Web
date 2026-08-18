import type { Locale } from "@/i18n/locales";

// Client-safe localized-text primitives (perf phase 2A). This module is
// deliberately schema-free: client components import `t()` from here so the
// zod runtime in ./types never enters a client bundle. ./types re-exports
// the LocalizedText type and keeps its schema aligned via z.ZodType.
export type LocalizedText = {
  en: string;
  ka: string;
};

export function t(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}
