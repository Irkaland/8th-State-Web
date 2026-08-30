import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The contextual masthead back (FINAL UX §03/§04).
 *
 * The site's ONE contextual return vocabulary, replacing the retired ReturnTab.
 * It sits inside the page's own masthead rather than floating over the chrome,
 * so it is present at every width - phone included - in the route's own dress,
 * and it scrolls with the page like the rest of the editorial furniture.
 *
 * IT IS ALWAYS A REAL LINK TO A REAL PARENT.
 *
 * Never `history.back()`: a reader who arrived from a shared link, a search
 * result or a locale switch has no such history, and popping it would either do
 * nothing or walk them back into the previous language. Every caller declares
 * the canonical parent it means, so a direct entry lands somewhere true.
 *
 * The browser's own Back is untouched and keeps native semantics - site
 * navigation and history are deliberately not the same control.
 *
 * Hit area: `min-height: 44px` plus vertical padding in CSS (§13), so the
 * target is comfortably ≥44px on touch without changing the printed line's
 * visual weight.
 */
export function MastheadBack({
  href,
  label,
  ground = "light",
  className,
  ...rest
}: {
  href: string;
  /** already uppercased by the caller, matching the masthead register */
  label: string;
  /** which ground the control is printed on - drives ink vs paper */
  ground?: "light" | "dark";
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={cn("dao-mback", ground === "dark" && "dao-mback--paper", className)}
      data-dao-parent={href}
      {...rest}
    >
      {/* the arrow is decoration on top of a labelled link, never the label */}
      <span className="dao-mback__arrow" aria-hidden="true">
        ←
      </span>
      <span className="dao-mback__label">{label}</span>
    </Link>
  );
}
