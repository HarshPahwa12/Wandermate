"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Plan } from "@/lib/types";
import PlanCard, { isPast } from "./PlanCard";

function Empty({ children }: { children: string }) {
  return (
    <p className="card border-dashed p-8 text-center text-sm text-black/60 dark:text-white/60">{children}</p>
  );
}

export default function MyPlans() {
  const { token, ready } = useAuth();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    api<Plan[]>("/plans/mine", { token })
      .then(setPlans)
      .catch((e: Error) => setError(e.message));
  }, [ready, token]);

  if (ready && !token) {
    return (
      <p className="text-sm">
        <Link href="/login" className="underline">
          Log in
        </Link>{" "}
        to see your plans.
      </p>
    );
  }
  if (error) return <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>;
  if (!plans) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-64 !rounded-[1.25rem]" />
        ))}
      </div>
    );
  }

  const upcoming = plans.filter((p) => !isPast(p.startsAt));
  const past = plans.filter((p) => isPast(p.startsAt));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My plans</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">Everything you&apos;re hosting or going to.</p>
        </div>
        <Link href="/plans/new" className="btn text-sm">
          + New plan
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="mt-3">
            <Empty>Nothing coming up. Browse plans or post your own.</Empty>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {upcoming.map((p) => (
              <div key={p.id}>
                <span
                  className={`mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    p.isHost ? "brand-gradient text-white" : "bg-emerald-500/12 text-brand-ink"
                  }`}
                >
                  {p.isHost ? "Hosting" : "Going"}
                </span>
                <PlanCard plan={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Past ({past.length})</h2>
        {past.length === 0 ? (
          <div className="mt-3">
            <Empty>No past plans yet.</Empty>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {past.map((p) => (
              <div key={p.id} className="opacity-90">
                <span className="mb-1.5 inline-block rounded-full bg-black/8 px-2.5 py-0.5 text-xs font-semibold text-black/60 dark:bg-white/12 dark:text-white/60">
                  {p.isHost ? "Hosted" : "Attended"}
                </span>
                <PlanCard plan={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
