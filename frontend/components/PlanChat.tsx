"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation } from "@/lib/types";
import ChatPanel from "./ChatPanel";

/** Group chat for a plan; only rendered for the host and accepted guests. */
export default function PlanChat({ planId }: { planId: number }) {
  const { token } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Conversation>(`/plans/${planId}/conversation`, { token })
      .then((c) => {
        if (!cancelled) setConversation(c);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [planId, token]);

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-3 font-semibold">💬 Group chat</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !conversation && <p className="text-sm text-black/50 dark:text-white/50">Opening chat…</p>}
      {conversation && <ChatPanel key={conversation.id} conversationId={conversation.id} showNames />}
    </section>
  );
}
