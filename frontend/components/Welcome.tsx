"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

const FLOATERS = [
  { emoji: "🚶", className: "left-[6%] top-[18%] animate-float", delay: "0s" },
  { emoji: "☕", className: "right-[9%] top-[12%] animate-float-alt", delay: "0.6s" },
  { emoji: "🎲", className: "left-[14%] bottom-[14%] animate-float-alt", delay: "1.1s" },
  { emoji: "🍜", className: "right-[6%] bottom-[18%] animate-float", delay: "0.3s" },
  { emoji: "🏸", className: "right-[30%] top-[62%] animate-float", delay: "1.4s" },
  { emoji: "✨", className: "left-[34%] top-[8%] animate-float-alt", delay: "0.9s" },
];

const STEPS = [
  { emoji: "📝", title: "Post or find a plan", body: "A walk, coffee, a pickup game — whatever you're up for, nearby." },
  { emoji: "🤝", title: "Request to join", body: "The host approves who comes. No surprises, no open invites." },
  { emoji: "📍", title: "Meet somewhere public", body: "Chat first in-app, then meet up. Block or report anyone, anytime." },
];

const SAFETY = [
  {
    emoji: "✅",
    title: "Hosts approve everyone",
    body: "Nobody walks in uninvited. Hosts see each requester's rating and track record before saying yes.",
  },
  {
    emoji: "🔒",
    title: "Exact spot stays private",
    body: "Strangers only see the neighbourhood. The precise meeting place is shared once you're accepted.",
  },
  {
    emoji: "⭐",
    title: "Ratings and no-shows",
    body: "After every plan, people rate each other and hosts mark who didn't turn up. Reliability is visible.",
  },
  {
    emoji: "🚫",
    title: "Block and report",
    body: "One tap to block someone or report them. Blocked people can't see your plans or message you.",
  },
];

export default function Welcome() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((n) => (n + 1) % CATEGORIES.length), 2200);
    return () => clearInterval(id);
  }, []);

  const word = CATEGORIES[wordIndex];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-300/20 blur-3xl" />
          {FLOATERS.map((f, i) => (
            <span key={i} className={`absolute text-4xl opacity-40 ${f.className}`} style={{ animationDelay: f.delay }}>
              {f.emoji}
            </span>
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-32">
          <p className="mx-auto inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            🧭 Casual plans with real people nearby
          </p>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Find someone for{" "}
            <span key={wordIndex} className="animate-word-in inline-block text-emerald-200">
              {word.emoji} {word.label.toLowerCase()}
            </span>
            ,<br className="hidden sm:block" /> right near you.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">
            Post a low-pressure plan or join one. You&apos;re always in control: hosts approve guests, and exact locations
            stay private until you&apos;re in.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login?mode=register"
              className="rounded-full bg-white px-7 py-3 font-semibold text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/50 px-7 py-3 font-semibold transition hover:bg-white/10"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Whatever you&apos;re up for</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-black/60 dark:text-white/60">
          Pick a vibe, see who&apos;s doing it near you.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.value}
              href="/login?mode=register"
              className={`animate-drift-in group relative overflow-hidden rounded-3xl bg-gradient-to-br ${c.band} p-5 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className="block text-4xl transition group-hover:scale-110">{c.emoji}</span>
              <span className="mt-6 block font-semibold">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface-muted/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card animate-drift-in p-6" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="flex items-center gap-3">
                  <span className="brand-gradient grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-2xl">{s.emoji}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-black/60 dark:text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Safe by <span className="brand-text">design</span>
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-black/60 dark:text-white/60">
          Meeting new people should feel easy. These are built in, not bolted on.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SAFETY.map((s) => (
            <div key={s.title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/12 text-2xl">{s.emoji}</span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="brand-gradient rounded-3xl px-6 py-12 text-center text-white shadow-lg sm:py-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">Your next plan is one tap away</h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">Join in a minute. Free, and no pressure.</p>
          <Link
            href="/login?mode=register"
            className="mt-7 inline-block rounded-full bg-white px-7 py-3 font-semibold text-emerald-800 shadow-lg transition hover:-translate-y-0.5"
          >
            Create your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-black/50 dark:text-white/50">
        🧭 WanderMate · casual plans, real people, nearby
      </footer>
    </div>
  );
}
