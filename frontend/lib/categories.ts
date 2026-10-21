import type { Category } from "./types";

export interface CategoryInfo {
  value: Category;
  label: string;
  emoji: string;
  /** Hex used for map pins. */
  color: string;
  /** Full class strings so Tailwind can see them: header band, soft tint and readable text. */
  band: string;
  soft: string;
  text: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    value: "WALK",
    label: "Walk",
    emoji: "🚶",
    color: "#10b981",
    band: "from-emerald-400 to-teal-500",
    soft: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    value: "COFFEE",
    label: "Coffee",
    emoji: "☕",
    color: "#d97706",
    band: "from-amber-400 to-orange-500",
    soft: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
  },
  {
    value: "FOOD",
    label: "Food",
    emoji: "🍜",
    color: "#e11d48",
    band: "from-rose-400 to-red-500",
    soft: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
  },
  {
    value: "GAMES",
    label: "Games",
    emoji: "🎲",
    color: "#7c3aed",
    band: "from-violet-400 to-purple-500",
    soft: "bg-violet-500/10",
    text: "text-violet-700 dark:text-violet-300",
  },
  {
    value: "SPORTS",
    label: "Sports",
    emoji: "🏸",
    color: "#0284c7",
    band: "from-sky-400 to-blue-500",
    soft: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
  },
  {
    value: "OTHER",
    label: "Other",
    emoji: "✨",
    color: "#db2777",
    band: "from-pink-400 to-fuchsia-500",
    soft: "bg-pink-500/10",
    text: "text-pink-700 dark:text-pink-300",
  },
];

export function categoryOf(value: Category) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}
