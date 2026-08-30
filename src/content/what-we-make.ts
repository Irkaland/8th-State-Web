import type { LocalizedText } from "./types";
import { type CapabilityId, isCapabilityId } from "./dao-services";

/**
 * WHAT WE MAKE - the studio's five TOP-LEVEL services.
 *
 * WHY THIS EXISTS ALONGSIDE THE CAPABILITY TAXONOMY
 * -------------------------------------------------
 * `content/dao-services.ts` is, and remains, the canonical capability
 * taxonomy: four groups, nine capabilities, and the join key every other
 * surface uses (`?capability=`, Related Work, the Services catalogue, a
 * person's practice). Nothing here replaces it.
 *
 * What this file adds is the layer ABOVE it - the five services the studio
 * offers as departments, which is how the homepage dossier presents the
 * company. The two answer different questions:
 *
 *   a CAPABILITY  is a discipline a project can be credited with
 *   a SERVICE     is a department a production can be commissioned from
 *
 * They are not duplicated. Where a service has a canonical capability that
 * names the same thing, it carries that id and links straight to it, so the
 * dossier and the catalogue cannot drift apart. Where it does not, the field
 * is null and the row routes to the catalogue itself - see `capability` below.
 *
 * NOTHING HERE IS INVENTED. The five names, their keyword sets and their plate
 * assignments are the approved handoff's, unchanged. The Georgian is the
 * approved English rendered into Georgian, reusing the studio's own existing
 * terminology from dao-services.ts wherever the same term already appears
 * there, so the two surfaces speak with one voice.
 */
export type TopLevelService = {
  /** printed index, and the plate number */
  n: string;
  /** stable id - the test hook and the row's own anchor */
  id: string;
  name: LocalizedText;
  /**
   * Where this row goes on /services.
   *
   * A canonical capability id when one names the same work, so the row lands on
   * that exact anchor. Null for GRAPHIC & BROADCAST DESIGN, which has no
   * capability in the approved taxonomy - see the note on `serviceHref`.
   */
  capability: CapabilityId | null;
  /** this row's underline, from the approved palette for the blue ground */
  accent: string;
  /** the full keyword run (desktop / tablet) */
  keywords: LocalizedText;
  /** the shortened run the phone composition carries */
  keywordsShort: LocalizedText;
  /** the production plate - a real archive still, with its printed caption */
  plate: { src: string; label: LocalizedText };
};

export const WHAT_WE_MAKE: TopLevelService[] = [
  {
    n: "01",
    id: "audiovisual-production",
    name: { en: "Audiovisual Production", ka: "აუდიოვიზუალური პროდაქშენი" },
    capability: "film-video-production",
    accent: "#fff9ab",
    keywords: {
      en: "Creative development · Pre-production · Producing · Casting · Locations · Crew · Shooting · Post-production",
      ka: "კრეატიული განვითარება · მოსამზადებელი პერიოდი · პროდიუსინგი · კასტინგი · ლოკაციები · ჯგუფი · გადაღება · პოსტ-პროდაქშენი",
    },
    keywordsShort: {
      en: "Development · Producing · Shooting · Post",
      ka: "განვითარება · პროდიუსინგი · გადაღება · პოსტი",
    },
    plate: { src: "/media/aom-film-still.jpg", label: { en: "Film still", ka: "კადრი ფილმიდან" } },
  },
  {
    n: "02",
    id: "production-design",
    name: { en: "Production Design", ka: "პროდაქშენ დიზაინი" },
    capability: "production-design",
    accent: "#f0ab11",
    keywords: {
      en: "Art direction · Concept art · Set design · Scenography · Decoration · Set construction · Props · Costume",
      ka: "არტ მიმართულება · კონცეპტ არტი · დეკორის დიზაინი · სცენოგრაფია · დეკორაცია · დეკორის აწყობა · რეკვიზიტი · კოსტიუმი",
    },
    keywordsShort: {
      en: "Set design · Scenography · Props · Costume",
      ka: "დეკორის დიზაინი · სცენოგრაფია · რეკვიზიტი · კოსტიუმი",
    },
    plate: { src: "/media/georgia-set.jpg", label: { en: "On set", ka: "დეკორზე" } },
  },
  {
    n: "03",
    id: "photography",
    name: { en: "Photography", ka: "ფოტოგრაფია" },
    capability: "photography",
    accent: "#7ad4c9",
    keywords: {
      en: "Commercial · Fashion · Portrait · Product · Architecture · Editorial · Documentary · Art photography",
      ka: "კომერციული · მოდა · პორტრეტი · პროდუქტი · არქიტექტურა · რედაქციული · დოკუმენტური · სამხატვრო ფოტოგრაფია",
    },
    keywordsShort: {
      en: "Commercial · Fashion · Editorial · Documentary",
      ka: "კომერციული · მოდა · რედაქციული · დოკუმენტური",
    },
    plate: { src: "/media/berlin-editorial.jpg", label: { en: "Editorial", ka: "რედაქციული" } },
  },
  {
    n: "04",
    id: "creative-art-direction",
    name: { en: "Creative & Art Direction", ka: "კრეატიული და არტ მიმართულება" },
    capability: "creative-direction",
    accent: "#f2ede3",
    keywords: {
      en: "Creative direction · Campaign development · Visual research · Brand worlds · Photography & film direction",
      ka: "კრეატიული მიმართულება · კამპანიის განვითარება · ვიზუალური კვლევა · ბრენდის სამყაროები · ფოტოსა და ფილმის რეჟისურა",
    },
    keywordsShort: {
      en: "Campaigns · Visual research · Brand worlds",
      ka: "კამპანიები · ვიზუალური კვლევა · ბრენდის სამყაროები",
    },
    plate: { src: "/media/pure-royal.jpg", label: { en: "Campaign", ka: "კამპანია" } },
  },
  {
    n: "05",
    id: "graphic-broadcast-design",
    name: { en: "Graphic & Broadcast Design", ka: "გრაფიკული და სამაუწყებლო დიზაინი" },
    // No capability in the approved nine names this work. The row therefore
    // routes to the catalogue itself rather than to a capability anchor that
    // would be a guess - see `serviceHref`.
    capability: null,
    accent: "#131210",
    keywords: {
      en: "Brand identity · Graphic design · Editorial · Packaging · Film graphics · Broadcast design · Motion · Digital",
      ka: "ბრენდის იდენტობა · გრაფიკული დიზაინი · რედაქციული · შეფუთვა · ფილმის გრაფიკა · სამაუწყებლო დიზაინი · მოძრაობა · ციფრული",
    },
    keywordsShort: {
      en: "Identity · Packaging · Broadcast · Motion",
      ka: "იდენტობა · შეფუთვა · მაუწყებლობა · მოძრაობა",
    },
    plate: { src: "/media/chronograph.jpg", label: { en: "Identity", ka: "იდენტობა" } },
  },
];

/**
 * The real production destination for a dossier row (§29).
 *
 * Locale-free, so the caller wraps it in localeHref(). Four of the five land on
 * their own capability anchor inside the catalogue; the fifth lands on the
 * catalogue. That is deliberate rather than a placeholder: GRAPHIC & BROADCAST
 * DESIGN has no capability in the approved nine-capability taxonomy, and
 * /services is explicitly out of scope for redesign, so inventing an anchor
 * would either fabricate a capability or point at a section that does not
 * describe this work. The catalogue is the honest answer until the taxonomy
 * gains the capability, at which point this becomes a one-line data edit.
 */
export function serviceHref(s: TopLevelService): string {
  return s.capability ? `/services#${s.capability}` : "/services";
}

/** Every capability a dossier row claims must be a real one. */
export function whatWeMakeCapabilitiesAreCanonical(): boolean {
  return WHAT_WE_MAKE.every((s) => s.capability === null || isCapabilityId(s.capability));
}
