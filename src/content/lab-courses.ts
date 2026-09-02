import type { LocalizedText } from "./types";

/**
 * Studio Lab - the approved course system.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT
 * ---------------------------------
 * Real, from the studio: the four course names, their lecturers, the
 * photography format (individual, in-person or online), the film format
 * (online only), the fixed five-stage portfolio process, the cinema frame
 * index, and the registration field list.
 *
 * Deliberately NOT real: durations, schedules, prices, the art/portfolio
 * formats, and every lecturer biography. Those carry `tbd: true` and are
 * rendered at a lower ink so the page never states a fact the studio has not
 * given. The module lists for photography and art are marked "syllabus in
 * preparation" on the sheet itself for the same reason.
 *
 * Nothing here is invented to fill a gap. A TBD value is a TBD value.
 */

/**
 * The handwritten annotation on a course sheet. Art direction rather than
 * copy - the phrase is drawn in the studio's hand and stays English in every
 * locale by design, exactly like the file labels in lab-registration.ts.
 * Everything else about a course (name, blurb, format, who and learn) localises
 * normally.
 */
const handwritten = (en: string): LocalizedText => ({ en, ka: en });

/** The three disciplines, in the approved order. */
export type LabDisciplineId = "photography" | "art" | "film";

/** The four courses. `course` is the URL key: /studio-lab/<slug>. */
export type LabCourseId = "photography" | "art" | "portfolio" | "film";

export type LabSheetRow = {
  key: LocalizedText;
  value: LocalizedText;
  /** true when the studio has not confirmed this yet - rendered at ink .45 */
  tbd: boolean;
};

export type LabModule = {
  /** M. 01 / ST. 01 / FR. 01 - the numbering system differs per course */
  n: string;
  title: LocalizedText;
  note: LocalizedText;
};

export type LabCourse = {
  id: LabCourseId;
  slug: string;
  /** the sheet number printed in the masthead: 01-04 */
  no: string;
  discipline: LabDisciplineId;
  /** the icon this course borrows - portfolio shares the art mark */
  icon: LabDisciplineId;
  name: LocalizedText;
  /** "COURSE 01 - PHOTOGRAPHY" */
  kicker: LocalizedText;
  /** masthead right-hand label: "FILM · ONLINE ONLY" */
  discLabel: LocalizedText;
  /** the discipline as prose, for the hero meta row */
  disc: LocalizedText;
  lecturer: string;
  format: LocalizedText;
  /** true when the format itself is unannounced */
  formatTbd: boolean;
  blurb: LocalizedText;
  who: LocalizedText[];
  learn: LocalizedText[];
  programNote: LocalizedText;
  program: LabModule[];
  /** the handwritten line under the program - approved per course */
  annotation: LocalizedText;
  sheet: LabSheetRow[];
};

const TBD_DURATION: LocalizedText = {
  en: "Announced per intake",
  ka: "ცხადდება ყოველი ნაკადისთვის",
};
const TBD_SCHEDULE: LocalizedText = {
  en: "Announced per intake",
  ka: "ცხადდება ყოველი ნაკადისთვის",
};
const TBD_PRICE: LocalizedText = {
  en: "Published before intake",
  ka: "ქვეყნდება ნაკადის დაწყებამდე",
};
const TBD_FORMAT: LocalizedText = { en: "Announced", ka: "ცხადდება" };

const K_FORMAT: LocalizedText = { en: "Format", ka: "ფორმატი" };
const K_DURATION: LocalizedText = { en: "Duration", ka: "ხანგრძლივობა" };
const K_SCHEDULE: LocalizedText = { en: "Schedule", ka: "განრიგი" };
const K_PRICE: LocalizedText = { en: "Price", ka: "ფასი" };

const SYLLABUS_NOTE: LocalizedText = {
  en: "Syllabus in preparation - modules confirmed per intake",
  ka: "სილაბუსი მზადდება - მოდულები დასტურდება ნაკადის მიხედვით",
};

/**
 * The disciplines as the hero and section 03 list them.
 *
 * `sub` is the course line under the discipline name; `courses` and `note` are
 * the right-hand column of the section 03 blocks.
 */
export const LAB_DISCIPLINES: {
  id: LabDisciplineId;
  n: string;
  name: LocalizedText;
  sub: LocalizedText;
  courses: LocalizedText;
  note: LocalizedText;
  /** the approved per-icon rotation, in degrees */
  rot: number;
  /** section 03 anchor the hero row points at */
  href: string;
}[] = [
  {
    id: "photography",
    n: "01",
    name: { en: "Photography", ka: "ფოტოგრაფია" },
    sub: { en: "Theory & Practice", ka: "თეორია და პრაქტიკა" },
    courses: { en: "Photography: Theory & Practice", ka: "ფოტოგრაფია: თეორია და პრაქტიკა" },
    note: { en: "1 course · In-person / Online", ka: "1 კურსი · დასწრებით / ონლაინ" },
    rot: -1.5,
    href: "#featured",
  },
  {
    id: "art",
    n: "02",
    name: { en: "Art", ka: "ხელოვნება" },
    sub: { en: "Art Course · Portfolio Creation", ka: "ხელოვნების კურსი · პორტფოლიოს შექმნა" },
    courses: { en: "Art Course · Portfolio Creation", ka: "ხელოვნების კურსი · პორტფოლიოს შექმნა" },
    note: { en: "2 courses · In-person", ka: "2 კურსი · დასწრებით" },
    rot: 1,
    href: "#portfolio",
  },
  {
    id: "film",
    n: "03",
    name: { en: "Film", ka: "ფილმი" },
    sub: { en: "History of Cinema", ka: "კინოს ისტორია" },
    courses: { en: "History of Cinema", ka: "კინოს ისტორია" },
    note: { en: "1 course · Online only", ka: "1 კურსი · მხოლოდ ონლაინ" },
    rot: -1,
    href: "#cinema",
  },
];

export const LAB_COURSES: LabCourse[] = [
  {
    id: "photography",
    slug: "photography",
    no: "01",
    discipline: "photography",
    icon: "photography",
    name: { en: "Photography: Theory & Practice", ka: "ფოტოგრაფია: თეორია და პრაქტიკა" },
    kicker: { en: "Course 01 - Photography", ka: "კურსი 01 - ფოტოგრაფია" },
    discLabel: { en: "Photography", ka: "ფოტოგრაფია" },
    disc: { en: "Photography", ka: "ფოტოგრაფია" },
    lecturer: "Beka Jokharidze",
    format: {
      en: "Individual in-person lessons\nIndividual online lessons",
      ka: "ინდივიდუალური გაკვეთილები დასწრებით\nინდივიდუალური გაკვეთილები ონლაინ",
    },
    formatTbd: false,
    blurb: {
      en: "A course built on both sides of the camera: how photographs think, and how they are made. Theory and practice run in parallel from the first lesson.",
      ka: "კურსი აგებულია კამერის ორივე მხარეზე: როგორ ფიქრობს ფოტოგრაფია და როგორ იქმნება იგი. თეორია და პრაქტიკა პირველივე გაკვეთილიდან პარალელურად მიდის.",
    },
    who: [
      {
        en: "Beginners building a first serious practice",
        ka: "დამწყებები, რომლებიც პირველ სერიოზულ პრაქტიკას იწყებენ",
      },
      {
        en: "Photographers formalising self-taught experience",
        ka: "ფოტოგრაფები, რომლებსაც დამოუკიდებლად მიღებული გამოცდილების სისტემატიზაცია სურთ",
      },
      {
        en: "Students preparing for further study in photography",
        ka: "სტუდენტები, რომლებიც ფოტოგრაფიაში სწავლის გაგრძელებისთვის ემზადებიან",
      },
    ],
    learn: [
      {
        en: "Reading photographs - theory, history, visual language",
        ka: "ფოტოგრაფიის წაკითხვა - თეორია, ისტორია, ვიზუალური ენა",
      },
      {
        en: "Camera craft: exposure, light, lenses, film and digital",
        ka: "კამერასთან მუშაობა: ექსპოზიცია, განათება, ოპტიკა, ფირი და ციფრი",
      },
      {
        en: "Developing a personal practice and a working method",
        ka: "პირადი პრაქტიკისა და სამუშაო მეთოდის განვითარება",
      },
    ],
    programNote: SYLLABUS_NOTE,
    program: [
      {
        n: "M. 01",
        title: { en: "Seeing before shooting", ka: "დანახვა გადაღებამდე" },
        note: { en: "Theory", ka: "თეორია" },
      },
      {
        n: "M. 02",
        title: { en: "The camera as instrument", ka: "კამერა როგორც ინსტრუმენტი" },
        note: { en: "Practice", ka: "პრაქტიკა" },
      },
      {
        n: "M. 03",
        title: { en: "Light, exposure, material", ka: "სინათლე, ექსპოზიცია, მასალა" },
        note: { en: "Practice", ka: "პრაქტიკა" },
      },
      {
        n: "M. 04",
        title: { en: "Reading photographs", ka: "ფოტოგრაფიის წაკითხვა" },
        note: { en: "Theory", ka: "თეორია" },
      },
      {
        n: "M. 05",
        title: { en: "A working series", ka: "სამუშაო სერია" },
        note: { en: "Final outcome", ka: "საბოლოო შედეგი" },
      },
    ],
    annotation: handwritten("theory and practice, in parallel"),
    sheet: [
      {
        key: K_FORMAT,
        value: {
          en: "Individual in-person\nIndividual online",
          ka: "ინდივიდუალური, დასწრებით\nინდივიდუალური, ონლაინ",
        },
        tbd: false,
      },
      { key: K_DURATION, value: TBD_DURATION, tbd: true },
      {
        key: K_SCHEDULE,
        value: { en: "Agreed individually", ka: "თანხმდება ინდივიდუალურად" },
        tbd: true,
      },
      { key: K_PRICE, value: TBD_PRICE, tbd: true },
    ],
  },
  {
    id: "art",
    slug: "art",
    no: "02",
    discipline: "art",
    icon: "art",
    name: { en: "Art Course", ka: "ხელოვნების კურსი" },
    kicker: { en: "Course 02 - Art", ka: "კურსი 02 - ხელოვნება" },
    discLabel: { en: "Art", ka: "ხელოვნება" },
    disc: { en: "Art", ka: "ხელოვნება" },
    lecturer: "Mariam Kandiashvili",
    format: TBD_FORMAT,
    formatTbd: true,
    blurb: {
      en: "A course in making and thinking: drawing, material, composition and the habits of a sustained artistic practice.",
      ka: "კურსი შექმნასა და აზროვნებაზე: ხატვა, მასალა, კომპოზიცია და მდგრადი მხატვრული პრაქტიკის ჩვევები.",
    },
    who: [
      {
        en: "Beginners starting a drawing and making practice",
        ka: "დამწყებები, რომლებიც ხატვისა და შექმნის პრაქტიკას იწყებენ",
      },
      {
        en: "Self-taught artists seeking structure and feedback",
        ka: "თვითნასწავლი მხატვრები, რომლებსაც სტრუქტურა და უკუკავშირი სჭირდებათ",
      },
      {
        en: "Students preparing for further study in art",
        ka: "სტუდენტები, რომლებიც ხელოვნებაში სწავლის გაგრძელებისთვის ემზადებიან",
      },
    ],
    learn: [
      { en: "Drawing and material fundamentals", ka: "ხატვისა და მასალის საფუძვლები" },
      { en: "Composition and visual thinking", ka: "კომპოზიცია და ვიზუალური აზროვნება" },
      {
        en: "Building and keeping a working practice",
        ka: "სამუშაო პრაქტიკის აგება და შენარჩუნება",
      },
    ],
    programNote: SYLLABUS_NOTE,
    program: [
      {
        n: "M. 01",
        title: { en: "Material & mark", ka: "მასალა და კვალი" },
        note: { en: "Practice", ka: "პრაქტიკა" },
      },
      {
        n: "M. 02",
        title: { en: "Composition", ka: "კომპოზიცია" },
        note: { en: "Practice", ka: "პრაქტიკა" },
      },
      {
        n: "M. 03",
        title: { en: "Visual thinking", ka: "ვიზუალური აზროვნება" },
        note: { en: "Theory", ka: "თეორია" },
      },
      {
        n: "M. 04",
        title: { en: "A sustained practice", ka: "მდგრადი პრაქტიკა" },
        note: { en: "Final outcome", ka: "საბოლოო შედეგი" },
      },
    ],
    annotation: handwritten("make, look, make again"),
    sheet: [
      { key: K_FORMAT, value: TBD_FORMAT, tbd: true },
      { key: K_DURATION, value: TBD_DURATION, tbd: true },
      { key: K_SCHEDULE, value: TBD_SCHEDULE, tbd: true },
      { key: K_PRICE, value: TBD_PRICE, tbd: true },
    ],
  },
  {
    id: "portfolio",
    slug: "portfolio",
    no: "03",
    discipline: "art",
    icon: "art",
    name: { en: "Portfolio Creation", ka: "პორტფოლიოს შექმნა" },
    kicker: { en: "Course 03 - Portfolio", ka: "კურსი 03 - პორტფოლიო" },
    discLabel: { en: "Art · Portfolio", ka: "ხელოვნება · პორტფოლიო" },
    disc: { en: "Art · Portfolio", ka: "ხელოვნება · პორტფოლიო" },
    lecturer: "Mariam Kandiashvili",
    format: TBD_FORMAT,
    formatTbd: true,
    blurb: {
      en: "A course with a fixed outcome: a working portfolio for applications in art, design, illustration, fashion, film art departments and other creative programs.",
      ka: "კურსი მკაფიო შედეგით: მოქმედი პორტფოლიო ხელოვნების, დიზაინის, ილუსტრაციის, მოდის, კინოს სამხატვრო დეპარტამენტებისა და სხვა საკრეატივო პროგრამების განაცხადებისთვის.",
    },
    who: [
      {
        en: "Applicants to art, design and illustration programs",
        ka: "ხელოვნების, დიზაინისა და ილუსტრაციის პროგრამების აპლიკანტები",
      },
      {
        en: "Applicants to fashion and film art departments",
        ka: "მოდისა და კინოს სამხატვრო დეპარტამენტების აპლიკანტები",
      },
      {
        en: "Anyone assembling a first professional portfolio",
        ka: "ყველა, ვინც პირველ პროფესიულ პორტფოლიოს კრებს",
      },
    ],
    learn: [
      { en: "Assessing existing work honestly", ka: "არსებული ნამუშევრების გულწრფელი შეფასება" },
      {
        en: "Planning and producing portfolio projects",
        ka: "პორტფოლიოს პროექტების დაგეგმვა და შექმნა",
      },
      { en: "Writing the texts a portfolio needs", ka: "პორტფოლიოსთვის საჭირო ტექსტების წერა" },
    ],
    programNote: { en: "Fixed five-stage process", ka: "ფიქსირებული ხუთეტაპიანი პროცესი" },
    program: [
      {
        n: "ST. 01",
        title: { en: "Assessment", ka: "შეფასება" },
        note: { en: "Where you are", ka: "სად ხარ ახლა" },
      },
      {
        n: "ST. 02",
        title: { en: "Portfolio planning", ka: "პორტფოლიოს დაგეგმვა" },
        note: { en: "What it needs", ka: "რა სჭირდება" },
      },
      {
        n: "ST. 03",
        title: { en: "Project creation", ka: "პროექტების შექმნა" },
        note: { en: "Making the work", ka: "ნამუშევრის შექმნა" },
      },
      {
        n: "ST. 04",
        title: { en: "Texts", ka: "ტექსტები" },
        note: { en: "Saying it plainly", ka: "მარტივად თქმა" },
      },
      {
        n: "ST. 05",
        title: { en: "Final portfolio", ka: "საბოლოო პორტფოლიო" },
        note: { en: "Final outcome", ka: "საბოლოო შედეგი" },
      },
    ],
    annotation: handwritten("before → process → final"),
    sheet: [
      { key: K_FORMAT, value: TBD_FORMAT, tbd: true },
      { key: K_DURATION, value: TBD_DURATION, tbd: true },
      { key: K_SCHEDULE, value: TBD_SCHEDULE, tbd: true },
      { key: K_PRICE, value: TBD_PRICE, tbd: true },
    ],
  },
  {
    id: "film",
    slug: "film",
    no: "04",
    discipline: "film",
    icon: "film",
    name: { en: "History of Cinema", ka: "კინოს ისტორია" },
    kicker: { en: "Course 04 - Film", ka: "კურსი 04 - ფილმი" },
    discLabel: { en: "Film · Online only", ka: "ფილმი · მხოლოდ ონლაინ" },
    disc: { en: "Film", ka: "ფილმი" },
    lecturer: "Tea Kandiashvili",
    format: { en: "Online only", ka: "მხოლოდ ონლაინ" },
    formatTbd: false,
    blurb: {
      en: "Not a chronology - a course in reading films: cinema language, directorial approaches, visual style, cultural context and film analysis.",
      ka: "არა ქრონოლოგია - კურსი ფილმების წაკითხვაზე: კინოს ენა, სარეჟისორო მიდგომები, ვიზუალური სტილი, კულტურული კონტექსტი და ფილმის ანალიზი.",
    },
    who: [
      {
        en: "Filmmakers wanting a deeper critical grounding",
        ka: "კინემატოგრაფისტები, რომლებსაც ღრმა კრიტიკული საფუძველი სურთ",
      },
      {
        en: "Writers and critics on visual culture",
        ka: "ვიზუალურ კულტურაზე მწერლები და კრიტიკოსები",
      },
      {
        en: "Anyone who wants to read films, not just watch them",
        ka: "ყველა, ვისაც ფილმების წაკითხვა სურს და არა მხოლოდ ყურება",
      },
    ],
    learn: [
      { en: "Cinema language and film form", ka: "კინოს ენა და ფილმის ფორმა" },
      {
        en: "Directorial approaches and visual style",
        ka: "სარეჟისორო მიდგომები და ვიზუალური სტილი",
      },
      {
        en: "Analysing films in their cultural context",
        ka: "ფილმების ანალიზი კულტურულ კონტექსტში",
      },
    ],
    programNote: {
      en: "Frame index - sessions confirmed per intake",
      ka: "კადრების ინდექსი - სესიები დასტურდება ნაკადის მიხედვით",
    },
    program: [
      {
        n: "FR. 01",
        title: { en: "Cinema language", ka: "კინოს ენა" },
        note: { en: "Analysis", ka: "ანალიზი" },
      },
      {
        n: "FR. 02",
        title: { en: "Directorial approaches", ka: "სარეჟისორო მიდგომები" },
        note: { en: "Analysis", ka: "ანალიზი" },
      },
      {
        n: "FR. 03",
        title: { en: "Visual style", ka: "ვიზუალური სტილი" },
        note: { en: "Analysis", ka: "ანალიზი" },
      },
      {
        n: "FR. 04",
        title: { en: "Cultural context", ka: "კულტურული კონტექსტი" },
        note: { en: "Context", ka: "კონტექსტი" },
      },
      {
        n: "FR. 05",
        title: { en: "Film analysis", ka: "ფილმის ანალიზი" },
        note: { en: "Practice", ka: "პრაქტიკა" },
      },
    ],
    annotation: handwritten("watch closely, then again"),
    sheet: [
      { key: K_FORMAT, value: { en: "Online only", ka: "მხოლოდ ონლაინ" }, tbd: false },
      { key: K_DURATION, value: TBD_DURATION, tbd: true },
      { key: K_SCHEDULE, value: TBD_SCHEDULE, tbd: true },
      { key: K_PRICE, value: TBD_PRICE, tbd: true },
    ],
  },
];

/**
 * The program table on the landing page.
 *
 * `formatShort` is the mobile column; `formatTbd` drives the lower ink the
 * handoff specifies for values the studio has not confirmed.
 */
export const LAB_PROGRAM: {
  n: string;
  slug: string;
  disc: LocalizedText;
  format: LocalizedText;
  formatShort: LocalizedText;
  formatTbd: boolean;
}[] = [
  {
    n: "01",
    slug: "photography",
    disc: { en: "Photography", ka: "ფოტოგრაფია" },
    format: { en: "Individual · In-person / Online", ka: "ინდივიდუალური · დასწრებით / ონლაინ" },
    formatShort: { en: "In-person / Online", ka: "დასწრებით / ონლაინ" },
    formatTbd: false,
  },
  {
    n: "02",
    slug: "art",
    disc: { en: "Art", ka: "ხელოვნება" },
    format: { en: "Format - announced", ka: "ფორმატი - ცხადდება" },
    formatShort: { en: "TBA", ka: "ცხადდება" },
    formatTbd: true,
  },
  {
    n: "03",
    slug: "portfolio",
    disc: { en: "Art · Portfolio", ka: "ხელოვნება · პორტფოლიო" },
    format: { en: "Format - announced", ka: "ფორმატი - ცხადდება" },
    formatShort: { en: "TBA", ka: "ცხადდება" },
    formatTbd: true,
  },
  {
    n: "04",
    slug: "film",
    disc: { en: "Film", ka: "ფილმი" },
    format: { en: "Online only", ka: "მხოლოდ ონლაინ" },
    formatShort: { en: "Online only", ka: "მხოლოდ ონლაინ" },
    formatTbd: false,
  },
];

/** Section 05 - what the photography sheet carries, as an index. */
export const LAB_FEATURED_INDEX: { n: string; title: LocalizedText; note: LocalizedText }[] = [
  {
    n: "A",
    title: { en: "What the course is", ka: "რა არის კურსი" },
    note: { en: "On the course sheet", ka: "კურსის ფურცელზე" },
  },
  {
    n: "B",
    title: { en: "Who it is for", ka: "ვისთვის არის" },
    note: { en: "On the course sheet", ka: "კურსის ფურცელზე" },
  },
  {
    n: "C",
    title: { en: "What you will learn", ka: "რას ისწავლი" },
    note: { en: "On the course sheet", ka: "კურსის ფურცელზე" },
  },
  {
    n: "D",
    title: { en: "Final outcome", ka: "საბოლოო შედეგი" },
    note: { en: "On the course sheet", ka: "კურსის ფურცელზე" },
  },
];

/** Section 08 - the Lab beyond the courses. */
export const LAB_ECOSYSTEM: { title: LocalizedText; desc: LocalizedText; tag: LocalizedText }[] = [
  {
    title: { en: "Workshops", ka: "ვორქშოფები" },
    desc: {
      en: "Short programs and artist sessions, announced per season. First entries publish here.",
      ka: "მოკლე პროგრამები და მხატვრული სესიები, რომლებიც სეზონურად ცხადდება. პირველი ჩანაწერები აქ გამოქვეყნდება.",
    },
    tag: { en: "W - announced per season", ka: "W - ცხადდება სეზონურად" },
  },
  {
    title: { en: "Research", ka: "კვლევა" },
    desc: {
      en: "Ongoing visual research and field notes - notebook, not portfolio.",
      ka: "მიმდინარე ვიზუალური კვლევა და საველე ჩანაწერები - რვეული და არა პორტფოლიო.",
    },
    tag: { en: "R - field notes", ka: "R - საველე ჩანაწერები" },
  },
  {
    title: { en: "Experiments", ka: "ექსპერიმენტები" },
    desc: {
      en: "Open process sessions, documented as they happen and kept in the archive.",
      ka: "ღია პროცესის სესიები, რომლებიც ფიქსირდება მიმდინარეობისას და ინახება არქივში.",
    },
    tag: { en: "E - into the archive", ka: "E - არქივში" },
  },
];

/**
 * Section 09 - the faculty.
 *
 * Biographies are NOT written here: the studio has not supplied them, so each
 * entry carries the same explicit pending line rather than invented prose.
 */
export const LAB_FACULTY: {
  slug: string;
  name: string;
  disc: LocalizedText;
  /** the course this person teaches, as the link label */
  course: LocalizedText;
  href: string;
  portraitLabel: LocalizedText;
}[] = [
  {
    slug: "beka-jokharidze",
    name: "Beka Jokharidze",
    disc: { en: "Photography", ka: "ფოტოგრაფია" },
    course: { en: "Photography: Theory & Practice", ka: "ფოტოგრაფია: თეორია და პრაქტიკა" },
    href: "photography",
    portraitLabel: { en: "Portrait - Beka Jokharidze", ka: "პორტრეტი - ბექა ჯოხარიძე" },
  },
  {
    slug: "mariam-kandiashvili",
    name: "Mariam Kandiashvili",
    disc: { en: "Art · Portfolio", ka: "ხელოვნება · პორტფოლიო" },
    course: { en: "Art Course · Portfolio Creation", ka: "ხელოვნების კურსი · პორტფოლიოს შექმნა" },
    href: "art",
    portraitLabel: { en: "Portrait - Mariam Kandiashvili", ka: "პორტრეტი - მარიამ კანდიაშვილი" },
  },
  {
    slug: "tea-kandiashvili",
    name: "Tea Kandiashvili",
    disc: { en: "Film", ka: "ფილმი" },
    course: { en: "History of Cinema", ka: "კინოს ისტორია" },
    href: "film",
    portraitLabel: { en: "Portrait - Tea Kandiashvili", ka: "პორტრეტი - თეა ყანდიშვილი" },
  },
];

/** Every course slug, for generateStaticParams. */
export function labCourseSlugs(): string[] {
  return LAB_COURSES.map((c) => c.slug);
}

/** A course by its URL slug. */
export function labCourseBySlug(slug: string): LabCourse | undefined {
  return LAB_COURSES.find((c) => c.slug === slug);
}
