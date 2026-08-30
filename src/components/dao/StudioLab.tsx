import Link from "next/link";
import type { StudioLabMessages } from "@/i18n/slices";
import { type Locale, localeHref } from "@/i18n/locales";
import { t } from "@/content/localized";
import { LAB_DISCIPLINES } from "@/content/lab-courses";
import { up } from "@/lib/cn";
import {
  DisciplineIcon,
  LabArrow,
  LabBotanical,
  LabCross,
  LabIndex,
  LabStain,
  LabTexture,
  PencilRule,
} from "./LabKit";

/**
 * Act 05 - the Studio Lab portal, as approved.
 *
 * The olive field (--dao-green) under the Lab texture stack: a masthead rule,
 * the STUDIO / LAB masthead against the three disciplines, and the editorial
 * index closing the section. This SUPERSEDES the earlier version, which grew
 * botanicals in on scroll and ran a Glacier marquee along the bottom - the
 * approved composition is static, and the index does not move.
 *
 * A server component: the only interactions are the row shift and the CTA
 * arrow drift, both CSS transitions, so this act ships no JavaScript at all.
 */
export function StudioLab({ locale, lab }: { locale: Locale; lab: StudioLabMessages }) {
  const m = lab;

  return (
    <section className="dao-lab" data-dao-scene="dark" id="studio-lab" aria-labelledby="lab-title">
      <LabTexture />
      <LabStain style={{ left: "30%", top: "-160px", width: "820px", opacity: 0.045 }} />

      {/* masthead */}
      <div className="dao-lab__mast">
        <span className="dao-lab__mastl">{up(m.act)}</span>
        <span className="dao-lab__mastr">
          {up(m.city)}
          <LabCross />
        </span>
      </div>
      <PencilRule variant="a" opacity={0.36} className="dao-lab__mastrule" />

      {/* the botanical: static, cropped by the section, never interactive */}
      <span className="dao-lab__orn" aria-hidden="true">
        <LabBotanical src="/assets/graphics/floral-rose.webp" />
        <span className="dao-lab__ornfig">FIG. 05</span>
      </span>

      <div className="dao-lab__body">
        <div className="dao-lab__lede">
          <h2 className="dao-lab__title" id="lab-title">
            <span>{up(m.titleLine1)}</span>
            <span>{up(m.titleLine2)}</span>
          </h2>
          <p className="dao-lab__copy">{m.copy}</p>
          {/* a client-side Link, never a raw <a>: a raw anchor forces a full
              document load, which replays the Studio Ident */}
          <Link href={localeHref(locale, "/studio-lab")} className="dao-lab__cta">
            {up(m.cta)}
            <LabArrow />
          </Link>
        </div>

        <div className="dao-lab__rows">
          {/* the narrow composition opens the list with a rule; the wide one does not */}
          <PencilRule variant="a" opacity={0.34} className="dao-lab__rowtop" />
          {LAB_DISCIPLINES.map((d, i) => (
            <div key={d.id} className="dao-lab__rowwrap">
              {i > 0 ? <PencilRule variant={i === 1 ? "b" : "c"} opacity={0.3} /> : null}
              <Link
                href={localeHref(locale, `/studio-lab${d.href}`)}
                className="dao-lab__row"
                data-lab-row={d.id}
              >
                <span className="dao-lab__rowno" aria-hidden="true">
                  {d.n}
                </span>
                <DisciplineIcon icon={d.id} rot={d.rot} />
                <span className="dao-lab__rowtext">
                  <span className="dao-lab__rowname">{up(t(d.name, locale))}</span>
                  <span className="dao-lab__rowsub">{t(d.sub, locale)}</span>
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="dao-lab__spacer" />

      <div className="dao-lab__foot">
        <PencilRule variant="d" opacity={0.34} />
        <LabIndex words={m.index} />
      </div>
    </section>
  );
}
