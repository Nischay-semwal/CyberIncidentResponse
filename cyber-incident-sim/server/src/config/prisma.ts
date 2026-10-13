import { PrismaClient } from "@prisma/client";

// Single shared Prisma instance for the whole app — avoids exhausting
// Postgres connections by creating a new client per request/module.
export const prisma = new PrismaClient();
