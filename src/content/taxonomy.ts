import type { Category } from "./types";

// Work filter categories (single-select). "all" is the reset state and is handled in the UI.
export const CATEGORIES: Category[] = [
  { id: "campaigns", label: { en: "Campaigns", ka: "კამპანიები" } },
  { id: "product", label: { en: "Product", ka: "პროდუქტი" } },
  { id: "fashion", label: { en: "Fashion", ka: "მოდა" } },
  { id: "food-lifestyle", label: { en: "Food & Lifestyle", ka: "საკვები და ცხოვრების სტილი" } },
  { id: "film-culture", label: { en: "Film & Culture", ka: "ფილმი და კულტურა" } },
];

export const ALL_LABEL = { en: "All", ka: "ყველა" };
