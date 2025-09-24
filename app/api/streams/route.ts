import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { YT_REGEX } from "@/lib/util";
const API_KEY = process.env.YOUTUBE_API_KEY;

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

 const DeleteSchema = z.object({
    streamId: z.string(),
})


export async function GET(request: NextRequest) {
    const creatorId = request.nextUrl.searchParams.get("creatorId");
    if (!creatorId) {
        return new Response("Bad Request: Missing creatorId", { status: 400 });
    }

       const streams = await prismaClient.stream.findMany({
                where: { userId: creatorId }
                ,
                include :{
                    _count:{
                        select:{
                            upvotes : true,
                        }
                    },
                    upvotes : {
                        where : {
                            userId : creatorId
                        }
                    }
                }
            }
        );
            return NextResponse.json({
               streams :streams.map(({_count, ...stream}) => ({...stream, upvotes : _count.upvotes,haveVoted : stream.upvotes.length ? true : false
               })),
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
    console.log(data)

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

    return NextResponse.json({ message: "Stream deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { message: "Invalid request data at delete" },
      { status: 411 }
    );
  }
}
