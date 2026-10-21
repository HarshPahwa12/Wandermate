"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import type { Category, Plan } from "@/lib/types";
import LocationPicker from "./LocationPicker";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  mode: "create" | "edit";
  planId?: number;
  initial?: Plan;
}

/** Shared by /plans/new and /plans/[id]/edit; only how it submits differs. */
export default function PlanForm({ mode, planId, initial }: Props) {
  const router = useRouter();
  const { token, ready } = useAuth();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "COFFEE");
  const [placeName, setPlaceName] = useState(initial?.placeName ?? "");
  const [areaName, setAreaName] = useState(initial?.areaName ?? "");
  const [lat, setLat] = useState(initial ? String(initial.lat) : "");
  const [lng, setLng] = useState(initial ? String(initial.lng) : "");
  const [startsAt, setStartsAt] = useState(initial ? toLocalInput(initial.startsAt) : "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? 3);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !token) router.replace("/login");
  }, [ready, token, router]);

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLng(pos.coords.longitude.toFixed(5));
      },
      () => setError("Couldn't get your location. Enter coordinates manually."),
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      title,
      description: description || null,
      category,
      placeName,
      areaName,
      lat: Number(lat),
      lng: Number(lng),
      startsAt: new Date(startsAt).toISOString(),
      capacity,
    };
    try {
      const plan =
        mode === "create"
          ? await api<Plan>("/plans", { method: "POST", token, body })
          : await api<Plan>(`/plans/${planId}`, { method: "PUT", token, body });
      router.push(`/plans/${plan.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight">{mode === "create" ? "Post a plan" : "Edit plan"}</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Keep it simple and meet somewhere public. You approve who joins.
      </p>

      <form onSubmit={submit} className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <div className="card space-y-3 p-5 sm:p-6">
          <h2 className="font-semibold">The plan</h2>
        <input
          className="input"
          placeholder="What's the plan? e.g. Sunset walk around the lake"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
        />
        <textarea
          className="input"
          rows={3}
          placeholder="Anything people should know? (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
        />

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`chip ${category === c.value ? "chip-active" : ""}`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="input"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
          <label className="flex shrink-0 items-center gap-2 text-sm">
            Guests
            <input
              className="input !w-20"
              type="number"
              min={1}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
            />
          </label>
        </div>
        </div>

        <div className="card space-y-3 p-5 sm:p-6">
          <h2 className="font-semibold">Where</h2>
        <input
          className="input"
          placeholder="Public meeting spot, e.g. Blue Tokai, Indiranagar"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          maxLength={120}
          required
        />
        <div>
          <input
            className="input"
            placeholder="Public area, e.g. Indiranagar"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            maxLength={60}
            required
          />
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            Everyone sees the area and a spot rounded to about 1 km. The exact spot and pin are shared only with guests you
            accept. Keep the exact address out of the description.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Latitude"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Longitude"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
          />
          <button type="button" onClick={useMyLocation} className="btn-ghost shrink-0 text-sm">
            📍 Use mine
          </button>
        </div>
        <div>
          <LocationPicker
            lat={lat === "" ? null : Number(lat)}
            lng={lng === "" ? null : Number(lng)}
            onPick={(pickedLat, pickedLng) => {
              setLat(String(pickedLat));
              setLng(String(pickedLng));
            }}
          />
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">Or click the map to drop a pin.</p>
        </div>
        </div>

        <div className="space-y-3 lg:col-span-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn w-full sm:w-auto sm:min-w-56" disabled={busy || !ready || !token}>
            {busy ? "Saving…" : mode === "create" ? "Post plan" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
