"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import StreamView from "../components/StreamView";
import { Appbar } from "../components/Appbar";

function StudioLoader({ message = "Connecting to stream deck..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 text-center">
      {/* Equalizer animation bars in monochrome pro style */}
      <div className="flex items-end gap-1.5 h-8 px-4">
        <span className="w-1 rounded-full bg-zinc-700 dark:bg-zinc-300 animate-[pulse_0.8s_ease-in-out_infinite] h-4" />
        <span className="w-1 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-[pulse_0.6s_ease-in-out_infinite_0.15s] h-7" />
        <span className="w-1 rounded-full bg-zinc-700 dark:bg-zinc-300 animate-[pulse_1.0s_ease-in-out_infinite_0.3s] h-5" />
        <span className="w-1 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-[pulse_0.7s_ease-in-out_infinite_0.1s] h-8" />
        <span className="w-1 rounded-full bg-zinc-700 dark:bg-zinc-300 animate-[pulse_0.9s_ease-in-out_infinite_0.25s] h-3" />
      </div>
      <div>
        <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">{message}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Synchronizing stream room</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCreator() {
      // Only fetch if creatorId is not already loaded
      if (status === "authenticated" && session?.user?.email && !creatorId) {
        try {
          setError(null);
          const response = await fetch(`/api/me?email=${encodeURIComponent(session.user.email)}`);
          if (!response.ok) {
            throw new Error("Unable to locate creator profile for this account.");
          }
          const responseData = await response.json();
          if (isMounted) {
            setCreatorId(responseData.creatorId);
          }
        } catch (err: unknown) {
          if (isMounted) {
            setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else if (status === "unauthenticated") {
        if (isMounted) setLoading(false);
      }
    }

    fetchCreator();

    return () => {
      isMounted = false;
    };
  }, [status, session?.user?.email, creatorId]);

  // Loading state
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col transition-colors">
        <Appbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <StudioLoader />
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col transition-colors">
        <Appbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-colors">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 mb-4">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-zinc-950 dark:text-white mb-1.5">
              Sign In to Your Stream Deck
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Connect your account to launch your live audience song voting room.
            </p>
            <button
              onClick={() => signIn()}
              className="w-full inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all active:scale-[0.98]"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col transition-colors">
        <Appbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 text-center dark:border-red-900/40 dark:bg-zinc-900 shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 mb-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white mb-1">Connection Issue</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); setCreatorId(null); }}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated state
  if (creatorId) {
    return <StreamView creatorId={creatorId} share={false} />;
  }

  // Fallback
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col transition-colors">
      <Appbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-zinc-500 dark:text-zinc-400 text-xs">
          Unable to locate your creator ID. Please sign out and sign back in.
        </div>
      </div>
    </div>
  );
}
