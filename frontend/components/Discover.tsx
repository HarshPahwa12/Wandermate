"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import type { Category, Plan } from "@/lib/types";
import PlanCard from "./PlanCard";
import PlansMap from "./PlansMap";

interface Coords {
  lat: number;
  lng: number;
}

const RADII = [3, 5, 10, 25, 50];
const DATE_FILTERS = [
  { value: "any", label: "Anytime" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
] as const;
type DateFilter = (typeof DATE_FILTERS)[number]["value"];

const SORTS = [
  { value: "soonest", label: "Soonest" },
  { value: "closest", label: "Closest" },
  { value: "spots", label: "Most spots left" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

function dateRangeFor(filter: DateFilter): { from?: string; to?: string } {
  if (filter === "any") return {};
  const now = new Date();
  if (filter === "today") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { from: now.toISOString(), to: end.toISOString() };
  }
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from: now.toISOString(), to: end.toISOString() };
}

export default function Discover() {
  const { token, ready } = useAuth();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(true);
  const [radiusKm, setRadiusKm] = useState(10);
  const [category, setCategory] = useState<Category | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");
  const [sort, setSort] = useState<Sort>("soonest");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  // Below lg the list and the map are separate tabs; from lg up both are always visible.
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    if (!navigator.geolocation) {
      Promise.resolve().then(() => setLocating(false));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (locating || !ready) return;
    const params = new URLSearchParams();
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
      params.set("radiusKm", String(radiusKm));
    }
    if (category) params.set("category", category);
    if (debouncedQuery) params.set("q", debouncedQuery);
    const { from, to } = dateRangeFor(dateFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    let cancelled = false;
    api<Plan[]>(`/plans?${params}`, { token })
      .then((data) => {
        if (cancelled) return;
        setPlans(data);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [locating, ready, token, coords, radiusKm, category, debouncedQuery, dateFilter]);

  // Memoised so the map only rebuilds its pins when the list really changes, not on every hover.
  const sorted = useMemo(
    () =>
      plans
        ? [...plans].sort((a, b) => {
            if (sort === "spots") return b.spotsLeft - a.spotsLeft;
            if (sort === "closest") return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
            return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
          })
        : null,
    [plans, sort],
  );

  // Hovering a pin brings its card into view in the list.
  useEffect(() => {
    if (activeId == null) return;
    document.getElementById(`plan-card-${activeId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  const title = coords ? "Plans near you" : "Discover plans";
  const subtitle = coords
    ? "Casual, low-pressure plans from people close by."
    : locating
      ? "Finding your location…"
      : "Location is off, so you're seeing everything. Allow location to see what's nearby.";

  return (
    <div className="lg:grid lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(26rem,44%)_1fr]">
      {/* Left: filters + list */}
      <section className={`min-h-0 flex-col lg:flex lg:border-r lg:border-line ${view === "map" ? "hidden" : "flex"}`}>
        <div className="shrink-0 space-y-3 px-4 pb-3 pt-5 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-0.5 text-sm text-black/60 dark:text-white/60">{subtitle}</p>
            </div>
            {sorted && (
              <span className="shrink-0 rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-brand-ink">
                {sorted.length} {sorted.length === 1 ? "plan" : "plans"}
              </span>
            )}
          </div>

          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
              🔍
            </span>
            <input
              className="input !pl-10"
              placeholder="Search by title, area, or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 [scrollbar-width:none]">
            <button onClick={() => setCategory(null)} className={`chip ${category === null ? "chip-active" : ""}`}>
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`chip ${category === c.value ? "chip-active" : ""}`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {DATE_FILTERS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDateFilter(d.value)}
                className={`chip ${dateFilter === d.value ? "chip-active" : ""}`}
              >
                {d.label}
              </button>
            ))}

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="chip cursor-pointer"
              aria-label="Sort by"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value} className="text-black">
                  Sort: {s.label}
                </option>
              ))}
            </select>

            {coords && (
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="chip ml-auto cursor-pointer"
                aria-label="Search radius"
              >
                {RADII.map((r) => (
                  <option key={r} value={r} className="text-black">
                    within {r} km
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 px-4 pb-24 pt-2 sm:px-6 lg:overflow-y-auto lg:pb-8">
          {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

          {!error && sorted === null && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="skeleton h-64 !rounded-[1.25rem]" />
              ))}
            </div>
          )}

          {sorted?.length === 0 && (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <div className="text-5xl">🔭</div>
              <h2 className="mt-3 text-lg font-semibold">Nothing here yet</h2>
              <p className="mt-1 max-w-xs text-sm text-black/60 dark:text-white/60">
                Try widening your search or clearing a filter. Or be the first to start something.
              </p>
              <Link href="/plans/new" className="btn mt-5 text-sm">
                + Post a plan
              </Link>
            </div>
          )}

          {sorted && sorted.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {sorted.map((p, i) => (
                <div key={p.id} className="animate-drift-in" style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}>
                  <PlanCard plan={p} active={activeId === p.id} onHover={(on) => setActiveId(on ? p.id : null)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Right: map */}
      <section
        className={`relative h-[calc(100dvh-4rem)] lg:block lg:h-full ${view === "list" ? "hidden" : "block"}`}
        aria-label="Map of plans"
      >
        {sorted === null ? (
          <div className="skeleton h-full w-full !rounded-none" />
        ) : sorted.length === 0 && !coords ? (
          // Nothing to anchor a map to, so say so instead of showing an arbitrary city.
          <div className="grid h-full place-items-center bg-surface-muted p-8 text-center">
            <div>
              <div className="text-5xl">🗺️</div>
              <p className="mt-3 font-semibold">No locations to show yet</p>
              <p className="mt-1 max-w-xs text-sm text-black/60 dark:text-white/60">
                The map appears once there are plans to show, or when you allow your location.
              </p>
            </div>
          </div>
        ) : (
          <PlansMap plans={sorted} activeId={activeId} onActive={setActiveId} me={coords} />
        )}
      </section>

      {/* Mobile List / Map switch */}
      <div className="fixed inset-x-0 bottom-5 z-[1000] flex justify-center lg:hidden">
        <div className="card flex gap-1 p-1 shadow-lg">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${view === v ? "brand-gradient text-white" : ""}`}
            >
              {v === "list" ? "📋 List" : "🗺️ Map"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
