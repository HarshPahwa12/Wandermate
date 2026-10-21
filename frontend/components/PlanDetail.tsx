"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { categoryOf } from "@/lib/categories";
import type { Conversation, Plan } from "@/lib/types";
import Avatar from "./Avatar";
import PlanChat from "./PlanChat";
import PlanLocationMap from "./PlanLocationMap";
import RatingBadge from "./RatingBadge";
import RatingDialog from "./RatingDialog";
import ReportDialog from "./ReportDialog";
import TrustLine from "./TrustLine";
import { formatWhen, isPast as isPlanPast } from "./PlanCard";

export default function PlanDetail({ id }: { id: string }) {
  const { token, ready } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    // Wait for the stored token so the first response already knows who is viewing.
    if (!ready) return;
    let cancelled = false;
    api<Plan>(`/plans/${id}`, { token })
      .then((data) => {
        if (cancelled) return;
        setPlan(data);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, id, token]);

  async function act(path: string, method: "POST" | "DELETE" = "POST") {
    setBusy(true);
    setActionError(null);
    try {
      await api(path, { method, token });
    } catch (e) {
      setActionError((e as Error).message);
    }
    // Refresh either way: a failed action usually means the state changed under us.
    try {
      setPlan(await api<Plan>(`/plans/${id}`, { token }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function messageUser(userId: number) {
    setActionError(null);
    try {
      const conversation = await api<Conversation>(`/conversations/direct/${userId}`, { method: "POST", token });
      router.push(`/messages/${conversation.id}`);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function blockGuest(userId: number, name: string) {
    if (!confirm(`Block ${name}? You won't see each other's plans and won't be able to message.`)) return;
    setActionError(null);
    try {
      await api(`/users/${userId}/block`, { method: "POST", token });
      setPlan(await api<Plan>(`/plans/${id}`, { token }));
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function unblockGuest(userId: number) {
    setActionError(null);
    try {
      await api(`/users/${userId}/block`, { method: "DELETE", token });
      setPlan(await api<Plan>(`/plans/${id}`, { token }));
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function markAttendance(requestId: number, attended: boolean) {
    setActionError(null);
    try {
      await api(`/requests/${requestId}/attendance`, { method: "PUT", body: { attended }, token });
      setPlan(await api<Plan>(`/plans/${id}`, { token }));
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function refresh() {
    setPlan(await api<Plan>(`/plans/${id}`, { token }));
  }

  if (error) return <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>;
  if (!plan) return <p className="text-sm text-black/50 dark:text-white/50">Loading…</p>;

  const cat = categoryOf(plan.category);
  const full = plan.spotsLeft === 0;
  const isPast = isPlanPast(plan.startsAt);
  const rated = new Set(plan.ratedUserIds ?? []);
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${plan.lat}&mlon=${plan.lng}#map=16/${plan.lat}/${plan.lng}`;
  return (
    <div>
      <Link href="/" className="text-sm font-medium text-black/60 hover:underline dark:text-white/60">
        ← All plans
      </Link>

      <header className={`relative mt-3 overflow-hidden rounded-3xl bg-gradient-to-br ${cat.band} p-6 text-white shadow-lg sm:p-9`}>
        <span aria-hidden="true" className="pointer-events-none absolute -right-4 -top-6 select-none text-[9rem] opacity-20">
          {cat.emoji}
        </span>
        <div className="relative">
          <span className="inline-block rounded-full bg-black/25 px-3 py-1 text-xs font-semibold backdrop-blur">
            {cat.emoji} {cat.label}
          </span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{plan.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-base font-medium text-white/95">
            <span>🕒 {formatWhen(plan.startsAt)}</span>
            {plan.locationExact ? (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline decoration-white/50 underline-offset-4">
                📍 {plan.placeName}
              </a>
            ) : (
              <span title="The exact spot is shared once the host accepts you">📍 {plan.placeName} (approx.)</span>
            )}
            <span>👥 {full ? "Full" : `${plan.spotsLeft} of ${plan.capacity} spots left`}</span>
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold">About this plan</h2>
            {plan.description ? (
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-black/80 dark:text-white/80">{plan.description}</p>
            ) : (
              <p className="mt-2 text-sm text-black/50 dark:text-white/50">The host didn&apos;t add any details.</p>
            )}
          </section>

          {(plan.isHost || plan.myStatus === "ACCEPTED") && <PlanChat planId={plan.id} />}

          {plan.isHost && plan.requests && (
            <section className="card p-5 sm:p-6">
              <h2 className="font-semibold">Requests ({plan.requests.length})</h2>
              {plan.requests.length === 0 ? (
                <p className="mt-2 text-sm text-black/60 dark:text-white/60">No requests yet. Share your plan to get some.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {plan.requests.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar name={r.user.displayName} id={r.user.id} size="lg" />
                        <div className="min-w-0">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-medium">{r.user.displayName}</span>
                            {r.status !== "DECLINED" && !r.blocked && (
                              <button
                                className="text-xs text-black/50 underline dark:text-white/50"
                                onClick={() => messageUser(r.user.id)}
                              >
                                Message
                              </button>
                            )}
                            {r.blocked ? (
                              <span className="flex items-center gap-1 text-xs text-black/40 dark:text-white/40">
                                Blocked
                                <button className="underline" onClick={() => unblockGuest(r.user.id)}>
                                  Unblock
                                </button>
                              </span>
                            ) : (
                              <button
                                className="text-xs text-black/40 underline dark:text-white/40"
                                onClick={() => blockGuest(r.user.id, r.user.displayName)}
                              >
                                Block
                              </button>
                            )}
                            {isPast && r.status === "ACCEPTED" && !rated.has(r.user.id) && (
                              <button
                                className="text-xs text-black/50 underline dark:text-white/50"
                                onClick={() => setRatingTarget({ id: r.user.id, name: r.user.displayName })}
                              >
                                ⭐ Rate
                              </button>
                            )}
                            {isPast && r.status === "ACCEPTED" && (
                              <button
                                className={`text-xs underline ${r.attended === false ? "text-red-600" : "text-black/50 dark:text-white/50"}`}
                                onClick={() => markAttendance(r.id, r.attended === false)}
                              >
                                {r.attended === false ? "No-show · undo" : "Mark no-show"}
                              </button>
                            )}
                          </span>
                          <TrustLine trust={r.trust} />
                        </div>
                      </div>
                      {r.status === "PENDING" ? (
                        <span className="flex gap-2">
                          <button className="btn !px-4 !py-1 text-sm" disabled={busy || full} onClick={() => act(`/requests/${r.id}/accept`)}>
                            Accept
                          </button>
                          <button className="btn-ghost !px-4 !py-1 text-sm" disabled={busy} onClick={() => act(`/requests/${r.id}/decline`)}>
                            Decline
                          </button>
                        </span>
                      ) : (
                        <span className="text-sm text-black/60 dark:text-white/60">
                          {r.status === "ACCEPTED" ? "✅ Accepted" : "Declined"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            {!ready ? null : !token ? (
              <div className="space-y-3">
                <p className="text-sm text-black/65 dark:text-white/65">Log in to ask the host if you can join.</p>
                <Link href="/login" className="btn block text-center">
                  Log in to join
                </Link>
              </div>
            ) : plan.isHost ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">🎤 You&apos;re hosting this plan.</p>
                {!isPast && (
                  <Link href={`/plans/${plan.id}/edit`} className="btn-ghost block text-center text-sm">
                    ✏️ Edit plan
                  </Link>
                )}
              </div>
            ) : plan.myStatus === null ? (
              <button className="btn w-full" disabled={busy || full} onClick={() => act(`/plans/${plan.id}/join`)}>
                {full ? "Plan is full" : "Request to join"}
              </button>
            ) : plan.myStatus === "PENDING" ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">⏳ Waiting for the host to approve you</p>
                <button className="btn-ghost w-full text-sm" disabled={busy} onClick={() => act(`/plans/${plan.id}/join`, "DELETE")}>
                  Cancel request
                </button>
              </div>
            ) : plan.myStatus === "ACCEPTED" ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">🎉 You&apos;re in!</p>
                <button className="btn-ghost w-full text-sm" disabled={busy} onClick={() => act(`/plans/${plan.id}/join`, "DELETE")}>
                  Leave plan
                </button>
              </div>
            ) : (
              <p className="text-sm text-black/60 dark:text-white/60">The host couldn&apos;t fit you in this time.</p>
            )}
            {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={plan.host.displayName} id={plan.host.id} size="lg" />
              <div className="min-w-0">
                <p className="text-xs text-black/50 dark:text-white/50">Hosted by</p>
                <p className="flex flex-wrap items-center gap-x-2 font-semibold">
                  <span className="truncate">{plan.host.displayName}</span>
                  <RatingBadge userId={plan.host.id} token={token} />
                </p>
              </div>
            </div>
            {!plan.isHost && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {(plan.myStatus === "PENDING" || plan.myStatus === "ACCEPTED") && (
                  <button className="btn-ghost !px-4 !py-1.5 text-sm" onClick={() => messageUser(plan.host.id)}>
                    💬 Message
                  </button>
                )}
                {isPast && plan.myStatus === "ACCEPTED" && !rated.has(plan.host.id) && (
                  <button
                    className="btn-ghost !px-4 !py-1.5 text-sm"
                    onClick={() => setRatingTarget({ id: plan.host.id, name: plan.host.displayName })}
                  >
                    ⭐ Rate
                  </button>
                )}
                <button
                  className="ml-auto text-xs text-black/40 hover:underline dark:text-white/40"
                  onClick={() => setReportOpen(true)}
                >
                  🚩 Report
                </button>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <PlanLocationMap lat={plan.lat} lng={plan.lng} exact={plan.locationExact} category={plan.category} />
            <div className="p-4 text-sm">
              <p className="font-medium">📍 {plan.placeName}</p>
              {plan.locationExact ? (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-brand-ink underline">
                  Open in OpenStreetMap →
                </a>
              ) : (
                <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                  🔒 Approximate area only. The exact meeting spot is shared once the host accepts you.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {reportOpen && (
        <ReportDialog
          targetId={plan.host.id}
          targetName={plan.host.displayName}
          planId={plan.id}
          token={token}
          onClose={() => setReportOpen(false)}
          onBlocked={() => router.push("/")}
        />
      )}

      {ratingTarget && (
        <RatingDialog
          planId={plan.id}
          rateeId={ratingTarget.id}
          rateeName={ratingTarget.name}
          token={token}
          onClose={() => setRatingTarget(null)}
          onRated={() => {
            setRatingTarget(null);
            refresh();
          }}
        />
      )}

    </div>
  );
}
