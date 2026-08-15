import type { Service } from "./types";

export const SERVICES: Service[] = [
  {
    n: "01",
    name: { en: "Photography", ka: "ფოტოგრაფია" },
    items: [
      { en: "Commercial campaigns", ka: "კომერციული კამპანიები" },
      { en: "Product photography", ka: "პროდუქტის ფოტოგრაფია" },
      { en: "Fashion & editorial", ka: "მოდა და რედაქციული" },
      { en: "Food & beverage", ka: "საკვები და სასმელი" },
      { en: "Portrait & lifestyle", ka: "პორტრეტი და ცხოვრების სტილი" },
      { en: "Cultural documentation", ka: "კულტურული დოკუმენტაცია" },
    ],
  },
  {
    n: "02",
    name: { en: "Film & Motion", ka: "ფილმი და მოძრაობა" },
    items: [
      { en: "Brand films & commercials", ka: "ბრენდის ფილმები და რეკლამები" },
      { en: "Short-form social video", ka: "მოკლე სოციალური ვიდეო" },
      { en: "Music videos", ka: "მუსიკალური ვიდეოები" },
      { en: "Motion & editing", ka: "მოძრაობა და მონტაჟი" },
    ],
  },
  {
    n: "03",
    name: { en: "Creative Direction", ka: "კრეატიული მიმართულება" },
    items: [
      { en: "Visual concept", ka: "ვიზუალური კონცეფცია" },
      { en: "Moodboards & references", ka: "მუდბორდები და რეფერენსები" },
      { en: "Art direction", ka: "არტ მიმართულება" },
      { en: "Campaign direction", ka: "კამპანიის მიმართულება" },
    ],
  },
  {
    n: "04",
    name: { en: "Production Design", ka: "პროდაქშენ დიზაინი" },
    items: [
      { en: "Scenography", ka: "სცენოგრაფია" },
      { en: "Set construction", ka: "დეკორის აწყობა" },
      { en: "Props & environments", ka: "რეკვიზიტი და გარემო" },
      { en: "Costume & styling direction", ka: "კოსტიუმი და სტილის მიმართულება" },
    ],
  },
  {
    n: "05",
    name: { en: "Production Support", ka: "პროდაქშენ მხარდაჭერა" },
    items: [
      { en: "Local production in Georgia", ka: "ადგილობრივი პროდაქშენი საქართველოში" },
      { en: "Locations & permits", ka: "ლოკაციები და ნებართვები" },
      { en: "Crew & casting", ka: "ჯგუფი და კასტინგი" },
      { en: "Coordination & logistics", ka: "კოორდინაცია და ლოგისტიკა" },
    ],
  },
];
