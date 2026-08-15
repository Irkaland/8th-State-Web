import type { LocalizedText } from "./types";

export type Option = { id: string; label: LocalizedText };

// Step 2 - Project type (single choice). ids double as ?type= deep-link values.
export const PROJECT_TYPES: Option[] = [
  { id: "commercial-campaign", label: { en: "Commercial campaign", ka: "კომერციული კამპანია" } },
  { id: "product-photography", label: { en: "Product photography", ka: "პროდუქტის ფოტოგრაფია" } },
  { id: "fashion-editorial", label: { en: "Fashion / editorial", ka: "მოდა / რედაქციული" } },
  { id: "food-beverage", label: { en: "Food & beverage", ka: "საკვები და სასმელი" } },
  {
    id: "portrait-lifestyle",
    label: { en: "Portrait / lifestyle", ka: "პორტრეტი / ცხოვრების სტილი" },
  },
  { id: "film-brand-story", label: { en: "Film / brand story", ka: "ფილმი / ბრენდის ისტორია" } },
  { id: "music-video", label: { en: "Music video", ka: "მუსიკალური ვიდეო" } },
  { id: "cultural-project", label: { en: "Cultural project", ka: "კულტურული პროექტი" } },
  {
    id: "production-support-georgia",
    label: { en: "Production support in Georgia", ka: "პროდაქშენ მხარდაჭერა საქართველოში" },
  },
  { id: "other", label: { en: "Other", ka: "სხვა" } },
];

// Step 2 - Required services (multiple).
export const REQUIRED_SERVICES: Option[] = [
  { id: "photography", label: { en: "Photography", ka: "ფოტოგრაფია" } },
  { id: "creative-direction", label: { en: "Creative direction", ka: "კრეატიული მიმართულება" } },
  { id: "film", label: { en: "Film", ka: "ფილმი" } },
  { id: "production-design", label: { en: "Production design", ka: "პროდაქშენ დიზაინი" } },
  { id: "scenography", label: { en: "Scenography", ka: "სცენოგრაფია" } },
  { id: "costume-design", label: { en: "Costume design", ka: "კოსტიუმის დიზაინი" } },
  { id: "post-production", label: { en: "Post-production", ka: "პოსტ-პროდაქშენი" } },
  {
    id: "local-production-support",
    label: { en: "Local production support", ka: "ადგილობრივი პროდაქშენ მხარდაჭერა" },
  },
  { id: "not-sure", label: { en: "Not sure yet", ka: "ჯერ არ ვიცი" } },
];

// Step 4 - Deliverables (multiple).
export const DELIVERABLES: Option[] = [
  { id: "campaign-photography", label: { en: "Campaign photography", ka: "კამპანიის ფოტოგრაფია" } },
  { id: "product-images", label: { en: "Product images", ka: "პროდუქტის სურათები" } },
  { id: "ecommerce-images", label: { en: "E-commerce images", ka: "ელკომერციის სურათები" } },
  {
    id: "short-form-social",
    label: { en: "Short-form social videos", ka: "მოკლე სოციალური ვიდეოები" },
  },
  { id: "commercial-film", label: { en: "Commercial film", ka: "კომერციული ფილმი" } },
  { id: "music-video", label: { en: "Music video", ka: "მუსიკალური ვიდეო" } },
  { id: "bts-content", label: { en: "BTS content", ka: "BTS კონტენტი" } },
  { id: "creative-concept", label: { en: "Creative concept", ka: "კრეატიული კონცეფცია" } },
  { id: "production-design", label: { en: "Production design", ka: "პროდაქშენ დიზაინი" } },
  { id: "other", label: { en: "Other", ka: "სხვა" } },
];

export const SHOOT_TYPES: Option[] = [
  { id: "studio", label: { en: "Studio", ka: "სტუდია" } },
  { id: "location", label: { en: "Location", ka: "ლოკაცია" } },
  { id: "both", label: { en: "Both / not sure", ka: "ორივე / არ ვიცი" } },
];

export const BUDGETS: Option[] = [
  { id: "small", label: { en: "Small Production", ka: "მცირე პროდაქშენი" } },
  { id: "medium", label: { en: "Medium Production", ka: "საშუალო პროდაქშენი" } },
  { id: "full", label: { en: "Full Campaign Production", ka: "სრული კამპანიის პროდაქშენი" } },
  { id: "undefined", label: { en: "Not Defined Yet", ka: "ჯერ განუსაზღვრელი" } },
];

export const PROJECT_TYPE_IDS = PROJECT_TYPES.map((o) => o.id);
export const REQUIRED_SERVICE_IDS = REQUIRED_SERVICES.map((o) => o.id);
export const DELIVERABLE_IDS = DELIVERABLES.map((o) => o.id);
export const SHOOT_TYPE_IDS = SHOOT_TYPES.map((o) => o.id);
export const BUDGET_IDS = BUDGETS.map((o) => o.id);

export function optionLabel(options: Option[], id: string): LocalizedText | undefined {
  return options.find((o) => o.id === id)?.label;
}
