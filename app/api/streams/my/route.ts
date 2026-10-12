import { prismaClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";


export async function GET(request: NextRequest) {
    const session = await getServerSession();
    if (!session?.user?.email) {
        return new Response("Unauthorized", { status: 401 });
    }   
    const user = await prismaClient.user.findFirst({
        where: {
            email : session.user.email ?? ""
        }
    })
    if (!user) {
        return new Response("User not found", { status: 404 });
    }

        const [streams, currentStream] = await Promise.all([
            prismaClient.stream.findMany({
                where: { userId: user.id, active: true },
                include: {
                    _count: {
                        select: {
                            upvotes: true,
                        },
                    },
                    upvotes: {
                        where: {
                            userId: user.id,
                        },
                    },
                },
            }),
            prismaClient.stream.findFirst({
                where: { userId: user.id, active: false },
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