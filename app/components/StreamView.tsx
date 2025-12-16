"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { YT_REGEX } from '@/lib/util';
import { Appbar } from './Appbar';

interface Video {
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

// --- HELPER ICONS ---
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);
const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.006v3.988a1 1 0 001.555.838l3.428-1.994a1 1 0 000-1.676l-3.428-1.994z" clipRule="evenodd" />
    </svg>
);

const ThumbsUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.364a1 1 0 00.942-.671l1.659-6.223A1.5 1.5 0 0014.5 8H11V6a1 1 0 00-1-1H8.354a1 1 0 00-.942.671L6.659 7.224A1.5 1.5 0 006 8.667v1.666z" />
    </svg>
);

const ThumbsDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1h-6.364a1 1 0 00-.942.671L4.036 8.89A1.5 1.5 0 005.5 11H9v2a1 1 0 001 1h1.646a1 1 0 00.942-.671l1.659-6.224A1.5 1.5 0 0014 9.667z" />
    </svg>
);

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);

// --- MAIN DASHBOARD COMPONENT ---
function StreamView({ creatorId, share }: { creatorId: string, share?: boolean }) {

    
    // --- STATE MANAGEMENT ---
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [videoQueue, setVideoQueue] = useState<Video[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false)

    // --- DERIVED STATE ---
    const sortedQueue = useMemo(() => {
        return [...videoQueue].sort((a, b) => b.upvotes - a.upvotes);
    }, [videoQueue]);


    const refreshStreams = async () => {
        const response = await fetch(`/api/streams?creatorId=${creatorId}`);
        let data = [];
        if (response.headers.get("content-type")?.includes("application/json")) {
            data = await response.json();
        }
        const streams = data.streams.sort((a: any, b: any) => b.upvotes - a.upvotes);

        setVideoQueue(streams || [])

    }
    useEffect(() => {
        refreshStreams()
        const interval = setInterval(() => {
          refreshStreams();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const getYouTubeId = (url: string) => {
        const match = url.match(YT_REGEX);
        return match && match[1].length === 11 ? match[1] : null;
    };



    const handleDelete = async (id: string) => {
       const res = await fetch("/api/streams", {
                method: "DELETE",
                body: JSON.stringify({
                    streamId: id
                })
            })
            const data: { message: string } = await res.json()
            alert(data.message)
            refreshStreams()
    }

    // --- EVENT HANDLERS ---
    const handleShare = () => {
        const url = `${window.location.hostname}/creatorId/${creatorId}`;
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2500); // Reset message after 2.5 seconds
        } catch (err) {
            console.error('Failed to copy URL: ', err);
        }
        document.body.removeChild(textArea);
    };

    const handleAddSong = async () => {
        setError('');
        const videoId = getYouTubeId(inputValue);
        if (videoId) {
            setLoading(true)
            if (videoQueue.some(v => v.extractedId === videoId)) {
                setError('This song is already in the queue.');
                return;
            }
            const response = await fetch('/api/streams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: inputValue,
                }),
            });
            console.log(response);

            refreshStreams()
            setInputValue('');
            setLoading(false)
        } else {
            setError('Invalid YouTube URL. Please check the link and try again.');
        }

    };

    const handleVote = async (id: string) => {

        const originalQueue = [...videoQueue];
        setVideoQueue(prevQueue =>
            prevQueue.map(video => {
                if (video.id === id) {
                    // If they have already voted, unvote (decrement). Otherwise, vote (increment).
                    const newUpvotes = video.haveVoted ? video.upvotes - 1 : video.upvotes + 1;
                    return { ...video, upvotes: newUpvotes, haveVoted: !video.haveVoted };
                }
                return video;
            })

        );

        const haveVoted = videoQueue.find(v => v.id === id)?.haveVoted;
        console.log(haveVoted)
        const res = await fetch(`/api/streams/${haveVoted ? 'downvote' : 'upvote'}`,
            {
                method: `${haveVoted ? 'DELETE' : 'POST'}`,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    streamId: id
                })
            }
        )
        if (!res.ok) {
            setVideoQueue(originalQueue);
        }


    };

    const handlePlayNext = async () => {
        if (sortedQueue.length > 0) {
            const nextVideo = sortedQueue[0];
            setCurrentVideoId(nextVideo.extractedId);
            setVideoQueue(prevQueue => prevQueue.filter(v => v.id !== nextVideo.id));
            const res = await fetch("/api/streams", {
                method: "DELETE",
                body: JSON.stringify({
                    streamId: nextVideo.id
                })
            })
            const data: { message: string } = await res.json()
            alert(data.message)
            refreshStreams()
        }

    };

    // --- RENDER ---
    return (
        <div className="bg-black text-white min-h-screen font-sans">
            <Appbar />


            <main className="container mx-auto p-4 md:p-8 max-w-2xl">
                <div className="space-y-8">

                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">Song Voting Queue</h1>
                        <div className="relative">
                            <button onClick={handleShare} suppressHydrationWarning className="flex items-center bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                                <ShareIcon />
                                <span>Share</span>
                            </button>
                            {copied && <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs bg-purple-500 text-white font-bold py-1 px-2 rounded-md whitespace-nowrap">Link Copied!</span>}
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-3">
                        <input suppressHydrationWarning
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Paste YouTube link here"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                        />
                        <button onClick={handleAddSong} disabled={loading} suppressHydrationWarning className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-lg transition duration-300">
                            {loading ? "loading....." : "Add to Queue"}
                        </button>
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    {/* Now Playing Section */}
                    {share ? <></> : <>
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Now Playing</h2>
                            <div className="h-[480px] rounded-lg bg-gray-900 border-2 border-gray-800 flex items-center justify-center">
                                {currentVideoId ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>
                                ) : (
                                    <p className="text-gray-500">No video playing</p>
                                )}
                            </div>
                        </div>

                        {/* Play Next Button */}
                        <button onClick={handlePlayNext} disabled={sortedQueue.length === 0} className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            <PlayIcon />
                            Play Next
                        </button></>}

                    {/* Upcoming Songs Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Upcoming Songs</h2>
                        <div className="space-y-3">
                            {sortedQueue.length > 0 || loading ? sortedQueue.map((video) => (
                                <div key={video.id} className="flex items-center gap-4 bg-gray-900 p-3 rounded-lg border border-gray-800">
                                    <img src={video.thumbnail} alt={video.title} className="w-24 h-16 object-cover rounded" />
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-semibold truncate text-white">{video.title}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                            <button
                                                onClick={() => handleVote(video.id)}
                                                className={`flex items-center gap-1 transition ${video.haveVoted ? 'text-purple-400 hover:text-white' : 'hover:text-white'}`}
                                            >
                                                {video.haveVoted ? <ThumbsDownIcon /> : <ThumbsUpIcon />}
                                                <span className="ml-3 "> votes count :{video.upvotes}</span>
                                            </button>
                                        </div>
                                    </div>
                                    {/* --- BEAUTIFUL DELETE BUTTON --- */}
                                    
                                    {share ? <></> : <button
                                        onClick={() => handleDelete(video.id)} // You will need to create this handleDelete function
                                        className="ml-auto p-2 rounded-full text-gray-500 hover:bg-red-500 hover:text-white transition-colors duration-200 flex-shrink-0"
                                        aria-label="Delete song"
                                    >
                                        <TrashIcon />
                                    </button>
                                    }
                                </div>
                            )) : (
                                <div className="text-center py-10 bg-gray-900 rounded-lg">
                                    <p className="text-gray-500">The queue is empty. Add a song to get started!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default StreamView;


