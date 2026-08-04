import { Router } from "express";
import { createRunbookSchema, updateRunbookSchema } from "@incident-dash/shared";
import { prisma } from "../db/prismaClient";
import { requirePermission } from "../auth/requireRole";
import { logAudit } from "../services/audit";

export const runbooksRouter = Router();

runbooksRouter.get("/", requirePermission("runbook:view"), async (_req, res) => {
  const runbooks = await prisma.runbook.findMany({ orderBy: { title: "asc" } });
  res.json(runbooks);
});

runbooksRouter.get("/:id", requirePermission("runbook:view"), async (req, res) => {
  const runbook = await prisma.runbook.findUnique({ where: { id: req.params.id } });
  if (!runbook) return res.status(404).json({ error: "Runbook not found" });
  res.json(runbook);
});

runbooksRouter.post("/", requirePermission("runbook:edit"), async (req, res) => {
  const parsed = createRunbookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const runbook = await prisma.runbook.create({
    data: { ...parsed.data, createdById: req.user!.id },
  });

  await logAudit(prisma, {
    action: "RUNBOOK_CREATED",
    actorId: req.user!.id,
    metadata: { runbookId: runbook.id, title: runbook.title },
  });

  res.status(201).json(runbook);
});

runbooksRouter.patch("/:id", requirePermission("runbook:edit"), async (req, res) => {
  const parsed = updateRunbookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.runbook.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Runbook not found" });

  const runbook = await prisma.runbook.update({
    where: { id: req.params.id },
    data: { ...parsed.data, updatedById: req.user!.id },
  });

  await logAudit(prisma, {
    action: "RUNBOOK_UPDATED",
    actorId: req.user!.id,
    metadata: { runbookId: runbook.id, changes: parsed.data },
  });

  res.json(runbook);
});
