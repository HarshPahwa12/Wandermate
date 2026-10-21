"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface GoogleId {
  initialize(config: { client_id: string; callback: (response: { credential: string }) => void }): void;
  renderButton(element: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/** Google's own "Sign in with Google" button; hands the resulting ID token to the parent. */
export default function GoogleButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    callback.current = onCredential;
  });

  useEffect(() => {
    if (!scriptReady || !clientId || !container.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => callback.current(response.credential),
    });
    window.google.accounts.id.renderButton(container.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 320,
    });
  }, [scriptReady, clientId]);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-dashed border-black/20 p-3 text-center text-xs text-black/50 dark:border-white/25 dark:text-white/50">
        Google sign-in isn&apos;t configured yet.
      </p>
    );
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={container} className="flex min-h-[44px] justify-center" />
    </>
  );
}
