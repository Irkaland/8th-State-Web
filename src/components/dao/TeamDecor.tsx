/**
 * The Team page's contact-sheet traces (approved Team design, §32).
 *
 * An oxide stain, two restrained brand symbols (the wreath and the celestial
 * sun), a strip of contact-sheet frame numbers, a registration mark and a crop
 * corner. Everything here is decoration in the strict sense of §43: it takes no
 * pointer events, never enters the tab order, contributes nothing to the
 * accessibility tree, and sits under the text at every width.
 *
 * A server component - it is five static shapes, and it decides nothing at
 * runtime. The heavier marks are drawn only on wide viewports, by media query,
 * so the phone composition keeps the registration mark and the crop corner and
 * loses the rest (§31).
 */
export function TeamDecor() {
  return (
    <div className="dtm__decor" aria-hidden="true">
      {/* the oxide stain is the ground's own weathering, not a graphic */}
      <span className="dtm__stain" />
      <span className="dtm__wreath" />
      <span className="dtm__sun" />

      <svg className="dtm__mark dtm__mark--sheet" viewBox="0 0 150 40">
        <path
          d="M4 8 L4 32 M40 7 L40 31 M76 8 L76 32 M112 7 L112 31 M146 8 L146 32"
          strokeWidth="1"
          fill="none"
        />
        <text x="12" y="25" className="dtm__marktext">
          07
        </text>
        <text x="48" y="24" className="dtm__marktext">
          08
        </text>
        <text x="84" y="25" className="dtm__marktext">
          08A
        </text>
      </svg>

      <svg className="dtm__mark dtm__mark--reg" viewBox="0 0 34 34">
        <path d="M17 1 L17 33 M1 17 L33 17" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path
          d="M17 7 C23 7 27 11.5 26.8 17 C26.6 22.8 22.5 27 17 26.8 C11.5 26.6 7.2 22.3 7.4 16.8 C7.6 11.4 11.8 7.1 17 7 Z"
          strokeWidth="1.1"
          fill="none"
        />
      </svg>

      <svg className="dtm__mark dtm__mark--crop" viewBox="0 0 26 26">
        <path
          d="M10 1 L10 10 L1 10 M16 25 L16 16 L25 16"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
