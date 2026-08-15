export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Display-caps helper: uppercases Latin strings, leaves Georgian untouched.
 * Georgian has no casing in running text - JS toUpperCase() would convert
 * mkhedruli to Mtavruli forms that ALK Sanet does not carry.
 */
export function up(s: string): string {
  return /[Ⴀ-ჿ]/.test(s) ? s : s.toUpperCase();
}
