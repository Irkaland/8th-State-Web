import Image from "next/image";
import { up } from "@/lib/cn";

/**
 * A FRAME THAT IS WAITING FOR ITS PHOTOGRAPH.
 *
 * Every image position on the site is a slot the studio will fill with its own
 * master later. Until then the slot still has to hold its place: the frame, the
 * aspect ratio, the grid cell and the whitespace around it are part of the
 * approved composition and do not belong to the picture that happens to be
 * sitting in them.
 *
 * So this renders the image when there is one and the studio's own waiting mark
 * when there is not. Nothing else about the caller changes - the frame, the
 * caption, the plate number and the CSS all stay where they are, which is what
 * makes "empty slot -> final image" a one-line data edit rather than a rebuild.
 *
 * The waiting state is the TEAM sheet's language, because TEAM already solved
 * this: a board-toned ground and one small mark set in the numeral face, low
 * contrast, bottom left. It reads as a prepared plate, not as a missing asset.
 * Deliberately NOT a dashed box, a grey rectangle, an upload glyph or the word
 * IMAGE at 48px - an unfinished developer placeholder would be louder than the
 * photograph it stands in for.
 */
export function MediaSlot({
  src,
  alt,
  mark,
  sizes,
  priority,
  className,
}: {
  /** absent while the studio has not supplied the master */
  src?: string;
  /** only ever read when there IS an image; the waiting mark is decorative */
  alt?: string;
  /** localised waiting mark, e.g. "IMAGE PENDING" - never English on /ka */
  mark: string;
  sizes: string;
  priority?: boolean;
  /** extra classes for the <img>, e.g. a per-site object-position */
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt ?? ""}
        fill
        sizes={sizes}
        priority={priority}
        className={className ? `object-cover ${className}` : "object-cover"}
      />
    );
  }
  return (
    <span className="dms" aria-hidden="true">
      {/* the site's own printed stock, so a large empty plate reads as prepared
          paper rather than a flat fill. An approved design-system texture, not
          stand-in imagery - at hero size the board tone alone was bare. */}
      <span className="dao-grain" />
      <span className="dms__mark">{up(mark)}</span>
    </span>
  );
}
