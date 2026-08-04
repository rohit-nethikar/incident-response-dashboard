import { Router } from "express";
import { prisma } from "../db/prismaClient";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req, res) => res.json({ ok: true }));

healthRouter.get("/readyz", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});
