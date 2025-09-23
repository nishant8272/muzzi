// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prismaClient = globalForPrisma.prisma || new PrismaClient({
    log: ["error", "warn"], // optional: helps debug
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;
