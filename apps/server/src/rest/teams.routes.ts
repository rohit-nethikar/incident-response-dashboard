import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prismaClient";
import { requirePermission } from "../auth/requireRole";

export const teamsRouter = Router();

const createTeamSchema = z.object({ name: z.string().min(1), description: z.string().optional() });
const membershipSchema = z.object({ userId: z.string() });

teamsRouter.get("/", requirePermission("team:view"), async (_req, res) => {
  const teams = await prisma.team.findMany({
    include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
    orderBy: { name: "asc" },
  });
  res.json(teams);
});

teamsRouter.post("/", requirePermission("team:manage"), async (req, res) => {
  const parsed = createTeamSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const team = await prisma.team.create({ data: parsed.data });
  res.status(201).json(team);
});

teamsRouter.post("/:id/members", requirePermission("team:manage"), async (req, res) => {
  const parsed = membershipSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const membership = await prisma.teamMembership.upsert({
    where: { userId_teamId: { userId: parsed.data.userId, teamId: req.params.id } },
    update: {},
    create: { userId: parsed.data.userId, teamId: req.params.id },
  });
  res.status(201).json(membership);
});

teamsRouter.delete("/:id/members/:userId", requirePermission("team:manage"), async (req, res) => {
  await prisma.teamMembership.deleteMany({ where: { teamId: req.params.id, userId: req.params.userId } });
  res.status(204).end();
});
