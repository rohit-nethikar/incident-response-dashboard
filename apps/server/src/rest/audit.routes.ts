import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../auth/requireRole";
import { listAudit } from "../services/audit";

export const auditRouter = Router();

const querySchema = z.object({ incidentId: z.string().optional(), limit: z.coerce.number().int().min(1).max(500).optional() });

// Read-only, intentionally. There is no PATCH/DELETE route for audit log
// entries anywhere in this API — see services/audit.ts.
auditRouter.get("/", requirePermission("audit:view"), async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const entries = await listAudit(parsed.data);
  res.json(entries);
});
