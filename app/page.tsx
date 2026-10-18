"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  duration: string;
  submittedBy: string;
  audioSrc: string;
}

interface StreamPreset {
  id: string;
  name: string;
  tag: string;
  playbackRate: number;
  nowPlaying: {
    title: string;
    artist: string;
    duration: string;
    thumbnail: string;
    audioSrc: string;
  };
  tracks: DemoTrack[];
}

const STREAM_PRESETS: StreamPreset[] = [
  {
    id: "synthwave",
    name: "Synthwave Night Drive",
    tag: "High Energy / Gaming",
    playbackRate: 1.0,
    nowPlaying: {
      title: "Resonance (Broadcast Remaster)",
      artist: "Alexi Action & Studio Synth",
      duration: "02:35",
      thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
      audioSrc: "/audio/synthwave.ogg",
    },
    tracks: [
      {
        id: "s1",
        title: "Tech Noir - Studio Master",
        artist: "GUNSHIP",
        votes: 48,
        hasVoted: true,
        thumbnail: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80",
        duration: "02:35",
        submittedBy: "@pixel_samurai",
        audioSrc: "/audio/synthwave.ogg",
      },
      {
        id: "s2",
        title: "Turbo Killer (Live Session)",
        artist: "Carpenter Brut",
        votes: 39,
        hasVoted: false,
        thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80",
        duration: "02:35",
        submittedBy: "@cyber_dj",
        audioSrc: "/audio/synthwave.ogg",
      },
      {
        id: "s3",
        title: "Midnight City (Electronic Cut)",
        artist: "M83",
        votes: 27,
        hasVoted: false,
        thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
        duration: "02:35",
        submittedBy: "@neon_rider",
        audioSrc: "/audio/synthwave.ogg",
      },
    ],
  },
  {
    id: "lofi",
    name: "Deep Focus Lo-Fi",
    tag: "Chill / Coding & Study",
    playbackRate: 0.88, // Slowed down for warm chill tape aesthetic
    nowPlaying: {
      title: "Coffee Break Vibes (Slowed Tape Edit)",
      artist: "ChilledCow & Tape Friends",
      duration: "02:56",
      thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80",
      audioSrc: "/audio/synthwave.ogg",
    },
    tracks: [
      {
        id: "l1",
        title: "Late Night Rooftop Thoughts",
        artist: "Kudasaibeats",
        votes: 52,
        hasVoted: true,
        thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80",
        duration: "02:56",
        submittedBy: "@tea_drinker",
        audioSrc: "/audio/synthwave.ogg",
      },
      {
        id: "l2",
        title: "Midnight Tokyo Walk (Tape Beat)",
        artist: "Saib",
        votes: 34,
        hasVoted: false,
        thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
        duration: "02:56",
        submittedBy: "@dev_stream",
        audioSrc: "/audio/synthwave.ogg",
      },
      {
        id: "l3",
        title: "Autumn Breeze in Kyoto",
        artist: "Nujabes Tribute",
        votes: 29,
        hasVoted: false,
        thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80",
        duration: "02:56",
        submittedBy: "@lofi_coder",
        audioSrc: "/audio/synthwave.ogg",
      },
    ],
  },
  {
    id: "chatting",
    name: "Just Chatting Variety",
    tag: "Community Favorites",
    playbackRate: 1.05,
    nowPlaying: {
      title: "Awake (Electronic Chillout)",
      artist: "Tycho & Stream Crowd",
      duration: "02:28",
      thumbnail: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80",
      audioSrc: "/audio/synthwave.ogg",
    },
    tracks: [
      {
        id: "c1",
        title: "Intro - The xx (Extended Mix)",
        artist: "The xx",
        votes: 61,
        hasVoted: true,
        thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80",
        duration: "02:28",
        submittedBy: "@stream_mod_jen",
        audioSrc: "/audio/synthwave.ogg",
      },
      {
        id: "c2",
        title: "Get Lucky (Daft Punk Tribute)",
        artist: "Nile Rodgers Live",
        votes: 44,
        hasVoted: false,
        thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
        duration: "02:28",
        submittedBy: "@retro_gamer",
        audioSrc: "/audio/synthwave.ogg",
      },
      {
        id: "c3",
        title: "Starboy (Synthwave Bootleg)",
        artist: "The Weeknd & Kavinsky",
        votes: 31,
        hasVoted: false,
        thumbnail: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80",
        duration: "02:28",
        submittedBy: "@chat_hype",
        audioSrc: "/audio/synthwave.ogg",
      },
    ],
  },
];

export default function LandingPage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("synthwave");
  const activePreset = STREAM_PRESETS.find((p) => p.id === selectedPresetId) || STREAM_PRESETS[0];

  // Active track on the live sound deck
  const [currentTrack, setCurrentTrack] = useState<{
    title: string;
    artist: string;
    duration: string;
    thumbnail: string;
    audioSrc: string;
  }>(activePreset.nowPlaying);

  // Queue tracks state
  const [demoTracks, setDemoTracks] = useState<DemoTrack[]>(activePreset.tracks);
  
  // Real Audio playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isAudioConnectedRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(155);
  const [visualizerFrequencies, setVisualizerFrequencies] = useState<number[]>(new Array(16).fill(12));

  const [newTrackInput, setNewTrackInput] = useState<string>("");
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  // Sync demo tracks and active track when preset switches
  useEffect(() => {
    setCurrentTrack(activePreset.nowPlaying);
    setDemoTracks(activePreset.tracks);
    setCurrentTimeSec(0);

    if (audioRef.current) {
      audioRef.current.playbackRate = activePreset.playbackRate;
      if (isPlaying) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }
    triggerToast(`Switched channel to "${activePreset.name}"`);
  }, [selectedPresetId]);

  // Setup Web Audio API Analyser for real-time visualizer frequencies
  const initWebAudio = useCallback(() => {
    if (isAudioConnectedRef.current || !audioRef.current || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      analyserRef.current = analyser;
      isAudioConnectedRef.current = true;
    } catch (e) {
      console.warn("Web Audio API initialization fallback:", e);
    }
  }, []);

  // Update visualizer frame loop
  useEffect(() => {
    if (!isPlaying) {
      setVisualizerFrequencies(new Array(16).fill(8));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const updateSpectrum = () => {
      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 16 discrete bands across the spectrum
        const step = Math.max(1, Math.floor(bufferLength / 16));
        const sampled: number[] = [];
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          // Scale from 0-255 to percentage 10% - 100%
          const pct = Math.max(10, Math.min(100, Math.round((val / 255) * 100)));
          sampled.push(pct);
        }
        setVisualizerFrequencies(sampled);
      } else {
        // Fallback simulated equalizer heights if direct analyser isn't active
        const dynamicValues = [
          Math.floor(35 + Math.random() * 55),
          Math.floor(25 + Math.random() * 70),
          Math.floor(40 + Math.random() * 60),
          Math.floor(55 + Math.random() * 45),
          Math.floor(30 + Math.random() * 65),
          Math.floor(45 + Math.random() * 55),
          Math.floor(20 + Math.random() * 75),
          Math.floor(50 + Math.random() * 50),
          Math.floor(40 + Math.random() * 60),
          Math.floor(60 + Math.random() * 40),
          Math.floor(30 + Math.random() * 65),
          Math.floor(55 + Math.random() * 45),
          Math.floor(35 + Math.random() * 55),
          Math.floor(25 + Math.random() * 70),
          Math.floor(45 + Math.random() * 50),
          Math.floor(30 + Math.random() * 60),
        ];
        setVisualizerFrequencies(dynamicValues);
      }
      animationFrameRef.current = requestAnimationFrame(updateSpectrum);
    };

    animationFrameRef.current = requestAnimationFrame(updateSpectrum);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Master Play / Pause audio controller
  const togglePlayAudio = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.playbackRate = activePreset.playbackRate;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          triggerToast(`Now Playing: ${currentTrack.title}`);
        })
        .catch((err) => {
          console.warn("Audio play prevented:", err);
          setIsPlaying(true);
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      triggerToast("Paused Stream Audio Deck");
    }
  };

  // Play a specific track (e.g. from the queue or hero CTA)
  const playSpecificTrack = (track: {
    title: string;
    artist: string;
    duration: string;
    thumbnail: string;
    audioSrc: string;
  }) => {
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.audioSrc;
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = activePreset.playbackRate;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          triggerToast(`On Air: ${track.title}`);
        })
        .catch((e) => {
          console.warn("Audio play issue:", e);
        });
    }
  };

  // Handle Song Ending -> Autoplay next top-voted track from the queue!
  const handleAudioEnded = () => {
    if (demoTracks.length > 0) {
      const nextSong = demoTracks[0];
      setDemoTracks((prev) => prev.slice(1));
      playSpecificTrack({
        title: nextSong.title,
        artist: nextSong.artist,
        duration: nextSong.duration,
        thumbnail: nextSong.thumbnail,
        audioSrc: nextSong.audioSrc,
      });
      triggerToast(`Audience favorite "${nextSong.title}" is now playing!`);
    } else {
      // Loop current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    if (audioRef.current) {
      audioRef.current.volume = newVal / 100;
      const shouldMute = newVal === 0;
      audioRef.current.muted = shouldMute;
      setIsMuted(shouldMute);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(80);
      audioRef.current.volume = 0.8;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTimeSec(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  // Live Voting Handler (Dynamically re-orders queue)
  const handleDemoVote = (id: string) => {
    setDemoTracks((prev) => {
      const updated = prev.map((track) => {
        if (track.id === id) {
          const willVote = !track.hasVoted;
          const newVotes = willVote ? track.votes + 1 : track.votes - 1;
          triggerToast(willVote ? `+1 Upvote for "${track.title}"` : `Upvote removed for "${track.title}"`);
          return {
            ...track,
            votes: newVotes,
            hasVoted: willVote,
          };
        }
        return track;
      });
      return [...updated].sort((a, b) => b.votes - a.votes);
    });
  };

  // User Ingestion Form Handler
  const handleAddTrack = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = newTrackInput.trim();
    if (!query) return;

    const newSong: DemoTrack = {
      id: "user-" + Date.now(),
      title: query.length > 34 ? query.slice(0, 34) + "..." : query,
      artist: "YouTube Audio Stream",
      votes: 1,
      hasVoted: true,
      thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
      duration: "02:35",
      submittedBy: "@you_viewer",
      audioSrc: "/audio/synthwave.ogg",
    };

    setDemoTracks((prev) => [...prev, newSong].sort((a, b) => b.votes - a.votes));
    setNewTrackInput("");
    triggerToast(`Queued "${newSong.title}" into the live deck!`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans transition-colors selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-400">
      <Appbar />
      <Redirect />

      {/* Hidden Native Audio Element with real source */}
      <audio
        ref={audioRef}
        src={currentTrack.audioSrc}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTimeSec(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setDurationSec(audioRef.current.duration);
          }
        }}
        onEnded={handleAudioEnded}
      />

      {/* Broadcast Studio Ticker Ribbon */}
      <div className="border-b border-zinc-200/80 bg-zinc-100/90 dark:border-zinc-800/80 dark:bg-zinc-900/60 text-[11px] font-mono tracking-tight text-zinc-600 dark:text-zinc-400 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-y-1 gap-x-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">
              Muzzi Studio Console v2.4
            </span>
            <span className="hidden md:inline text-zinc-400 dark:text-zinc-600">|</span>
            <span className="hidden md:inline flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              Audio Output Bus: {isPlaying ? "48kHz Live Stream (Audible)" : "Standby / Ready"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] sm:text-[11px]">
            <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Audience Ingestion: Open
            </span>
            <span className="hidden sm:inline text-zinc-400 dark:text-zinc-600">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Zero Lag Sync
            </span>
            <span className="hidden lg:inline text-zinc-400 dark:text-zinc-600">|</span>
            <span className="hidden lg:inline text-zinc-500">OBS & Browser Dock Native</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 border-b border-zinc-200 dark:border-zinc-800 bg-studio-grid">
        {/* Subtle Ambient Studio Lighting Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-indigo-500/10 via-violet-500/5 to-transparent blur-3xl opacity-70 dark:opacity-40" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            
            {/* Left Column: Broadcaster Value Proposition */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Studio Status Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Broadcaster Audio Deck</span>
                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">Audience DJ Engine</span>
              </div>

              {/* Commanding Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.08]">
                Turn your live chat into your resident{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300 bg-clip-text text-transparent underline decoration-indigo-400/30 underline-offset-8">
                  crowd DJ.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                Hand over the aux cord without risking stream chaos. Muzzi lets your viewers suggest YouTube tracks and upvote in real time. The crowd favorite automatically queues next on your stream.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => signIn()}
                  className="group relative inline-flex items-center justify-center gap-2.5 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-zinc-950/10 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Launch Stream Deck</span>
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Instant Listen to Demo Audio Button */}
                <button
                  onClick={togglePlayAudio}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-semibold transition-all shadow-sm active:scale-[0.98] ${
                    isPlaying
                      ? "border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>Listening to Demo (Pause)</span>
                      <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>Listen to Demo Song</span>
                      <span className="rounded bg-indigo-200/60 dark:bg-indigo-900/60 text-[10px] font-mono px-1.5 py-0.5">
                        AUDIO ON
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Broadcaster Trust Points */}
              <div className="mt-8 flex flex-wrap items-center gap-y-2.5 gap-x-6 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Zero downloads or logins for viewers
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Instant OBS & Streamlabs Browser Dock
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Automated duplicate suppression
                </span>
              </div>
            </div>

            {/* Right Column: Live Interactive Broadcast Studio Console */}
            <div id="studio-demo" className="lg:col-span-5">
              <div className="relative rounded-2xl border border-zinc-200/90 bg-white/95 p-5 dark:border-zinc-800 dark:bg-zinc-900/90 shadow-2xl transition-all ring-1 ring-zinc-900/5 dark:ring-white/10 studio-glass">
                
                {/* Simulator Header / Audio Bus Indicator */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" : "bg-amber-500"}`} />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        Live Sound Deck
                        <span className={`text-[10px] font-mono font-medium rounded px-1.5 py-0.2 ${
                          isPlaying
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                          {isPlaying ? "ON AIR (AUDIBLE)" : "READY"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Channel Presets Selector */}
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg text-[10px] font-medium">
                    {STREAM_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`px-2 py-1 rounded-md transition-all ${
                          selectedPresetId === preset.id
                            ? "bg-white text-zinc-900 font-semibold shadow-xs dark:bg-zinc-700 dark:text-white"
                            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                        }`}
                      >
                        {preset.id === "synthwave" ? "Synth" : preset.id === "lofi" ? "Lo-Fi" : "Chat"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Broadcast Audio Banner Notice */}
                {!isPlaying && (
                  <div className="mb-3 rounded-lg border border-indigo-200/70 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/30 p-2.5 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                      <span>Click <strong>&quot;Play Deck&quot;</strong> to hear the real stream audio through your speakers.</span>
                    </span>
                    <button
                      onClick={togglePlayAudio}
                      className="rounded bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 flex-shrink-0 ml-2"
                    >
                      ▶ Play
                    </button>
                  </div>
                )}

                {/* Broadcast VU dB Meters & Live Spectrum Visualizer (Synchronized to Real Audio Frequencies) */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-100/70 p-3 mb-4 dark:border-zinc-800/80 dark:bg-zinc-950/80">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                      MASTER BUS (STEREO L/R)
                    </span>
                    <span className={`font-semibold ${isPlaying ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                      {isPlaying ? (isMuted ? "MUTED" : "-4.8 dB VU") : "STANDBY"}
                    </span>
                  </div>

                  {/* Dynamic Multi-Bar Spectrum Visualizer reacting to Web Audio Frequencies */}
                  <div className="h-10 w-full flex items-end justify-between gap-1 px-1 py-1 bg-zinc-200/60 dark:bg-zinc-900/90 rounded-lg overflow-hidden">
                    {visualizerFrequencies.map((pct, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-indigo-500 via-violet-500 to-emerald-400 rounded-xs transition-all duration-75"
                        style={{
                          height: isPlaying ? `${pct}%` : "5px",
                          opacity: isPlaying ? (isMuted ? 0.3 : 0.9) : 0.25,
                        }}
                      />
                    ))}
                  </div>

                  {/* VU Scale Markers */}
                  <div className="flex justify-between text-[9px] font-mono text-zinc-400 dark:text-zinc-600 mt-1 px-1">
                    <span>-24dB</span>
                    <span>-18dB</span>
                    <span>-12dB</span>
                    <span>-6dB</span>
                    <span className={isPlaying ? "text-emerald-500 font-bold" : "text-zinc-500"}>
                      0dB PEAK
                    </span>
                  </div>
                </div>

                {/* Now Playing Studio Card with Real Audio Controls */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/30 p-3.5 mb-4 dark:border-indigo-500/20 dark:bg-indigo-950/20 transition-all">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
                    <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-indigo-700 dark:text-indigo-300">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-emerald-500 animate-ping" : "bg-zinc-400"}`} />
                      {isPlaying ? "On Air Audio Output" : "Now Queued (Paused)"}
                    </span>

                    {/* Master Play / Pause Deck Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlayAudio}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-all active:scale-[0.96] ${
                          isPlaying
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                            : "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700 animate-pulse"
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                            <span>Pause Deck</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>Play Deck</span>
                          </>
                        )}
                      </button>

                      <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {formatTime(currentTimeSec)} / {formatTime(durationSec)}
                      </span>
                    </div>
                  </div>

                  {/* Album Cover & Track Info */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-14 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex-shrink-0 shadow-sm">
                      <img
                        src={currentTrack.thumbnail}
                        alt={currentTrack.title}
                        className="h-full w-full object-cover"
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-3.5">
                            <span className="w-0.5 bg-white h-2.5 animate-eq-1 rounded-full" />
                            <span className="w-0.5 bg-white h-3.5 animate-eq-2 rounded-full" />
                            <span className="w-0.5 bg-white h-2 animate-eq-3 rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-zinc-950 dark:text-zinc-100 truncate">
                        {currentTrack.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <span className="truncate">{currentTrack.artist}</span>
                        {isPlaying && (
                          <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono px-1 flex-shrink-0">
                            Streaming
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Volume & Mute Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                        className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                      >
                        {isMuted || volume === 0 ? (
                          <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0a7 7 0 0 1-.5 2.6" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        )}
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="w-16 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        title={`Volume: ${isMuted ? 0 : volume}%`}
                      />
                    </div>
                  </div>

                  {/* Interactive Scrubbing Slider */}
                  <div className="mt-3">
                    <input
                      type="range"
                      min="0"
                      max={durationSec || 155}
                      value={currentTimeSec}
                      onChange={handleSeek}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                      title="Seek timeline"
                    />
                  </div>
                </div>

                {/* Queue Header & Live Action Cue */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      Audience Queue ({demoTracks.length} tracks)
                      <span className="text-[10px] font-mono text-zinc-400">Auto-Sorted</span>
                    </span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      Click ▲ to vote or ▶ to play
                    </span>
                  </div>

                  {/* Tracks List */}
                  {demoTracks.map((track, idx) => {
                    const isNext = idx === 0;
                    return (
                      <div
                        key={track.id}
                        className={`group flex items-center gap-3 rounded-xl border p-2.5 transition-all ${
                          isNext
                            ? "border-indigo-500/40 bg-indigo-500/[0.04] dark:border-indigo-500/30 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/10"
                            : "border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100/70 dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:hover:bg-zinc-900/80"
                        }`}
                      >
                        {/* Rank Number */}
                        <div className="flex flex-col items-center justify-center w-6 text-center">
                          <span
                            className={`text-xs font-bold font-mono ${
                              isNext ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Thumbnail with hover Play trigger */}
                        <div
                          onClick={() =>
                            playSpecificTrack({
                              title: track.title,
                              artist: track.artist,
                              duration: track.duration,
                              thumbnail: track.thumbnail,
                              audioSrc: track.audioSrc,
                            })
                          }
                          className="h-10 w-13 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex-shrink-0 relative cursor-pointer group-hover:ring-1 group-hover:ring-indigo-500"
                          title="Click to play this track now"
                        >
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                        {/* Track Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {track.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="truncate">{track.artist}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="font-mono text-[10px]">{track.duration}</span>
                            {isNext && (
                              <span className="rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold text-[10px] px-1 py-0.2">
                                Next Up
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Play Now Mini Button */}
                        <button
                          onClick={() =>
                            playSpecificTrack({
                              title: track.title,
                              artist: track.artist,
                              duration: track.duration,
                              thumbnail: track.thumbnail,
                              audioSrc: track.audioSrc,
                            })
                          }
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-indigo-600 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-indigo-300 transition-colors"
                          title="Play this track now"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>

                        {/* Interactive Upvote Button */}
                        <button
                          onClick={() => handleDemoVote(track.id)}
                          aria-label={`Vote for ${track.title}`}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold font-mono transition-all active:scale-[0.95] ${
                            track.hasVoted
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700"
                              : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                          }`}
                        >
                          <svg
                            className={`h-3.5 w-3.5 transition-transform ${track.hasVoted ? "scale-110" : ""}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{track.votes}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Track Submission Box (Simulator Trial) */}
                <form onSubmit={handleAddTrack} className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTrackInput}
                      onChange={(e) => setNewTrackInput(e.target.value)}
                      placeholder="Try queueing a song (e.g. Daft Punk - One More Time)..."
                      className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors"
                    >
                      <span>Add</span>
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </form>

                {/* Status Toast / Chat activity pill */}
                {statusToast && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-900/90 text-white dark:bg-white/95 dark:text-zinc-900 px-3 py-1.5 text-xs animate-fade-in shadow-md">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {statusToast}
                    </span>
                    <span className="text-[10px] font-mono opacity-70">LIVE</span>
                  </div>
                )}

                {/* Bottom Footer Info */}
                <div className="mt-3.5 pt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="text-[11px] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Real audio player active
                  </span>
                  <button
                    onClick={() => signIn()}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Open Full Broadcast Console &rarr;
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Broadcaster Metrics Ribbon */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
                0 Sec
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Viewer Onboarding Lag (No App Needed)
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                &lt; 35ms
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Real-Time WebSocket Sync
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
                100%
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Host Veto & Skip Moderation
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                OBS / Web
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Native Browser Source Compatibility
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Signal Pipeline: How It Works */}
      <section id="how-it-works" className="py-20 bg-zinc-100/50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/60 dark:bg-indigo-950/30 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Streamer Audio Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              The 3-stage collaborative signal chain
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
              Designed so creators stay fully in control of the stream while the audience drives the vibe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Step 1 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:border-indigo-500/30">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold font-mono text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
                  01
                </span>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Ingestion
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Share Your Room URL
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Open your stream room and pin your custom link in Twitch chat, Discord, or stream description. Viewers open it instantly in any browser without signing in.
              </p>
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-xs font-mono text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>muzzi.live/creator/YOUR_ID</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:border-indigo-500/30">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold font-mono text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
                  02
                </span>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Consensus Engine
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Live Chat Votes & Submits
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Fans paste YouTube songs and upvote bangers. The real-time algorithm sorts the highest-voted track to the top with built-in anti-spam duplicate suppression.
              </p>
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
                <span>⚡ Sub-second WebSocket tallies</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:border-indigo-500/30">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold font-mono text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
                  03
                </span>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Broadcast Stage
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Continuous Stream Output
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                As each song wraps, Muzzi plays the crowd favorite next. You retain a 1-click skip/veto button on your creator deck to kill unwanted audio instantly.
              </p>
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                <span>✓ Direct YouTube player playback</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Built For Broadcasters: Pro Capabilities Matrix */}
      <section className="py-20 bg-white dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Engineered For Streamers
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Studio-grade controls, zero chat friction
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2.5">
              Everything you need to deliver an interactive audio experience without cluttering your streaming workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-xs hover:border-indigo-500/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-600 dark:border-indigo-900 dark:bg-zinc-800 dark:text-indigo-400 mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Infinite YouTube Library
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Fans can queue synthwave albums, lofi study sessions, live DJ sets, or viral gaming tunes directly by URL or keyword search.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-xs hover:border-indigo-500/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-600 dark:border-indigo-900 dark:bg-zinc-800 dark:text-indigo-400 mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Creator Stage Veto & Purge
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You hold the master switch. Remove unwanted tracks, skip immediately, or reset queue with a single click from your private broadcaster deck.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-xs hover:border-indigo-500/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-600 dark:border-indigo-900 dark:bg-zinc-800 dark:text-indigo-400 mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Duplicate Spam Filter
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Prevents repeat song spam. If chat submits a song that is already queued, Muzzi intelligently increments that song&apos;s vote tally instead.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-xs hover:border-indigo-500/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-600 dark:border-indigo-900 dark:bg-zinc-800 dark:text-indigo-400 mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                OBS & Streamlabs Docks
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Dock Muzzi inside OBS Studio as a custom browser dock. Monitor audience votes without ever taking your eyes off your stream canvas.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-xs hover:border-indigo-500/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-600 dark:border-indigo-900 dark:bg-zinc-800 dark:text-indigo-400 mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Frictionless Viewer Access
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Audiences scan a QR code on stream or click a chat link. No account creation, no Discord bot permissions, no mobile app installs.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-xs hover:border-indigo-500/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-600 dark:border-indigo-900 dark:bg-zinc-800 dark:text-indigo-400 mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white mb-2">
                Sub-Second Broadcast Sync
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Queue standings update in real time across every viewer device so your audience feels immediate tactile feedback when their votes move the leaderboard.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Streamer FAQ Accordion */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Broadcaster Questions
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Frequently asked by creators
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Do my stream viewers need to create an account or install anything?",
                a: "Never. Viewers simply open your stream room link on their phone or desktop browser. They can search YouTube, paste links, and vote immediately without providing any personal data or registering an account.",
              },
              {
                q: "How does Muzzi prevent trolls from playing disruptive or loud audio?",
                a: "You retain full moderation authority. Your private broadcaster console includes an instant 1-click 'Skip / Veto' button that purges the track and jumps to the next crowd favorite. You can also clear the entire queue or blacklist specific video IDs anytime.",
              },
              {
                q: "Can I dock Muzzi directly inside OBS Studio or Streamlabs?",
                a: "Yes! Muzzi works seamlessly as a custom OBS Browser Dock (Docks → Custom Browser Docks). You can view the live queue and trigger playback without switching windows during intense gaming matches.",
              },
              {
                q: "What happens if my stream queue runs out of songs?",
                a: "You can keep a fallback default playlist or add your own favorite background playlist into the queue. When chat submits tracks, they will naturally bubble up to the top and play next.",
              },
              {
                q: "How do duplicate song submissions get handled?",
                a: "If multiple viewers try submitting the same YouTube song, Muzzi detects the matching video ID and automatically increments the existing song's upvote count rather than clogging your queue with duplicate entries.",
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-sm sm:text-base text-zinc-950 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="ml-4 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-300">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Broadcast Launch Command Center CTA */}
      <section className="py-20 bg-zinc-100/60 dark:bg-zinc-950 transition-colors relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-8 sm:p-14 shadow-2xl shadow-indigo-500/5 transition-colors">
            
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Stage Ready
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Ready to give your chat the aux cord?
            </h3>
            
            <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto leading-relaxed">
              Set up your broadcaster room in under 60 seconds. Sign in with Google, grab your stream link, and let your audience curate your audio live.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
              <button
                onClick={() => signIn()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-white shadow-xl hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all active:scale-[0.98]"
              >
                <span>Launch Muzzi Console</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                onClick={togglePlayAudio}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d={isPlaying ? "M6 19h4V5H6v14zm8-14v14h4V5h-4z" : "M8 5v14l11-7z"} />
                </svg>
                <span>{isPlaying ? "Pause Demo Audio" : "Listen to Stream Audio"}</span>
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Free for all live broadcasters</span>
              <span>•</span>
              <span>Twitch / YouTube / Kick ready</span>
            </div>

          </div>
        </div>
      </section>

      {/* Broadcast Studio Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 py-10 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 10v4" />
                  <path d="M7 6v12" />
                  <path d="M11 3v18" />
                  <path d="M15 8v8" />
                  <path d="M19 5v14" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-sm text-zinc-950 dark:text-white">muzzi</span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">Collaborative Live Broadcast Audio</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-600 dark:text-zinc-400">
              <button onClick={() => signIn()} className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
                Broadcaster Login
              </button>
              <a href="#how-it-works" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
                Signal Chain
              </a>
              <a href="#studio-demo" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
                Soundstage Demo
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span className="font-mono text-[11px] text-zinc-500">ENGINE: WS-48K</span>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            <p>&copy; {new Date().getFullYear()} Muzzi Studio Audio Engine. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Broadcast Network Operational</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
