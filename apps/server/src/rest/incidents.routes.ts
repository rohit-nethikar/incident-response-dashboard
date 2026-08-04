import { Router } from "express";
import {
  listIncidentsQuerySchema,
  changeStatusSchema,
  assignIncidentSchema,
  acknowledgeIncidentSchema,
  approveRemediationSchema,
} from "@incident-dash/shared";
import { prisma } from "../db/prismaClient";
import { requirePermission } from "../auth/requireRole";
import {
  changeStatus,
  assignIncident,
  acknowledgeIncident,
  approveRemediation,
  IllegalTransitionError,
  NotFoundError,
} from "../services/incidentLifecycle";

export const incidentsRouter = Router();

incidentsRouter.get("/", requirePermission("incident:view"), async (req, res) => {
  const parsed = listIncidentsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { status, severity, sourceSystem, teamId, ownerId, cursor, limit } = parsed.data;

  const incidents = await prisma.incident.findMany({
    where: { status, severity, sourceSystem, teamId, ownerId },
    orderBy: [{ firstSeenAt: "desc" }],
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  res.json({
    incidents,
    nextCursor: incidents.length === limit ? incidents[incidents.length - 1]?.id : null,
  });
});

incidentsRouter.get("/:id", requirePermission("incident:view"), async (req, res) => {
  const incident = await prisma.incident.findUnique({
    where: { id: req.params.id },
    include: {
      runbook: true,
      owner: { select: { id: true, name: true, email: true } },
      team: true,
      acknowledgments: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } },
      timelineEntries: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!incident) return res.status(404).json({ error: "Incident not found" });
  res.json(incident);
});

incidentsRouter.patch("/:id/status", requirePermission("incident:change_status"), async (req, res) => {
  const parsed = changeStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const updated = await changeStatus({
      incidentId: req.params.id,
      actorId: req.user!.id,
      nextStatus: parsed.data.status,
      note: parsed.data.note,
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof IllegalTransitionError) return res.status(409).json({ error: err.message });
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    throw err;
  }
});

incidentsRouter.patch("/:id/assign", requirePermission("incident:assign"), async (req, res) => {
  const parsed = assignIncidentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const updated = await assignIncident({
      incidentId: req.params.id,
      actorId: req.user!.id,
      ownerId: parsed.data.ownerId,
      teamId: parsed.data.teamId,
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    throw err;
  }
});

incidentsRouter.post("/:id/acknowledge", requirePermission("incident:acknowledge"), async (req, res) => {
  const parsed = acknowledgeIncidentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const ack = await acknowledgeIncident({
      incidentId: req.params.id,
      actorId: req.user!.id,
      note: parsed.data.note,
    });
    res.status(201).json(ack);
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    throw err;
  }
});

incidentsRouter.post(
  "/:id/approve-remediation",
  requirePermission("incident:approve_remediation"),
  async (req, res) => {
    const parsed = approveRemediationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    try {
      const result = await approveRemediation({
        incidentId: req.params.id,
        actorId: req.user!.id,
        runbookId: parsed.data.runbookId,
        stepIndex: parsed.data.stepIndex,
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
      throw err;
    }
  }
);
