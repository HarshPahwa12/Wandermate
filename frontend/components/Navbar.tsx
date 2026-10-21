"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import Avatar from "./Avatar";

const LINKS = [
  {
    href: "/",
    label: "Discover",
    match: (p: string) => p === "/" || (p.startsWith("/plans/") && p !== "/plans/mine" && p !== "/plans/new"),
  },
  { href: "/plans/mine", label: "My plans", match: (p: string) => p === "/plans/mine" },
];

/** Reads the pathname, which is only known at request time, so it lives behind its own Suspense boundary. */
function NavLinks({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <div className="hidden items-center gap-1 text-sm font-medium md:flex">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-full px-3 py-1.5 transition ${
            l.match(pathname)
              ? "bg-emerald-500/12 text-brand-ink"
              : "text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
          }`}
        >
          {l.label}
        </Link>
      ))}
      <Link
        href="/messages"
        className={`relative rounded-full px-3 py-1.5 transition ${
          pathname.startsWith("/messages")
            ? "bg-emerald-500/12 text-brand-ink"
            : "text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
        }`}
      >
        Messages
        {unread > 0 && (
          <span className="brand-gradient ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    </div>
  );
}

export default function Navbar() {
  const { user, ready, signOut } = useAuth();
  const { unread } = useChat();

  return (
    <header className="sticky top-0 z-[1100] border-b border-line bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            🧭 Wander<span className="brand-text">Mate</span>
          </Link>
          {ready && user && (
            <Suspense fallback={null}>
              <NavLinks unread={unread} />
            </Suspense>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm sm:gap-3">
          {ready && user ? (
            <>
              <Link href="/messages" className="relative rounded-full p-2 hover:bg-black/5 md:hidden dark:hover:bg-white/10" aria-label="Messages">
                💬
                {unread > 0 && (
                  <span className="brand-gradient absolute -right-0.5 -top-0.5 rounded-full px-1.5 text-[10px] font-semibold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
              <Link href="/plans/new" className="btn !px-4 !py-1.5 text-sm">
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ New plan</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full p-1 hover:bg-black/5 sm:pr-3 dark:hover:bg-white/10"
              >
                <Avatar name={user.displayName} id={user.id} />
                <span className="hidden max-w-32 truncate font-medium sm:inline">{user.displayName}</span>
              </Link>
              <button onClick={signOut} className="hidden text-black/60 hover:underline sm:inline dark:text-white/60">
                Log out
              </button>
            </>
          ) : ready ? (
            <>
              <Link href="/login" className="btn-ghost !px-4 !py-1.5 text-sm">
                Log in
              </Link>
              <Link href="/login?mode=register" className="btn !px-4 !py-1.5 text-sm">
                Sign up
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
