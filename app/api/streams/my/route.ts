import { prismaClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";


export async function GET(request: NextRequest) {
    const session = await getServerSession();
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }   

    const user = await prismaClient.user.findFirst({
        where: {
            email : session?.user?.email ?? ""
        }
    })
   
    if (!user) {
        return new Response("User not found", { status: 404 });
    }

       const streams = await prismaClient.stream.findMany({
                where: { userId: user.id }
                ,
                include :{
                    _count:{
                        select:{
                            upvotes : true,
                        }
                    },
                    upvotes : {
                        where : {
                            userId : user.id
                        }
                    }
                }
            }
        );
    
            return NextResponse.json({
               streams :streams.map(({_count, ...stream}) => ({...stream, upvotes : _count.upvotes
                ,haveVoted : stream.upvotes.length ? true : false
               })),
            }, { status: 200 });

}       