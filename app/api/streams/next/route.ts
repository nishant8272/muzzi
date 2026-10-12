import { prismaClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastWs } from "@/lib/socket";

const NextSchema = z.object({
  streamId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prismaClient.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  try {
    let streamId: string | undefined;
    try {
      const body = await req.json();
      const parsed = NextSchema.safeParse(body);
      if (parsed.success) {
        streamId = parsed.data.streamId;
      }
    } catch {
      // Body may be empty, which is completely fine
    }

    let targetStream = null;

    if (streamId) {
      targetStream = await prismaClient.stream.findFirst({
        where: {
          id: streamId,
          userId: user.id,
        },
      });
    }

    if (!targetStream) {
      // Find the stream with the highest upvotes for this user that is active (in queue)
      const queueStreams = await prismaClient.stream.findMany({
        where: {
          userId: user.id,
          active: true,
        },
        include: {
          _count: {
            select: { upvotes: true },
          },
        },
        orderBy: {
          upvotes: {
            _count: "desc",
          },
        },
      });

      if (queueStreams.length > 0) {
        targetStream = queueStreams[0];
      }
    }

    if (!targetStream) {
      return NextResponse.json(
        { message: "No tracks remaining in queue", currentStream: null },
        { status: 400 }
      );
    }

    // 1. Clean up any previously played tracks (active: false) for this creator
    const previousPlayed = await prismaClient.stream.findMany({
      where: {
        userId: user.id,
        active: false,
      },
      select: { id: true },
    });

    if (previousPlayed.length > 0) {
      const prevIds = previousPlayed.map((p) => p.id);
      await prismaClient.upvotes.deleteMany({
        where: { streamId: { in: prevIds } },
      });
      await prismaClient.stream.deleteMany({
        where: { id: { in: prevIds } },
      });
    }

    // 2. Remove upvotes for this target stream so it won't show in voting lists
    await prismaClient.upvotes.deleteMany({
      where: { streamId: targetStream.id },
    });

    // 3. Update targetStream to active: false (indicating it is now the live stage track)
    const updated = await prismaClient.stream.update({
      where: { id: targetStream.id },
      data: { active: false },
    });

    broadcastWs(user.id, {
      type: "NOW_PLAYING",
      currentStream: updated,
      streamId: updated.id,
    }).catch(() => {});

    return NextResponse.json({
      message: "Playing next track",
      currentStream: updated,
      stream: updated,
    });
  } catch (err) {
    console.error("Error playing next stream:", err);
    return NextResponse.json(
      { message: "Failed to play next track" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prismaClient.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  try {
    const previousPlayed = await prismaClient.stream.findMany({
      where: {
        userId: user.id,
        active: false,
      },
      select: { id: true },
    });

    if (previousPlayed.length > 0) {
      const prevIds = previousPlayed.map((p) => p.id);
      await prismaClient.upvotes.deleteMany({
        where: { streamId: { in: prevIds } },
      });
      await prismaClient.stream.deleteMany({
        where: { id: { in: prevIds } },
      });
    }

    broadcastWs(user.id, {
      type: "STAGE_STOPPED",
    }).catch(() => {});

    return NextResponse.json({ message: "Stage playback cleared" });
  } catch (err) {
    console.error("Error clearing playback:", err);
    return NextResponse.json(
      { message: "Failed to clear playback" },
      { status: 500 }
    );
  }
}
