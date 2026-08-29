import type { LocalizedText, TeamDepartment, TeamMember } from "./types";

/**
 * The groups, in the approved display order.
 *
 * These are NOT corporate departments and they are not drawn as boxed sections:
 * the landing roster is one continuous contact sheet, and a person's group is
 * stated inside their own profile. What the group actually controls is SEQUENCE -
 * it decides the order the frames are numbered in, which is how the studio's
 * working hierarchy is expressed on this page: by placement and numbering rather
 * than by an org chart.
 *
 * A group is only rendered when it has members, so the architecture can hold a
 * group the studio has not filled without ever drawing an empty heading.
 */
export const TEAM_DEPARTMENTS: { id: TeamDepartment; name: LocalizedText }[] = [
  {
    id: "creative-leadership",
    name: { en: "Creative Leadership", ka: "კრეატიული ხელმძღვანელობა" },
  },
  {
    id: "direction-production",
    name: { en: "Direction & Production", ka: "რეჟისურა და პროდიუსინგი" },
  },
  { id: "camera-coordination", name: { en: "Camera & Coordination", ka: "კამერა და კოორდინაცია" } },
  { id: "art-department", name: { en: "Art Department", ka: "არტ დეპარტამენტი" } },
  { id: "studio-support", name: { en: "Studio Support", ka: "სტუდიის მხარდაჭერა" } },
];

/**
 * The roster - the CURRENT team, thirteen people.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT
 * ---------------------------------
 * Names, roles and responsibilities are the studio's own supplied record and are
 * confirmed. Everything else on the schema is genuinely absent rather than
 * invented: no biographies, no clients, no awards, no credits, no education, no
 * languages, no contact details, no external profiles, and no `selectedWork` -
 * a project is never attached to a person without a confirmed credit. The
 * profile sheet renders exactly the blocks that carry content, so each person
 * opens onto identity, roles and responsibilities and nothing padded.
 *
 * PORTRAITS
 * ---------
 * No portrait exists for anyone yet, and none is fabricated. `portrait` is
 * optional on the schema, so the frame falls back to the studio's own drawn
 * device - initials inside the hand-ruled rectangle under a localised PORTRAIT
 * PENDING mark, both aria-hidden so no meaningless alt text reaches a screen
 * reader. That is an intentional state, not a broken image.
 *
 * Adding a portrait later is a data edit and needs no code change:
 *
 *   portrait: {
 *     src: "/media/team/mariam-kandiashvili.webp",
 *     alt: { en: "Mariam Kandiashvili", ka: "მარიამ კანდიაშვილი" },
 *   },
 *
 * ROLE ORDER
 * ----------
 * The source lists each person's roles slash-separated. `role` takes the one
 * that identifies the person, and `secondaryRoles` carries the rest - no role is
 * dropped and none is added. The landing frame shows the first two, the profile
 * shows all of them.
 *
 * NAMES
 * -----
 * Georgian names are exactly as the studio supplied them, including the surname
 * spellings that differ from the English transliteration. They are not
 * "corrected" against any outside source.
 */
export const TEAM: TeamMember[] = [
  /* ---- 01 creative leadership ---- */
  {
    id: "mariam-kandiashvili",
    slug: "mariam-kandiashvili",
    name: { en: "Mariam Kandiashvili", ka: "მარიამ კანდიაშვილი" },
    provisional: false,
    department: "creative-leadership",
    role: { en: "Co-Founder", ka: "თანადამფუძნებელი" },
    secondaryRoles: [
      { en: "Creative Director", ka: "კრეატიული დირექტორი" },
      { en: "Head of Art Department", ka: "არტ დეპარტამენტის ხელმძღვანელი" },
      { en: "Multimedia Artist", ka: "მულტიმედია არტისტი" },
      { en: "Graphic Designer", ka: "გრაფიკული დიზაინერი" },
    ],
    shortStatement: {
      en: "Leads creative direction, production design, art direction, concept development, visual development and graphic design.",
      ka: "ხელმძღვანელობს კრეატიულ მიმართულებას, Production Design-ს, არტ დირექტინგს, კონცეფციების შექმნას, ვიზუალურ განვითარებასა და გრაფიკულ დიზაინს.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 1,
    featured: true,
  },
  {
    id: "beka-jokharidze",
    slug: "beka-jokharidze",
    name: { en: "Beka Jokharidze", ka: "ბექა ჯოხარიძე" },
    provisional: false,
    department: "creative-leadership",
    role: { en: "Co-Founder", ka: "თანადამფუძნებელი" },
    secondaryRoles: [
      { en: "Director of Photography", ka: "ოპერატორი-დამდგმელი (Director of Photography)" },
      { en: "Photographer", ka: "ფოტოგრაფი" },
      { en: "Art Director", ka: "არტ დირექტორი" },
      { en: "Multimedia Artist", ka: "მულტიმედია არტისტი" },
    ],
    shortStatement: {
      en: "Leads photography and works as Director of Photography on film and audiovisual productions. Also works as Art Director and Artist, second in the Art Department after Mariam.",
      ka: "ხელმძღვანელობს ფოტოგრაფიის მიმართულებას და კინოში მუშაობს როგორც Director of Photography. ასევე არის არტ დირექტორი და არტისტი, არტ დეპარტამენტში მარიამის შემდეგ მეორე პოზიციაზე.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 2,
    featured: true,
  },

  /* ---- 02 direction & production ---- */
  {
    id: "david-gurgulia",
    slug: "david-gurgulia",
    name: { en: "David Gurgulia", ka: "დავით გურგულია" },
    provisional: false,
    department: "direction-production",
    role: { en: "Director", ka: "რეჟისორი" },
    secondaryRoles: [],
    shortStatement: {
      en: "Directs film, commercial, music video and other audiovisual projects.",
      ka: "მუშაობს ფილმებზე, რეკლამებზე, მუსიკალურ ვიდეოებსა და სხვა აუდიოვიზუალურ პროექტებზე.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 3,
    featured: false,
  },
  {
    id: "beka-siradze",
    slug: "beka-siradze",
    name: { en: "Beka Siradze", ka: "ბექა სირაძე" },
    provisional: false,
    department: "direction-production",
    role: { en: "Producer", ka: "პროდიუსერი" },
    secondaryRoles: [
      { en: "Main Communicator", ka: "მთავარი კომუნიკატორი" },
      { en: "Business Development", ka: "ბიზნესის განვითარება" },
    ],
    shortStatement: {
      en: "Handles producing, client communication, external relations, partnerships and new project opportunities.",
      ka: "პასუხისმგებელია პროდიუსინგზე, კლიენტებთან კომუნიკაციაზე, პარტნიორობებზე, გარე ურთიერთობებსა და ახალი პროექტების მოძიებაზე.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 4,
    featured: false,
  },
  {
    id: "irakli-kalandadze",
    slug: "irakli-kalandadze",
    name: { en: "Irakli Kalandadze", ka: "ირაკლი კალანდაძე" },
    provisional: false,
    department: "direction-production",
    role: { en: "Producer", ka: "პროდიუსერი" },
    secondaryRoles: [
      { en: "Company Manager", ka: "კომპანიის მენეჯერი" },
      { en: "Business Development", ka: "ბიზნესის განვითარება" },
    ],
    shortStatement: {
      en: "Produces projects, manages daily company operations, and develops clients, partnerships and new business opportunities.",
      ka: "მართავს პროექტებსა და კომპანიის ყოველდღიურ საქმიანობას, მუშაობს კლიენტების, პარტნიორებისა და ახალი შესაძლებლობების მოძიებაზე.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 5,
    featured: false,
  },
  {
    id: "nona-kandiashvili",
    slug: "nona-kandiashvili",
    name: { en: "Nona Kandiashvili", ka: "ნონა ყანდიაშვილი" },
    provisional: false,
    department: "direction-production",
    role: { en: "Head Producer", ka: "მთავარი პროდიუსერი" },
    secondaryRoles: [
      {
        en: "International News, Documentary & Television",
        ka: "საერთაშორისო ახალი ამბები, დოკუმენტალისტიკა და ტელევიზია",
      },
    ],
    shortStatement: {
      en: "Leads international news, documentary and television productions, and manages foreign broadcasters, journalists and television clients.",
      ka: "ხელმძღვანელობს საერთაშორისო ახალი ამბების, დოკუმენტური და სატელევიზიო პროექტების მიმართულებას და მუშაობს უცხოურ ტელევიზიებთან, ჟურნალისტებთან და მაუწყებლებთან.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 6,
    featured: false,
  },
  {
    id: "tea-kandiashvili",
    slug: "tea-kandiashvili",
    name: { en: "Tea Kandiashvili", ka: "თეა ყანდიაშვილი" },
    provisional: false,
    department: "direction-production",
    role: {
      en: "Research & Editorial Director",
      ka: "კვლევისა და სარედაქციო მიმართულების დირექტორი",
    },
    secondaryRoles: [],
    shortStatement: {
      en: "Analyses projects, conducts research, and oversees treatments, synopses, proposals, presentations, grant texts, website copy and other written material.",
      ka: "აანალიზებს პროექტებს, ატარებს კვლევას და პასუხისმგებელია ტექსტებზე — ტრიტმენტებზე, სინოფსისებზე, განაცხადებზე, პრეზენტაციებზე, საგრანტო ტექსტებზე, ვებგვერდის ტექსტებსა და სხვა წერილობით მასალაზე.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 7,
    featured: false,
  },

  /* ---- 03 camera & coordination ---- */
  {
    id: "vako-kvinikadze",
    slug: "vako-kvinikadze",
    name: { en: "Vako Kvinikadze", ka: "ვაკო კვინიკაძე" },
    provisional: false,
    department: "camera-coordination",
    role: { en: "Camera Operator", ka: "კამერის ოპერატორი" },
    secondaryRoles: [],
    shortStatement: {
      en: "Responsible for camera operation and filming.",
      ka: "პასუხისმგებელია კამერის მუშაობასა და გადაღებაზე.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 8,
    featured: false,
  },
  {
    id: "yuko-chubinidze",
    slug: "yuko-chubinidze",
    name: { en: "Yuko Chubinidze", ka: "იუკო ჩუბინიძე" },
    provisional: false,
    department: "camera-coordination",
    role: { en: "Production Coordinator", ka: "Production Coordinator" },
    secondaryRoles: [{ en: "Director's Assistant", ka: "რეჟისორის ასისტენტი" }],
    shortStatement: {
      en: "Handles schedules, logistics, documentation and production coordination, and assists the Director.",
      ka: "პასუხისმგებელია გრაფიკებზე, ლოჯისტიკაზე, დოკუმენტაციაზე, კოორდინაციასა და რეჟისორის მხარდაჭერაზე.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 9,
    featured: false,
  },

  /* ---- 04 art department ---- */
  {
    id: "luka-abazashvili",
    slug: "luka-abazashvili",
    name: { en: "Luka Abazashvili", ka: "ლუკა აბაზაშვილი" },
    provisional: false,
    department: "art-department",
    role: { en: "First Assistant to Mariam", ka: "მარიამის პირველი ასისტენტი" },
    secondaryRoles: [{ en: "Art Department Assistant", ka: "არტ დეპარტამენტის ასისტენტი" }],
    shortStatement: {
      en: "Supports production design, research, preparation and Art Department execution.",
      ka: "ეხმარება Production Design-ში, კვლევაში, მომზადებასა და არტ დეპარტამენტის სამუშაოებში.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 10,
    featured: false,
  },
  {
    id: "nutsa-revazishvili",
    slug: "nutsa-revazishvili",
    name: { en: "Nutsa Revazishvili", ka: "ნუცა რევაზიშვილი" },
    provisional: false,
    department: "art-department",
    role: { en: "Prop Maker", ka: "რეკვიზიტორი" },
    secondaryRoles: [{ en: "Second Assistant", ka: "მეორე ასისტენტი" }],
    shortStatement: {
      en: "Creates props and supports Art Department work, set preparation and production.",
      ka: "ამზადებს რეკვიზიტებს და ეხმარება არტ დეპარტამენტს, დეკორაციის მომზადებასა და წარმოებაში.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 11,
    featured: false,
  },

  /* ---- 05 studio support ---- */
  {
    id: "lasha-bedianashvili",
    slug: "lasha-bedianashvili",
    name: { en: "Lasha Bedianashvili", ka: "ლაშა ბედიაშვილი" },
    provisional: false,
    department: "studio-support",
    role: {
      en: "Technical Assistant to Beka Jokharidze",
      ka: "ბექა ჯოხარიძის ტექნიკური ასისტენტი",
    },
    secondaryRoles: [],
    shortStatement: {
      en: "Supports photography, lighting, equipment and technical setups.",
      ka: "ეხმარება ფოტოგრაფიის, განათების, ტექნიკისა და ტექნიკური setup-ების მიმართულებით.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 12,
    featured: false,
  },
  {
    id: "keto-kiladze",
    slug: "keto-kiladze",
    name: { en: "Keto Kiladze", ka: "ქეთო კილაძე" },
    provisional: false,
    department: "studio-support",
    role: { en: "General Assistant", ka: "გენერალური ასისტენტი" },
    secondaryRoles: [],
    shortStatement: {
      en: "Supports the whole company with production, studio work and day-to-day tasks.",
      ka: "ეხმარება მთლიან გუნდს გადაღებებზე, სტუდიის საქმიანობასა და ყოველდღიურ საორგანიზაციო სამუშაოებში.",
    },
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 13,
    featured: false,
  },
];

/** Team in display order. */
export function teamSorted(): TeamMember[] {
  return [...TEAM].sort((a, b) => a.order - b.order);
}

/** Whether any people data exists yet, provisional or not. */
export function hasTeam(): boolean {
  return TEAM.length > 0;
}

/** Whether any CONFIRMED person exists - drives the provisional roster notice. */
export function hasConfirmedTeam(): boolean {
  return TEAM.some((p) => !p.provisional && !!p.name);
}

/**
 * The roster grouped by department, in the approved order, with empty
 * departments dropped entirely - a heading is never drawn without members.
 */
export function teamByDepartment(): {
  id: TeamDepartment;
  name: LocalizedText;
  people: TeamMember[];
}[] {
  const sorted = teamSorted();
  return TEAM_DEPARTMENTS.map((d) => ({
    ...d,
    people: sorted.filter((p) => p.department === d.id),
  })).filter((d) => d.people.length > 0);
}

/** Flat roster in the order the sections render it - drives prev/next. */
export function teamInSectionOrder(): TeamMember[] {
  return teamByDepartment().flatMap((d) => d.people);
}

/** A person by their URL slug. */
export function teamMemberBySlug(slug: string): TeamMember | undefined {
  return TEAM.find((p) => p.slug === slug);
}
