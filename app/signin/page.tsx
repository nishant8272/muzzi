"use client";

import React, { useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "../components/ThemeToggle";

// Google G Icon (Official SVG)
function GoogleIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  // Auto redirect if already signed in
  React.useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signIn("google", { callbackUrl });
    } catch {
      setLoading(false);
    }
  };

  const getErrorMessage = (err: string | null) => {
    if (!err) return null;
    switch (err) {
      case "OAuthSignin":
      case "OAuthCallback":
        return "Could not authenticate with Google. Please try again.";
      case "OAuthCreateAccount":
      case "Callback":
        return "Failed to complete account registration.";
      case "SessionRequired":
        return "Please sign in to access that page.";
      default:
        return "An authentication error occurred. Please try again.";
    }
  };

  const errorText = getErrorMessage(error);

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        
        {/* Main Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-xl transition-colors">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link
              href="/"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm mb-4 transition-transform hover:scale-105"
            >
              {/* Audio Wave Icon */}
              <svg
                className="h-5 w-5"
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
            </Link>

            <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Welcome to Muzzi
            </h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-[260px] leading-relaxed">
              Sign in to launch your interactive stream deck and let chat vote on music.
            </p>
          </div>

          {/* Error Banner */}
          {errorText && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/30 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-2">
              <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorText}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-750 dark:hover:border-zinc-600 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-100"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-800 dark:border-zinc-500 dark:border-t-zinc-100" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              We only use your email to authenticate your stream host profile. No advertising, spam, or hidden permissions.
            </p>
          </div>

        </div>

        {/* Back to Home Link */}
        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back to Muzzi Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      
      {/* Minimal Top Header */}
      <header className="border-b border-zinc-200/80 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs">
              M
            </span>
            <span>muzzi</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content with Suspense for useSearchParams */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
          </div>
        }
      >
        <SignInContent />
      </Suspense>

      {/* Minimal Footer */}
      <footer className="py-6 text-center text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
        <span>&copy; {new Date().getFullYear()} Muzzi. Collaborative Stream Music.</span>
      </footer>
    </div>
  );
}
