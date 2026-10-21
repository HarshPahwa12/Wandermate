"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type ThemePreference = "light" | "dark" | "system";
const STORAGE_KEY = "meetup.theme";

// Mirrors the localStorage + in-memory-fallback pattern in lib/auth.tsx.
let memoryValue: ThemePreference | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(): ThemePreference {
  let value: string | null;
  try {
    value = localStorage.getItem(STORAGE_KEY) ?? memoryValue;
  } catch {
    value = memoryValue;
  }
  return value === "light" || value === "dark" ? value : "system";
}

function write(pref: ThemePreference) {
  memoryValue = pref;
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // storage unavailable: the in-memory copy still holds for this tab
  }
  listeners.forEach((l) => l());
}

function resolvedIsDark(pref: ThemePreference): boolean {
  if (pref === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return pref === "dark";
}

function apply(pref: ThemePreference) {
  document.documentElement.classList.toggle("dark", resolvedIsDark(pref));
}

interface ThemeState {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as ThemePreference);

  // The inline boot script in layout.tsx already set the right class before paint;
  // this keeps it correct as the preference changes and while "system" is selected.
  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply(theme);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo<ThemeState>(() => ({ theme, setTheme: write }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
