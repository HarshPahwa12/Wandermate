"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import type { ChatMessage } from "@/lib/types";

const PAGE_SIZE = 50;

/** Merge by id, oldest first, so a live message that races the history fetch never doubles up. */
function merge(a: ChatMessage[], b: ChatMessage[]) {
  const byId = new Map<number, ChatMessage>();
  [...a, ...b].forEach((m) => byId.set(m.id, m));
  return [...byId.values()].sort((x, y) => x.id - y.id);
}

function time(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Chat room UI. Give it a `key` of the conversation id so switching rooms resets it. */
export default function ChatPanel({
  conversationId,
  showNames,
  disabled,
}: {
  conversationId: number;
  showNames: boolean;
  disabled?: boolean;
}) {
  const { token, user } = useAuth();
  const { connected, subscribe, send, refreshUnread } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  function markRead() {
    api(`/conversations/${conversationId}/read`, { method: "POST", token })
      .then(refreshUnread)
      .catch(() => {});
  }

  // History.
  useEffect(() => {
    let cancelled = false;
    api<ChatMessage[]>(`/conversations/${conversationId}/messages?limit=${PAGE_SIZE}`, { token })
      .then((page) => {
        if (cancelled) return;
        setMessages((prev) => merge(page, prev));
        setHasMore(page.length === PAGE_SIZE);
        setLoaded(true);
        api(`/conversations/${conversationId}/read`, { method: "POST", token }).then(refreshUnread).catch(() => {});
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, token, refreshUnread]);

  // Live messages for this room, plus errors the server sends back to just us.
  useEffect(() => {
    const stopRoom = subscribe<ChatMessage>(`/topic/conversations/${conversationId}`, (m) => {
      setMessages((prev) => merge(prev, [m]));
      if (m.sender.id !== user?.id) {
        api(`/conversations/${conversationId}/read`, { method: "POST", token }).then(refreshUnread).catch(() => {});
      }
    });
    const stopErrors = subscribe<{ message: string }>("/user/queue/errors", (e) => setError(e.message));
    return () => {
      stopRoom();
      stopErrors();
    };
  }, [conversationId, subscribe, user?.id, token, refreshUnread]);

  // Keep the newest message in view unless the reader scrolled up.
  useEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = scroller.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }

  async function loadEarlier() {
    const oldest = messages[0]?.id;
    if (!oldest) return;
    stickToBottom.current = false;
    try {
      const page = await api<ChatMessage[]>(`/conversations/${conversationId}/messages?limit=${PAGE_SIZE}&before=${oldest}`, { token });
      setMessages((prev) => merge(page, prev));
      setHasMore(page.length === PAGE_SIZE);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setError(null);
    if (send(conversationId, text)) {
      setDraft("");
      stickToBottom.current = true;
    } else {
      setError("Reconnecting… try again in a moment.");
    }
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-2xl border border-black/10 dark:border-white/15">
      <div ref={scroller} onScroll={onScroll} className="flex-1 space-y-2 overflow-y-auto p-3">
        {hasMore && (
          <button onClick={loadEarlier} className="mx-auto block text-xs text-black/50 underline dark:text-white/50">
            Load earlier messages
          </button>
        )}
        {!loaded && !error && <p className="text-center text-sm text-black/50 dark:text-white/50">Loading…</p>}
        {loaded && messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-black/50 dark:text-white/50">No messages yet. Say hi 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender.id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                  mine ? "bg-emerald-600 text-white" : "bg-black/5 dark:bg-white/10"
                }`}
              >
                {showNames && !mine && <p className="text-xs font-medium opacity-70">{m.sender.displayName}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/70" : "text-black/40 dark:text-white/40"}`}>
                  {time(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="px-3 pb-1 text-xs text-red-600">{error}</p>}
      {disabled ? (
        <p className="border-t border-black/10 p-3 text-center text-sm text-black/50 dark:border-white/15 dark:text-white/50">
          You can&apos;t message each other.
        </p>
      ) : (
        <form onSubmit={submit} onFocus={markRead} className="flex items-center gap-2 border-t border-black/10 p-2 dark:border-white/15">
          <span
            title={connected ? "Live" : "Reconnecting…"}
            className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`}
          />
          <input
            className="input !py-1.5"
            placeholder={connected ? "Type a message" : "Connecting…"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
          />
          <button className="btn !py-1.5 text-sm" disabled={!draft.trim()}>
            Send
          </button>
        </form>
      )}
    </div>
  );
}
