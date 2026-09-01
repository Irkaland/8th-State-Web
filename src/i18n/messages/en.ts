// English messages - source of truth for the message shape (see ka.ts for Georgian).
import { getNotFoundMessages } from "../not-found-messages";

const en = {
  meta: {
    defaultTitle: "8th State Production - Visual Production Studio, Tbilisi",
    titleTemplate: "%s - 8th State Production",
    description:
      "Independent visual production studio in Tbilisi. Photography, film, creative direction and production design for brands, culture and people.",
  },
  nav: {
    work: "Work",
    services: "Services",
    studio: "Studio",
    process: "Process",
    georgiaProduction: "Georgia Production",
    contact: "Contact",
    startProject: "Start a Project",
    menu: "Menu",
    primary: "Primary",
  },
  common: {
    contactStudio: "Contact the Studio",
    tbilisi: "Tbilisi, Georgia",
    clearFilter: "Clear filter",
    skipToContent: "Skip to content",
    switchToGeorgian: "Switch to Georgian",
    switchToEnglish: "Switch to English",
    instagram: "Instagram",
    // the mark inside an image slot the studio has not supplied a master for.
    // One string for the whole site: the waiting state is the same editorial
    // gesture wherever it appears, and TEAM's own "Portrait pending" is the
    // pattern it follows.
    imagePending: "Image pending",
  },
  home: {
    hero: {
      headline: "From visual concept to final frame.",
      sub: "Photography, film, creative direction and production design for brands, culture and people.",
    },
    positioning: {
      statement:
        "We build carefully constructed visual worlds through photography, film, creative direction and production design.",
    },
    selectedWork: {
      index: "01",
      title: "Selected Work",
      note: "Curated - not the Instagram feed",
    },
    featured: {
      labels: {
        client: "Client",
        type: "Type",
        services: "Services",
        deliverables: "Deliverables",
        location: "Location",
      },
    },
    services: {
      index: "02",
      title: "Services",
    },
    capabilities: {
      index: "03",
      title: "Capabilities",
    },
    pathways: {
      index: "04",
      title: "Who we work with",
    },
    process: {
      index: "05",
      title: "How we work",
    },
    georgia: {
      title: "Production Partner in Georgia",
      desc: "Locations, crew, casting, coordination, transport, permits, set design and local production management - planned and executed from Tbilisi.",
    },
    partnerships: {
      badge: "In development",
      title: "Creative Partnerships",
      desc: "Beyond standalone production, we collaborate with selected creative specialists to connect brand thinking, campaign direction and visual execution.",
      cta: "Discuss a Creative Partnership",
    },
    finalCta: {
      title: "Have a project in mind?",
      desc: "Share the brief, timeline and production needs. We will review the project and recommend the right next step.",
    },
  },
  footer: {
    blurb:
      "Visual production studio creating photography, film and campaign imagery through creative direction and production design.",
    menu: "Menu",
    contact: "Contact",
    privacy: "Privacy",
    credits: "Credits",
    copyright: "© 2026 8th State Production",
  },
  work: {
    title: "Campaigns, editorials and productions - curated, not imported.",
    description:
      "A selection of commissioned and self-initiated work across photography, film, creative direction and production design.",
    filterLabel: "Filter work by category",
    empty: {
      title: "Nothing in this category yet.",
      desc: "New work is added as campaigns are released. Meanwhile, browse everything or ask for a private selection.",
      viewAll: "View All Work",
    },
  },
  caseStudy: {
    labels: {
      creativeIdea: "Creative idea",
      productionApproach: "Production approach",
      studioRole: "Studio role",
      services: "Services",
      deliverables: "Deliverables",
      usage: "Usage",
      credits: "Credits",
      client: "Client",
      location: "Location",
      year: "Year",
    },
    demoNote:
      "Editorial demo content. Project names, credits and imagery are placeholders pending studio confirmation.",
  },
  georgia: {
    title: "Shoot in Georgia with a local production partner.",
    intro:
      "8th State plans and executes productions from Tbilisi - locations, crew, casting, logistics and set construction - so visiting teams arrive to a production that is already running.",
    ctaDesc:
      "Send the brief and dates - we will come back with feasibility, a production approach and an estimate. A credentials overview is available on request.",
    honestNote:
      "No confirmed permits, partnerships or response times are claimed on this page. Permit coordination does not constitute a legal guarantee.",
  },
  brief: {
    title: "Start a Project",
    intro: "Tell us about the project. Five short steps - your progress is saved on this device.",
    steps: {
      contact: "Contact",
      project: "Project",
      production: "Production details",
      deliverables: "Deliverables",
    },
    headings: {
      contact: "Who are we talking to?",
      project: "What are we making?",
      production: "When and where?",
      deliverables: "What do you need in hand?",
    },
    fields: {
      email: "Email",
      phone: "Phone",
      description: "Short project description",
      audience: "Intended audience",
      references: "Reference links",
      location: "Estimated location",
      deliverables: "Deliverables",
      channels: "Intended channels",
    },
    hints: {
      optional: "(optional)",
      filesNote:
        "Demo only - files are listed locally and are not uploaded anywhere. Max 25 MB each.",
    },
    shootType: {
      studio: "Studio",
      location: "Location",
      both: "Both / not sure",
    },
    budget: {
      undefined: "Not Defined Yet",
    },
    buttons: {
      back: "Back",
      submit: "Submit Project Brief",
    },
    review: {
      contact: "Contact",
      project: "Project",
      production: "Production",
      deliverables: "Deliverables",
      consent:
        "I agree to the processing of my personal data for the purpose of responding to this request.",
    },
    validation: {
      email: "Enter a complete email address, e.g. name@company.com",
    },
    submitting: {
      title: "Sending your brief…",
      note: "Preparing a demo confirmation.",
    },
    success: {
      title: "Brief received.",
      desc: "Thank you - we will review the project and come back with the recommended next step and any questions.",
      demoNote:
        "This is a demo submission - your brief was not sent to a server. Nothing was stored or emailed.",
    },
    draft: {},
  },
  privacy: {
    title: "Privacy",
    body: [
      "This is a demonstration website for 8th State Production. It does not operate a production backend, database, CRM or email delivery. The Start a Project form simulates submission entirely in your browser: nothing you enter is transmitted to, stored on, or processed by any server.",
      "Any draft of the project brief is saved only in your browser's local storage on this device, with an expiry, so you can return to it. It never leaves your device and is cleared automatically after a successful demo submission or when it expires.",
      "Selected files are listed by name and size only for a realistic preview - their contents are never read or uploaded.",
      "Before this site goes to production, a complete privacy policy covering real data processing, lawful basis, retention and contact details will replace this notice.",
    ],
  },
  credits: {
    title: "Credits",
    intro:
      "Design and engineering credits for this demonstration build. Studio credits per project are recorded with each case study and remain provisional pending confirmation.",
    sections: {
      type: "Typography",
    },
    designBody:
      "Art direction and UI adapted from the approved 8th State Production wireframe and UI mockup.",
    buildBody:
      "High-fidelity interactive demo built with Next.js, React and TypeScript. Form submission is simulated; no production infrastructure is included in this phase.",
    imageryBody:
      "No photography ships in this phase. Every image position is an empty editorial slot held at its final size and place, ready for 8th State studio masters; the demo imagery that previously stood in for them has been removed.",
  },
  // "One Continuous Take" - approved Digital Art Object homepage (Direction 01).
  dao: {
    ident: {
      act: "Studio Ident",
      city: "Tbilisi, Georgia",
      title: "8TH STATE",
      sub: "PRODUCTION",
      skip: "Skip intro",
    },
    reel: {
      act: "Master Showreel",
      play: "Play reel",
      pause: "Pause reel",
      // §16: the meta strip carries studio authorship, not technical specs
      authored: "An 8th State Production",
      title: "Master Showreel - 2026",
      pending: "Showreel in production - final master pending",
    },
    intro: {
      act: "The Studio",
      statement:
        "A multidisciplinary production company and creative studio dedicated to visual storytelling, art direction, design, education and experimental artistic practice.",
      // §22: the same sentence, split at its own clause boundaries. Joined with
      // a single space it IS `statement` - tests/unit/text-motion.test.ts.
      statementGroups: [
        "A multidisciplinary production company and creative studio",
        "dedicated to visual storytelling, art direction, design,",
        "education and experimental artistic practice.",
      ],
      cta: "The Studio",
      chipPhotography: "Photography",
      chipLab: "Studio Lab",
      chipFilm: "Film & Video",
    },
    work: {
      act: "Selected Work",
      title: "Selected Work",
      caseStudy: "Case Study",
      role: "Role",
      client: "Client",
      year: "Year",
      all: "All Work",
      prev: "Previous project",
      next: "Next project",
      counterLabel: "Project counter",
      goTo: "Go to project",
    },
    services: {
      act: "What We Make",
      title: "What We Make",
      intro:
        "Nine capabilities, four kinds of work. Groups describe kinds of work, not a required order - scope is determined per project.",
      all: "All Services",
      // the production dossier (approved What We Make design)
      dossier: "Production dossier",
      departments: "Five departments · One production line",
      lede: "Five departments under one roof - a production can enter at any of them and move through the rest without leaving the studio.",
      plate: "PL.",
      chain: ["Production", "Design", "Image", "Direction", "Graphics"],
    },
    lab: {
      act: "Another room in the same house",
      title: "Studio Lab",
      titleLine1: "Studio",
      titleLine2: "Lab",
      city: "Tbilisi, Georgia",
      copy: "Education, research, workshops and artistic development - the experimental branch of 8th State, where process is the subject.",
      cta: "Enter the Lab",
      index: ["Field notes", "Archive", "Research", "Workshops", "Experiments", "Education"],
    },
    contact: {
      act: "Final Scene",
      title1: "START A",
      title2: "PRODUCTION",
      note: "Tell us what you are making. We respond within a stated timeframe with a first conversation, not a quote.",
      email: "Email",
      emailTbd: "contact address - TBD",
      studio: "Studio",
      studioValue: "Tbilisi, Georgia",
      follow: "Follow",
      followTbd: "channels - TBD",
      enquiry: "Enquiry",
      name: "Name",
      emailField: "Email",
      what: "What are you making?",
      send: "Send",
      sendPending: "Enquiries open soon - the form is not yet connected.",
    },
    credits: {
      endWord: "End of Reel",
      endOfReel: "8th State Production - End of Reel",
      work: "Work",
      services: "Services",
      studio: "Studio",
      lab: "Studio Lab",
      legal: "Legal",
    },
    nav: {
      open: "Open menu",
      close: "Close menu",
      work: "WORK",
      services: "SERVICES",
      studio: "STUDIO",
      lab: "STUDIO LAB",
      contact: "CONTACT",
      process: "PROCESS",
      georgia: "GEORGIA PRODUCTION",
      start: "START A PROJECT",
      workKa: "ნამუშევრები",
      servicesKa: "სერვისები",
      studioKa: "სტუდია",
      labKa: "სტუდიო ლაბი",
      contactKa: "კონტაქტი",
      processKa: "პროცესი",
      georgiaKa: "პროდაქშენი საქართველოში",
      startKa: "დაიწყე პროექტი",
      catFilm: "Film & Video",
      catPhoto: "Photography",
      catSpatial: "Production & Spatial Design",
      catLab: "Studio Lab Work",
      catArchive: "Archive",
      expandWork: "Toggle work categories",
    },
  },
  notFound: {
    code: "404",
    title: "This frame doesn't exist.",
    desc: "The page you are looking for may have moved or is not part of this demo.",
    home: "Back to home",
    work: "Explore Selected Work",
  },
  // v6 route system - turns 3-4 of the approved handoff.
  daoRoutes: {
    contentRequired: "Content required",
    work: {
      archive: "Production archive",
      projectsShown: "{count} projects",
      all: "All",
      caseStudy: "Case Study",
      end: "End of archive - {count} projects shown",
      startProduction: "Start a Production",
      // shown when the archive was entered through a Services "Related Work"
      // link, so the visitor can see why only some projects are listed
      showing: "Showing",
      clearFilter: "Show the full archive",
      emptyTitle: "Nothing in this room yet.",
      emptyDesc:
        "New work is added as productions are published. Meanwhile, browse the full archive.",
      viewAll: "View the full archive",
    },
    project: {
      archive: "Archive",
      caseStudy: "Case Study",
      client: "Client",
      year: "Year",
      location: "Location",
      discipline: "Discipline",
      role: "Role",
      credits: "CREDITS",
      production: "Production",
      next: "Next",
      previous: "Previous",
      // §05: the archive is finite - the last entry says so and offers the way out
      endOfArchive: "End of archive",
      viewAllWork: "View all work",
      positionLabel: "Project {n} of {total}",
      contactSheet: "Contact sheet - process / BTS",
      usage: "Usage",
    },
    services: {
      end: "End of catalogue - scope is determined per project",
      relatedWork: "Related Work",
      workedExample: "Worked example",
      thinking: "The thinking layer",
      madeWorld: "The made-world layer",
      capture: "The capture layer",
      completion: "The completion layer",
      postDesc:
        "Sixteen confirmed sub-capabilities - more internal depth than any other service - offered standalone, including on footage shot by others. Motion graphics and VFX are offered at a basic level.",
    },
    studio: {
      whoWeAre: "Who we are",
      operatingScope: "Operating scope",
      oneInstitution: "One institution - two rooms",
      roomsText: "Nine capabilities and the Lab work as one studio.",
      capabilities: "Capabilities",
      howWeWork: "How we work",
      labLines: "Education,\nresearch,\nexperiment",
      enterLab: "Enter the Lab",
      make: "Make something with us",
      startProduction: "Start a Production",
      // §19: the Studio route into the people who run the productions.
      // Editorial, not an HR label.
      thePeople: "The people behind 8th State",
      meetTheTeam: "Meet the team",
      slateProd: "Prod.",
      slateScene: "Scene",
      slateLoc: "Loc.",
      slateSceneValue: "The people",
    },
    team: {
      kicker: "Studio → The people",
      mastLabel: "Personnel sheet",
      // the studio stamp that closes a personnel file
      city: "Tbilisi, Georgia",
      // §09: the ONE polite announcement on this route - nothing else is spoken
      personnelSwap: "{name} - {n} of {total}",
      closing: "This is the crew a production gets.",
      startProject: "Start a project",
      title: "The People Behind The Work",
      titleLine1: "The people",
      titleLine2: "behind the work",
      intro:
        "Not a directory. The crew that actually carries a production - who holds the brief, who lights it, who builds the set, who cuts it - listed the way a contact sheet lists frames.",
      // stated above the roster while no person is confirmed, so the number of
      // seats can never be read as a headcount claim
      provisionalRoster:
        "Roster pending confirmation. The seats below are placeholders - names, roles, portraits and credits are added once the studio confirms them.",
      namePending: "Name pending",
      rolePending: "Role pending",
      portraitPending: "Portrait pending",
      viewProfile: "View profile",
      about: "About",
      contact: "Contact",
      links: "Professional links",
      viewPortfolio: "View portfolio",
      viewLinkedin: "LinkedIn profile",
      resume: "Resume",
      // The document controls. `biography` is the section heading below, reused
      // deliberately - one word, one string. There is no resume language menu
      // any more: one English CV, one click.
      artistStatement: "Artist Statement",
      resumeCannotDisplay: "This browser cannot display the document inline.",
      resumeOpenInTab: "Open the file",
      backToSheet: "Back to the sheet",
      personnel: "Personnel",
      selectedFrame: "Selected frame",
      profileIndex: "Profile / Personnel",
      opensExternal: "opens an external site in a new tab",
      selectedWorkNote: "8th State projects this person is credited on.",
      profilePending:
        "Profile content pending. This seat is reserved - the statement, biography, practice and credits publish once the studio confirms them.",
      profile: "Profile",
      close: "Close",
      previous: "Previous",
      nextPerson: "Next person",
      biography: "Biography",
      practice: "Practice / expertise",
      experience: "Experience",
      credits: "Filmography / credits",
      clients: "Selected clients",
      awards: "Awards",
      education: "Education",
      languages: "Languages",
      basedIn: "Based in",
      selectedWork: "Selected work",
      portfolio: "Portfolio",
      email: "Email",
      // shown until approved people content exists
      pendingTitle: "Team profiles are being prepared.",
      pendingDesc:
        "The studio is assembling the credits properly - names, roles and the work each person carried. Until that is confirmed, the archive itself is the honest record of who does what.",
      pendingCta: "See the work",
      roleLabel: "Role",
      countLabel: "{count} in the studio",
    },
    lab: {
      // §01 hero
      mastheadLeft: "Studio Lab - 8th State",
      mastheadMid: "The experimental room of 8th State",
      city: "Tbilisi, Georgia",
      titleLine1: "Studio",
      titleLine2: "Lab",
      copy: "Education, research, workshops and artistic development - the experimental branch of 8th State, where process is the subject.",
      beginRegistration: "Begin registration",
      viewProgram: "View the program",
      heroIndex: ["Education", "Research", "Workshops", "Experiments", "Field notes", "Archive"],
      // §02 the lab
      s02Label: "The Lab",
      s02Context: "Another room in the same house",
      s02Statement:
        "Education, research, workshops and artistic development - where process is the subject and outcomes are allowed to be questions.",
      s02Annotation1: "process",
      s02Annotation2: "before",
      s02Annotation3: "product",
      roomCaption: "Fig. 01 - The room",
      roomMeta: "Tbilisi",
      roomPending: "Studio Lab working space - photo TBD",
      s02Keywords: [
        "Learning",
        "Observation",
        "Experimentation",
        "Visual research",
        "Creative practice",
        "Discussion",
        "Process",
        "Artistic development",
      ],
      // §03 disciplines
      s03Label: "Disciplines",
      s03Context: "Three directions, one room",
      // §04 current program
      s04Label: "Current program",
      s04Context: "First program · Registration by application",
      programTitle: "The Program",
      colNo: "No",
      colCourse: "Course",
      colLecturer: "Lecturer",
      colFormat: "Format",
      register: "Register",
      programFootnote: "Duration · Schedule · Price - published per course on its sheet",
      // §05 featured course
      s05Label: "Course sheet · 01",
      s05Context: "Photography",
      featuredCaption: "PL. 01 - Working material",
      featuredMeta: "35mm · TBD",
      featuredPending: "Photography course - key image TBD",
      openSheet: "Open the course sheet",
      lecturerLabel: "Lecturer",
      formatLabel: "Format",
      disciplineLabel: "Discipline",
      // §06 portfolio
      s06Label: "Course sheet · 03",
      s06Context: "Art · Portfolio",
      lecturerSuffix: "- lecturer",
      portfolioAnnotation: "before → process → final",
      // §07 cinema
      s07Label: "Course sheet · 04",
      s07Context: "Film · Online only",
      onlineOnly: "Online only",
      // §08 the wider lab
      s08Label: "Beyond the courses",
      s08Context: "Notebook, not portfolio",
      widerTitle: "The Wider Lab",
      // §09 lecturers
      s09Label: "Lecturers",
      s09Context: "Faculty index",
      bioPending: "Biography - to be provided by the studio.",
      // §10 registration
      s10Label: "Registration",
      s10Context: "One course per application",
      registerTitle: "Register",
      registerCopy:
        "Choose a course and open the registration sheet. The Lab reads every application and responds personally.",
      // §11 footer
      index: ["Field notes", "Archive", "Research", "Workshops", "Experiments", "Education"],
      footerMark: "8th State Production - Studio Lab",
      backToSite: "Back to 8th State",
      // course sheet
      backToLab: "Studio Lab",
      courseSheet: "Course sheet",
      whoLabel: "A - Who it is for",
      learnLabel: "B - What you will learn",
      programLabel: "C - Full program",
      practicalLabel: "D - Practical sheet",
      practicalContext: "Published before each intake",
      coursePending: "Course key image or video still - TBD",
      courseCaption: "PL. 01 - Course material",
      registerForCourse: "Register for this course",
      courseRegisterCopy:
        "One course per application. The sheet asks for your details, experience level and goal - the Lab responds personally.",
      allCourses: "All courses",
    },
    process: {
      kicker: "How we work - production choreography",
      intro: "Nine confirmed stages, arranged per project - kinds of work, never a required order.",
      callSheet: "Call sheet",
      inPractice: "In practice",
      practiceText:
        "Every production assembles its own sequence from these stages. See how that looked on real work.",
      caseStudies: "Case Studies",
      startProject: "Start a Project",
    },
    georgia: {
      kicker: "Production partner in Georgia",
      fileLabel: "File - Georgia Production",
      coords: "41°41'36.1\"N 44°48'05.2\"E",
      city: "Tbilisi, Georgia",
      tz: "GMT+4",
      locationPlates: "Location Plates",
      platesMeta: "Field guide - 03 plates",
      plate: "Plate",
      productionSupport: "Production Support",
      supportMeta: "Scope of local support - 08 items",
      fieldNote: "Field Note",
      bring: "Bring a production to Georgia",
      startProject: "Start a Project",
    },
    contact: {
      kicker: "The final scene",
      quickNote: "Quick note",
      message: "Message",
      sendNote: "Send note",
      briefCta: "Start a Project Brief",
    },
    brief: {
      kicker: "A production brief - not a form",
      title: "Start a project",
      intro:
        "Four short sheets. Answer what you can - everything is optional except how to reach you.",
      progress: "Brief progress",
      q1: "What are we making?",
      chipFilm: "Film & Video",
      chipPhoto: "Photography",
      chipSpatial: "Production & Spatial Design",
      chipPost: "Post-Production",
      chipLab: "Studio Lab",
      chipUnsure: "Not sure yet",
      q2: "Tell us about it",
      q2Placeholder: "The idea, the audience, anything written so far…",
      q3: "Timing & place",
      when: "When",
      whenPlaceholder: "Dates if you have them - flexible is fine",
      where: "Where",
      wherePlaceholder: "Georgia, elsewhere, or undecided",
      q4: "How do we reach you?",
      name: "Name",
      email: "Email",
      send: "Send the brief",
      errorSummary: "Please add a name and a valid email so we can reach you.",
      justTalk: "Just want to talk first?",
      contactStudio: "Contact the Studio",
    },
    legal: {
      privacy: "Privacy Policy",
      cookies: "Cookies",
      copyright: "Copyright",
      accessibility: "Accessibility",
      lastUpdated: "Last updated",
      onThisPage: "On this page",
      footerLine: "8th State Production - Tbilisi",
      pending:
        "This document is being prepared. Its confirmed text will replace this notice before publication.",
      pendingHeading: "Document in preparation",
    },
    // single source of truth lives in i18n/not-found-messages.ts - the 404
    // route is a client component and must not import this full dictionary
    notFound: getNotFoundMessages("en"),
  },
};

export default en;
export type Messages = typeof en;
