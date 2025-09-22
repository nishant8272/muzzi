import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/lib/db";
import { getServerSession } from "next-auth";
const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/))([A-Za-z0-9_-]{11})(?:[?&][^\s]*)?$/;

const CreateStreamSchema = z.object({
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
        const isYT = YT_REGEX.test(data.url);
        if (!isYT) {
            return NextResponse.json({
                message: "Invalid url",
            }, {
                status: 411
            })
        }
        const extractorId = data.url.split("v=")[1];
        
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${extractorId}&key=${API_KEY}`;
        
        const response = await fetch(url);
        const ytdata: YouTubeApiResponse = await response.json();
        
        if (!ytdata.items || ytdata.items.length === 0) {
            return NextResponse.json({
                message: "Video not found or inaccessible",
            }, { status: 404 });
        }
        const video = ytdata.items[0];
        
        
        console.log(session.user)
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

        const stream = await prismaClient.stream.create({
            data: {
                userId: user.id,
                url: data.url,
                title: video.snippet.title ?? "Unknown Title",
                thumbnail: video.snippet.thumbnails.high.url ?? "https://plus.unsplash.com/premium_photo-1758367454201-dc8292d99bb7?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                extractedId: extractorId,
                type: "Youtube"
            }
        })
        return NextResponse.json({
            message: "Stream created successfully",
            stream: stream

        })
    }
    catch (err) {
        return NextResponse.json({
            message: "Invalid request data at stream ",
        }, {
            status: 411
        })
    }


}
export async function GET(req: NextRequest) {
    const creatorId = req.nextUrl.searchParams.get("creatorId");

    if (!creatorId) {
        return NextResponse.json({
            message: "Missing creatorId in query params",
        }, { status: 400 });
    }

    try {
        const streams = await prismaClient.stream.findMany({
            where: { userId: creatorId }
        });

        return NextResponse.json({
            message: "Streams fetched successfully",
            streams : streams
        }, { status: 200 });

    } catch (err) {
        console.error("Error fetching streams:", err);
        return NextResponse.json({
            message: "Error fetching streams",
        }, { status: 500 });
    }
}
