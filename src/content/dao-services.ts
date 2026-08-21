import type { LocalizedText } from "./types";

// Approved services structure (handoff Act 04): nine capabilities in four
// groups. Group colours are fixed brand hexes (red/orange/blue/green).
// Descriptions are plain-language CMS placeholders derived from the existing
// approved services content.

export type DaoServiceGroup = {
  id: string;
  colour: string; // fixed brand hex per handoff 2i
  /**
   * §05: the group label as it must read on the section's BLUE ground. Four of
   * the original `colour` hexes were chosen against paper, and two of them
   * (the blue itself, and the dark lab olive) are effectively invisible on
   * blue. This is the same brand palette, re-picked for the new ground; the
   * original `colour` is untouched because other surfaces still use it.
   */
  onBlue: string;
  tint: string;
  name: LocalizedText;
  layer: LocalizedText;
};

export type DaoService = {
  n: string;
  group: string;
  /**
   * §08: this capability's own underline colour - an approved brand hex, and
   * visually distinct from the other eight. Nine rows, nine colours.
   *
   * The run alternates light and dark deliberately, because the ground is a
   * MID-luminance blue (#2374b3): a light stroke and a dark stroke both read
   * on it, but two neighbours of similar lightness do not read apart. The
   * ordering is verified in tests/unit/services-palette.test.ts against two
   * bars - each accent vs the ground, and each accent vs the row above it.
   *
   * The studio red (#d03e26) is deliberately NOT in the run: at 1.04:1 against
   * this blue it is invisible, being almost exactly the same luminance. It is
   * the one palette colour the blue ground cannot carry.
   */
  accent: string;
  name: LocalizedText;
  desc: LocalizedText;
};

export const DAO_SERVICE_GROUPS: DaoServiceGroup[] = [
  {
    id: "creative",
    colour: "#d03e26",
    onBlue: "#fff9ab", // yellow - 4.6:1 on the blue ground
    tint: "rgba(255, 249, 171, 0.09)",
    name: { en: "Creative & Art Direction", ka: "კრეატიული და არტ მიმართულება" },
    layer: { en: "The thinking layer - idea and look", ka: "აზროვნების შრე - იდეა და ვიზუალი" },
  },
  {
    id: "spatial",
    colour: "#e16912",
    onBlue: "#f0ab11", // gold - orange itself is only 1.5:1 on blue
    tint: "rgba(240, 171, 17, 0.1)",
    name: { en: "Production & Spatial Design", ka: "პროდაქშენი და სივრცითი დიზაინი" },
    layer: { en: "The made-world layer", ka: "შექმნილი სამყაროს შრე" },
  },
  {
    id: "image",
    colour: "#2374b3",
    onBlue: "#7ad4c9", // mint - 2.9:1
    tint: "rgba(122, 212, 201, 0.1)",
    name: { en: "Image Production", ka: "გამოსახულების წარმოება" },
    layer: { en: "The capture layer", ka: "გადაღების შრე" },
  },
  {
    id: "finishing",
    // darkened lab olive (--dao-green-ink): readable as small text on paper
    colour: "#56622e",
    onBlue: "#131210", // ink - dark caps on blue, 3.8:1
    tint: "rgba(19, 18, 16, 0.1)",
    name: { en: "Finishing", ka: "დასრულება" },
    layer: { en: "The completion layer", ka: "დასრულების შრე" },
  },
];

export const DAO_SERVICES: DaoService[] = [
  {
    n: "01",
    group: "creative",
    accent: "#fff9ab", // yellow
    name: { en: "Creative Direction", ka: "კრეატიული მიმართულება" },
    desc: {
      en: "Visual concept, moodboards and references, campaign direction - the idea that everything else is built on.",
      ka: "ვიზუალური კონცეფცია, მუდბორდები და რეფერენსები, კამპანიის მიმართულება - იდეა, რომელზეც ყველაფერი შენდება.",
    },
  },
  {
    n: "02",
    group: "creative",
    accent: "#e16912", // orange
    name: { en: "Art Direction", ka: "არტ მიმართულება" },
    desc: {
      en: "The look of the frame - colour, composition, styling logic - held consistent from first sketch to final delivery.",
      ka: "კადრის ვიზუალი - ფერი, კომპოზიცია, სტილის ლოგიკა - თანმიმდევრული პირველი ესკიზიდან საბოლოო მიწოდებამდე.",
    },
  },
  {
    n: "03",
    group: "spatial",
    accent: "#7ad4c9", // mint
    name: { en: "Production Design", ka: "პროდაქშენ დიზაინი" },
    desc: {
      en: "Designing the made world of a production - sets, environments and the physical language of the frame.",
      ka: "პროდაქშენის შექმნილი სამყაროს დიზაინი - დეკორები, გარემო და კადრის ფიზიკური ენა.",
    },
  },
  {
    n: "04",
    group: "spatial",
    accent: "#6c3e13", // brown
    name: { en: "Scenography", ka: "სცენოგრაფია" },
    desc: {
      en: "Spatial storytelling for stage, film and events - scenic structures designed and built for the camera and the room.",
      ka: "სივრცითი თხრობა სცენისთვის, ფილმისა და ღონისძიებებისთვის - სცენური სტრუქტურები კამერისა და სივრცისთვის.",
    },
  },
  {
    n: "05",
    group: "spatial",
    accent: "#f2ede3", // paper
    name: { en: "Costume Design", ka: "კოსტიუმის დიზაინი" },
    desc: {
      en: "Costume and styling direction built around the concept - sourced, made and fitted for the story being told.",
      ka: "კოსტიუმი და სტილის მიმართულება კონცეფციაზე აგებული - მოძიებული, შექმნილი და მორგებული სათქმელ ისტორიაზე.",
    },
  },
  {
    n: "06",
    group: "spatial",
    accent: "#9dab5c", // green
    name: { en: "Decoration", ka: "დეკორაცია" },
    desc: {
      en: "Props, dressing and detail - the layer of objects that makes a built world feel inhabited.",
      ka: "რეკვიზიტი, გაფორმება და დეტალი - საგნების შრე, რომელიც აშენებულ სამყაროს ცოცხალს ხდის.",
    },
  },
  {
    n: "07",
    group: "image",
    accent: "#131210", // ink
    name: { en: "Film & Video Production", ka: "ფილმისა და ვიდეოს წარმოება" },
    desc: {
      en: "Brand films, commercials, music videos and short-form - planned, shot and produced end to end.",
      ka: "ბრენდის ფილმები, რეკლამები, მუსიკალური ვიდეოები და მოკლე ფორმატი - დაგეგმილი, გადაღებული და ნაწარმოები სრულად.",
    },
  },
  {
    n: "08",
    group: "image",
    accent: "#f0ab11", // gold
    name: { en: "Photography", ka: "ფოტოგრაფია" },
    desc: {
      en: "Campaign, editorial, product and documentary photography - from concept to selected, graded frames.",
      ka: "კამპანიის, რედაქციული, პროდუქტისა და დოკუმენტური ფოტოგრაფია - კონცეფციიდან შერჩეულ, დამუშავებულ კადრებამდე.",
    },
  },
  {
    n: "09",
    group: "finishing",
    accent: "#126149", // ident green
    name: { en: "Post-Production", ka: "პოსტ-პროდაქშენი" },
    desc: {
      en: "Edit, grade, sound and finishing - the completion layer that carries the work to its final state.",
      ka: "მონტაჟი, ფერის კორექცია, ხმა და დასრულება - შრე, რომელსაც ნამუშევარი საბოლოო მდგომარეობამდე მიჰყავს.",
    },
  },
];
