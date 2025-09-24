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


export async function DELETE(request: NextRequest) {
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

    await prismaClient.upvotes.deleteMany({
        where: {
            userId: user.id
        }
    })  
    await prismaClient.stream.deleteMany({
        where: {
            userId: user.id
        }
    })
    await prismaClient.user.delete({
        where: {
            id: user.id
        }
    })
    return NextResponse.json({
        message: "User deleted successfully"
    })
}   