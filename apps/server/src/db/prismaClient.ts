import { PrismaClient } from "@prisma/client";

// Single shared Prisma client instance for the whole server process
// (REST handlers, poll loop, WS layer all read/write through this).
export const prisma = new PrismaClient();
