"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export default function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, newPassword: password } });
      router.push("/login");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        This reset link is missing its token.{" "}
        <Link href="/forgot-password" className="underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="input"
        type="password"
        placeholder="New password (8+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        autoComplete="new-password"
        required
      />
      <input
        className="input"
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        minLength={8}
        autoComplete="new-password"
        required
      />
      {error && (
        <p className="text-sm text-red-600">
          {error}
          {error.toLowerCase().includes("expired") && (
            <>
              {" "}
              <Link href="/forgot-password" className="underline">
                Request a new link
              </Link>
              .
            </>
          )}
        </p>
      )}
      <button className="btn w-full" disabled={busy}>
        {busy ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
