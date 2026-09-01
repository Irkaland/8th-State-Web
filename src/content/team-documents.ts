/**
 * THE STUDIO'S OWN LONG-FORM DOCUMENTS, AS CONTENT.
 *
 * A biography and an artist statement are prose. The studio supplied each one
 * as a PDF, but a PDF is a fixed sheet: it cannot reflow on a phone, it cannot
 * be read by a screen reader reliably, it cannot be searched by the site, and
 * it costs megabytes. So the PDFs are treated as the VISUAL AND CONTENT
 * REFERENCE they are - the text below is theirs, verbatim, and the art
 * direction below records what each sheet actually looks like.
 *
 * VERBATIM IS THE RULE. Every paragraph here was extracted from the supplied
 * document and is reproduced in full. Nothing is summarised, rewritten,
 * reordered or trimmed. The only editorial act is the one the source itself
 * performs: paragraph breaks. Where the source has a typographic quirk - a
 * missing dash before a subordinate clause, a double space - it is preserved,
 * because correcting an author's statement is not this file's job.
 *
 * A DESIGN, NOT A TEMPLATE. Each document names its own `design`, and the
 * viewer draws that design. Bekassio's sheets are a burnt-orange field with a
 * heavy condensed wordmark and his black sun low on the page; Mariam's are warm
 * paper with a pale wash and a bold grotesque title. They must not converge:
 * the whole point is that each reads as the document it came from.
 */

/** Which art direction the sheet is drawn in. */
export type TeamDocumentDesign = "bekassio" | "mariam";

export type TeamDocument = {
  id: string;
  design: TeamDocumentDesign;
  /**
   * The wordmark above the title, when the source prints one. Bekassio's sheets
   * do ("BEKASSIO"); Mariam's carry their title alone.
   */
  wordmark?: string;
  /** the document's own heading, as the source prints it */
  title: string;
  /** the accessible name for the dialog - person plus document */
  label: string;
  /** the source's paragraphs, verbatim and complete */
  body: string[];
  /** the black sun low on the page, as Bekassio's artist statement prints it */
  mark?: "sun";
};

/* ------------------------------------------------------------- bekassio --- */

/** Source: "Bekassio Bio English.pdf" (1 page). */
const BEKA_BIOGRAPHY: TeamDocument = {
  id: "beka-biography",
  design: "bekassio",
  wordmark: "BEKASSIO",
  title: "Short Biography",
  label: "Beka Jokharidze - Short Biography",
  body: [
    "Bekassio (Beka Jokharidze) is a self-taught Georgian photographer and multimedia artist whose practice spans photography, videography, cinematography, art direction and visual storytelling. Working professionally since 2018, he has developed a multidisciplinary approach that moves between documentary observation, portraiture, fashion, editorial imagery, commercial work and audiovisual production. His visual language is strongly shaped by travel, culture and human environments, combining documentary sensitivity with a cinematic and editorial perspective.",
    "From 2022 to 2024, he worked as Lead Photographer at Meama. In 2024, he founded AOM Fashion Brand, where he serves as Founder and Art Director. In 2026, together with artist and production designer Mariam Kandiashvili, he co-founded 8th State Production & Studio Lab, a multidisciplinary creative studio working across film, photography, visual art and audiovisual production, where he works as Creative Director.",
    "Travel plays an important role in his artistic development and photographic practice. His projects have taken him across Nepal, Berlin, India, Thailand, Barcelona, Paris and Bangkok, resulting in documentary and portrait series, street photography, fashion and editorial work. His commercial portfolio includes collaborations and campaigns for Bank of Georgia, Likani, Bolt, Volvo and Zeekr.",
    "Alongside photography, Bekassio has increasingly expanded his practice into moving image and film. He has worked as a cinematographer, production designer, costume designer and art director on music videos, experimental films and independent short films. Moving between still and moving images allows him to approach visual storytelling from different perspectives while maintaining a consistent interest in atmosphere, human presence, place and the relationship between people and their environments.",
    "His multidisciplinary practice continues to evolve beyond photography, with an increasing interest in filmmaking, directing and other forms of visual expression. For Bekassio, each medium becomes a different way of observing, interpreting and communicating his experience of the world.",
  ],
};

/**
 * Source: "Bekassio Artist Statement.pdf" (1 page).
 *
 * The source runs "surround us things that cannot truly be perceived" and
 * "around us  subtle forces" with the dash absent and a double space left in
 * its place. Both are kept: this is the author's statement, not copy to edit.
 */
const BEKA_ARTIST_STATEMENT: TeamDocument = {
  id: "beka-artist-statement",
  design: "bekassio",
  wordmark: "BEKASSIO",
  title: "Artist Statement",
  label: "Beka Jokharidze - Artist Statement",
  mark: "sun",
  body: [
    "At the center of my work is an interest in the spiritual dimension of the visible world. Through photography, I try to capture something that exists beyond physical appearance: a fragment of the human soul, the spirit of nature, and the invisible layers of presence that surround us things that cannot truly be perceived by the naked eye.",
    "I am drawn to moments in which the material and immaterial seem to overlap. A body, a landscape, a gesture, light, movement or atmosphere can suddenly reveal something that cannot be fully explained. My work is an attempt to recognize and preserve these moments.",
    "Photography was my first entrance into the world of art and the first medium through which I discovered a language for self-expression. Although it remains at the core of my practice, I do not see it as a final destination. I am interested in continuously expanding my artistic language through painting, moving image and film direction, allowing different mediums to become extensions of the same search.",
    "Rather than simply documenting reality, I use image-making as a way of searching within it. Through my practice, I explore traces of divine presence that I believe exist in people, nature and the world around us  subtle forces that are often difficult to perceive, but can sometimes be felt through an image.",
    "For me, life and art are inseparable.",
    "I try to live in the same way that I create: with love, curiosity, emotion and a celebration of life in its most immediate and intense form. I am interested in all of its layers; physical, emotional and transcendental. Constantly moving from one place to another, encountering different landscapes, cultures and people, I continue to search for this presence everywhere. Art becomes a way of experiencing the world more deeply, of remaining open to its intensity, its mystery and its continual transformation.",
  ],
};

/* --------------------------------------------------------------- mariam --- */

/** Source: "Mariam Kandiashvili Biography English.pdf" (1 page). */
const MARIAM_BIOGRAPHY: TeamDocument = {
  id: "mariam-biography",
  design: "mariam",
  title: "Mariam Kandiashvili Biography",
  label: "Mariam Kandiashvili - Biography",
  body: [
    "Mariam Kandiashvili (born 1993) is a Georgian multimedia artist and production designer working between Georgia and Europe. At the age of 12, she entered into an apprenticeship with renowned Georgian artists Tazo and Gia Khutsishvili, spending seven formative years in their studio, where she trained in classical painting, academic drawing and studied history of arts.",
    "She continued her education at the Gerrit Rietveld Academie in Amsterdam, completing the Preparatory Course in Visual Arts in 2013. In 2014, she moved to England to study Illustration at Arts University Bournemouth. After returning to Georgia in 2016, Kandiashvili expanded her artistic practice to encompass painting, illustration, mixed media, art direction, production design, and teaching.",
    "She later founded and worked from her own studio, Workroom #6, where she also taught a range of visual art disciplines. Since 2021, production design for film and television has become a significant part of her professional practice, alongside her work as an artist and designer for the Georgian Public Broadcaster. Her approach to visual storytelling moves fluidly between disciplines, translating ideas from static imagery and painting into scenography, cinematic environments, costume, and constructed visual worlds.",
    "In 2016, she wrote and illustrated her first art book, A Place For Us, a surreal visual narrative combining figurative imagery with poetic storytelling. The project marked the beginning of a growing shift in her practice toward narrative-driven work, in which image and text intertwine to explore dreamlike, emotional, and symbolic landscapes.",
    "While experienced in a wide range of media, oil painting remains her primary artistic focus and chosen form of expression. Her paintings are predominantly figurative, expressive, and surreal, drawing inspiration from literature and poetry, folklore, mythology, history, music, and cinema. Her work has been exhibited nationally and internationally, including in Spain, the Netherlands, Hungary, Italy, and Germany, and several works are held in the permanent collections of Georgian museums.",
    "In 2025, Kandiashvili moved to Valencia, Spain, to continue her studies at Barreira Arte + Diseño. In 2026, she graduated from the school's Master's program in Art Direction, further developing her practice in production design, scenography, visual research, and cinematic world-building.",
    "In 2026, Kandiashvili also co-founded 8th State Production, an internationally oriented multidisciplinary production company, together with photographer and art director Beka Jokharidze. Bringing together photography, film, production design, scenography, visual identity, and other forms of image-making, the company reflects her broader interest in collaborative and cross-disciplinary visual production.",
    "Kandiashvili currently works on a range of independent, artistic, and commercial projects between Georgia, Europe and South America, continuing to develop a practice situated at the intersection of fine art, cinema, design, and visual storytelling.",
  ],
};

/** Source: "Mariam Kandiashvili Artist Statement.pdf" (1 page). */
const MARIAM_ARTIST_STATEMENT: TeamDocument = {
  id: "mariam-artist-statement",
  design: "mariam",
  title: "Mariam Kandiashvili Artist Statement",
  label: "Mariam Kandiashvili - Artist Statement",
  body: [
    "For me, art is more than a practice: it is proof of existence, of spirit, and of the divine. Every painting, every line, every image is a testament to our ability to perceive, sense, and create beyond the material.",
    "I believe the true purpose of art is to inspire, to awaken a creative impulse in another artist or sensitive human being. Art cannot be approached through logic alone. It emerged from sacred ritual, and for me, it continues to carry that ancestral essence. It lives beyond words or explanation; it is meant to be felt, not dissected.",
    "In my work, I follow impulses; expressive energy, intuition, and the constant flow of information that shapes how I see the world. My subject matter evolves in response to this influx. Through the artworks I create, I aim to honour the very sources of my inspiration; for me, each piece is a gesture of gratitude toward the individuals, experiences, or elements that moved me to create.",
    "Human beings are my central subject and interest. I explore the complexity of emotion, the psyche, and human experience through figurative forms, combining surrealism and expressionism to reveal inner landscapes. Character exploration—encountering them in real life, sensing their presence, or creating and animating them through visual narrative is at the core of my practice. Through symbolism, narrative, and visual storytelling, I aim to capture the invisible forces that shape our lives: the spiritual, the psychological, and the emotional. Literature, poetry, folklore, and music are constant guides in my artistic journey, leading me toward worlds where reality and imagination intertwine.",
    "I work across multiple media; from oil painting and illustration to mixed media and production design - but every piece is rooted in the pursuit of authenticity and connection. For me, art is not an aesthetic pursuit; it is a ritual, a way to confront the mystery of human existence, and a means of offering hope and understanding to a world that needs it.",
  ],
};

/* ------------------------------------------------------------- register --- */

export const TEAM_DOCUMENTS: TeamDocument[] = [
  BEKA_BIOGRAPHY,
  BEKA_ARTIST_STATEMENT,
  MARIAM_BIOGRAPHY,
  MARIAM_ARTIST_STATEMENT,
];

const BY_ID = new Map(TEAM_DOCUMENTS.map((d) => [d.id, d]));

/**
 * A document by id.
 *
 * Throws rather than returning undefined: an id in team.ts that names no
 * document is a content error, and it should fail the build that introduces it
 * instead of quietly rendering an empty sheet in production. The contract test
 * covers the same ground.
 */
export function teamDocument(id: string): TeamDocument {
  const doc = BY_ID.get(id);
  if (!doc) throw new Error(`team-documents: no document with id "${id}"`);
  return doc;
}
