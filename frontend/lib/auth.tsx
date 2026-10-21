"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { AuthResponse, User } from "./types";

const STORAGE_KEY = "meetup.auth";

// The session lives in localStorage; memoryRaw keeps it working when storage is blocked.
let memoryRaw: string | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function writeRaw(value: string | null) {
  memoryRaw = value;
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // storage unavailable: the in-memory copy still holds for this tab
  }
  listeners.forEach((l) => l());
}

interface AuthState {
  user: User | null;
  token: string | null;
  /** False until the browser has been read, so pages don't flash a logged-out state. */
  ready: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function signIn(auth: AuthResponse) {
  writeRaw(JSON.stringify(auth));
}

function signOut() {
  writeRaw(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined on the server and during hydration, string | null once the browser is read.
  const raw = useSyncExternalStore<string | null | undefined>(subscribe, readRaw, () => undefined);

  const value = useMemo<AuthState>(() => {
    let auth: AuthResponse | null = null;
    if (raw) {
      try {
        auth = JSON.parse(raw);
      } catch {
        auth = null;
      }
    }
    return { user: auth?.user ?? null, token: auth?.token ?? null, ready: raw !== undefined, signIn, signOut };
  }, [raw]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
