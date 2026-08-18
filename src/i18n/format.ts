// Client-safe string interpolation (perf phase 2A). Lives outside ./index so
// client components can format strings without pulling both full message
// dictionaries into their bundle (./index imports en + ka at module scope).

/** Simple {name} interpolation. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
