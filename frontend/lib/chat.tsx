"use client";

import { Client, type StompSubscription } from "@stomp/stompjs";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import type { Conversation } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws";

type Listener = (body: unknown) => void;

interface ChatState {
  /** True while the STOMP connection is up. */
  connected: boolean;
  /** Unread messages across all of the user's conversations. */
  unread: number;
  /**
   * Listen on a STOMP destination. Survives reconnects; call the returned function to stop.
   * Safe to call before the connection is up.
   */
  subscribe: <T>(destination: string, listener: (body: T) => void) => () => void;
  /** Sends a message to a conversation. Returns false if the connection is down. */
  send: (conversationId: number, body: string) => boolean;
  refreshUnread: () => void;
}

const ChatContext = createContext<ChatState | null>(null);

interface Registration {
  destination: string;
  listener: Listener;
  active: StompSubscription | null;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);

  const clientRef = useRef<Client | null>(null);
  const registrations = useRef(new Map<number, Registration>());
  const nextId = useRef(0);

  const attach = useCallback((reg: Registration) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    reg.active = client.subscribe(reg.destination, (frame) => reg.listener(JSON.parse(frame.body)));
  }, []);

  const subscribe = useCallback(
    <T,>(destination: string, listener: (body: T) => void) => {
      const id = nextId.current++;
      const reg: Registration = { destination, listener: listener as unknown as Listener, active: null };
      registrations.current.set(id, reg);
      attach(reg);
      return () => {
        registrations.current.delete(id);
        try {
          reg.active?.unsubscribe();
        } catch {
          // connection already closed
        }
      };
    },
    [attach],
  );

  const refreshUnread = useCallback(() => {
    if (!token) return;
    api<Conversation[]>("/conversations", { token })
      .then((list) => setUnread(list.reduce((sum, c) => sum + c.unread, 0)))
      .catch(() => {
        // badge just stays as it was
      });
  }, [token]);

  // One connection per logged-in session.
  useEffect(() => {
    if (!token) return;
    const regs = registrations.current;
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        // Subscriptions don't survive a reconnect, so re-attach everything that is registered.
        regs.forEach((reg) => attach(reg));
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    });
    clientRef.current = client;
    client.activate();

    return () => {
      regs.forEach((reg) => (reg.active = null));
      clientRef.current = null;
      client.deactivate();
    };
  }, [token, attach]);

  // Initial badge, then keep it fresh as messages arrive for this user.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api<Conversation[]>("/conversations", { token })
      .then((list) => {
        if (!cancelled) setUnread(list.reduce((sum, c) => sum + c.unread, 0));
      })
      .catch(() => {});
    const stop = subscribe("/user/queue/notifications", () => refreshUnread());
    return () => {
      cancelled = true;
      stop();
    };
  }, [token, subscribe, refreshUnread]);

  const send = useCallback((conversationId: number, body: string) => {
    const client = clientRef.current;
    if (!client?.connected) return false;
    client.publish({ destination: `/app/chat/${conversationId}`, body: JSON.stringify({ body }) });
    return true;
  }, []);

  const value = useMemo<ChatState>(
    () => ({ connected, unread: token ? unread : 0, subscribe, send, refreshUnread }),
    [connected, unread, token, subscribe, send, refreshUnread],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}
