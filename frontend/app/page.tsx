"use client";

import Discover from "@/components/Discover";
import Welcome from "@/components/Welcome";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { token, ready } = useAuth();

  if (!ready) return null;
  // Both are full bleed and manage their own widths.
  return token ? <Discover /> : <Welcome />;
}
