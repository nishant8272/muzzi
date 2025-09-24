import { getServerSession } from "next-auth";
import { prismaClient } from "@/lib/db";
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
    return NextResponse.json({
        creatorId: user.id
    })

}