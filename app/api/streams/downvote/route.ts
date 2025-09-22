
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { prismaClient } from "@/lib/db";

const UpvoteSchema = z.object( {
    streamId :z.string(),
})

export async function DELETE(req:NextRequest){
    const session = await getServerSession();
    if(!session){
        return NextResponse.json({
            message : "Unauthorized",
        },{
            status : 401
        })
    }
    const user = await prismaClient.user.findUnique({
        where : {
          email : session?.user?.email ?? "",
        }
    })
    if(!user){
        return NextResponse.json({
            message : "Invalid user",
        },{
            status : 401
        })
    }
    console.log(user)
    try{
        const data = UpvoteSchema.parse(await req.json())
        await prismaClient.upvotes.delete({
            where : {
                userId_streamId : {
                    userId : user.id,
                    streamId : data.streamId,
                }
            }
        })
        return NextResponse.json({
            message : "Upvote created successfully",
        })
    }
    catch(err){
        return NextResponse.json({
            message : "Invalid request data at downvote ",
        },{
            status : 411
        })
    }
}