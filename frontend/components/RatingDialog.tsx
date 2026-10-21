"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Props {
  planId: number;
  rateeId: number;
  rateeName: string;
  token: string | null | undefined;
  onClose: () => void;
  onRated: () => void;
}

const STARS = [1, 2, 3, 4, 5];

export default function RatingDialog({ planId, rateeId, rateeName, token, onClose, onRated }: Props) {
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api(`/plans/${planId}/ratings`, {
        method: "POST",
        token,
        body: { rateeId, stars, comment: comment.trim() || null },
      });
      onRated();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-neutral-950"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold">Rate {rateeName}</h2>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">How was meeting up with {rateeName}?</p>

        <div className="mt-3 flex gap-1 text-3xl">
          {STARS.map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="leading-none"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(n)}
            >
              {(hover || stars) >= n ? "⭐" : "☆"}
            </button>
          ))}
        </div>

        <textarea
          className="input mt-3 min-h-20 resize-none"
          placeholder="Anything worth mentioning? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost text-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn text-sm" onClick={submit} disabled={busy}>
            Submit rating
          </button>
        </div>
      </div>
    </div>
  );
}
