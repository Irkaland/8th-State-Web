import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Read a repository source file for assertion, with its line endings normalised.
 *
 * Several unit tests assert on the TEXT of CSS and TS/TSX sources - that a rule
 * declares a token, that a component keeps a boundary, that a deleted module has
 * not come back. Those assertions are written against `\n`, but Git materialises
 * the working tree with CRLF on Windows (`core.autocrlf` is on here) and with LF
 * on Linux and macOS. The same commit therefore presents different bytes
 * depending on which machine checked it out.
 *
 * That is not hypothetical: a Studio Lab guard matched locally and would not
 * have matched a LF checkout, and had to be fixed at 5b86c07. The failure is
 * invisible until it bites, because a pattern with no newline in it passes
 * either way - so the risk is carried silently by every raw source read.
 *
 * Normalising once, here, makes every such assertion independent of how the
 * tree was materialised. It touches nothing the application ships: this is a
 * test-only reader, and the files on disk are never rewritten.
 */
export function readSource(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), "utf8").replace(/\r\n?/g, "\n");
}
