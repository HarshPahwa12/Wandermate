"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme, type ThemePreference } from "@/lib/theme";
import type { Me, User } from "@/lib/types";
import Avatar from "./Avatar";
import RatingBadge from "./RatingBadge";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "☀️ Light" },
  { value: "dark", label: "🌙 Dark" },
  { value: "system", label: "🖥️ System" },
];

export default function Profile() {
  const { token, ready } = useAuth();
  const { theme, setTheme } = useTheme();
  const [me, setMe] = useState<Me | null>(null);
  const [blocked, setBlocked] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    api<Me>("/users/me", { token })
      .then(setMe)
      .catch((e: Error) => setError(e.message));
    api<User[]>("/users/blocked", { token })
      .then(setBlocked)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  async function unblock(userId: number) {
    setBusyId(userId);
    try {
      await api(`/users/${userId}/block`, { method: "DELETE", token });
      setBlocked((prev) => prev?.filter((u) => u.id !== userId) ?? prev);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (ready && !token) {
    return (
      <p className="text-sm">
        <Link href="/login" className="underline">
          Log in
        </Link>{" "}
        to see your profile.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="card p-6 text-center">
            {me ? (
              <>
                <div className="flex justify-center">
                  <Avatar name={me.displayName} id={me.id} size="lg" />
                </div>
                <p className="mt-3 text-lg font-semibold">{me.displayName}</p>
                <p className="mt-1 flex justify-center">
                  <RatingBadge userId={me.id} token={token} />
                </p>
                <p className="mt-1 break-all text-sm text-black/50 dark:text-white/50">{me.email}</p>
              </>
            ) : (
              <p className="text-sm text-black/50 dark:text-white/50">Loading…</p>
            )}
            <Link href="/plans/mine" className="btn-ghost mt-5 block text-sm">
              My plans →
            </Link>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-semibold">Appearance</h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">Choose how WanderMate looks on this device.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`chip !px-4 !py-1.5 ${theme === opt.value ? "chip-active" : ""}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-semibold">Blocked users</h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              Blocked users can&apos;t see your plans and can&apos;t message you, and you won&apos;t see theirs. Block someone
              from their plan page or from a direct chat with them.
            </p>
            {blocked === null ? (
              <p className="mt-4 text-sm text-black/50 dark:text-white/50">Loading…</p>
            ) : blocked.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-black/60 dark:text-white/60">
                You haven&apos;t blocked anyone.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {blocked.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex items-center gap-3">
                      <Avatar name={u.displayName} id={u.id} />
                      {u.displayName}
                    </span>
                    <button
                      className="btn-ghost !px-4 !py-1 text-sm"
                      disabled={busyId === u.id}
                      onClick={() => unblock(u.id)}
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
