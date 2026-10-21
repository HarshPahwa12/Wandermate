"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation } from "@/lib/types";
import ChatPanel from "./ChatPanel";

export default function ConversationPage({ id }: { id: string }) {
  const { token, ready } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reload() {
    return api<Conversation>(`/conversations/${id}`, { token }).then(setConversation);
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api<Conversation>(`/conversations/${id}`, { token })
      .then((c) => {
        if (!cancelled) setConversation(c);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  async function toggleBlock() {
    if (!conversation?.other) return;
    const blocking = !conversation.blocked;
    if (blocking && !confirm(`Block ${conversation.other.displayName}? You won't be able to message each other.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/users/${conversation.other.id}/block`, { method: blocking ? "POST" : "DELETE", token });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (ready && !token) {
    return (
      <p className="text-sm">
        <Link href="/login" className="underline">
          Log in
        </Link>{" "}
        to see this chat.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/messages" className="text-sm font-medium text-black/60 hover:underline dark:text-white/60">
        ← All messages
      </Link>
      {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {conversation && (
        <>
          <div className="mt-3 flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              {conversation.type === "PLAN" ? "👥" : "👤"} {conversation.title}
            </h1>
            {conversation.other && (
              <button className="shrink-0 text-sm text-black/40 hover:underline dark:text-white/40" disabled={busy} onClick={toggleBlock}>
                {conversation.blocked ? "Unblock" : "🚫 Block"}
              </button>
            )}
          </div>
          {conversation.planId && (
            <Link href={`/plans/${conversation.planId}`} className="mb-3 inline-block text-sm underline">
              View plan
            </Link>
          )}
          <div className="mt-3">
            <ChatPanel
              key={conversation.id}
              conversationId={conversation.id}
              showNames={conversation.type === "PLAN"}
              disabled={conversation.blocked}
            />
          </div>
        </>
      )}
    </div>
  );
}
