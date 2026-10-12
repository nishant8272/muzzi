"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { YT_REGEX, extractYouTubeId } from "@/lib/util";
import { Appbar } from "./Appbar";
import Link from "next/link";

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

  const [wsConnected, setWsConnected] = useState(false);
  const [activeViewers, setActiveViewers] = useState<number | null>(null);

  // Broadcaster & Audience state
  const [broadcasterState, setBroadcasterState] = useState<"PLAYING" | "PAUSED">("PLAYING");
  const [creatorIsPlaying, setCreatorIsPlaying] = useState(true);
  const [isYTReady, setIsYTReady] = useState(false);

  const playerRef = React.useRef<any>(null);
  const socketRef = React.useRef<WebSocket | null>(null);
  const broadcasterSyncRef = React.useRef<{
    state: "PLAYING" | "PAUSED";
    anchorPositionSec: number;
    anchorEpochMs: number;
    localReceivedMs: number;
  } | null>(null);

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

        // Sync currently playing stream between creator and audience
        const serverCurrent = data.currentStream || data.activeStream || null;
        if (serverCurrent) {
          setCurrentVideoId((prevId) => {
            if (prevId !== serverCurrent.extractedId) {
              return serverCurrent.extractedId;
            }
            return prevId;
          });
          setCurrentVideoTitle((prevTitle) => {
            if (prevTitle !== serverCurrent.title) {
              return serverCurrent.title;
            }
            return prevTitle;
          });
          setCurrentVideoThumbnail(serverCurrent.thumbnail || null);
        } else {
          // If server reports no active stream, clear stage
          setCurrentVideoId(null);
          setCurrentVideoTitle(null);
          setCurrentVideoThumbnail(null);
        }
      }
    } catch (err) {
      console.error("Error refreshing queue:", err);
    } finally {
      setRefreshing(false);
    }
  }, [creatorId]);

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

    // Instant WebSocket broadcast so all audience members see "No song is playing currently"
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "STAGE_STOPPED",
          creatorId,
        })
      );
    }

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
  }, [creatorId, addToast, refreshStreams]);

  // Handle song completion on creator's end
  const handleSongEnded = useCallback(async () => {
    setCreatorIsPlaying(false);
    await handleStopPlayback();
    addToast("Song completed. No song is playing currently.", "info");
  }, [handleStopPlayback, addToast]);

  useEffect(() => {
    refreshStreams();
    // Safety fallback sync every 60s (WebSocket handles instant 0ms real-time updates)
    const interval = setInterval(refreshStreams, 60000);
    return () => clearInterval(interval);
  }, [refreshStreams]);

  // Real-time WebSocket connection for instant synchronization
  useEffect(() => {
    if (!creatorId) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isCleanedUp = false;
    let retryCount = 0;

    function connect() {
      if (isCleanedUp) return;

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = process.env.NEXT_PUBLIC_WS_HOST || `${window.location.hostname}:3001`;
      const wsUrl = `${wsProtocol}//${wsHost}`;

      try {
        socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          retryCount = 0;
          if (isCleanedUp) {
            socket?.close();
            return;
          }
          setWsConnected(true);
          // Subscribe to this room
          socket?.send(
            JSON.stringify({
              type: "JOIN_ROOM",
              creatorId,
            })
          );
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "ROOM_JOINED" && typeof data.activeViewers === "number") {
              setActiveViewers(data.activeViewers);
            }

            if (data.type === "VIEWER_COUNT" && typeof data.count === "number") {
              setActiveViewers(data.count);
            }

            if (data.type === "STREAM_ADDED" && data.stream) {
              setVideoQueue((prev) => {
                if (prev.some((v) => v.id === data.stream.id)) return prev;
                return [data.stream, ...prev];
              });
              addToast(`New track added: "${data.stream.title.slice(0, 32)}..."`, "info");
            }

            if (data.type === "VOTE_UPDATE" && data.streamId) {
              setVideoQueue((prev) =>
                prev.map((v) => {
                  if (v.id === data.streamId) {
                    return { ...v, upvotes: data.upvotes };
                  }
                  return v;
                })
              );
            }

            if (data.type === "NOW_PLAYING" && data.currentStream) {
              setCurrentVideoId(data.currentStream.extractedId);
              setCurrentVideoTitle(data.currentStream.title);
              setCurrentVideoThumbnail(data.currentStream.thumbnail || null);
              setVideoQueue((prev) => prev.filter((v) => v.id !== data.currentStream.id));
              addToast(`Now playing: "${data.currentStream.title}"`, "info");
            }

            if (data.type === "STAGE_STOPPED") {
              setCurrentVideoId(null);
              setCurrentVideoTitle(null);
              setCurrentVideoThumbnail(null);
              setBroadcasterState("PAUSED");
              if (playerRef.current) {
                try {
                  playerRef.current.pauseVideo();
                  playerRef.current.destroy();
                } catch {}
                playerRef.current = null;
              }
              addToast("No song is playing currently", "info");
            }

            if (data.type === "STREAM_DELETED" && data.streamId) {
              setVideoQueue((prev) => prev.filter((v) => v.id !== data.streamId));
            }

            // Server-Anchored Epoch Clock Playback Sync
            if (data.type === "PLAYBACK_SYNC") {
              const anchorSec = typeof data.anchorPositionSec === "number"
                ? data.anchorPositionSec
                : typeof data.currentTime === "number"
                ? data.currentTime
                : 0;

              broadcasterSyncRef.current = {
                state: data.state === "PAUSED" ? "PAUSED" : "PLAYING",
                anchorPositionSec: anchorSec,
                anchorEpochMs: data.anchorEpochMs || Date.now(),
                localReceivedMs: Date.now(),
              };

              if (share) {
                setBroadcasterState(data.state);

                if (data.videoId && data.videoId !== currentVideoId) {
                  setCurrentVideoId(data.videoId);
                }
                if (data.title) {
                  setCurrentVideoTitle(data.title);
                }
                if (data.thumbnail) {
                  setCurrentVideoThumbnail(data.thumbnail);
                }
              }
            }
          } catch (err) {
            console.error("Error processing WS event:", err);
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
          socketRef.current = null;
          if (!isCleanedUp) {
            retryCount++;
            const backoff = Math.min(1000 * Math.pow(1.5, retryCount), 8000);
            reconnectTimeout = setTimeout(connect, backoff);
          }
        };

        socket.onerror = () => {
          setWsConnected(false);
        };
      } catch (err) {
        setWsConnected(false);
        socketRef.current = null;
        if (!isCleanedUp) {
          retryCount++;
          const backoff = Math.min(1000 * Math.pow(1.5, retryCount), 8000);
          reconnectTimeout = setTimeout(connect, backoff);
        }
      }
    }

    connect();

    return () => {
      isCleanedUp = true;
      clearTimeout(reconnectTimeout);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "LEAVE_ROOM",
          })
        );
        socket.close();
      }
      socketRef.current = null;
    };
  }, [creatorId, addToast, share, currentVideoId]);

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

  // YouTube Player instance initialization (Broadcaster ONLY)
  useEffect(() => {
    // Audience view: strictly NEVER instantiate YouTube player or stream live audio/music!
    if (share) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
      return;
    }

    if (!isYTReady || !currentVideoId) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
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
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              if (!isSubscribed) return;
              const state = event.data;

              // ONLY BROADCASTER broadcasts state changes to viewers!
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                const currentTime = event.target.getCurrentTime ? event.target.getCurrentTime() : 0;

                if (state === 1) { // PLAYING
                  setCreatorIsPlaying(true);
                  socketRef.current.send(
                    JSON.stringify({
                      type: "BROADCASTER_SYNC",
                      creatorId,
                      state: "PLAYING",
                      currentTime,
                      videoId: currentVideoId,
                      title: currentVideoTitle,
                      thumbnail: currentVideoThumbnail,
                    })
                  );
                } else if (state === 2) { // PAUSED
                  setCreatorIsPlaying(false);
                  socketRef.current.send(
                    JSON.stringify({
                      type: "BROADCASTER_SYNC",
                      creatorId,
                      state: "PAUSED",
                      currentTime,
                      videoId: currentVideoId,
                      title: currentVideoTitle,
                      thumbnail: currentVideoThumbnail,
                    })
                  );
                } else if (state === 0) { // ENDED
                  setCreatorIsPlaying(false);
                  handleSongEnded();
                }
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
  }, [isYTReady, currentVideoId, share, playerKey, creatorId, currentVideoTitle, currentVideoThumbnail, handleSongEnded]);

  // Broadcaster: Low-frequency background anchor recalibration (every 5s)
  useEffect(() => {
    if (share || !currentVideoId) return;

    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getPlayerState === "function" &&
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        try {
          const pState = playerRef.current.getPlayerState();
          const currentState = pState === 1 ? "PLAYING" : "PAUSED";
          const currentTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
          setCreatorIsPlaying(pState === 1);
          socketRef.current.send(
            JSON.stringify({
              type: "BROADCASTER_SYNC",
              creatorId,
              state: currentState,
              currentTime,
              videoId: currentVideoId,
              title: currentVideoTitle,
              thumbnail: currentVideoThumbnail,
            })
          );
        } catch {}
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [share, currentVideoId, creatorId, currentVideoTitle, currentVideoThumbnail]);

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
      }
    } catch {
      setVideoQueue(originalQueue);
      addToast("Network issue while voting.", "error");
    }
  };

  // Play Next Song (Streamer only)
  const handlePlayNext = async () => {
    if (!nextVideo) {
      await handleStopPlayback();
      return;
    }

    const targetTrack = nextVideo;
    setCurrentVideoId(targetTrack.extractedId);
    setCurrentVideoTitle(targetTrack.title);
    setCurrentVideoThumbnail(targetTrack.thumbnail);
    setCreatorIsPlaying(true);

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
  };

  // Toggle Play / Pause Stream (Streamer only)
  const handleTogglePlayPause = () => {
    if (!playerRef.current) return;
    try {
      const pState = typeof playerRef.current.getPlayerState === "function" ? playerRef.current.getPlayerState() : -1;
      const isPlaying = pState === 1;
      const willPlay = !isPlaying;
      const currentTime = typeof playerRef.current.getCurrentTime === "function" ? playerRef.current.getCurrentTime() : 0;

      if (willPlay) {
        playerRef.current.playVideo();
        setCreatorIsPlaying(true);
      } else {
        playerRef.current.pauseVideo();
        setCreatorIsPlaying(false);
      }

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "BROADCASTER_SYNC",
            creatorId,
            state: willPlay ? "PLAYING" : "PAUSED",
            currentTime,
            videoId: currentVideoId,
            title: currentVideoTitle,
            thumbnail: currentVideoThumbnail,
          })
        );
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
      }
    } catch {
      refreshStreams();
      addToast("Network error removing song.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans transition-colors">
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
            {/* Realtime WebSocket status & Viewer Counter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-500 dark:text-zinc-400 shadow-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  wsConnected
                    ? "bg-emerald-500 animate-pulse"
                    : refreshing
                    ? "bg-amber-500 animate-spin"
                    : "bg-zinc-400 dark:bg-zinc-600"
                }`}
              />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {wsConnected ? "Realtime Live" : "Fallback 15s"}
              </span>
              {activeViewers !== null && activeViewers > 0 && (
                <span className="border-l border-zinc-200 dark:border-zinc-700 pl-1.5 ml-0.5 text-zinc-500 font-mono text-[11px]">
                  {activeViewers} {activeViewers === 1 ? "viewer" : "viewers"}
                </span>
              )}
            </div>

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
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
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
                        onClick={handleStopPlayback}
                        title="Clear current track from stage"
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors shadow-sm"
                      >
                        Stop Stage
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-3">
                    <span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{videoQueue.length}</strong> songs in queue
                    </span>
                    {nextVideo && (
                      <span className="hidden sm:inline border-l border-zinc-300 dark:border-zinc-700 pl-3">
                        Top vote: <strong className="text-amber-600 dark:text-amber-400 font-mono">{nextVideo.upvotes}</strong>
                      </span>
                    )}
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

            {/* Song Submission Form */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <YouTubeIcon />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Suggest a Track
                </h2>
              </div>
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

          </div>

        </div>
      </main>

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
