import { Router } from "express";
import { prisma } from "../../config/prisma";

export const healthRouter = Router();

// Deliberately does a real query (not just returning 200) so this endpoint
// verifies the full chain: Express -> Prisma -> Postgres, not just that
// the Node process is alive.
healthRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check database query failed:", error);
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});
