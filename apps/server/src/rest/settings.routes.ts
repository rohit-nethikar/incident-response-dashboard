import { Router } from "express";
import { z } from "zod";
import { connectorSettingsSchema } from "@incident-dash/shared";
import { prisma } from "../db/prismaClient";
import { requirePermission } from "../auth/requireRole";
import { logAudit } from "../services/audit";

export const settingsRouter = Router();

settingsRouter.get("/connectors", requirePermission("settings:manage_connectors"), async (_req, res) => {
  const states = await prisma.connectorState.findMany();
  res.json(states);
});

settingsRouter.patch("/connectors", requirePermission("settings:manage_connectors"), async (req, res) => {
  const parsed = connectorSettingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const before = await prisma.connectorState.findUnique({ where: { sourceSystem: parsed.data.sourceSystem } });
  const updated = await prisma.connectorState.update({
    where: { sourceSystem: parsed.data.sourceSystem },
    data: { mode: parsed.data.mode },
  });

  await logAudit(prisma, {
    action: "CONNECTOR_MODE_CHANGED",
    actorId: req.user!.id,
    metadata: { sourceSystem: parsed.data.sourceSystem, from: before?.mode, to: parsed.data.mode },
  });

  res.json(updated);
});

const mockGeneratorSchema = z.object({ enabled: z.boolean(), intervalMs: z.number().int().min(1000).max(120000) });

settingsRouter.get("/mock-generator", requirePermission("settings:manage_connectors"), async (_req, res) => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "mockGenerator" } });
  res.json(setting?.value ?? { enabled: true, intervalMs: 8000 });
});

settingsRouter.patch("/mock-generator", requirePermission("settings:manage_connectors"), async (req, res) => {
  const parsed = mockGeneratorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const setting = await prisma.systemSetting.upsert({
    where: { key: "mockGenerator" },
    update: { value: parsed.data },
    create: { key: "mockGenerator", value: parsed.data },
  });

  res.json(setting.value);
});
