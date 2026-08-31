import type { LocalizedText } from "./types";
import type { CapabilityId } from "./dao-services";
import { WHAT_WE_MAKE, type ServiceAnchor, type TopLevelService } from "./what-we-make";

/**
 * THE SERVICES DOSSIER - the five departments, in full.
 *
 * WHERE THIS SITS
 * ---------------
 * `what-we-make.ts` is the PREVIEW: the five departments as the homepage prints
 * them. This file is the DESTINATION: the same five, opened out into the
 * complete file. It joins to the preview by id rather than restating it, so the
 * name a reader sees on the homepage and the name at the top of the chapter are
 * the same string and cannot drift apart. The plates are shared for the same
 * reason.
 *
 * `dao-services.ts` remains the canonical CAPABILITY taxonomy, and is not
 * replaced. A capability is a discipline a project is credited with; a
 * department is a file a production is commissioned from. Each chapter records
 * which capabilities it absorbs (`absorbs`), which is what keeps every
 * previously published `/services#<capability>` link resolving after the
 * redesign - see ServicesDossier.
 *
 * GEORGIAN
 * --------
 * The approved design is written in English. Where the studio already has its
 * own Georgian for something - the five department names, the plate captions -
 * that Georgian is reused, so this page speaks with the same voice as the rest
 * of the site. The copy the redesign introduces has no Georgian source, and
 * inventing it would put machine-translated production vocabulary in front of
 * clients. Those strings are marked with `pending()` and render their English
 * in both locales until a translator supplies the Georgian. Every one of them
 * is greppable by that call, and they are listed in the handover.
 */

/** Copy that has no Georgian yet. Renders English in both locales, on purpose. */
const pending = (en: string): LocalizedText => ({ en, ka: en });

export type CapabilityGroup = {
  /** the group's printed title */
  title: LocalizedText;
  /** the short register key printed against it, in the accent */
  key: string;
  /** the run of disciplines, separated by the studio's middot */
  items: LocalizedText;
};

/** which surface a chapter is printed on - the approved colour rhythm */
export type DeptSurface = "blue" | "paper" | "ink";

export type Department = {
  /** printed index, and the oversized cropped chapter numeral */
  n: string;
  /** THE canonical anchor. Never renamed - the homepage links here. */
  anchor: ServiceAnchor;
  /** joined from the preview, so both surfaces print one name */
  service: TopLevelService;
  /** the folio's shortened label */
  short: LocalizedText;
  /** the register's right-hand descriptor */
  tag: LocalizedText;
  /** the file line in the chapter masthead */
  file: LocalizedText;
  surface: DeptSurface;
  /** the chapter's accent, from the approved palette */
  accent: string;
  /** the register swatch and its numeral colour */
  registerColor: string;
  swatch: string;
  desc: LocalizedText;
  /** printed against CAPABILITY REGISTER */
  groupCount: LocalizedText;
  groups: CapabilityGroup[];
  /** WORKS WITH - internal, to other chapters of this same page */
  worksWith: ServiceAnchor[];
  /**
   * The capability anchors this chapter absorbs.
   *
   * Every `/services#<capability>` URL the site has already published - a
   * project's discipline link, a shared link, a bookmark - continues to land on
   * the chapter that now covers that discipline. This introduces no new
   * taxonomy and no alternative name for the five canonical service ids; it
   * only stops existing links breaking.
   */
  absorbs: CapabilityId[];
  /**
   * The capability this department's Related Work filters on, or null.
   *
   * A CAPABILITY, not one of the four broad disciplines - that is the archive's
   * own answer to "which service does this project demonstrate", and
   * work-filters.ts says so explicitly: four broad categories cannot express
   * Scenography or Post-Production. 05 has no capability in the canonical
   * taxonomy, so it has nothing to filter on and carries no link.
   *
   * Whether the link is actually DRAWN is decided at render against the
   * archive - see ServicesDossier - so a capability with nothing credited to it
   * yet never sends a reader to an empty page.
   */
  relatedWork: CapabilityId | null;
  /** the image-led evidence strip - Photography only, per the approved design */
  gallery?: { src: string; alt: LocalizedText }[];
};

const byId = (id: string): TopLevelService => {
  const s = WHAT_WE_MAKE.find((x) => x.id === id);
  if (!s) throw new Error(`services-departments: no preview service "${id}"`);
  return s;
};

const g = (title: string, key: string, items: string): CapabilityGroup => ({
  title: pending(title),
  key,
  items: pending(items),
});

/** the approved palette, named where it is used */
const PAPER = "#f2ede3";
const INK = "#131210";
const BLUE = "#2374b3";
const RED = "#d03e26";
const ORANGE = "#f0ab11";
const YELLOW = "#fff9ab";

export const DEPARTMENTS: Department[] = [
  {
    n: "01",
    anchor: "audiovisual-production",
    service: byId("audiovisual-production"),
    short: pending("AUDIOVISUAL"),
    tag: pending("DEVELOPMENT → DELIVERY"),
    file: pending("FILE 01 - FULL SERVICE"),
    surface: "blue",
    accent: YELLOW,
    registerColor: BLUE,
    swatch: BLUE,
    desc: pending(
      "Full-service audiovisual production - development and planning through shooting, post-production and final delivery. The broadest department: it can carry a commercial, film, documentary, music or television project end to end, or supply any single stage.",
    ),
    groupCount: pending("12 GROUPS - FULLY INDEXED"),
    groups: [
      g(
        "CREATIVE DEVELOPMENT",
        "DEV",
        "Project & concept development · Treatments · Visual treatment · Script support & breakdown · Creative / visual / reference research · Moodboards · Presentations · Format, content & story development · Production strategy · Consultation",
      ),
      g(
        "PRE-PRODUCTION",
        "PREP",
        "Planning · Budgeting & cost estimation · Scheduling & calendars · Breakdown · Crew planning · Department coordination · Technical & shooting plans · Call sheets · Risk assessment · Logistics · Vendor & supplier coordination",
      ),
      g(
        "PRODUCING",
        "PROD",
        "Executive · Creative · Line · Production management & coordination · Local & field producing · Supervision · Consulting · Co-production support · Administration",
      ),
      g(
        "DIRECTING & CREATIVE TEAM",
        "TEAM",
        "Directors · Creative directors · Art directors · DoPs · Photographers · Choreographers & movement · Stylists · Production & costume designers · HMU artists · Editors · Sound designers",
      ),
      g(
        "CASTING",
        "CAST",
        "Actors · Models · Presenters & hosts · Extras · Street, character & child casting · Specialized talent · Performers, musicians, dancers · Auditions & self-tapes · Talent coordination",
      ),
      g(
        "LOCATIONS",
        "LOC",
        "Research & scouting · Location photography · Presentations · Management & negotiation · Permits · Technical surveys · Recce coordination · Preparation & restoration · Unit-base planning",
      ),
      g(
        "CREW & CAMERA",
        "CRW",
        "All departments - production, direction, camera, lighting, grip, sound, art, costume, HMU, styling, locations, transport · DoP, operators, ACs, DIT, video assist · Steadicam, gimbal, drone, specialty camera & lenses",
      ),
      g(
        "LIGHTING · GRIP · SOUND",
        "L/G/S",
        "Gaffer, best boy, electricians · Key grip & grip crew · Rigging, generators, power · Specialty lighting · Sound mixer, boom, location sound, dialogue, playback, wireless",
      ),
      g(
        "ART DEPARTMENT ON SET",
        "ART",
        "Production design · Set design & construction · Scenography · Decoration & set dressing · Props & graphic props · Costume · HMU · Scenic painting - connects to Dept. 02",
      ),
      g(
        "SHOOTING & ON-SET SERVICES",
        "SHOOT",
        "Equipment · Transportation & logistics · Permits & administration · Catering & on-set services · Production of commercials, film, documentary, news, music, TV & digital, fashion, events, photography",
      ),
      g(
        "POST-PRODUCTION",
        "POST",
        "Editing · Color · Sound · Motion graphics & titles · VFX coordination · Compositing, cleanup, retouching · Subtitles & captioning · Versioning",
      ),
      g(
        "MUSIC · AUDIO · DELIVERY",
        "OUT",
        "Music & audio · Localization · Deliverables in all formats",
      ),
    ],
    worksWith: ["production-design", "graphic-broadcast-design"],
    absorbs: ["film-video-production", "post-production"],
    relatedWork: "film-video-production",
  },
  {
    n: "02",
    anchor: "production-design",
    service: byId("production-design"),
    short: pending("PROD. DESIGN"),
    tag: pending("WORLD · SPACE · OBJECT · CHARACTER"),
    file: pending("FILE 02 - WORLD · SPACE · OBJECT · CHARACTER · ATMOSPHERE"),
    surface: "paper",
    accent: ORANGE,
    registerColor: ORANGE,
    swatch: PAPER,
    desc: pending(
      "The department that builds worlds - from visual research and concept art to standing sets, decorated locations, props, costume and character. It works as the art department inside an 8th State production or as an independent design commission.",
    ),
    groupCount: pending("9 GROUPS"),
    groups: [
      g(
        "PRODUCTION DESIGN",
        "WORLD",
        "Production design · Art direction · Visual research · World building · Color development · Visual language · Design bibles",
      ),
      g(
        "CONCEPT ART",
        "CONCEPT",
        "Environment & set concepts · Character concepts · Storyboards · Visual development · Illustration · Previsualization",
      ),
      g(
        "SET DESIGN",
        "SPACE",
        "Set design · Scenography · Interior & exterior sets · Location transformation · Spatial planning · Set layout",
      ),
      g(
        "DECORATION & AMBIENTATION",
        "ATMOS",
        "Set & interior decoration · Period & contemporary ambientation · Furniture, objects, textiles, artwork · Location & period dressing · Material sourcing · Final set dressing · Atmosphere & detail",
      ),
      g(
        "SET CONSTRUCTION",
        "BUILD",
        "Scenic construction · Painting & surface treatments · Custom structures · Decorative elements · Temporary installations",
      ),
      g(
        "PROPS",
        "OBJECT",
        "Prop design & construction · Hero props · Graphic & printed props · Period props · Sourcing · Styling",
      ),
      g(
        "CHARACTER DESIGN",
        "CHAR",
        "Character visual development · Costume, makeup & hair concepts · Moodboards · Color palettes · Silhouette development",
      ),
      g(
        "COSTUME",
        "COST",
        "Costume design & styling · Sourcing · Tailoring & construction · Accessories · Coordination",
      ),
      g(
        "HAIR & MAKEUP",
        "HMU",
        "Hair & makeup design · Character & creative makeup · Period styling · Coordination",
      ),
    ],
    worksWith: ["audiovisual-production", "photography"],
    absorbs: ["production-design", "scenography", "costume-design", "decoration"],
    relatedWork: "production-design",
  },
  {
    n: "03",
    anchor: "photography",
    service: byId("photography"),
    short: pending("PHOTOGRAPHY"),
    tag: pending("COMMISSION → PRINT"),
    file: pending("FILE 03 - COMMISSION TO PRINT"),
    surface: "paper",
    accent: BLUE,
    registerColor: BLUE,
    swatch: PAPER,
    desc: pending(
      "A complete photography service - commercial, fashion, portrait, product, architecture, music, documentary and art photography - with its own creative services, production and post. Sellable as a single shoot or a full campaign.",
    ),
    groupCount: pending("9 GROUPS"),
    groups: [
      g(
        "COMMERCIAL",
        "ADV",
        "Advertising & campaign · Branded photography · Product campaigns · Lifestyle · Corporate",
      ),
      g(
        "FASHION & BEAUTY",
        "FASH",
        "Fashion & editorial · Beauty · Lookbooks · Designer campaigns · Model portfolios",
      ),
      g(
        "PORTRAIT",
        "PORT",
        "Artists, musicians, actors · Editorial & corporate portraiture · Environmental portraits",
      ),
      g(
        "PRODUCT & STILL LIFE",
        "STILL",
        "Product · Still life · Packaging · Beauty product · Food & beverage · Objects · E-commerce",
      ),
      g(
        "ARCHITECTURE & INTERIORS",
        "ARCH",
        "Architecture · Interiors · Sets · Hospitality · Cultural & exhibition spaces",
      ),
      g(
        "MUSIC · CULTURE · DOCUMENT",
        "DOC",
        "Album photography · Artist campaigns · Music press · Concert & performance · Documentary · Art photography · Unit & BTS",
      ),
      g(
        "CREATIVE SERVICES",
        "CRE",
        "Creative & art direction · Concept development · Moodboards · Set design & props · Casting · Locations · Costume, styling, HMU",
      ),
      g(
        "PHOTO PRODUCTION",
        "PROD",
        "Production management · Crew · Studio & equipment · Lighting · Locations · Casting · Travel & logistics · Catering · Shoot coordination",
      ),
      g(
        "POST-PRODUCTION",
        "POST",
        "Selection & editing · Color · Retouching · Compositing & cleanup · Print preparation · Digital delivery",
      ),
    ],
    worksWith: ["creative-direction", "production-design"],
    absorbs: ["photography"],
    relatedWork: "photography",
    // the approved image-led breathing point: one selected frame and two frames
    // from the sheet beside it
    gallery: [
      { src: "/media/berlin-editorial.jpg", alt: pending("Editorial photograph, selected frame") },
      { src: "/media/bts-set.jpg", alt: pending("Behind the scenes on set") },
      { src: "/media/pure-royal.jpg", alt: pending("Campaign photograph") },
    ],
  },
  {
    n: "04",
    anchor: "creative-direction",
    service: byId("creative-art-direction"),
    short: pending("DIRECTION"),
    tag: pending("UPSTREAM OF EVERYTHING"),
    file: pending("FILE 04 - UPSTREAM OF EVERYTHING"),
    surface: "ink",
    accent: RED,
    registerColor: INK,
    swatch: INK,
    desc: pending(
      "The strategic department. It defines what the work becomes before execution begins - concept, campaign, visual language, research - then directs photography, film, fashion, music and graphic work through the other four departments.",
    ),
    groupCount: pending("6 GROUPS"),
    groups: [
      g(
        "CREATIVE DIRECTION",
        "CD",
        "Creative direction · Concept development · Campaign & brand concepts · Creative strategy · Visual storytelling · Narrative development · Creative & cultural research · Treatments",
      ),
      g(
        "ART DIRECTION",
        "AD",
        "Visual & image direction · Visual language · Color & composition · Typography direction · Styling direction · Photography & film direction · Graphic direction",
      ),
      g(
        "CAMPAIGN DEVELOPMENT",
        "CAMP",
        "Advertising, brand, fashion, music & cultural campaigns · Product launches · Seasonal & social concepts · Integrated campaign direction",
      ),
      g(
        "BRAND WORLDS",
        "WORLD",
        "Brand world development · Visual universe & atmosphere · Visual codes · Image, color, material, graphic, photography & motion language",
      ),
      g(
        "VISUAL RESEARCH",
        "RES",
        "Art-historical & cultural research · Film, photography, fashion & design references · Archive research · Moodboards · Reference libraries · Research books",
      ),
      g(
        "DIRECTION BY FIELD",
        "FIELD",
        "Photography art direction · Film & commercial · Music & artist · Fashion & editorial · Cultural & artistic direction",
      ),
    ],
    worksWith: ["photography", "graphic-broadcast-design"],
    absorbs: ["creative-direction", "art-direction"],
    relatedWork: "creative-direction",
  },
  {
    n: "05",
    anchor: "graphic-broadcast-design",
    service: byId("graphic-broadcast-design"),
    short: pending("GRAPHICS"),
    tag: pending("SYSTEMS · IMAGE · TYPE · MOTION"),
    file: pending("FILE 05 - SYSTEMS · IMAGE · TYPE · MOTION"),
    surface: "paper",
    accent: RED,
    registerColor: RED,
    swatch: PAPER,
    desc: pending(
      "Identity systems, printed matter, film graphics and on-air design - the department where systems, image, typography and movement work together, from a logo system to a complete broadcast package.",
    ),
    groupCount: pending("10 GROUPS"),
    groups: [
      g(
        "BRAND IDENTITY",
        "ID",
        "Visual identity & systems · Logo design & systems · Typography · Color systems · Graphic language · Guidelines · Applications · Toolkits",
      ),
      g(
        "GRAPHIC DESIGN",
        "GFX",
        "Key visuals · Campaign graphics · Posters, flyers, invitations · Print & digital · Social graphics · Presentation & event design",
      ),
      g(
        "PACKAGING",
        "PACK",
        "Packaging concepts & identity · Labels, boxes, bags, wrapping · Food & beverage · Cosmetics · Limited editions · Illustration · Print-ready artwork",
      ),
      g(
        "EDITORIAL DESIGN",
        "EDIT",
        "Books · Magazines · Catalogues & lookbooks · Artist books · Brochures & reports · Editorial layout · Cover design",
      ),
      g(
        "FILM & ENTERTAINMENT",
        "FILM",
        "Film & series posters · Key art · Title design · Opening & end titles · Credits · Character posters · Festival & campaign assets",
      ),
      g(
        "BROADCAST DESIGN",
        "AIR",
        "Channel & program identity · On-air identity · Idents, bumpers, stings · Openers & closers · Lower thirds, info bars, bugs · Transitions & templates · News, sports, entertainment & event graphics",
      ),
      g(
        "MOTION GRAPHICS",
        "MOT",
        "Motion design · Animated typography · Logo & title animation · Animated idents · Broadcast packages · Explainers · Social motion · Motion toolkits",
      ),
      g(
        "SCREEN & INTERFACE",
        "SCRN",
        "Fictional screens · Film & TV interfaces · Phone & computer screens · Broadcast & data screens · Maps · Infographics",
      ),
      g("SOCIAL & DIGITAL", "DIGI", "Social & digital design systems"),
      g("ILLUSTRATION & PRINT", "PRNT", "Illustration · Print production"),
    ],
    worksWith: ["creative-direction", "audiovisual-production"],
    absorbs: [],
    relatedWork: null,
  },
];

/** The chapter a published `/services#<capability>` link now belongs to. */
export const CAPABILITY_HOME = new Map<CapabilityId, ServiceAnchor>(
  DEPARTMENTS.flatMap((d) => d.absorbs.map((c) => [c, d.anchor] as const)),
);

/** ONE PRODUCTION LINE - the approved routes, printed as written. */
export const SYSTEM_ROUTES: { key: LocalizedText; path: LocalizedText }[] = [
  {
    key: pending("COMMERCIAL"),
    path: pending("04 DIRECTION → 01 PRODUCTION → 02 DESIGN → SHOOT → POST → 05 CAMPAIGN ASSETS"),
  },
  { key: pending("CAMPAIGN"), path: pending("04 DIRECTION → 03 PHOTOGRAPHY → 05 GRAPHIC SYSTEM") },
  {
    key: pending("FILM"),
    path: pending("01 PRODUCTION → 02 PRODUCTION DESIGN → SHOOT → POST → 05 TITLES & KEY ART"),
  },
  {
    key: pending("BRAND"),
    path: pending("05 IDENTITY → 04 BRAND WORLD → 03 PHOTOGRAPHY LANGUAGE"),
  },
];

export const SERVICES_COPY = {
  eyebrow: pending("SERVICES"),
  system: pending("FIVE DEPARTMENTS · ONE PRODUCTION SYSTEM"),
  dossier: pending("DEPARTMENT DOSSIER · COMPLETE FILE"),
  title: pending("SERVICES"),
  intro: pending(
    "Five departments. One production system. 8th State can lead the complete process from development to delivery - or join a project through a single discipline.",
  ),
  statement: pending("A PROJECT MAY ENTER AT ANY DEPARTMENT AND MOVE THROUGH THE REST."),
  registerTitle: pending("DEPARTMENT REGISTER"),
  registerContents: pending("CONTENTS - 01-05"),
  capabilityRegister: pending("CAPABILITY REGISTER"),
  worksWith: pending("WORKS WITH"),
  relatedWork: pending("VIEW RELATED WORK"),
  mapTitle: pending("ONE PRODUCTION LINE - TYPICAL ROUTES THROUGH THE SYSTEM"),
  mapNote: pending(
    "A project can enter through any department. Direction can hand to photography, photography to graphics, design to the shoot - without leaving the studio.",
  ),
  closing: pending(
    "One brief. Five departments. A single production line from first idea to final delivery.",
  ),
  cta: pending("START A PROJECT"),
  contactSheet: pending("CONTACT SHEET"),
  selectedFrame: pending("FR. 12 - SELECTED"),
  departments: pending("Departments"),
} as const;
