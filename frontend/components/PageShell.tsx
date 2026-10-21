import type { ReactNode } from "react";

const WIDTHS = {
  /** Auth screens. */
  narrow: "max-w-md",
  /** Forms and text-heavy pages. */
  content: "max-w-3xl",
  /** Dashboards and grids: fills big screens up to a sensible limit. */
  wide: "max-w-7xl",
} as const;

/** Per-page width + gutters. The layout itself is full width so pages like the home split can go edge to edge. */
export default function PageShell({
  size = "wide",
  className = "",
  children,
}: {
  size?: keyof typeof WIDTHS;
  className?: string;
  children: ReactNode;
}) {
  return <div className={`mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 ${WIDTHS[size]} ${className}`}>{children}</div>;
}
