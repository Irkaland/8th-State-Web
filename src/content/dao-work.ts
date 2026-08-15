import type { LocalizedText } from "./types";
import type { Project } from "./types";

// v6 Work archive: the four approved discipline groups are the only /work
// filter states (handoff 3a/3b). Existing projects are grouped by their real
// service lists - a presentation mapping, no content invented.

export type DaoDiscipline = "film-video" | "photography" | "production-spatial" | "studio-lab";

export const DAO_DISCIPLINES: { id: DaoDiscipline; n: string; label: LocalizedText }[] = [
  { id: "film-video", n: "01", label: { en: "Film & Video", ka: "ფილმი და ვიდეო" } },
  { id: "photography", n: "02", label: { en: "Photography", ka: "ფოტოგრაფია" } },
  {
    id: "production-spatial",
    n: "03",
    label: { en: "Production & Spatial Design", ka: "პროდაქშენი და სივრცითი დიზაინი" },
  },
  { id: "studio-lab", n: "04", label: { en: "Studio Lab Work", ka: "სტუდიო ლაბის ნამუშევრები" } },
];

export function disciplineOf(p: Project): DaoDiscipline {
  const services = p.services.map((s) => s.en.toLowerCase()).join(" · ");
  if (/film|video/.test(services) || p.categories.includes("film-culture" as never)) {
    return "film-video";
  }
  if (/photograph/.test(services)) return "photography";
  return "production-spatial";
}

export function disciplineLabel(id: DaoDiscipline): LocalizedText {
  return DAO_DISCIPLINES.find((d) => d.id === id)!.label;
}

export function isDiscipline(v: string): v is DaoDiscipline {
  return DAO_DISCIPLINES.some((d) => d.id === v);
}
