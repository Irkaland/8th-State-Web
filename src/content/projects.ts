import type { Media, Project } from "./types";

// Every project is status: "published". Nothing in the approved content marks
// any of the twelve as unfinished, so none is flagged in-development - see the
// note on projectStatus in content/types.ts.
//
// NOTE: Titles/clients marked as provisional are placeholder/editorial demo content derived from
// the approved mockup (which flagged them with *). NO imagery ships: the demo photography that
// used to stand in for the studio's masters has been removed, and every image position renders as
// an empty editorial slot. None of this implies a real completed 8th State client engagement.

/**
 * One image position in the archive.
 *
 * There is no `src`: the studio's own masters have not been delivered, and the
 * demo photography that used to stand in for them has been removed rather than
 * left to read as finished work. What survives is the description of what
 * belongs in each position - which is the part that is actually editorial - so
 * a slot arrives already captioned and already sized, and the file is a one-key
 * addition later.
 */
const img = (en: string, ka: string, extra: Partial<Media> = {}): Media => ({
  alt: { en, ka },
  ...extra,
});

export const PROJECTS: Project[] = [
  {
    slug: "aom-summer-collection",
    title: "AOM - Summer Collection",
    titleProvisional: true,
    client: "AOM",
    year: "2025",
    location: { en: "Tbilisi, Georgia", ka: "თბილისი, საქართველო" },
    categories: ["fashion", "campaigns"],
    primaryCategory: "fashion",
    categoryLabel: { en: "Fashion Campaign", ka: "მოდის კამპანია" },
    services: [
      { en: "Creative Direction", ka: "კრეატიული მიმართულება" },
      { en: "Photography", ka: "ფოტოგრაფია" },
      { en: "Styling Direction", ka: "სტილის მიმართულება" },
      { en: "Set Design", ka: "დეკორის დიზაინი" },
    ],
    deliverables: [
      { en: "24 campaign images", ka: "24 კამპანიის სურათი" },
      { en: "8 social crops", ka: "8 სოციალური კროპი" },
      { en: "3 short-form videos", ka: "3 მოკლე ვიდეო" },
    ],
    studioRole: {
      en: "Full production - concept to delivery",
      ka: "სრული პროდაქშენი - კონცეფციიდან მიწოდებამდე",
    },
    summary: {
      en: "A summer collection documented as travel memory - market streets, harsh midday sun and saturated color against archival styling. Photography and short-form video produced in one combined schedule.",
      ka: "საზაფხულო კოლექცია, დაფიქსირებული როგორც სამოგზაურო მოგონება - ბაზრის ქუჩები, შუადღის მკვეთრი მზე და გაჯერებული ფერი არქივულ სტილინგზე. ფოტოგრაფია და მოკლე ვიდეო ერთ საერთო გრაფიკში.",
    },
    creativeIdea: {
      en: "Treat the collection like found photographs: real locations, in-between moments, deliberate imperfection framed with cinematic control.",
      ka: "კოლექცია მოვეპყროთ როგორც ნაპოვნ ფოტოებს: რეალური ლოკაციები, შუალედური მომენტები, განზრახ არასრულყოფილება კინემატოგრაფიული კონტროლით.",
    },
    productionApproach: {
      en: "Location scouting across old Tbilisi; casting mixed street-cast and agency talent; styling built around the collection with sourced props; two production days, one combined photo + video crew.",
      ka: "ლოკაციების მოძიება ძველ თბილისში; შერეული ქუჩისა და სააგენტოს კასტინგი; სტილინგი აგებული კოლექციაზე მოძიებული რეკვიზიტით; ორი გადაღების დღე, ერთი გაერთიანებული ფოტო + ვიდეო ჯგუფი.",
    },
    usage: { en: "Social, e-commerce, OOH", ka: "სოციალური, ელკომერცია, OOH" },
    cover: img(
      "AOM summer campaign - bold styling under saturated red light",
      "AOM საზაფხულო კამპანია - თამამი სტილინგი გაჯერებულ წითელ შუქზე",
    ),
    hero: img(
      "AOM campaign hero - model in a red-lit studio scene",
      "AOM კამპანიის ჰერო - მოდელი წითლად განათებულ სცენაზე",
    ),
    gallery: [
      img(
        "Model in colourful conceptual fashion, full-bleed",
        "მოდელი ფერად კონცეპტუალურ მოდაში, სრული კადრი",
      ),
      img("Warm-toned studio portrait", "თბილტონიანი სტუდიური პორტრეტი"),
      img("Studio portrait with motion", "სტუდიური პორტრეტი მოძრაობით"),
      img(
        "Film still - figure inside a car under coloured light",
        "ფილმის კადრი - ფიგურა მანქანაში ფერად შუქზე",
        {
          kind: "video",
          caption: {
            en: "Campaign film · 0:45 · captions on",
            ka: "კამპანიის ფილმი · 0:45 · სუბტიტრებით",
          },
        },
      ),
      img(
        "Detail crop - black satin and leather gloves",
        "დეტალის კროპი - შავი სატინი და ტყავის ხელთათმანები",
        { kind: "detail" },
      ),
    ],
    bts: [
      img(
        "Crew with a camera on set under red lighting",
        "ჯგუფი კამერით გადაღებაზე წითელ განათებაზე",
        { kind: "bts" },
      ),
      img(
        "Set prep - lighting equipment being arranged",
        "დეკორის მომზადება - განათების აღჭურვილობის განლაგება",
        { kind: "bts" },
      ),
    ],
    credits: [
      {
        role: { en: "Creative Direction", ka: "კრეატიული მიმართულება" },
        name: "Name Surname",
        provisional: true,
      },
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
      { role: { en: "Styling", ka: "სტილინგი" }, name: "Name Surname", provisional: true },
      {
        role: { en: "Set Design", ka: "დეკორის დიზაინი" },
        name: "Name Surname",
        provisional: true,
      },
    ],
    relatedSlug: "kitchen-living-gastronome",
    featured: true,
    status: "published",
    order: 1,
    isVideo: false,
    verified: false,
  },
  {
    slug: "bal-dafrique-still-life",
    title: "Bal d'Afrique - Still Life",
    titleProvisional: true,
    client: "Bal d'Afrique",
    year: "2025",
    location: { en: "Studio, Tbilisi", ka: "სტუდია, თბილისი" },
    categories: ["product"],
    primaryCategory: "product",
    categoryLabel: { en: "Product", ka: "პროდუქტი" },
    services: [
      { en: "Photography", ka: "ფოტოგრაფია" },
      { en: "Set Design", ka: "დეკორის დიზაინი" },
    ],
    deliverables: [
      { en: "Product images", ka: "პროდუქტის სურათები" },
      { en: "E-commerce crops", ka: "ელკომერციის კროპები" },
    ],
    studioRole: { en: "Photography & set design", ka: "ფოტოგრაფია და დეკორის დიზაინი" },
    summary: {
      en: "A fragrance still life built on warm sand tones - natural texture, cotton blooms and low directional light to hold the object as the subject.",
      ka: "სუნამოს ნატურმორტი თბილ ქვიშისფერ ტონებზე - ბუნებრივი ტექსტურა, ბამბის ყვავილები და დაბალი მიმართული შუქი, რომ ობიექტი დარჩეს მთავარ სუბიექტად.",
    },
    creativeIdea: {
      en: "Let the material speak - no gloss, no gimmick, a considered arrangement that reads as editorial rather than catalogue.",
      ka: "მასალას მიეცეს სიტყვა - ბრჭყვიალის გარეშე, აწყობა, რომელიც რედაქციულად იკითხება და არა კატალოგად.",
    },
    productionApproach: {
      en: "Studio build with sourced natural props; single-session capture optimized for both hero and e-commerce ratios.",
      ka: "სტუდიური აწყობა მოძიებული ბუნებრივი რეკვიზიტით; ერთსესიური გადაღება ჰერო და ელკომერციის ფორმატებისთვის.",
    },
    cover: img(
      "Bal d'Afrique fragrance styled with cotton blooms on warm sand tones",
      "Bal d'Afrique სუნამო ბამბის ყვავილებით თბილ ქვიშისფერ ტონებზე",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "pure-royal-fragrance",
    featured: true,
    status: "published",
    order: 2,
    isVideo: false,
    verified: false,
  },
  {
    slug: "iced-classic-meama",
    title: "Iced Classic - Meama",
    titleProvisional: true,
    client: "Meama",
    year: "2025",
    location: { en: "Studio, Tbilisi", ka: "სტუდია, თბილისი" },
    categories: ["food-lifestyle"],
    primaryCategory: "food-lifestyle",
    categoryLabel: { en: "Food & Beverage", ka: "საკვები და სასმელი" },
    services: [{ en: "Photography", ka: "ფოტოგრაფია" }],
    deliverables: [
      { en: "Beverage stills", ka: "სასმელის სტილები" },
      { en: "Social crops", ka: "სოციალური კროპები" },
    ],
    studioRole: { en: "Photography", ka: "ფოტოგრაფია" },
    summary: {
      en: "A cold-brew classic shot in hard summer light - condensation, citrus and a saturated backdrop for maximum thirst appeal.",
      ka: "ცივი ყავის კლასიკა, გადაღებული ზაფხულის მკვეთრ შუქზე - კონდენსატი, ციტრუსი და გაჯერებული ფონი მაქსიმალური მადისთვის.",
    },
    creativeIdea: {
      en: "Make the drink feel physically cold: real ice, real sweat on the glass, one confident colour field behind it.",
      ka: "სასმელი ფიზიკურად ცივად გამოჩნდეს: ნამდვილი ყინული, ჭიქაზე ნამი, ერთი დარწმუნებული ფერის ველი უკან.",
    },
    productionApproach: {
      en: "Fast tabletop capture to preserve condensation; colour-matched backdrop and controlled hard light.",
      ka: "სწრაფი მაგიდის გადაღება კონდენსატის შესანარჩუნებლად; ფერგაწონასწორებული ფონი და კონტროლირებული მკვეთრი შუქი.",
    },
    cover: img(
      "Iced coffee in a textured glass with a straw against green",
      "ცივი ყავა ტექსტურირებულ ჭიქაში ჩხირით მწვანე ფონზე",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "kitchen-living-gastronome",
    featured: true,
    status: "published",
    order: 3,
    isVideo: false,
    verified: false,
  },
  {
    slug: "kitchen-living-gastronome",
    title: "Kitchen & Living - Gastronome",
    titleProvisional: true,
    client: "Gastronome",
    year: "2024",
    location: { en: "Tbilisi, Georgia", ka: "თბილისი, საქართველო" },
    categories: ["food-lifestyle", "campaigns"],
    primaryCategory: "food-lifestyle",
    categoryLabel: { en: "Lifestyle", ka: "ცხოვრების სტილი" },
    services: [
      { en: "Photography", ka: "ფოტოგრაფია" },
      { en: "Creative Direction", ka: "კრეატიული მიმართულება" },
    ],
    deliverables: [
      { en: "Lifestyle images", ka: "ცხოვრების სტილის სურათები" },
      { en: "Social content", ka: "სოციალური კონტენტი" },
    ],
    studioRole: {
      en: "Photography & creative direction",
      ka: "ფოტოგრაფია და კრეატიული მიმართულება",
    },
    summary: {
      en: "A shared table photographed from above - a lived-in gathering of texture, food and daylight rather than a styled catalogue.",
      ka: "საერთო მაგიდა ზემოდან გადაღებული - ცოცხალი შეკრება ტექსტურის, საკვებისა და დღის შუქით და არა სტილიზებული კატალოგი.",
    },
    creativeIdea: {
      en: "Warmth over perfection: real dishes, natural imperfection, a table that feels used.",
      ka: "სითბო სრულყოფილებაზე მაღლა: ნამდვილი კერძები, ბუნებრივი არასრულყოფილება, გამოყენებული მაგიდა.",
    },
    productionApproach: {
      en: "Overhead rig, natural window light, food styled to read as a real meal in progress.",
      ka: "ზედა რიგი, ბუნებრივი ფანჯრის შუქი, საკვები დასტილული როგორც მიმდინარე ნამდვილი კვება.",
    },
    cover: img(
      "Overhead table with khachapuri, wine and salads",
      "ზემოდან ხედი მაგიდაზე ხაჭაპურით, ღვინითა და სალათებით",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "iced-classic-meama",
    featured: true,
    status: "published",
    order: 4,
    isVideo: false,
    verified: false,
  },
  {
    slug: "volvo-situationist",
    title: "Volvo × Situationist",
    titleProvisional: true,
    client: "Situationist",
    year: "2024",
    location: { en: "Tbilisi, Georgia", ka: "თბილისი, საქართველო" },
    categories: ["film-culture", "campaigns"],
    primaryCategory: "film-culture",
    categoryLabel: { en: "Film", ka: "ფილმი" },
    services: [
      { en: "Video Production", ka: "ვიდეო პროდაქშენი" },
      { en: "Creative Direction", ka: "კრეატიული მიმართულება" },
    ],
    deliverables: [
      { en: "Brand film", ka: "ბრენდის ფილმი" },
      { en: "Social cutdowns", ka: "სოციალური მონტაჟები" },
    ],
    studioRole: { en: "Film production", ka: "ფილმ პროდაქშენი" },
    summary: {
      en: "A night-drive brand film - neon, reflection and motion, built for a cinematic wide edit and vertical social cutdowns.",
      ka: "ღამის მგზავრობის ბრენდ ფილმი - ნეონი, ანარეკლი და მოძრაობა, აგებული კინემატოგრაფიული ფართო მონტაჟისა და ვერტიკალური სოციალური ვერსიებისთვის.",
    },
    creativeIdea: {
      en: "Let the city light the product: reflections, wet asphalt and controlled neon rather than studio gloss.",
      ka: "ქალაქმა გაანათოს პროდუქტი: ანარეკლები, სველი ასფალტი და კონტროლირებული ნეონი და არა სტუდიური ბრჭყვიალი.",
    },
    productionApproach: {
      en: "Night location scout, tracking vehicle rig, practical neon and a compact night crew.",
      ka: "ღამის ლოკაციის მოძიება, თვალთვალის მანქანის რიგი, პრაქტიკული ნეონი და კომპაქტური ღამის ჯგუფი.",
    },
    cover: img(
      "Film still - figure by a vintage car under neon light",
      "ფილმის კადრი - ფიგურა ვინტაჟურ მანქანასთან ნეონის შუქზე",
      { kind: "video" },
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Direction", ka: "რეჟისურა" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "colors-of-leghvi",
    featured: true,
    status: "published",
    order: 5,
    isVideo: true,
    verified: false,
  },
  {
    slug: "colors-of-leghvi",
    title: "The Colors of Leghvi",
    titleProvisional: true,
    client: "Leghvi",
    year: "2024",
    location: { en: "Kakheti, Georgia", ka: "კახეთი, საქართველო" },
    categories: ["film-culture"],
    primaryCategory: "film-culture",
    categoryLabel: { en: "Music & Culture", ka: "მუსიკა და კულტურა" },
    services: [
      { en: "Film", ka: "ფილმი" },
      { en: "Photography", ka: "ფოტოგრაფია" },
      { en: "Creative Direction", ka: "კრეატიული მიმართულება" },
    ],
    deliverables: [
      { en: "Short film", ka: "მოკლემეტრაჟიანი ფილმი" },
      { en: "Editorial stills", ka: "რედაქციული სტილები" },
    ],
    studioRole: {
      en: "Film, photography & creative direction",
      ka: "ფილმი, ფოტოგრაფია და კრეატიული მიმართულება",
    },
    summary: {
      en: "A cultural short about colour and celebration - a document of place and people rather than a polished promo.",
      ka: "კულტურული მოკლემეტრაჟი ფერსა და დღესასწაულზე - ადგილისა და ხალხის დოკუმენტი და არა გაპრიალებული პრომო.",
    },
    creativeIdea: {
      en: "Follow the night: colour, music and faces, captured with a documentary hand.",
      ka: "გავყვეთ ღამეს: ფერი, მუსიკა და სახეები, დაფიქსირებული დოკუმენტური ხელით.",
    },
    productionApproach: {
      en: "Small mobile crew, available light, edited for rhythm rather than narrative.",
      ka: "მცირე მობილური ჯგუფი, არსებული შუქი, დამონტაჟებული რიტმზე და არა ნარატივზე.",
    },
    cover: img(
      "Cinematic night scene in colourful neon",
      "კინემატოგრაფიული ღამის სცენა ფერად ნეონში",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Direction", ka: "რეჟისურა" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "volvo-situationist",
    featured: true,
    status: "published",
    order: 6,
    isVideo: false,
    verified: false,
  },
  {
    slug: "office-series-editorial",
    title: "Office Series - Editorial",
    titleProvisional: true,
    client: "Editorial",
    year: "2025",
    location: { en: "Tbilisi, Georgia", ka: "თბილისი, საქართველო" },
    categories: ["fashion"],
    primaryCategory: "fashion",
    categoryLabel: { en: "Fashion", ka: "მოდა" },
    services: [
      { en: "Photography", ka: "ფოტოგრაფია" },
      { en: "Styling Direction", ka: "სტილის მიმართულება" },
    ],
    deliverables: [{ en: "Editorial images", ka: "რედაქციული სურათები" }],
    studioRole: { en: "Photography & styling direction", ka: "ფოტოგრაფია და სტილის მიმართულება" },
    summary: {
      en: "A tailoring editorial staged in a working environment - structure, posture and neutral light against everyday objects.",
      ka: "სამკერვალო რედაქცია, გათამაშებული სამუშაო გარემოში - სტრუქტურა, პოზა და ნეიტრალური შუქი ყოველდღიურ ობიექტებზე.",
    },
    creativeIdea: {
      en: "Contrast couture posture with mundane setting; let the tailoring carry the frame.",
      ka: "დავაპირისპიროთ კუტურის პოზა ჩვეულებრივ გარემოს; სამკერვალომ ატაროს კადრი.",
    },
    productionApproach: {
      en: "Single-location shoot, natural + shaped light, minimal props.",
      ka: "ერთლოკაციური გადაღება, ბუნებრივი + ფორმირებული შუქი, მინიმალური რეკვიზიტი.",
    },
    cover: img(
      "Model in a black blazer in a stylised studio shot",
      "მოდელი შავ ბლეიზერში სტილიზებულ სტუდიურ კადრში",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "berlin-diary-editorial",
    featured: true,
    status: "published",
    order: 7,
    isVideo: false,
    verified: false,
  },
  {
    slug: "chronograph-georgia",
    title: "Chronograph Georgia",
    titleProvisional: true,
    client: "Chronograph",
    year: "2024",
    location: { en: "Studio, Tbilisi", ka: "სტუდია, თბილისი" },
    categories: ["product"],
    primaryCategory: "product",
    categoryLabel: { en: "Product", ka: "პროდუქტი" },
    services: [
      { en: "Photography", ka: "ფოტოგრაფია" },
      { en: "Set Design", ka: "დეკორის დიზაინი" },
    ],
    deliverables: [{ en: "Product images", ka: "პროდუქტის სურათები" }],
    studioRole: { en: "Photography & set design", ka: "ფოტოგრაფია და დეკორის დიზაინი" },
    summary: {
      en: "A precision-object study in warm directional light - texture, reflection and shadow used to give a small object presence.",
      ka: "ზუსტი ობიექტის ეტიუდი თბილ მიმართულ შუქზე - ტექსტურა, ანარეკლი და ჩრდილი მცირე ობიექტისთვის ყოფნის მისანიჭებლად.",
    },
    creativeIdea: {
      en: "Sculpt with light: one warm source, deliberate shadow, no clutter.",
      ka: "ვქანდაკოთ შუქით: ერთი თბილი წყარო, განზრახ ჩრდილი, უსაფრთხოება ზედმეტისგან.",
    },
    productionApproach: {
      en: "Macro-friendly tabletop, controlled reflections, tethered capture.",
      ka: "მაკროსთვის მოსახერხებელი მაგიდა, კონტროლირებული ანარეკლები, მიბმული გადაღება.",
    },
    cover: img(
      "Object in textured glass under warm directional light",
      "ობიექტი ტექსტურირებულ მინაში თბილ მიმართულ შუქზე",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "bal-dafrique-still-life",
    featured: true,
    status: "published",
    order: 8,
    isVideo: false,
    verified: false,
  },
  {
    slug: "glass-study-interiors",
    title: "Glass Study - Interiors",
    titleProvisional: true,
    client: "Interiors",
    year: "2025",
    location: { en: "Tbilisi, Georgia", ka: "თბილისი, საქართველო" },
    categories: ["campaigns"],
    primaryCategory: "campaigns",
    categoryLabel: { en: "Campaigns", ka: "კამპანიები" },
    services: [
      { en: "Photography", ka: "ფოტოგრაფია" },
      { en: "Production Design", ka: "პროდაქშენ დიზაინი" },
    ],
    deliverables: [{ en: "Campaign images", ka: "კამპანიის სურათები" }],
    studioRole: { en: "Photography & production design", ka: "ფოტოგრაფია და პროდაქშენ დიზაინი" },
    summary: {
      en: "An interior object campaign built on colour blocking - furniture as subject, staged against a considered coloured environment.",
      ka: "ინტერიერის ობიექტის კამპანია ფერის ბლოკინგზე - ავეჯი როგორც სუბიექტი, გათამაშებული გააზრებულ ფერად გარემოზე.",
    },
    creativeIdea: {
      en: "Treat furniture like sculpture: colour, plane and light before styling.",
      ka: "ავეჯი მოვეპყროთ როგორც ქანდაკებას: ფერი, სიბრტყე და შუქი სტილინგამდე.",
    },
    productionApproach: {
      en: "Built colour set, controlled light, composition-first framing.",
      ka: "აგებული ფერადი დეკორი, კონტროლირებული შუქი, კომპოზიციაზე ორიენტირებული კადრირება.",
    },
    cover: img(
      "Green velvet chair in a striped coloured interior",
      "მწვანე ხავერდის სავარძელი ზოლიან ფერად ინტერიერში",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "florida-hospitality",
    featured: false,
    status: "published",
    order: 9,
    isVideo: false,
    verified: false,
  },
  {
    slug: "florida-hospitality",
    title: "Florida - Hospitality",
    titleProvisional: true,
    client: "Florida",
    year: "2024",
    location: { en: "Batumi, Georgia", ka: "ბათუმი, საქართველო" },
    categories: ["campaigns"],
    primaryCategory: "campaigns",
    categoryLabel: { en: "Campaigns", ka: "კამპანიები" },
    services: [
      { en: "Photography", ka: "ფოტოგრაფია" },
      { en: "Creative Direction", ka: "კრეატიული მიმართულება" },
    ],
    deliverables: [{ en: "Campaign images", ka: "კამპანიის სურათები" }],
    studioRole: {
      en: "Photography & creative direction",
      ka: "ფოტოგრაფია და კრეატიული მიმართულება",
    },
    summary: {
      en: "A hospitality identity shot around architecture and colour - facade, texture and light as the brand's visual signature.",
      ka: "სასტუმრო იდენტობა, გადაღებული არქიტექტურასა და ფერზე - ფასადი, ტექსტურა და შუქი როგორც ბრენდის ვიზუალური ხელწერა.",
    },
    creativeIdea: {
      en: "Let the building be the hero; colour and geometry over people.",
      ka: "შენობა იყოს გმირი; ფერი და გეომეტრია ადამიანებზე მაღლა.",
    },
    productionApproach: {
      en: "Golden-hour architecture capture, minimal talent, colour-led grade.",
      ka: "ოქროს საათის არქიტექტურის გადაღება, მინიმალური მოდელი, ფერზე აგებული გრეიდი.",
    },
    cover: img(
      "Building facade with red and blue mosaic tiling",
      "შენობის ფასადი წითელი და ლურჯი მოზაიკის ფილებით",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "glass-study-interiors",
    featured: false,
    status: "published",
    order: 10,
    isVideo: false,
    verified: false,
  },
  {
    slug: "pure-royal-fragrance",
    title: "Pure Royal - Fragrance",
    titleProvisional: true,
    client: "Pure Royal",
    year: "2025",
    location: { en: "Studio, Tbilisi", ka: "სტუდია, თბილისი" },
    categories: ["product"],
    primaryCategory: "product",
    categoryLabel: { en: "Product", ka: "პროდუქტი" },
    services: [
      { en: "Photography", ka: "ფოტოგრაფია" },
      { en: "Set Design", ka: "დეკორის დიზაინი" },
    ],
    deliverables: [{ en: "Product images", ka: "პროდუქტის სურათები" }],
    studioRole: { en: "Photography & set design", ka: "ფოტოგრაფია და დეკორის დიზაინი" },
    summary: {
      en: "A fragrance product study on a vivid colour field - bold, graphic and unapologetically saturated.",
      ka: "სუნამოს პროდუქტის ეტიუდი ცოცხალ ფერად ველზე - თამამი, გრაფიკული და უკომპრომისოდ გაჯერებული.",
    },
    creativeIdea: {
      en: "One colour, one object, maximum confidence.",
      ka: "ერთი ფერი, ერთი ობიექტი, მაქსიმალური თავდაჯერება.",
    },
    productionApproach: {
      en: "Seamless colour backdrop, hard light, tethered product capture.",
      ka: "უწყვეტი ფერადი ფონი, მკვეთრი შუქი, მიბმული პროდუქტის გადაღება.",
    },
    cover: img(
      "Fragrance bottle on a vivid orange background",
      "სუნამოს ბოთლი ცოცხალ ნარინჯისფერ ფონზე",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "bal-dafrique-still-life",
    featured: false,
    status: "published",
    order: 11,
    isVideo: false,
    verified: false,
  },
  {
    slug: "berlin-diary-editorial",
    title: "Berlin Diary - Editorial",
    titleProvisional: true,
    client: "Editorial",
    year: "2024",
    location: { en: "Berlin, Germany", ka: "ბერლინი, გერმანია" },
    categories: ["fashion"],
    primaryCategory: "fashion",
    categoryLabel: { en: "Fashion", ka: "მოდა" },
    services: [{ en: "Photography", ka: "ფოტოგრაფია" }],
    deliverables: [{ en: "Editorial images", ka: "რედაქციული სურათები" }],
    studioRole: { en: "Photography", ka: "ფოტოგრაფია" },
    summary: {
      en: "A travel editorial documented as a diary - location portraits between architecture and daylight.",
      ka: "სამოგზაურო რედაქცია, დაფიქსირებული დღიურად - ლოკაციის პორტრეტები არქიტექტურასა და დღის შუქს შორის.",
    },
    creativeIdea: {
      en: "Portraits as postcards: place, posture and available light.",
      ka: "პორტრეტები ღია ბარათებად: ადგილი, პოზა და არსებული შუქი.",
    },
    productionApproach: {
      en: "Run-and-gun location portraiture, minimal crew, natural light.",
      ka: "სწრაფი ლოკაციური პორტრეტი, მინიმალური ჯგუფი, ბუნებრივი შუქი.",
    },
    cover: img(
      "Fashion model posed in a Berlin studio setting",
      "მოდის მოდელი ბერლინის სტუდიურ გარემოში",
    ),
    gallery: [],
    bts: [],
    credits: [
      { role: { en: "Photography", ka: "ფოტოგრაფია" }, name: "Name Surname", provisional: true },
    ],
    relatedSlug: "office-series-editorial",
    featured: false,
    status: "published",
    order: 12,
    isVideo: false,
    verified: false,
  },
];

// ---- Selectors (single source of truth for homepage + work) -----------------

export const projectsSorted = (): Project[] => [...PROJECTS].sort((a, b) => a.order - b.order);

export const featuredProjects = (): Project[] => projectsSorted().filter((p) => p.featured);

export const getProject = (slug: string): Project | undefined =>
  PROJECTS.find((p) => p.slug === slug);

export const projectsByCategory = (category: string): Project[] => {
  if (category === "all") return projectsSorted();
  return projectsSorted().filter((p) => p.categories.includes(category as never));
};

export const projectSlugs = (): string[] => PROJECTS.map((p) => p.slug);
