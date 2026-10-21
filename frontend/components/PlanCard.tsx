import Link from "next/link";
import { categoryOf } from "@/lib/categories";
import type { Plan } from "@/lib/types";
import Avatar from "./Avatar";

export function isPast(iso: string) {
  return new Date(iso).getTime() <= Date.now();
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface Props {
  plan: Plan;
  /** Highlighted because its pin (or the card itself) is hovered. */
  active?: boolean;
  onHover?: (hovering: boolean) => void;
}

export default function PlanCard({ plan, active = false, onHover }: Props) {
  const cat = categoryOf(plan.category);
  const full = plan.spotsLeft === 0;
  const taken = plan.capacity - plan.spotsLeft;
  const fill = plan.capacity > 0 ? Math.round((taken / plan.capacity) * 100) : 0;

  return (
    <Link
      id={`plan-card-${plan.id}`}
      href={`/plans/${plan.id}`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      className={`card card-hover group block overflow-hidden ${active ? "is-active" : ""}`}
    >
      <div className={`relative h-20 bg-gradient-to-br ${cat.band}`}>
        <span className="absolute -bottom-6 left-4 grid h-12 w-12 place-items-center rounded-2xl bg-surface text-2xl shadow-md ring-1 ring-line transition group-hover:scale-110">
          {cat.emoji}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/25 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
          {cat.label}
        </span>
      </div>

      <div className="p-4 pt-8">
        <h2 className="line-clamp-2 font-semibold leading-snug">{plan.title}</h2>
        <p className="mt-1.5 text-sm text-black/65 dark:text-white/65">🕒 {formatWhen(plan.startsAt)}</p>
        <p className="mt-0.5 truncate text-sm text-black/65 dark:text-white/65">
          📍 {plan.placeName}
          {!plan.locationExact && <span className="text-black/40 dark:text-white/40"> · approx.</span>}
          {plan.distanceKm !== null && ` · ${plan.distanceKm.toFixed(1)} km`}
        </p>

        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
            <div
              className={`h-full rounded-full ${full ? "bg-black/30 dark:bg-white/30" : "brand-gradient"}`}
              style={{ width: `${Math.max(fill, taken > 0 ? 8 : 0)}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-medium text-black/55 dark:text-white/55">
            {full ? "Full" : `${plan.spotsLeft} of ${plan.capacity} spot${plan.capacity === 1 ? "" : "s"} left`}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-black/55 dark:text-white/55">
          <Avatar name={plan.host.displayName} id={plan.host.id} size="sm" />
          <span className="truncate">Hosted by {plan.host.displayName}</span>
        </div>
      </div>
    </Link>
  );
}
