import { Router } from "express";
import { updateUserRoleSchema } from "@incident-dash/shared";
import { prisma } from "../db/prismaClient";
import { requirePermission } from "../auth/requireRole";
import { logAudit } from "../services/audit";

export const usersRouter = Router();

usersRouter.get("/", requirePermission("user:manage_roles"), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, lastLoginAt: true, createdAt: true },
    orderBy: { email: "asc" },
  });
  res.json(users);
});

usersRouter.patch("/:id/role", requirePermission("user:manage_roles"), async (req, res) => {
  const parsed = updateUserRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "User not found" });

  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { role: parsed.data.role } });

  // Role changes are never automatic — this route is the only way a role
  // changes post-signup, and it's always attributable to the Admin who did it.
  await logAudit(prisma, {
    action: "USER_ROLE_CHANGED",
    actorId: req.user!.id,
    metadata: { targetUserId: updated.id, from: existing.role, to: updated.role },
  });

  res.json(updated);
});
