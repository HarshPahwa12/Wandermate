"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Props {
  targetId: number;
  targetName: string;
  planId?: number;
  token: string | null | undefined;
  onClose: () => void;
  onBlocked: () => void;
}

/** Report a user, then offer to also block them. Reporting never blocks on its own. */
export default function ReportDialog({ targetId, targetName, planId, token, onClose, onBlocked }: Props) {
  const [step, setStep] = useState<"form" | "done">("form");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api("/users/" + targetId + "/report", { method: "POST", token, body: { reason: reason.trim(), planId } });
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function block() {
    setBusy(true);
    setError(null);
    try {
      await api("/users/" + targetId + "/block", { method: "POST", token });
      onBlocked();
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
        {step === "form" ? (
          <>
            <h2 className="font-semibold">Report {targetName}</h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">What happened? This is sent to the WanderMate team.</p>
            <textarea
              className="input mt-3 min-h-24 resize-none"
              placeholder="Describe the issue"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost text-sm" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button className="btn text-sm" onClick={submit} disabled={busy || !reason.trim()}>
                Submit report
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-semibold">Report sent</h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              Thanks — we&apos;ll take a look. Want to also block {targetName}? You won&apos;t see their plans and won&apos;t be
              able to message each other.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost text-sm" onClick={onClose} disabled={busy}>
                Not now
              </button>
              <button className="btn text-sm" onClick={block} disabled={busy}>
                Block {targetName}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
