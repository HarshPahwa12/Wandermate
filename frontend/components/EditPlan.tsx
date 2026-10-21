"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Plan } from "@/lib/types";
import PlanForm from "./PlanForm";

export default function EditPlan({ id }: { id: string }) {
  const { token, ready } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    api<Plan>(`/plans/${id}`, { token })
      .then((data) => {
        if (cancelled) return;
        if (!data.isHost) {
          router.replace(`/plans/${id}`);
          return;
        }
        setPlan(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, id, token, router]);

  if (error) return <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>;
  if (!plan) return <p className="text-sm text-black/50 dark:text-white/50">Loading…</p>;
  return <PlanForm mode="edit" planId={plan.id} initial={plan} />;
}
