"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

export function Appbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Studio Tag */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm transition-transform group-hover:scale-105">
            {/* Audio Wave / Fader Icon */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10v4" />
              <path d="M7 6v12" />
              <path d="M11 3v18" />
              <path d="M15 8v8" />
              <path d="M19 5v14" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white">
              muzzi
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Studio Sync
            </span>
          </div>
        </Link>

        {/* Right Action / Auth Area */}
        <div className="flex items-center gap-2.5">
          {/* Theme Switcher */}
          <ThemeToggle />

          {status === "loading" && (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          )}

          {status === "authenticated" && (
            <div className="flex items-center gap-2.5">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center text-xs font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Dashboard
              </Link>
              <div className="hidden md:flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                  {session?.user?.name?.[0] || session?.user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 max-w-[120px] truncate">
                  {session?.user?.name || session?.user?.email}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}

          {status === "unauthenticated" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => signIn()}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-100"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
