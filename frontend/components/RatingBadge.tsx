"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RatingSummary } from "@/lib/types";

/** Fetches and renders a user's average rating, e.g. "⭐ 4.8 (12)". Renders nothing until there's at least one rating. */
export default function RatingBadge({ userId, token }: { userId: number; token: string | null }) {
  const [summary, setSummary] = useState<RatingSummary | null>(null);

  useEffect(() => {
    // The summary endpoint needs a login; logged-out visitors simply don't see a rating.
    if (!token) return;
    let cancelled = false;
    api<RatingSummary>(`/users/${userId}/rating-summary`, { token })
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        // A missing badge is not worth an error.
      });
    return () => {
      cancelled = true;
    };
  }, [userId, token]);

  if (!summary || summary.average == null) return null;
  return (
    <span className="text-sm text-black/60 dark:text-white/60">
      ⭐ {summary.average.toFixed(1)} ({summary.count})
    </span>
  );
}
