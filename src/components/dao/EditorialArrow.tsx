/**
 * THE ARROW.
 *
 * One drawn mark for every arrow-bearing CTA on the site. The geometry is the
 * approved one - a long, slightly uneven horizontal stem with a small open
 * head - and it is the path the Studio Lab CTAs, the Services dossier and the
 * What We Make register have always carried. It simply existed as three
 * identical copies of the same `d` attribute, alongside a scattering of U+2192
 * text glyphs on the route CTAs.
 *
 * WHY NOT THE GLYPH. A bare arrow codepoint is a coin toss: several mobile
 * browsers resolve it from an emoji font and render a full-colour boxed arrow -
 * the same trap the team dossier's external mark was pulled out of - and every
 * font renders its own weight, length and vertical position, which is why the
 * route CTAs and the drawn CTAs never matched. An SVG cannot be substituted by
 * a font, it inherits currentColor, and it scales with the label it belongs to.
 *
 * SIZE lives in CSS, not here. `className` defaults to `.dao-arrow`, the
 * em-based CTA size, so one class serves a 9.5px dossier link and a 26px
 * sequence title. The marks that already have their own size - `.dsl-arrow`,
 * `.dsvc__ctaarrow`, `.dao-wwm__arrow` and the rest - pass their own class and
 * keep the geometry they were approved at.
 */
export function EditorialArrow({
  className = "dao-arrow",
  weight = 1.3,
  stroke,
}: {
  className?: string;
  /** stroke width in the mark's own 46x12 space */
  weight?: number;
  /** only for a ground where currentColor is not the CTA's own ink */
  stroke?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 46 12" aria-hidden="true" focusable="false">
      <path
        d="M1 6.4 C14 5.6 28 6.8 43 5.9 M37.5 2.2 C39.6 3.7 41.7 5 44.2 5.9 C41.5 7.1 39.4 8.6 37.8 10.2"
        stroke={stroke ?? "currentColor"}
        strokeWidth={weight}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
