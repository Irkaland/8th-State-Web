import type { LocalizedText } from "./types";

// Approved services structure (handoff Act 04): nine capabilities in four
// groups. Group colours are fixed brand hexes (red/orange/blue/green).
// Descriptions are plain-language CMS placeholders derived from the existing
// approved services content.

export type DaoServiceGroup = {
  id: string;
  colour: string; // fixed brand hex per handoff 2i
  tint: string;
  name: LocalizedText;
  layer: LocalizedText;
};

export type DaoService = {
  n: string;
  group: string;
  name: LocalizedText;
  desc: LocalizedText;
};

export const DAO_SERVICE_GROUPS: DaoServiceGroup[] = [
  {
    id: "creative",
    colour: "#d03e26",
    tint: "rgba(208, 62, 38, 0.06)",
    name: { en: "Creative & Art Direction", ka: "კრეატიული და არტ მიმართულება" },
    layer: { en: "The thinking layer - idea and look", ka: "აზროვნების შრე - იდეა და ვიზუალი" },
  },
  {
    id: "spatial",
    colour: "#e16912",
    tint: "rgba(224, 105, 18, 0.06)",
    name: { en: "Production & Spatial Design", ka: "პროდაქშენი და სივრცითი დიზაინი" },
    layer: { en: "The made-world layer", ka: "შექმნილი სამყაროს შრე" },
  },
  {
    id: "image",
    colour: "#2374b3",
    tint: "rgba(35, 116, 179, 0.06)",
    name: { en: "Image Production", ka: "გამოსახულების წარმოება" },
    layer: { en: "The capture layer", ka: "გადაღების შრე" },
  },
  {
    id: "finishing",
    colour: "#126149",
    tint: "rgba(18, 97, 73, 0.06)",
    name: { en: "Finishing", ka: "დასრულება" },
    layer: { en: "The completion layer", ka: "დასრულების შრე" },
  },
];

export const DAO_SERVICES: DaoService[] = [
  {
    n: "01",
    group: "creative",
    name: { en: "Creative Direction", ka: "კრეატიული მიმართულება" },
    desc: {
      en: "Visual concept, moodboards and references, campaign direction - the idea that everything else is built on.",
      ka: "ვიზუალური კონცეფცია, მუდბორდები და რეფერენსები, კამპანიის მიმართულება - იდეა, რომელზეც ყველაფერი შენდება.",
    },
  },
  {
    n: "02",
    group: "creative",
    name: { en: "Art Direction", ka: "არტ მიმართულება" },
    desc: {
      en: "The look of the frame - colour, composition, styling logic - held consistent from first sketch to final delivery.",
      ka: "კადრის ვიზუალი - ფერი, კომპოზიცია, სტილის ლოგიკა - თანმიმდევრული პირველი ესკიზიდან საბოლოო მიწოდებამდე.",
    },
  },
  {
    n: "03",
    group: "spatial",
    name: { en: "Production Design", ka: "პროდაქშენ დიზაინი" },
    desc: {
      en: "Designing the made world of a production - sets, environments and the physical language of the frame.",
      ka: "პროდაქშენის შექმნილი სამყაროს დიზაინი - დეკორები, გარემო და კადრის ფიზიკური ენა.",
    },
  },
  {
    n: "04",
    group: "spatial",
    name: { en: "Scenography", ka: "სცენოგრაფია" },
    desc: {
      en: "Spatial storytelling for stage, film and events - scenic structures designed and built for the camera and the room.",
      ka: "სივრცითი თხრობა სცენისთვის, ფილმისა და ღონისძიებებისთვის - სცენური სტრუქტურები კამერისა და სივრცისთვის.",
    },
  },
  {
    n: "05",
    group: "spatial",
    name: { en: "Costume Design", ka: "კოსტიუმის დიზაინი" },
    desc: {
      en: "Costume and styling direction built around the concept - sourced, made and fitted for the story being told.",
      ka: "კოსტიუმი და სტილის მიმართულება კონცეფციაზე აგებული - მოძიებული, შექმნილი და მორგებული სათქმელ ისტორიაზე.",
    },
  },
  {
    n: "06",
    group: "spatial",
    name: { en: "Decoration", ka: "დეკორაცია" },
    desc: {
      en: "Props, dressing and detail - the layer of objects that makes a built world feel inhabited.",
      ka: "რეკვიზიტი, გაფორმება და დეტალი - საგნების შრე, რომელიც აშენებულ სამყაროს ცოცხალს ხდის.",
    },
  },
  {
    n: "07",
    group: "image",
    name: { en: "Film & Video Production", ka: "ფილმისა და ვიდეოს წარმოება" },
    desc: {
      en: "Brand films, commercials, music videos and short-form - planned, shot and produced end to end.",
      ka: "ბრენდის ფილმები, რეკლამები, მუსიკალური ვიდეოები და მოკლე ფორმატი - დაგეგმილი, გადაღებული და ნაწარმოები სრულად.",
    },
  },
  {
    n: "08",
    group: "image",
    name: { en: "Photography", ka: "ფოტოგრაფია" },
    desc: {
      en: "Campaign, editorial, product and documentary photography - from concept to selected, graded frames.",
      ka: "კამპანიის, რედაქციული, პროდუქტისა და დოკუმენტური ფოტოგრაფია - კონცეფციიდან შერჩეულ, დამუშავებულ კადრებამდე.",
    },
  },
  {
    n: "09",
    group: "finishing",
    name: { en: "Post-Production", ka: "პოსტ-პროდაქშენი" },
    desc: {
      en: "Edit, grade, sound and finishing - the completion layer that carries the work to its final state.",
      ka: "მონტაჟი, ფერის კორექცია, ხმა და დასრულება - შრე, რომელსაც ნამუშევარი საბოლოო მდგომარეობამდე მიჰყავს.",
    },
  },
];
