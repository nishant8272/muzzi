"use client";

import React, { useState } from "react";
import { Appbar } from "./components/Appbar";
import { Redirect } from "./components/Redirect";
import { signIn } from "next-auth/react";

interface DemoTrack {
  id: string;
  title: string;
  artist: string;
  votes: number;
  hasVoted: boolean;
  thumbnail: string;
}

export default function LandingPage() {
  // Interactive demo state so users can test voting right in the hero
  const [demoTracks, setDemoTracks] = useState<DemoTrack[]>([
    {
      id: "1",
      title: "Resonance - Synthwave Night Ride",
      artist: "HOME",
      votes: 42,
      hasVoted: true,
      thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "2",
      title: "Lofi Study Session - Deep Focus Beats",
      artist: "ChillHop Music",
      votes: 38,
      hasVoted: false,
      thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "3",
      title: "Midnight City (Live Electronic Mix)",
      artist: "M83",
      votes: 27,
      hasVoted: false,
      thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80",
    },
  ]);

  const [nowPlaying] = useState({
    title: "Coffee Break Vibes (Instrumental Lo-Fi)",
    artist: "ChilledCow",
    progress: "02:45 / 03:30",
  });

  const handleDemoVote = (id: string) => {
    setDemoTracks((prev) =>
      prev
        .map((track) => {
          if (track.id === id) {
            const willVote = !track.hasVoted;
            return {
              ...track,
              votes: willVote ? track.votes + 1 : track.votes - 1,
              hasVoted: willVote,
            };
          }
          return track;
        })
        .sort((a, b) => b.votes - a.votes)
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <Appbar />
      <Redirect />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Value Proposition & CTA */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm mb-6">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Broadcast Music Queue
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.08]">
                Turn your live chat into your resident{" "}
                <span className="underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-8">
                  stream DJ.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                Stop guessing what your chat wants to hear. Muzzi lets your viewers suggest YouTube tracks and upvote in real time. The crowd favorite automatically queues next on your stream.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => signIn()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-100"
                >
                  <span>Launch Stream Deck</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors shadow-sm"
                >
                  How It Works
                </a>
              </div>

              {/* Broadcaster Trust Points */}
              <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Zero downloads for viewers
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  OBS & Streamlabs compatible
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  10s real-time queue sync
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Live Stream Preview Simulator */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-xl transition-colors">
                
                {/* Simulator Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Live Queue Simulator
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    interactive preview
                  </span>
                </div>

                {/* Now Playing Bar in Demo */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 mb-4 dark:border-zinc-800 dark:bg-zinc-950 transition-colors">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-zinc-700 dark:text-zinc-300">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Now Playing
                    </span>
                    <span className="font-mono text-[11px]">{nowPlaying.progress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">{nowPlaying.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{nowPlaying.artist}</p>
                    </div>
                    {/* Equalizer animation */}
                    <div className="flex items-end gap-1 h-4">
                      <span className="w-1 bg-zinc-800 dark:bg-zinc-200 h-2.5 animate-pulse rounded-full" />
                      <span className="w-1 bg-zinc-600 dark:bg-zinc-400 h-4 animate-pulse rounded-full" />
                      <span className="w-1 bg-zinc-800 dark:bg-zinc-200 h-1.5 animate-pulse rounded-full" />
                      <span className="w-1 bg-zinc-600 dark:bg-zinc-400 h-3.5 animate-pulse rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Next Up Queue in Demo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Audience Votes</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Click arrow to test</span>
                  </div>

                  {demoTracks.map((track, idx) => {
                    const isNext = idx === 0;
                    return (
                      <div
                        key={track.id}
                        className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all ${
                          isNext
                            ? "border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.06]"
                            : "border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-950/60"
                        }`}
                      >
                        <span
                          className={`text-xs font-bold font-mono w-5 text-center ${
                            isNext ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-600"
                          }`}
                        >
                          #{idx + 1}
                        </span>

                        <div className="h-10 w-14 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {track.artist}
                            {isNext && (
                              <span className="ml-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                                • Next to play
                              </span>
                            )}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDemoVote(track.id)}
                          aria-label={`Vote for ${track.title}`}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold font-mono transition-all active:scale-[0.96] ${
                            track.hasVoted
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                              : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                          }`}
                        >
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{track.votes}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Live sorting by vote tally</span>
                  <button
                    onClick={() => signIn()}
                    className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
                  >
                    Go Live &rarr;
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-zinc-100/50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Simple Workflow
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Three steps to audience-driven audio
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2.5">
              Set up your stream room once. Your viewers handle track curation while you stream.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-bold font-mono text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-4">
                01
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Launch Your Room
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Sign in and open your private stream deck. Copy your unique audience link and share it in your stream chat, Twitch command, or Discord.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-bold font-mono text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-4">
                02
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Fans Submit & Upvote
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Viewers paste YouTube links from mobile or desktop. As the audience votes, the queue dynamically reorders in real time.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-bold font-mono text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-4">
                03
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Autoplay Top Track
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Hit "Play Next Track" on your stage. The number-one voted track plays directly through your browser, chosen by your audience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built For Broadcasters (Real Capabilities) */}
      <section className="py-20 bg-white dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Capabilities
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Built for streamers who care about chat vibe
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-3.5 shadow-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-zinc-950 dark:text-white mb-1.5">YouTube Audio & Video</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Fans can suggest tracks, synthwave sets, gaming soundtracks, or live performances directly from YouTube.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-3.5 shadow-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-zinc-950 dark:text-white mb-1.5">Creator Moderation</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You maintain full control. Remove unwanted tracks with a single click from your private broadcaster deck.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-3.5 shadow-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-zinc-950 dark:text-white mb-1.5">OBS & Desktop Audio Ready</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Stream audio cleanly through your browser tab directly into OBS Studio, Streamlabs, or virtual audio cables.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-3.5 shadow-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-zinc-950 dark:text-white mb-1.5">Duplicate Prevention</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Avoids song spam. If a song is already queued, audience members upvote the existing track instead of duplicating it.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-3.5 shadow-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-zinc-950 dark:text-white mb-1.5">No Audience Sign-Up Barrier</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Audience members access the room link immediately in any mobile or desktop browser without installing anything.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-3.5 shadow-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-zinc-950 dark:text-white mb-1.5">Continuous Auto-Sync</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Votes and track requests stay synchronized between all viewers and your stream console every 10 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-8 sm:p-12 shadow-sm transition-colors">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Ready to let your chat DJ your stream?
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
              Set up your stream room in under a minute. Built specifically for live creators and broadcasters.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => signIn()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all active:scale-[0.98]"
              >
                Launch Muzzi Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 py-8 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">muzzi</span>
            <span>&copy; {new Date().getFullYear()} Collaborative Stream Audio.</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => signIn()} className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Sign In
            </button>
            <a href="#how-it-works" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Workflow
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span>Broadcaster Audio Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
