const GRADIENTS = [
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-red-500",
  "from-violet-400 to-purple-500",
  "from-sky-400 to-blue-500",
  "from-pink-400 to-fuchsia-500",
];

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-base",
} as const;

/** Initials on a gradient picked from the user id, so the same person always gets the same colour. */
export default function Avatar({
  name,
  id,
  size = "md",
}: {
  name: string;
  id: number;
  size?: keyof typeof SIZES;
}) {
  // Only words that start with a letter or digit count, so "Priya (demo)" gives "P", not "P(".
  const initials =
    name
      .split(/\s+/)
      .filter((word) => /^[\p{L}\p{N}]/u.test(word))
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ${GRADIENTS[id % GRADIENTS.length]} ${SIZES[size]}`}
    >
      {initials}
    </span>
  );
}
