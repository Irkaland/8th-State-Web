import Link from "next/link";
import type { Messages } from "@/i18n";
import { type Locale, localeHref } from "@/i18n/locales";
import { type CapabilityId, capabilityWorkHref } from "@/content/dao-services";
import { up } from "@/lib/cn";
import { EditorialArrow } from "./EditorialArrow";

/**
 * "Related Work" for ONE capability.
 *
 * Services used to carry three of these, one per group, and two of them pointed
 * at bare `/work` - so a visitor reading Art Direction was shown the entire
 * archive, and Scenography, Costume Design and Decoration had no link at all.
 * Each capability now links to its own filtered archive, `/work?capability=<id>`,
 * built from the canonical id rather than a hand-written href.
 *
 * A capability with no credited projects still links here and still lands on a
 * correct, empty archive. That is deliberate: an accurate empty result tells the
 * truth about the work, where a silent widening to ALL would not.
 */
export function CapabilityWorkLink({
  id,
  locale,
  messages,
  className,
  style,
}: {
  id: CapabilityId;
  locale: Locale;
  messages: Messages;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Link
      href={localeHref(locale, capabilityWorkHref(id))}
      className={className ?? "dao-cta"}
      style={style}
      data-dao-capability={id}
    >
      {up(messages.daoRoutes.services.relatedWork)} <EditorialArrow />
    </Link>
  );
}
