import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { ChatProvider } from "@/lib/chat";
import { ThemeProvider } from "@/lib/theme";
import Navbar from "@/components/Navbar";
import "./globals.css";

// Runs before paint so there's no flash of the wrong theme: mirrors the logic in lib/theme.tsx.
const THEME_BOOT_SCRIPT = `
try {
  var t = localStorage.getItem("meetup.theme");
  var dark = t === "dark" || (t !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
} catch (e) {}
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WanderMate — casual plans with people nearby",
  description: "Post or join low-pressure plans: a walk, a coffee, a board game night.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The boot script adds the "dark" class before hydration, so the server and client class lists differ on purpose.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <ChatProvider>
              <Navbar />
              <main className="w-full flex-1">{children}</main>
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
