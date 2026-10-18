import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { YT_REGEX, extractYouTubeId } from "@/lib/util";
import { broadcastWs } from "@/lib/socket";
const API_KEY = process.env.YOUTUBE_API_KEY;

const CreateStreamSchema = z.object({
    creatorId: z.string().optional(),
    url: z.string(),
})

interface YouTubeThumbnail {
    url: string;
    width?: number;
    height?: number;
}

interface YouTubeSnippet {
    title: string;
    description: string;
    thumbnails: {
        default: YouTubeThumbnail;
        medium: YouTubeThumbnail;
        high: YouTubeThumbnail;
    };
    publishedAt: string;
}

interface YouTubeVideo {
    id: string;
    snippet: YouTubeSnippet;
}
interface YouTubeApiResponse {
    items: YouTubeVideo[];
}


export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({
                message: "Unauthorized",
            }, {
                status: 401
            })
        }       
        const zodData = CreateStreamSchema.safeParse(await req.json())
        if (!zodData.success) {
            return NextResponse.json({
                message: "Invalid request data",
                data: zodData.error
            }, {
                status: 411
            })
        }
        const data = zodData.data;
        const extractorId = extractYouTubeId(data.url);
        if (!extractorId) {
            return NextResponse.json({
                message: "Invalid YouTube URL",
            }, {
                status: 411
            });
        }
        
        // Pre-flight validation: check if video is embeddable via YouTube oEmbed
        try {
            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${extractorId}&format=json`);
            if (oembedRes.status === 401 || oembedRes.status === 403) {
                return NextResponse.json({
                    message: "This track cannot be embedded or broadcast due to copyright/licensing restrictions. Please choose another track.",
                }, { status: 400 });
            }
            if (oembedRes.status === 404) {
                return NextResponse.json({
                    message: "Video not found, private, or deleted on YouTube.",
                }, { status: 404 });
            }
        } catch {
            // Non-fatal if network times out
        }
        
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,statistics&id=${extractorId}&key=${API_KEY}`;
        
        const response = await fetch(url);
        const ytdata: YouTubeApiResponse = await response.json();
        
        if (!ytdata.items || ytdata.items.length === 0) {
            return NextResponse.json({
                message: "Video not found or inaccessible",
            }, { status: 404 });
        }
        const video = ytdata.items[0];

        if ((video as any).status?.embeddable === false) {
            return NextResponse.json({
                message: "Playback on other websites has been disabled by the video owner. Please choose another track.",
            }, { status: 400 });
        }

        // Queue Guard: Max track duration cap (12 minutes) to prevent troll loop videos
        const rawDuration = (video as any).contentDetails?.duration;
        if (rawDuration) {
            const match = rawDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
                const hours = parseInt(match[1] || "0", 10);
                const minutes = parseInt(match[2] || "0", 10);
                const seconds = parseInt(match[3] || "0", 10);
                const totalSec = hours * 3600 + minutes * 60 + seconds;
                if (totalSec > 720) { // 12 minutes cap
                    return NextResponse.json({
                        message: `Track is too long (${Math.round(totalSec / 60)} mins). The stream queue limit is 12 minutes per track.`,
                    }, { status: 400 });
                }
            }
        }
        
        const user = await prismaClient.user.findFirst({
            where: {
                email: session?.user?.email ?? ""
            }
        })
        if (!user) {
            return NextResponse.json({
                message: "User not found",
            }, { status: 404 });
        }

        const targetUserId = zodData.data.creatorId || user.id;

        const stream = await prismaClient.stream.create({
            data: {
                userId: targetUserId,
                url: data.url,
                title: video.snippet.title ?? "Unknown Title",
                thumbnail: video.snippet.thumbnails.high.url ?? "https://plus.unsplash.com/premium_photo-1758367454201-dc8292d99bb7?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                extractedId: extractorId,
                type: "Youtube",
                active: true,
            }
        })

        // Real-time notification to all connected viewers and creator
        broadcastWs(targetUserId, {
            type: "STREAM_ADDED",
            stream: {
                ...stream,
                upvotes: 0,
                haveVoted: false,
            },
        }).catch(() => {});

        return NextResponse.json({
            message: "Stream created successfully",
            stream: stream
        })
    }
    catch (err) {
        return NextResponse.json({
            message: "Invalid request data at stream",
        }, {
            status: 411
        })
    }
}

const DeleteSchema = z.object({
    streamId: z.string(),
})

export async function GET(request: NextRequest) {
    const creatorId = request.nextUrl.searchParams.get("creatorId");
    if (!creatorId) {
        return new Response("Bad Request: Missing creatorId", { status: 400 });
    }

    const session = await getServerSession();
    let currentUserId: string | null = null;
    if (session?.user?.email) {
        const currentUser = await prismaClient.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        currentUserId = currentUser?.id ?? null;
    }

    const [streams, currentStream] = await Promise.all([
        prismaClient.stream.findMany({
            where: {
                userId: creatorId,
                active: true,
            },
            include: {
                _count: {
                    select: {
                        upvotes: true,
                    },
                },
                upvotes: currentUserId
                    ? {
                        where: {
                            userId: currentUserId,
                        },
                    }
                    : false,
            },
        }),
        prismaClient.stream.findFirst({
            where: {
                userId: creatorId,
                active: false,
            },
            orderBy: {
                id: "desc",
            },
        }),
    ]);

    return NextResponse.json({
        streams: streams.map(({ _count, upvotes, ...stream }) => ({
            ...stream,
            upvotes: _count.upvotes,
            haveVoted: Array.isArray(upvotes) && upvotes.length > 0,
        })),
        currentStream: currentStream ? {
            id: currentStream.id,
            title: currentStream.title,
            extractedId: currentStream.extractedId,
            url: currentStream.url,
            thumbnail: currentStream.thumbnail,
            type: currentStream.type,
            userId: currentStream.userId,
            active: currentStream.active,
        } : null,
        activeStream: currentStream ? {
            id: currentStream.id,
            title: currentStream.title,
            extractedId: currentStream.extractedId,
            url: currentStream.url,
            thumbnail: currentStream.thumbnail,
            type: currentStream.type,
            userId: currentStream.userId,
            active: currentStream.active,
        } : null,
    }, { status: 200 });
}       

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prismaClient.user.findUnique({
    where: {
      email: session.user?.email ?? "",
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Invalid user" }, { status: 401 });
  }

  try {
    const data = DeleteSchema.parse(await req.json());

     await prismaClient.upvotes.deleteMany({
  where: {
    streamId: data.streamId,
  },
});
    // safer: deleteMany in case id+userId is not unique
    await prismaClient.stream.deleteMany({
      where: {
        id: data.streamId,
        userId: user.id,
      },
    });

    broadcastWs(user.id, {
      type: "STREAM_DELETED",
      streamId: data.streamId,
    }).catch(() => {});

    return NextResponse.json({ message: "Stream deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { message: "Invalid request data at delete" },
      { status: 411 }
    );
  }
}
