import type { ProcessStep } from "./types";

// Homepage "How we work" - 6 steps.
export const PROCESS: ProcessStep[] = [
  {
    n: "01",
    title: { en: "Brief", ka: "ბრიფი" },
    desc: {
      en: "Objectives, audience, channels, schedule, approximate budget.",
      ka: "მიზნები, აუდიტორია, არხები, გრაფიკი, სავარაუდო ბიუჯეტი.",
    },
  },
  {
    n: "02",
    title: { en: "Direction", ka: "მიმართულება" },
    desc: {
      en: "Creative direction, visual concept, moodboard, production approach.",
      ka: "კრეატიული მიმართულება, ვიზუალური კონცეფცია, მუდბორდი, პროდაქშენ მიდგომა.",
    },
  },
  {
    n: "03",
    title: { en: "Pre-Production", ka: "პრე-პროდაქშენი" },
    desc: {
      en: "Team, locations, casting, styling, sets, props, logistics, schedule.",
      ka: "გუნდი, ლოკაციები, კასტინგი, სტილინგი, დეკორი, რეკვიზიტი, ლოგისტიკა, გრაფიკი.",
    },
  },
  {
    n: "04",
    title: { en: "Production", ka: "პროდაქშენი" },
    desc: {
      en: "Photography, film and on-location execution.",
      ka: "ფოტოგრაფია, ფილმი და ლოკაციაზე შესრულება.",
    },
  },
  {
    n: "05",
    title: { en: "Post-Production", ka: "პოსტ-პროდაქშენი" },
    desc: {
      en: "Editing, retouching, color, sound, formatting, asset prep.",
      ka: "მონტაჟი, რეტუში, ფერი, ხმა, ფორმატირება, მასალის მომზადება.",
    },
  },
  {
    n: "06",
    title: { en: "Delivery", ka: "მიწოდება" },
    desc: {
      en: "Organized, ready-to-use final assets.",
      ka: "დალაგებული, გამოსაყენებლად მზა საბოლოო მასალა.",
    },
  },
];

// Georgia Production - 4-step "how a production comes together".
export const GEORGIA_PROCESS: ProcessStep[] = [
  {
    n: "01",
    title: { en: "Enquiry", ka: "მოთხოვნა" },
    desc: {
      en: "Project outline, dates, references, scale.",
      ka: "პროექტის მონახაზი, თარიღები, რეფერენსები, მასშტაბი.",
    },
  },
  {
    n: "02",
    title: { en: "Scope & estimate", ka: "მასშტაბი და შეფასება" },
    desc: {
      en: "Feasibility, local options, production plan.",
      ka: "ფიზიბილითი, ადგილობრივი ვარიანტები, პროდაქშენ გეგმა.",
    },
  },
  {
    n: "03",
    title: { en: "Pre-production", ka: "პრე-პროდაქშენი" },
    desc: {
      en: "Locations, crew, casting, logistics locked.",
      ka: "ლოკაციები, ჯგუფი, კასტინგი, ლოგისტიკა დაფიქსირებული.",
    },
  },
  {
    n: "04",
    title: { en: "Shoot & delivery", ka: "გადაღება და მიწოდება" },
    desc: {
      en: "On-set management through final handover.",
      ka: "მართვა გადაღებაზე საბოლოო ჩაბარებამდე.",
    },
  },
];
