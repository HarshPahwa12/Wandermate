"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import type { Conversation } from "@/lib/types";

function when(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function Inbox() {
  const { token, ready } = useAuth();
  const { subscribe } = useChat();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const load = () =>
      api<Conversation[]>("/conversations", { token })
        .then((list) => {
          if (!cancelled) setConversations(list);
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        });
    load();
    // A new message anywhere should bump that chat to the top and update its badge.
    const stop = subscribe("/user/queue/notifications", load);
    return () => {
      cancelled = true;
      stop();
    };
  }, [token, subscribe]);

  if (ready && !token) {
    return (
      <p className="text-sm">
        <Link href="/login" className="underline">
          Log in
        </Link>{" "}
        to see your messages.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">Plan group chats and direct messages.</p>
      <div className="mt-5 space-y-3">
        {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
        {!error && conversations === null && (
          <>
            <div className="skeleton h-20 !rounded-[1.25rem]" />
            <div className="skeleton h-20 !rounded-[1.25rem]" />
            <div className="skeleton h-20 !rounded-[1.25rem]" />
          </>
        )}
        {conversations?.length === 0 && (
          <div className="card flex flex-col items-center px-6 py-12 text-center">
            <div className="text-5xl">💬</div>
            <p className="mt-3 max-w-xs text-sm text-black/60 dark:text-white/60">
              No chats yet. Post a plan, or get accepted into one, and its group chat shows up here.
            </p>
          </div>
        )}
        {conversations?.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className="card card-hover flex items-center gap-4 p-4"
          >
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl ${
                c.type === "PLAN" ? "brand-gradient text-white" : "bg-emerald-500/12"
              }`}
            >
              {c.type === "PLAN" ? "👥" : "👤"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.title}</p>
              <p className="truncate text-sm text-black/60 dark:text-white/60">
                {c.lastMessage ? `${c.lastMessage.sender.displayName}: ${c.lastMessage.body}` : "No messages yet"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {c.lastMessage && (
                <span className="text-xs text-black/40 dark:text-white/40">{when(c.lastMessage.createdAt)}</span>
              )}
              {c.unread > 0 && (
                <span className="brand-gradient rounded-full px-2 py-0.5 text-xs font-semibold text-white">{c.unread}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
