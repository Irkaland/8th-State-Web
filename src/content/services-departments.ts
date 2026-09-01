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
  /**
   * The studio's shortened department label.
   *
   * Printed by the production-line routes, where a route spelled out in full
   * department names buries the route it is trying to show.
   */
  short: LocalizedText;
  /**
   * The register's right-hand descriptor - a CAPABILITY run, and only that.
   *
   * ONE information logic across all five rows, so the column can be read as
   * a column: `DEPARTMENT NAME ---- WHAT IT IS COMMISSIONED FOR`. The earlier
   * set described three different things in five rows - a process
   * (`DEVELOPMENT -> DELIVERY`), a capability run, and a positioning statement
   * (`UPSTREAM OF EVERYTHING`) - so the relationship between the two columns
   * changed from row to row.
   */
  tag: LocalizedText;
  /** the file line in the chapter masthead */
  file: LocalizedText;
  surface: DeptSurface;
  /** the chapter's accent, from the approved palette */
  accent: string;
  /**
   * This department's accent as re-picked for the RED register ground, or
   * absent when its own accent already reads there.
   *
   * The register's numeral and square take `service.accent` - the colour the
   * homepage already prints this department in - so a department carries one
   * identity across the site. This field is the single documented exception,
   * and it exists for the same reason `DAO_SERVICE_GROUPS.onBlue` does: an
   * accent chosen for one brand ground can be unreadable on another, and the
   * fix is to re-pick within the same colour family rather than to abandon
   * the department's identity.
   *
   * Only 02 needs it. Gold measures 2.40:1 on #d03e26 - it sinks into the red
   * at register size - so it steps to `--dao-gold-lift`, which is gold's own
   * hue lightened until it reads (3.32:1). See the token in dao.css for the
   * derivation. Nothing else on the site changes: the homepage keeps gold,
   * where it was chosen against the blue ground and measures fine.
   */
  onRed?: string;
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
const BLUE = "#2374b3";
const RED = "#d03e26";
const ORANGE = "#f0ab11";
/* --dao-gold-lift: gold's own hue, lightened to read on the brand red */
const GOLD_LIFT = "#ffd16b";
const YELLOW = "#fff9ab";

export const DEPARTMENTS: Department[] = [
  {
    n: "01",
    anchor: "audiovisual-production",
    service: byId("audiovisual-production"),
    short: pending("AUDIOVISUAL"),
    tag: pending("FILM · COMMERCIAL · CONTENT · POST"),
    file: pending("FILE 01 - FULL SERVICE"),
    surface: "blue",
    accent: YELLOW,
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
    // gold sinks into the register red at 2.40:1 - see `onRed` above
    onRed: GOLD_LIFT,
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
    tag: pending("CAMPAIGN · EDITORIAL · PRODUCT · PORTRAIT"),
    file: pending("FILE 03 - COMMISSION TO PRINT"),
    surface: "paper",
    accent: BLUE,
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
  },
  {
    n: "04",
    anchor: "creative-direction",
    service: byId("creative-art-direction"),
    short: pending("DIRECTION"),
    tag: pending("CONCEPT · CAMPAIGN · IMAGE · WORLD"),
    file: pending("FILE 04 - UPSTREAM OF EVERYTHING"),
    surface: "ink",
    accent: RED,
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
    tag: pending("IDENTITY · TYPE · MOTION · BROADCAST"),
    file: pending("FILE 05 - SYSTEMS · IMAGE · TYPE · MOTION"),
    surface: "paper",
    accent: RED,
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

/**
 * ONE PRODUCTION LINE - the four typical routes through the system.
 *
 * WHY A ROUTE IS A LIST OF STEPS AND NOT A STRING
 * ----------------------------------------------
 * The routes used to be printed as one run of text per route:
 *
 *   `04 DIRECTION → 01 PRODUCTION → 02 DESIGN → SHOOT → POST → 05 CAMPAIGN ASSETS`
 *
 * Which read as six things of the same kind. They are not. Four of them are
 * DEPARTMENTS - the studio's five standing files, each with a chapter on this
 * page - and two are WORKFLOW STAGES that every route passes through and no
 * department owns. Printing them in one run said the studio has a "shoot"
 * department, and it does not.
 *
 * Worse, a hand-written route could rename a department in passing: `05
 * IDENTITY`, `05 CAMPAIGN ASSETS` and `05 TITLES & KEY ART` all appeared for
 * Department 05, whose actual name is GRAPHIC & BROADCAST DESIGN. So a
 * department step here carries an ANCHOR and nothing else: the label is read
 * back out of DEPARTMENTS at render, which makes renaming a department in a
 * route impossible rather than merely discouraged.
 */
export type RouteStep =
  /** one of the five standing departments - numbered, named, and linked */
  | { kind: "dept"; anchor: ServiceAnchor }
  /** a stage of the work itself. Never numbered: it is not a sixth department. */
  | { kind: "stage"; label: LocalizedText };

export type SystemRoute = {
  /** the route's category - the four the studio publishes */
  key: LocalizedText;
  /** what the route delivers, in one line, so it reads in a couple of seconds */
  outcome: LocalizedText;
  steps: RouteStep[];
};

const dept = (anchor: ServiceAnchor): RouteStep => ({ kind: "dept", anchor });
const stage = (label: string): RouteStep => ({ kind: "stage", label: pending(label) });

export const SYSTEM_ROUTES: SystemRoute[] = [
  {
    key: pending("COMMERCIAL"),
    outcome: pending("A finished film, and the campaign that carries it."),
    steps: [
      dept("creative-direction"),
      dept("audiovisual-production"),
      dept("production-design"),
      stage("SHOOT"),
      stage("POST"),
      dept("graphic-broadcast-design"),
    ],
  },
  {
    key: pending("CAMPAIGN"),
    outcome: pending("One image language, applied across every surface."),
    steps: [dept("creative-direction"), dept("photography"), dept("graphic-broadcast-design")],
  },
  {
    key: pending("FILM"),
    outcome: pending("Long-form, from the built world to the title sequence."),
    steps: [
      dept("audiovisual-production"),
      dept("production-design"),
      stage("SHOOT"),
      stage("POST"),
      dept("graphic-broadcast-design"),
    ],
  },
  {
    key: pending("BRAND"),
    outcome: pending("An identity, and a world photographed in it."),
    steps: [dept("graphic-broadcast-design"), dept("creative-direction"), dept("photography")],
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
  /* The one thing a reader has to know before the routes make sense: a
     numbered step is a department with a chapter on this page, an unnumbered
     one is a stage of the work. Printed as a key line rather than drawn as a
     legend component - it is a caption, not a UI. */
  /* The key, as its two halves. Kept apart rather than joined into one string
     because the line has to break BETWEEN the definitions and nowhere else:
     left as one run it broke after "UNNUMBERED -", dangling a dash and
     splitting a definition across two lines. Non-breaking spaces do not fix
     that - a hyphen is a break opportunity in its own right - and the Unicode
     classes that would are engine-dependent, which is no good on a site that
     ships WebKit as well. Two halves, each set `white-space: nowrap`, is the
     answer that cannot be talked out of by a layout engine. */
  mapKeyDept: pending("NUMBERED - DEPARTMENT"),
  mapKeyStage: pending("UNNUMBERED - WORKFLOW STAGE"),
  mapRoutes: pending("Typical routes through the system"),
  mapNote: pending(
    "A project can enter through any department. Direction can hand to photography, photography to graphics, design to the shoot - without leaving the studio.",
  ),
  closing: pending(
    "One brief. Five departments. A single production line from first idea to final delivery.",
  ),
  cta: pending("START A PROJECT"),
  /* the mark inside a plate whose master has not been supplied yet. Approved
     Georgian, not pending(): it is the same line the rest of the site prints. */
  imagePending: { en: "Image pending", ka: "სურათი მოსამზადებელია" },
} as const;
