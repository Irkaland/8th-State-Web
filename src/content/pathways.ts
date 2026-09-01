import type { LocalizedText, Pathway } from "./types";

// Audience pathways. `href` deep-links into the brief with a prefilled project type
// (?type=<PROJECT_TYPES id>) where relevant.
export const PATHWAYS: Pathway[] = [
  {
    letter: "A",
    title: { en: "For Brands", ka: "ბრენდებისთვის" },
    desc: {
      en: "Campaign, product, lifestyle and social imagery that holds a visual world together.",
      ka: "კამპანიის, პროდუქტის, ცხოვრების სტილისა და სოციალური ვიზუალი, რომელიც ერთ ვიზუალურ სამყაროდ კრავს.",
    },
    tags: {
      en: "Photography · Film · Creative direction",
      ka: "ფოტოგრაფია · ფილმი · კრეატიული მიმართულება",
    },
    cta: { en: "Start a Project →", ka: "დაიწყე პროექტი →" },
    href: "/start-a-project?type=commercial-campaign",
  },
  {
    letter: "B",
    title: { en: "For Agencies", ka: "სააგენტოებისთვის" },
    desc: {
      en: "A reliable production partner for local execution - including white-label support.",
      ka: "სანდო პროდაქშენ პარტნიორი ადგილობრივი შესრულებისთვის - მათ შორის white-label მხარდაჭერით.",
    },
    tags: {
      en: "Production design · Crew · Execution",
      ka: "პროდაქშენ დიზაინი · ჯგუფი · შესრულება",
    },
    cta: { en: "Discuss a Partnership →", ka: "იმსჯელე პარტნიორობაზე →" },
    href: "/start-a-project?type=production-support-georgia",
  },
  {
    letter: "C",
    title: { en: "For International Productions", ka: "საერთაშორისო პროდაქშენებისთვის" },
    desc: {
      en: "Georgia-based support: locations, casting, crew, logistics, coordination.",
      ka: "საქართველოზე დაფუძნებული მხარდაჭერა: ლოკაციები, კასტინგი, ჯგუფი, ლოგისტიკა, კოორდინაცია.",
    },
    tags: {
      en: "Full local production support",
      ka: "სრული ადგილობრივი პროდაქშენ მხარდაჭერა",
    },
    cta: { en: "Plan a Production in Georgia →", ka: "დაგეგმე პროდაქშენი საქართველოში →" },
    href: "/georgia-production",
  },
  {
    letter: "D",
    title: { en: "For Artists & Culture", ka: "შემოქმედთა და კულტურისთვის" },
    desc: {
      en: "Music videos, editorial stories, visual experiments and cultural documentation.",
      ka: "მუსიკალური ვიდეოები, რედაქციული ისტორიები, ვიზუალური ექსპერიმენტები და კულტურული დოკუმენტაცია.",
    },
    tags: {
      en: "Music videos · Editorial · Collaboration",
      ka: "მუსიკალური ვიდეოები · რედაქციული · თანამშრომლობა",
    },
    cta: { en: "Start a Conversation →", ka: "დაიწყე საუბარი →" },
    href: "/start-a-project?type=cultural-project",
  },
];

// Georgia Production - scope of local support (8 items).
export const GEORGIA_SCOPE = [
  {
    n: "01",
    title: { en: "Location scouting", ka: "ლოკაციების მოძიება" },
    desc: {
      en: "Urban, natural and interior options with references",
      ka: "ურბანული, ბუნებრივი და ინტერიერის ვარიანტები რეფერენსებით",
    },
  },
  {
    n: "02",
    title: { en: "Crew & casting", ka: "ჯგუფი და კასტინგი" },
    desc: {
      en: "Local crew, street and agency casting",
      ka: "ადგილობრივი ჯგუფი, ქუჩისა და სააგენტოს კასტინგი",
    },
  },
  {
    n: "03",
    title: { en: "Permit coordination", ka: "ნებართვების კოორდინაცია" },
    desc: {
      en: "Coordination of shooting permissions (no legal guarantee)",
      ka: "გადაღების ნებართვების კოორდინაცია (იურიდიული გარანტიის გარეშე)",
    },
  },
  {
    n: "04",
    title: { en: "Transport & logistics", ka: "ტრანსპორტი და ლოგისტიკა" },
    desc: {
      en: "Movement of people and equipment",
      ka: "ადამიანებისა და აღჭურვილობის გადაადგილება",
    },
  },
  {
    n: "05",
    title: { en: "Production design", ka: "პროდაქშენ დიზაინი" },
    desc: { en: "Art direction of physical space", ka: "ფიზიკური სივრცის არტ მიმართულება" },
  },
  {
    n: "06",
    title: { en: "Set construction & scenography", ka: "დეკორის აწყობა და სცენოგრაფია" },
    desc: { en: "Custom-built sets and props", ka: "ინდივიდუალური დეკორი და რეკვიზიტი" },
  },
  {
    n: "07",
    title: { en: "Production coordination", ka: "პროდაქშენ კოორდინაცია" },
    desc: {
      en: "Schedules, call sheets, on-set management",
      ka: "გრაფიკები, call sheet-ები, მართვა გადაღებაზე",
    },
  },
  {
    n: "08",
    title: { en: "Local production management", ka: "ადგილობრივი პროდაქშენ მენეჯმენტი" },
    desc: {
      en: "A single accountable local producer",
      ka: "ერთი ანგარიშვალდებული ადგილობრივი პროდიუსერი",
    },
  },
];

/**
 * The three location plates.
 *
 * Each carries its printed label and its description; the file itself arrives
 * when the studio delivers the plate, so `src` is optional and the frame holds
 * its place in the meantime.
 */
export const GEORGIA_STILLS: { src?: string; label: LocalizedText; alt: LocalizedText }[] = [
  {
    label: { en: "Street · Old Tbilisi", ka: "ქუჩა · ძველი თბილისი" },
    alt: {
      en: "Street production still beside a red car in the city",
      ka: "ქუჩის პროდაქშენის კადრი წითელი მანქანის გვერდით ქალაქში",
    },
  },
  {
    label: { en: "Location · Modernist", ka: "ლოკაცია · მოდერნისტული" },
    alt: {
      en: "Modernist concrete building used as a location",
      ka: "მოდერნისტული ბეტონის შენობა ლოკაციად",
    },
  },
  {
    label: { en: "Set build · Studio", ka: "დეკორის აწყობა · სტუდია" },
    alt: {
      en: "Constructed set corner with red wall art and a green chair",
      ka: "აწყობილი დეკორის კუთხე წითელი კედლის ხელოვნებითა და მწვანე სავარძლით",
    },
  },
];
