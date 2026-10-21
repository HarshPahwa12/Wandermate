"use client";

// import Link from "next/link"; // only used by the "Forgot password?" link below
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
// import GoogleButton from "@/components/GoogleButton"; // only used by the Google sign-in block below
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";

const PERKS = [
  { emoji: "✅", text: "Hosts approve everyone who joins" },
  { emoji: "🔒", text: "Exact meeting spots stay private until you're in" },
  { emoji: "⭐", text: "Ratings and no-show tracking build trust" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const initialMode = useSearchParams().get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function authenticate(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const auth = await api<AuthResponse>(path, { method: "POST", body });
      signIn(auth);
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === "login") authenticate("/auth/login", { email, password });
    else authenticate("/auth/register", { email, password, displayName });
  }

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      {/* Brand panel, large screens only */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
          <span className="animate-float absolute right-[14%] top-[14%] text-5xl opacity-40">☕</span>
          <span className="animate-float-alt absolute bottom-[16%] left-[12%] text-5xl opacity-40">🚶</span>
          <span className="animate-float absolute bottom-[30%] right-[18%] text-4xl opacity-40">🎲</span>
        </div>
        <div className="relative max-w-md">
          <p className="text-2xl font-bold">🧭 WanderMate</p>
          <h2 className="mt-8 text-4xl font-extrabold tracking-tight">Casual plans, real people, right nearby.</h2>
          <ul className="mt-8 space-y-4">
            {PERKS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-white/90">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 text-xl">{p.emoji}</span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="card w-full max-w-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{mode === "login" ? "Welcome back" : "Join WanderMate"}</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {mode === "login" ? "Log in to see what's happening nearby." : "Create an account to post and join plans."}
          </p>

          {/* Google sign-in is switched off for now. To bring it back: uncomment this block and the GoogleButton import,
              set NEXT_PUBLIC_GOOGLE_CLIENT_ID (frontend) and GOOGLE_CLIENT_ID (backend).
          <div className="mt-5">
            <GoogleButton onCredential={(idToken) => authenticate("/auth/google", { idToken })} />
          </div>

          <div className="my-4 flex items-center gap-3 text-xs text-black/50 dark:text-white/50">
            <span className="h-px flex-1 bg-current opacity-20" />
            or
            <span className="h-px flex-1 bg-current opacity-20" />
          </div>
          */}

          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "register" && (
              <input
                className="input"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                required
              />
            )}
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "register" ? 8 : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
          {/* Forgot password is switched off for now (no email provider configured). To bring it back: uncomment this
              block and the Link import, and set the SMTP_* variables on the backend.
          {mode === "login" && (
            <Link
              href="/forgot-password"
              className="mt-3 block text-center text-sm text-black/60 hover:underline dark:text-white/60"
            >
              Forgot password?
            </Link>
          )}
          */}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            className="mt-4 w-full text-center text-sm font-medium text-brand-ink hover:underline"
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
