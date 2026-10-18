"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { YT_REGEX, extractYouTubeId } from "@/lib/util";
import { Appbar } from "./Appbar";
import Link from "next/link";
import QRCode from "qrcode";

export interface Video {
  id: string;
  title: string;
  extractedId: string;
  thumbnail: string;
  upvotes: number;
  haveVoted: boolean;
  active: boolean;
  type: string;
  userId: string;
  url: string;
}

interface Toast {
  id: string;
  message: string;
  type?: "info" | "success" | "error";
}

// --- ICONS ---
const PlayIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.006v3.988a1 1 0 001.555.838l3.428-1.994a1 1 0 000-1.676l-3.428-1.994z"
      clipRule="evenodd"
    />
  </svg>
);

const PauseIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h3a1 1 0 001-1V5a1 1 0 00-1-1H5zm7 0a1 1 0 00-1 1v10a1 1 0 001 1h3a1 1 0 001-1V5a1 1 0 00-1-1h-3z"
      clipRule="evenodd"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
      clipRule="evenodd"
    />
  </svg>
);

const ArrowUpIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const ShareIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const YouTubeIcon = () => (
  <svg className="h-4 w-4 text-red-600 dark:text-red-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);


declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

// --- MAIN STREAM VIEW COMPONENT ---
export default function StreamView({
  creatorId,
  share = false,
}: {
  creatorId: string;
  share?: boolean;
}) {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);
  const [currentVideoThumbnail, setCurrentVideoThumbnail] = useState<string | null>(null);

  // Compute effective high-res thumbnail for track display
  const effectiveThumbnail = useMemo(() => {
    if (currentVideoThumbnail) return currentVideoThumbnail;
    if (currentVideoId) return `https://img.youtube.com/vi/${currentVideoId}/hqdefault.jpg`;
    return "";
  }, [currentVideoThumbnail, currentVideoId]);

  const [videoQueue, setVideoQueue] = useState<Video[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Broadcaster & Audience state
  const [broadcasterState, setBroadcasterState] = useState<"PLAYING" | "PAUSED">("PLAYING");
  const [creatorIsPlaying, setCreatorIsPlaying] = useState(true);
  const [isYTReady, setIsYTReady] = useState(false);

  // Party Lounge Fullscreen Mode & QR Code
  const [isPartyMode, setIsPartyMode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedOverlay, setCopiedOverlay] = useState(false);

  // Built-in YouTube Search
  const [searchTab, setSearchTab] = useState<"search" | "url">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; title: string; channelTitle: string; thumbnail: string; url: string }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Session Track History
  const [sessionHistory, setSessionHistory] = useState<
    Array<{ id: string; title: string; thumbnail: string; playedAt: string; upvotes: number }>
  >([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [copiedTracklist, setCopiedTracklist] = useState(false);

  const playerRef = React.useRef<any>(null);

  const handleReloadPlayer = () => {
    setPlayerKey((k) => k + 1);
    addToast("Player reloaded", "info");
  };

  // Add toast helper
  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Generate QR Code for Party Lounge
  useEffect(() => {
    if (typeof window === "undefined" || !creatorId) return;
    const origin = window.location.origin;
    const roomUrl = `${origin}/creatorId/${creatorId}`;
    QRCode.toDataURL(roomUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).then(setQrCodeDataUrl).catch(console.error);
  }, [creatorId]);

  // Escape key closes Party Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPartyMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load Session History from localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !creatorId) return;
    try {
      const saved = localStorage.getItem(`muzzi_history_${creatorId}`);
      if (saved) {
        setSessionHistory(JSON.parse(saved));
      }
    } catch {}
  }, [creatorId]);

 

  // YouTube Instant Search API helper
  const handleSearchYouTube = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/streams/search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchError("Could not fetch YouTube results. Try pasting the direct link instead.");
    } finally {
      setIsSearching(false);
    }
  };

  // 1-Click Queue Track from YouTube Search
  const handleQueueTrackFromSearch = async (video: { url: string; title: string }) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          url: video.url,
        }),
      });

      if (!response.ok) {
        const resData = await response.json().catch(() => ({}));
        throw new Error(resData.message || "Could not add track.");
      }

      addToast(`Added "${video.title.slice(0, 26)}..." to queue!`, "success");
      setSearchQuery("");
      setSearchResults([]);
      await refreshStreams();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add song.";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Copy Tracklist to clipboard
  const handleCopyTracklist = async () => {
    if (sessionHistory.length === 0) {
      addToast("No tracks played in this session yet", "info");
      return;
    }
    const tracklistText = sessionHistory
      .map((item, idx) => `${idx + 1}. ${item.title} (🔥 ${item.upvotes} votes)`)
      .join("\n");

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tracklistText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = tracklistText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedTracklist(true);
      addToast("Copied session tracklist to clipboard!", "success");
      setTimeout(() => setCopiedTracklist(false), 2500);
    } catch {
      addToast("Failed to copy tracklist", "error");
    }
  };


  // Sorted Queue (Highest upvotes first)
  const sortedQueue = useMemo(() => {
    return [...videoQueue].sort((a, b) => b.upvotes - a.upvotes);
  }, [videoQueue]);

  // Next up video
  const nextVideo = sortedQueue[0] ?? null;

  // Fetch streams from API (Initial load + fallback sync)
  const refreshStreams = useCallback(async () => {
    if (!creatorId) return;
    try {
      setRefreshing(true);
      const response = await fetch(`/api/streams?creatorId=${encodeURIComponent(creatorId)}`);
      if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
        const data = await response.json();
        const streams = (data.streams || []).sort((a: Video, b: Video) => b.upvotes - a.upvotes);
        setVideoQueue(streams);

        // Sync stage stream:
        const serverCurrent = data.currentStream || data.activeStream || null;
        if (share) {
          // Audience view: strictly sync whatever server reports
          if (serverCurrent) {
            setCurrentVideoId(serverCurrent.extractedId);
            setCurrentVideoTitle(serverCurrent.title);
            setCurrentVideoThumbnail(serverCurrent.thumbnail || null);
            setBroadcasterState("PLAYING");
          } else {
            setCurrentVideoId(null);
            setCurrentVideoTitle(null);
            setCurrentVideoThumbnail(null);
            setBroadcasterState("PAUSED");
          }
        } else {
          // Broadcaster view: local player is the authoritative source!
          // NEVER interrupt or reset an ongoing song when refreshing the queue!
          if (serverCurrent) {
            setCurrentVideoId((prevId) => (prevId ? prevId : serverCurrent.extractedId));
            setCurrentVideoTitle((prevTitle) => (prevTitle ? prevTitle : serverCurrent.title));
            setCurrentVideoThumbnail((prevThumb) => (prevThumb ? prevThumb : (serverCurrent.thumbnail || null)));
          }
        }
      }
    } catch (err) {
      console.error("Error refreshing queue:", err);
    } finally {
      setRefreshing(false);
    }
  }, [creatorId, share]);

  // Stop Playback / Clear Stage (Broadcaster only)
  const handleStopPlayback = useCallback(async () => {
    setCurrentVideoId(null);
    setCurrentVideoTitle(null);
    setCurrentVideoThumbnail(null);
    setCreatorIsPlaying(false);
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }
    addToast("No song is playing currently", "info");

    try {
      const res = await fetch("/api/streams/next", {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Failed to clear playback on server");
      }
      await refreshStreams();
    } catch (err) {
      console.error("Error clearing playback:", err);
    }
  }, [addToast, refreshStreams]);

  // Play Next Song (Streamer only)
  const handlePlayNext = useCallback(async () => {
    // Record current track into session history before transitioning
    if (currentVideoId && currentVideoTitle) {
      const historyItem = {
        id: currentVideoId,
        title: currentVideoTitle,
        thumbnail: currentVideoThumbnail || `https://img.youtube.com/vi/${currentVideoId}/hqdefault.jpg`,
        playedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        upvotes: nextVideo ? nextVideo.upvotes : 0,
      };
      setSessionHistory((prev) => {
        const updated = [historyItem, ...prev.filter((h) => h.id !== currentVideoId)].slice(0, 25);
        try {
          localStorage.setItem(`muzzi_history_${creatorId}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    if (!nextVideo) {
      await handleStopPlayback();
      return;
    }

    const targetTrack = nextVideo;
    setCurrentVideoId(targetTrack.extractedId);
    setCurrentVideoTitle(targetTrack.title);
    setCurrentVideoThumbnail(targetTrack.thumbnail);
    setCreatorIsPlaying(true);

    // If YouTube Player is already active, immediately load and start the new track without waiting for effect
    if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
      loadedVideoIdRef.current = targetTrack.extractedId;
      try {
        playerRef.current.loadVideoById({
          videoId: targetTrack.extractedId,
          startSeconds: 0,
        });
        playerRef.current.playVideo();
      } catch (e) {
        console.error("Error switching video in handlePlayNext:", e);
      }
    }

    // Optimistically remove from queue
    setVideoQueue((prev) => prev.filter((v) => v.id !== targetTrack.id));
    addToast(`Now playing: "${targetTrack.title}"`, "info");

    try {
      const res = await fetch("/api/streams/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: targetTrack.id }),
      });

      if (!res.ok) {
        console.error("Failed to set next stream on server");
      }
      await refreshStreams();
    } catch (err) {
      console.error("Error playing next stream:", err);
    }
  }, [currentVideoId, currentVideoTitle, currentVideoThumbnail, nextVideo, creatorId, handleStopPlayback, addToast, refreshStreams]);

  // Veto / Skip Current Song (Streamer only)
  const handleSkipTrack = useCallback(async () => {
    if (sortedQueue.length > 0) {
      addToast("Skipping to next crowd-voted track...", "info");
      await handlePlayNext();
    } else {
      await handleStopPlayback();
    }
  }, [sortedQueue, handlePlayNext, handleStopPlayback, addToast]);

  // Handle song completion on creator's end
  const handleSongEnded = useCallback(async () => {
    setCreatorIsPlaying(false);
    await handleStopPlayback();
    addToast("Song completed. No song is playing currently.", "info");
  }, [handleStopPlayback, addToast]);


  // Smart Polling Effect (Option 2: Zero Extra Services / 100% Free on Vercel)
  // Polls /api/streams every 2.5s while tab is active, backs off to 15s when hidden, and refreshes immediately on tab focus
  useEffect(() => {
    if (!creatorId) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const poll = async () => {
      if (!isMounted) return;
      await refreshStreams();
      if (!isMounted) return;

      // Smart interval: 2500ms when tab is active/visible, 15000ms when hidden/backgrounded
      const interval = typeof document !== "undefined" && document.visibilityState === "visible" ? 2500 : 15000;
      timeoutId = setTimeout(poll, interval);
    };

    // Immediate initial fetch
    poll();

    // Re-sync immediately when user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (timeoutId) clearTimeout(timeoutId);
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [creatorId, refreshStreams]);

  // Load YouTube Iframe API once (Broadcaster only)
  useEffect(() => {
    if (share || typeof window === "undefined") return;

    if (window.YT && window.YT.Player) {
      setIsYTReady(true);
      return;
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      setIsYTReady(true);
    };

    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, [share]);

  // Stable refs to prevent rebuilding YouTube Player on queue updates, votes, or metadata changes
  const onSongEndedRef = React.useRef(handleSongEnded);
  useEffect(() => {
    onSongEndedRef.current = handleSongEnded;
  }, [handleSongEnded]);

  const loadedVideoIdRef = React.useRef<string | null>(null);

  // YouTube Player instance initialization (Broadcaster ONLY)
  useEffect(() => {
    // Audience view: strictly NEVER instantiate YouTube player or stream live audio/music!
    if (share) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
        loadedVideoIdRef.current = null;
      }
      return;
    }

    if (!isYTReady || !currentVideoId) {
      if (!currentVideoId && playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
        loadedVideoIdRef.current = null;
      }
      return;
    }

    // Guard: If the player already exists, handle video switching seamlessly in-place without rebuilding iframe
    if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
      if (loadedVideoIdRef.current === currentVideoId) {
        return; // Already playing this exact video. NEVER restart or recreate!
      }
      loadedVideoIdRef.current = currentVideoId;
      try {
        playerRef.current.loadVideoById({
          videoId: currentVideoId,
          startSeconds: 0,
        });
        playerRef.current.playVideo();
      } catch (e) {
        console.error("Error loading video by ID:", e);
      }
      return;
    }

    let isSubscribed = true;

    const setupPlayer = () => {
      if (!isSubscribed) return;
      const element = document.getElementById("muzzi-yt-player-target");
      if (!element) return;

      try {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {}
          playerRef.current = null;
        }

        playerRef.current = new window.YT.Player("muzzi-yt-player-target", {
          videoId: currentVideoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            controls: 1, // Broadcaster gets full player controls
            playsinline: 1,
            rel: 0,
            enablejsapi: 1,
            modestbranding: 1,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              if (!isSubscribed) return;
              loadedVideoIdRef.current = currentVideoId;
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              if (!isSubscribed) return;
              const state = event.data;

              if (state === 1) { // PLAYING
                setCreatorIsPlaying(true);
              } else if (state === 2) { // PAUSED
                setCreatorIsPlaying(false);
              } else if (state === 0) { // ENDED
                setCreatorIsPlaying(false);
                // Autoplay next track: Always trigger song completion callback
                onSongEndedRef.current();
              }
            },
          },
        });
      } catch (err) {
        console.error("Error creating YT Player:", err);
      }
    };

    const t = setTimeout(setupPlayer, 50);

    return () => {
      isSubscribed = false;
      clearTimeout(t);
    };
  }, [isYTReady, currentVideoId, share, playerKey]);

  const getYouTubeId = (url: string) => {
    return extractYouTubeId(url);
  };

  // Copy shareable link
  const handleShare = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/creatorId/${creatorId}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      addToast("Audience room link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
      addToast("Failed to copy link automatically.", "error");
    }
  };

  // Add song to queue
  const handleAddSong = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    const videoId = getYouTubeId(inputValue.trim());
    if (!videoId) {
      setError("Please enter a valid YouTube video or music link.");
      return;
    }

    if (videoQueue.some((v) => v.extractedId === videoId)) {
      setError("This song is already waiting in the queue.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creatorId,
          url: inputValue.trim(),
        }),
      });

      if (!response.ok) {
        const resData = await response.json().catch(() => ({}));
        throw new Error(resData.message || "Could not add track to queue.");
      }

      setInputValue("");
      addToast("Track submitted to queue!", "success");
      await refreshStreams();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add song.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote / Downvote
  const handleVote = async (id: string) => {
    const originalQueue = [...videoQueue];
    const targetVideo = videoQueue.find((v) => v.id === id);
    if (!targetVideo) return;

    const willBeVoted = !targetVideo.haveVoted;

    // Optimistic UI update
    setVideoQueue((prevQueue) =>
      prevQueue.map((video) => {
        if (video.id === id) {
          const newUpvotes = willBeVoted ? video.upvotes + 1 : Math.max(0, video.upvotes - 1);
          return { ...video, upvotes: newUpvotes, haveVoted: willBeVoted };
        }
        return video;
      })
    );

    try {
      const res = await fetch(`/api/streams/${willBeVoted ? "upvote" : "downvote"}`, {
        method: willBeVoted ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: id }),
      });

      if (!res.ok) {
        setVideoQueue(originalQueue);
        if (res.status === 401) {
          addToast("Please sign in to vote!", "error");
        } else {
          addToast("Failed to register vote. Please try again.", "error");
        }
      } else {
        refreshStreams();
      }
    } catch {
      setVideoQueue(originalQueue);
      addToast("Network issue while voting.", "error");
    }
  };

  // Toggle Play / Pause Stream (Streamer only)
  const handleTogglePlayPause = () => {
    if (!playerRef.current) return;
    try {
      const pState = typeof playerRef.current.getPlayerState === "function" ? playerRef.current.getPlayerState() : -1;
      const isPlaying = pState === 1;
      const willPlay = !isPlaying;

      if (willPlay) {
        playerRef.current.playVideo();
        setCreatorIsPlaying(true);
      } else {
        playerRef.current.pauseVideo();
        setCreatorIsPlaying(false);
      }
    } catch (err) {
      console.error("Error toggling play/pause:", err);
    }
  };

  // Delete song from queue (Streamer only)
  const handleDelete = async (id: string, title: string) => {
    setVideoQueue((prev) => prev.filter((v) => v.id !== id));
    addToast(`Removed "${title.slice(0, 30)}..." from queue`, "info");

    try {
      const res = await fetch("/api/streams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: id }),
      });

      if (!res.ok) {
        refreshStreams();
        addToast("Could not remove song from server.", "error");
      } else {
        refreshStreams();
      }
    } catch {
      refreshStreams();
      addToast("Network error removing song.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans transition-colors relative">
      <Appbar />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Room Header Strip */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                  {share ? "Audience Voting Lounge" : "Broadcaster Stream Deck"}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {share ? "CONNECTED" : "ON AIR"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {share
                  ? "Suggest YouTube songs & upvote your favorites. Top song plays next!"
                  : "Manage incoming music votes & direct playback for your live stream."}
              </p>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Live Polling Sync Indicator */}
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-500 dark:text-zinc-400 shadow-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  refreshing
                    ? "bg-emerald-400 ring-2 ring-emerald-400/40"
                    : "bg-emerald-500 animate-pulse"
                }`}
              />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Live Sync (2s)
              </span>
            </div>

            {/* Party Lounge Mode Toggle */}
            <button
              onClick={() => setIsPartyMode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-all shadow-sm focus:outline-none"
              title="Open Fullscreen TV Party Lounge with scannable QR Code"
            >
              <span>🎉</span>
              <span className="hidden sm:inline">Party Mode</span>
            </button>

            {/* Share Room Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-100"
            >
              {copied ? <CheckIcon /> : <ShareIcon />}
              <span>{copied ? "Copied Link" : "Share Link"}</span>
            </button>

            {/* If Creator, open fan view preview in new tab */}
            {!share && (
              <Link
                href={`/creatorId/${creatorId}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <span>Fan View</span>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Player Stage & Stream Controls (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* The Player Card */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-colors">
              <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${currentVideoId ? "bg-emerald-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600"}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {share ? "Now Playing Track" : "Live Video Stage"}
                  </span>
                  {currentVideoId && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      NOW PLAYING
                    </span>
                  )}
                </div>
                {currentVideoTitle && (
                  <div className="flex items-center gap-2 max-w-[280px] sm:max-w-[360px]">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate" title={currentVideoTitle}>
                      {currentVideoTitle}
                    </span>
                    {currentVideoId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex-shrink-0 flex items-center gap-1 text-[11px]"
                        title="Open on YouTube"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Video Frame */}
              <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                {currentVideoId ? (
                  <div className="relative w-full h-full">
                    {/* The YouTube iframe element target instantiated by window.YT.Player (ONLY on Broadcaster side) */}
                    {!share ? (
                      <div
                        id="muzzi-yt-player-target"
                        className="w-full h-full"
                      />
                    ) : (
                      /* For Audience: Show ONLY the song's thumbnail with clean album art presentation. NO live audio or music broadcast. */
                      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-zinc-950">
                        {/* Ambient blurred background glow from the track thumbnail */}
                        {effectiveThumbnail && (
                          <img
                            src={effectiveThumbnail}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110 pointer-events-none select-none"
                          />
                        )}

                        {/* Centered Album Cover & Track Details */}
                        <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-sm sm:max-w-md w-full">
                          <div className="relative group shadow-2xl rounded-2xl overflow-hidden border border-white/10 aspect-video w-full max-w-[280px] sm:max-w-[340px] mb-3 bg-zinc-900">
                            {effectiveThumbnail ? (
                              <img
                                src={effectiveThumbnail}
                                alt={currentVideoTitle || "Track cover"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                                <YouTubeIcon />
                              </div>
                            )}

                            {/* Live indicator overlay on thumbnail */}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 border border-white/10 text-[10px] font-semibold text-white shadow-sm">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  broadcasterState === "PLAYING" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                                }`}
                              />
                              <span>{broadcasterState === "PLAYING" ? "NOW PLAYING" : "STREAMER PAUSED"}</span>
                            </div>
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1 max-w-full mb-1 px-2" title={currentVideoTitle || ""}>
                            {currentVideoTitle}
                          </h3>
                          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                            {broadcasterState === "PLAYING" ? (
                              <>
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span>Broadcasting live on creator&apos;s stage</span>
                              </>
                            ) : (
                              <span>Playback paused by creator</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 max-w-md w-full">
                    {/* Alert Icon & Badge */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-3 shadow-inner">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-bold uppercase tracking-wider mb-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                      <span>Stage is Idle</span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-100">
                      No song is playing currently
                    </h3>

                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-xs">
                      {share
                        ? "The previous song ended. Waiting for the creator to start the next track. Suggest songs in the queue on the right!"
                        : sortedQueue.length > 0
                        ? "The song ended. Click 'Play Next Track' below to launch the next crowd-voted song!"
                        : "No songs queued yet. Submit a YouTube link or share your room link with viewers."}
                    </p>

                    {!share && sortedQueue.length > 0 && (
                      <button
                        onClick={handlePlayNext}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                      >
                        <PlayIcon />
                        <span>Play Next Track ({sortedQueue[0].title.slice(0, 24)}...)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Audience Visual Track Monitor Status Strip (No audio broadcast) */}
              {share && currentVideoId && (
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        broadcasterState === "PLAYING"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {broadcasterState === "PLAYING" ? "Live on Creator's Stage" : "Streamer Paused"}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      • Visual track monitor & queue voting
                    </span>
                  </div>

                  {/* External YouTube Link Button */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-750 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <YouTubeIcon />
                      <span>Listen on YouTube</span>
                      <svg className="h-3 w-3 text-zinc-400 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}

              {/* Creator Troubleshooting hint strip if a video is active */}
              {!share && currentVideoId && (
                <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5 truncate">
                    <svg className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Audience sees this track thumbnail & can vote in the queue.</span>
                  </span>
                  <button
                    onClick={handleReloadPlayer}
                    className="text-zinc-700 dark:text-zinc-300 hover:underline flex-shrink-0 ml-2 font-medium"
                  >
                    Reload Player
                  </button>
                </div>
              )}

              {/* Stage Controls Strip (For Creator) */}
              {!share && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col xl:flex-row items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <button
                      onClick={handlePlayNext}
                      disabled={sortedQueue.length === 0}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-100"
                    >
                      <PlayIcon />
                      <span>Play Next Track</span>
                      {nextVideo && (
                        <span className="ml-1 rounded bg-zinc-800 px-2 py-0.5 text-xs font-normal text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800 max-w-[140px] truncate">
                          #{1} {nextVideo.title}
                        </span>
                      )}
                    </button>
                    {currentVideoId && (
                      <button
                        onClick={handleTogglePlayPause}
                        title={creatorIsPlaying ? "Pause stream playback" : "Resume stream playback"}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] shadow-sm ${
                          creatorIsPlaying
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        {creatorIsPlaying ? (
                          <>
                            <PauseIcon />
                            <span>Pause Stream</span>
                          </>
                        ) : (
                          <>
                            <PlayIcon />
                            <span>Resume Stream</span>
                          </>
                        )}
                      </button>
                    )}
                    {currentVideoId && (
                      <button
                        onClick={handleSkipTrack}
                        title="Skip to next crowd-voted track (Veto)"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 transition-colors shadow-sm"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
                          <line x1="19" y1="5" x2="19" y2="19" strokeWidth="2.5" />
                        </svg>
                        <span>Skip</span>
                      </button>
                    )}
                    {currentVideoId && (
                      <button
                        onClick={handleStopPlayback}
                        title="Clear current track from stage"
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors shadow-sm"
                      >
                        Stop Stage
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto text-xs">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{videoQueue.length}</strong> songs
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Broadcaster Quick Share Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Stream Chat Room Link
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Drop this link in Twitch/YouTube chat so viewers can vote live from their phones or browsers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-600 dark:text-zinc-300 max-w-[190px] truncate">
                    /creatorId/{creatorId.slice(0, 8)}...
                  </div>
                  <button
                    onClick={handleShare}
                    className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Song Request & Ranked Voting Queue (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-5">

            {/* Song Submission Form & YouTube Instant Search */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-colors">
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <YouTubeIcon />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Suggest a Track
                  </h2>
                </div>

                {/* Search Mode Tabs */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setSearchTab("search")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      searchTab === "search"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    🔍 Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchTab("url")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      searchTab === "url"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    🔗 Link
                  </button>
                </div>
              </div>

              {searchTab === "search" ? (
                /* Mode 1: Built-in YouTube Search */
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (searchError) setSearchError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearchYouTube(searchQuery);
                        }
                      }}
                      placeholder="Search songs or artists (e.g. 'Daft Punk')..."
                      className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleSearchYouTube(searchQuery)}
                      disabled={isSearching || !searchQuery.trim()}
                      className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm flex-shrink-0"
                    >
                      {isSearching ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
                      ) : (
                        <span>Search</span>
                      )}
                    </button>
                  </div>

                  {searchError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{searchError}</p>
                  )}

                  {/* Search Results Autocomplete Preview List */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 pt-1">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={result.thumbnail}
                              alt=""
                              className="h-9 w-14 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={result.title}>
                                {result.title}
                              </p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                {result.channelTitle}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQueueTrackFromSearch(result)}
                            disabled={submitting}
                            className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 shadow-sm flex-shrink-0 disabled:opacity-40"
                          >
                            <span>+ Queue</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Mode 2: Direct YouTube URL Submission */
                <form onSubmit={handleAddSong} className="space-y-3">
                  <div>
                    <label htmlFor="youtube-url" className="sr-only">
                      YouTube URL
                    </label>
                    <input
                      id="youtube-url"
                      type="url"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Paste YouTube video or song link..."
                      className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
                    />
                    {error && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !inputValue.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
                        <span>Adding to Queue...</span>
                      </>
                    ) : (
                      <span>Add to Queue</span>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Voting Queue Section */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Live Upvote Queue
                  </h2>
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                    {videoQueue.length}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Highest votes play first
                </span>
              </div>

              {/* Queue List */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {sortedQueue.length > 0 ? (
                  sortedQueue.map((video, index) => {
                    const isTop = index === 0;
                    return (
                      <div
                        key={video.id}
                        className={`group relative flex items-center gap-3 rounded-xl border p-2.5 transition-all ${
                          isTop
                            ? "border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.06]"
                            : "border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {/* Rank Badge */}
                        <div className="flex flex-col items-center justify-center w-6 flex-shrink-0">
                          <span
                            className={`text-xs font-bold font-mono ${
                              isTop
                                ? "text-amber-600 dark:text-amber-400"
                                : index === 1
                                ? "text-zinc-700 dark:text-zinc-300"
                                : index === 2
                                ? "text-zinc-600 dark:text-zinc-400"
                                : "text-zinc-400 dark:text-zinc-600"
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </div>

                        {/* Thumbnail */}
                        <div className="relative h-12 w-16 sm:h-14 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        </div>

                        {/* Track Info */}
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                            title={video.title}
                          >
                            {video.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {isTop && (
                              <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                Next Up
                              </span>
                            )}
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                              {video.upvotes} {video.upvotes === 1 ? "vote" : "votes"}
                            </span>
                          </div>
                        </div>

                        {/* Vote Button */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleVote(video.id)}
                            aria-label={video.haveVoted ? "Remove vote" : "Upvote track"}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold font-mono transition-all active:scale-[0.96] ${
                              video.haveVoted
                                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                                : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
                            }`}
                          >
                            <ArrowUpIcon />
                            <span>{video.upvotes}</span>
                          </button>

                          {/* Delete Action (Streamer only) */}
                          {!share && (
                            <button
                              onClick={() => handleDelete(video.id, video.title)}
                              aria-label="Remove track from queue"
                              title="Remove track"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Empty Queue State */
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/40">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-2.5">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">The queue is empty</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-[200px]">
                      Paste a YouTube track above to start the voting!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Session Track History & Export Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-colors">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="flex items-center gap-2 text-left group"
                >
                  <svg
                    className={`h-4 w-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-transform ${
                      isHistoryOpen ? "rotate-90" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Session Track History
                  </h2>
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 font-mono">
                    {sessionHistory.length}
                  </span>
                </button>

                {sessionHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyTracklist}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors shadow-sm"
                    title="Copy full tracklist to clipboard"
                  >
                    {copiedTracklist ? <CheckIcon /> : (
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                    <span>{copiedTracklist ? "Copied" : "Export Setlist"}</span>
                  </button>
                )}
              </div>

              {isHistoryOpen && (
                <div className="mt-3.5 space-y-2 max-h-56 overflow-y-auto pr-1 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                  {sessionHistory.length > 0 ? (
                    sessionHistory.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="flex items-center justify-between gap-3 p-2 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800/80"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-zinc-400">
                            #{index + 1}
                          </span>
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="h-8 w-12 rounded object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate" title={item.title}>
                              {item.title}
                            </p>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Played at {item.playedAt}
                            </span>
                          </div>
                        </div>

                        <a
                          href={`https://www.youtube.com/watch?v=${item.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex-shrink-0 p-1"
                          title="Open on YouTube"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400 text-center py-4">
                      No tracks played in this session yet. Songs played will appear here!
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Fullscreen TV / Party Lounge Mode */}
      {isPartyMode && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl flex flex-col p-6 sm:p-10 text-white overflow-hidden animate-in fade-in duration-300">
          {/* Ambient blurred glow from current track */}
          {effectiveThumbnail && (
            <img
              src={effectiveThumbnail}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-25 scale-125 pointer-events-none select-none"
            />
          )}

          {/* Lounge Top Navigation Bar */}
          <div className="relative z-20 flex items-center justify-between border-b border-white/10 pb-5 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <span className="text-xl">🎉</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                    Muzzi Party Lounge
                  </h1>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Interactive Crowd Jukebox & Live Upvoting Screen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block rounded-lg bg-zinc-900/80 border border-white/10 px-2.5 py-1 text-xs text-zinc-400 font-mono">
                Press ESC to exit
              </span>
              <button
                onClick={() => setIsPartyMode(false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Exit Lounge</span>
              </button>
            </div>
          </div>

          {/* Lounge Main Stage Grid */}
          <div className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full overflow-y-auto pr-1">
            {/* Left Column: Giant Vinyl Stage & Current Track (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col items-center text-center p-6 rounded-3xl bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-2xl">
              {/* Spinning Vinyl Record Disc */}
              <div className="relative mb-6">
                <div
                  className={`relative h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-zinc-950 border-4 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center ${
                    broadcasterState === "PLAYING" ? "animate-spin-slow" : ""
                  }`}
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, transparent 30%, rgba(255,255,255,0.03) 31%, transparent 33%, rgba(255,255,255,0.04) 50%, transparent 52%, rgba(255,255,255,0.02) 70%, transparent 72%)",
                  }}
                >
                  {/* Album Cover inside vinyl center */}
                  <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-zinc-900 shadow-inner">
                    {effectiveThumbnail ? (
                      <img
                        src={effectiveThumbnail}
                        alt="Vinyl album art"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white">
                        <YouTubeIcon />
                      </div>
                    )}
                    {/* Vinyl Center Hole */}
                    <div className="absolute inset-0 m-auto h-4 w-4 rounded-full bg-zinc-950 border-2 border-zinc-600" />
                  </div>
                </div>

                {/* Status Dot */}
                <span
                  className={`absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-950 ${
                    broadcasterState === "PLAYING" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                >
                  {broadcasterState === "PLAYING" && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  )}
                </span>
              </div>

              {/* Status & Equalizer Bar */}
              <div className="flex items-center gap-2 mb-3">
                <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300">
                  {broadcasterState === "PLAYING" ? "NOW PLAYING ON STAGE" : "STAGE PAUSED"}
                </span>

                {broadcasterState === "PLAYING" && (
                  <div className="flex items-end gap-1 h-4">
                    <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite]" style={{ height: "60%" }} />
                    <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_0.2s]" style={{ height: "100%" }} />
                    <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.9s_infinite_0.4s]" style={{ height: "40%" }} />
                    <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.7s_infinite_0.1s]" style={{ height: "80%" }} />
                  </div>
                )}
              </div>

              {/* Current Track Title */}
              <h2 className="text-xl sm:text-2xl font-black text-white max-w-xl line-clamp-2 mb-2 leading-tight">
                {currentVideoTitle || "Stage is idle — Waiting for songs"}
              </h2>

              <p className="text-sm text-zinc-400 mb-6">
                {currentVideoId ? "Audio playing through venue sound system" : "Scan the QR code to submit and upvote tracks"}
              </p>

            </div>

            {/* Right Column: High-Contrast QR Code & Queue Ticker (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* QR Code Joining Card */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
                {/* High Contrast QR Code Canvas */}
                <div className="flex-shrink-0 p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Scan QR code to join room"
                      className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center text-zinc-900 font-bold text-xs">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="flex flex-col text-center sm:text-left">
                  <span className="inline-flex items-center gap-1.5 self-center sm:self-start rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300 mb-2">
                    📱 Phone Jukebox
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                    Scan to Queue Songs
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Point your smartphone camera at the QR code to propose YouTube songs and upvote the queue live!
                  </p>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    <span>{copied ? "Link Copied to Clipboard!" : "Copy joining URL"}</span>
                  </button>
                </div>
              </div>

              {/* Up Next Queue Ticker */}
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <span>Up Next in Queue</span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
                      {sortedQueue.length}
                    </span>
                  </h3>
                  <span className="text-[11px] text-zinc-500">Ranked by votes</span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {sortedQueue.length > 0 ? (
                    sortedQueue.slice(0, 4).map((video, index) => (
                      <div
                        key={video.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold font-mono ${
                              index === 0
                                ? "bg-amber-400 text-zinc-950 shadow-sm"
                                : index === 1
                                ? "bg-zinc-300 text-zinc-950"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <img
                            src={video.thumbnail || `https://img.youtube.com/vi/${video.extractedId}/hqdefault.jpg`}
                            alt=""
                            className="h-9 w-14 rounded-md object-cover flex-shrink-0"
                          />
                          <p className="text-xs font-medium text-zinc-200 truncate max-w-[200px]" title={video.title}>
                            {video.title}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-300 font-mono text-xs font-bold flex-shrink-0">
                          <span>🔥</span>
                          <span>{video.upvotes}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-zinc-500 text-xs">
                      No songs in queue yet. Scan the code to add one!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Floating In-App Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium shadow-xl backdrop-blur-md transition-all ${
              toast.type === "success"
                ? "border-emerald-500/30 bg-white/95 text-emerald-800 dark:bg-zinc-900/95 dark:text-emerald-300"
                : toast.type === "error"
                ? "border-red-500/30 bg-white/95 text-red-800 dark:bg-zinc-900/95 dark:text-red-300"
                : "border-zinc-200 bg-white/95 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckIcon />}
            {toast.type === "error" && (
              <svg className="h-3.5 w-3.5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="8" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
