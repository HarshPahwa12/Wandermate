"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>

      {sent ? (
        <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">
          If that email has an account, we&apos;ve sent a link to reset the password. It&apos;s valid for 30 minutes.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3">
          <p className="text-sm text-black/60 dark:text-white/60">
            Enter the email you signed up with and we&apos;ll send a reset link.
          </p>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <Link href="/login" className="mt-4 inline-block text-sm text-black/60 hover:underline dark:text-white/60">
        ← Back to log in
      </Link>
    </div>
  );
}
