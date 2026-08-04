import type { IncidentStatus } from "@incident-dash/shared";
import { LEGAL_TRANSITIONS } from "@incident-dash/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prismaClient";
import { logAudit } from "./audit";
import { emitIncidentAcknowledged, emitIncidentUpdated, emitTimelineEntry } from "../ws/emitter";

export class IllegalTransitionError extends Error {}
export class NotFoundError extends Error {}

async function requireIncident(tx: Prisma.TransactionClient, incidentId: string) {
  const incident = await tx.incident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new NotFoundError(`Incident ${incidentId} not found`);
  return incident;
}

export async function changeStatus(params: {
  incidentId: string;
  actorId: string;
  nextStatus: IncidentStatus;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const incident = await requireIncident(tx, params.incidentId);
    const legal = LEGAL_TRANSITIONS[incident.status as IncidentStatus] ?? [];
    if (!legal.includes(params.nextStatus)) {
      throw new IllegalTransitionError(
        `Cannot transition incident from ${incident.status} to ${params.nextStatus}`
      );
    }

    const updated = await tx.incident.update({
      where: { id: incident.id },
      data: {
        status: params.nextStatus,
        resolvedAt: params.nextStatus === "RESOLVED" ? new Date() : incident.resolvedAt,
      },
    });

    const description = `Status changed: ${incident.status} → ${params.nextStatus}${
      params.note ? ` — ${params.note}` : ""
    }`;
    const entry = await tx.incidentTimelineEntry.create({
      data: { incidentId: incident.id, eventType: "status_change", description },
    });

    await logAudit(tx, {
      action: "INCIDENT_STATUS_CHANGED",
      actorId: params.actorId,
      incidentId: incident.id,
      metadata: { from: incident.status, to: params.nextStatus, note: params.note ?? null },
    });

    emitIncidentUpdated(incident.id, { status: params.nextStatus }, params.actorId);
    emitTimelineEntry(incident.id, {
      id: entry.id,
      eventType: entry.eventType,
      description: entry.description,
      createdAt: entry.createdAt.toISOString(),
    });

    return updated;
  });
}

export async function assignIncident(params: {
  incidentId: string;
  actorId: string;
  ownerId?: string | null;
  teamId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const incident = await requireIncident(tx, params.incidentId);

    const updated = await tx.incident.update({
      where: { id: incident.id },
      data: {
        ownerId: params.ownerId === undefined ? incident.ownerId : params.ownerId,
        teamId: params.teamId === undefined ? incident.teamId : params.teamId,
      },
    });

    await logAudit(tx, {
      action: "INCIDENT_ASSIGNED",
      actorId: params.actorId,
      incidentId: incident.id,
      metadata: { ownerId: updated.ownerId, teamId: updated.teamId },
    });

    emitIncidentUpdated(incident.id, { ownerId: updated.ownerId, teamId: updated.teamId }, params.actorId);

    return updated;
  });
}

export async function acknowledgeIncident(params: { incidentId: string; actorId: string; note?: string }) {
  return prisma.$transaction(async (tx) => {
    const incident = await requireIncident(tx, params.incidentId);

    const ack = await tx.acknowledgment.create({
      data: { incidentId: incident.id, userId: params.actorId, note: params.note },
      include: { user: { select: { id: true, name: true, email: true, image: true, role: true } } },
    });

    // Acknowledging also advances OPEN -> ACKNOWLEDGED if that's still the
    // current status; if a responder already moved it further along, the
    // ack is still recorded but doesn't move status backwards.
    let updatedIncident = incident;
    if (incident.status === "OPEN") {
      updatedIncident = await tx.incident.update({ where: { id: incident.id }, data: { status: "ACKNOWLEDGED" } });
    }

    await logAudit(tx, {
      action: "INCIDENT_ACKNOWLEDGED",
      actorId: params.actorId,
      incidentId: incident.id,
      metadata: { note: params.note ?? null },
    });

    emitIncidentAcknowledged(incident.id, {
      id: ack.id,
      userId: ack.userId,
      note: ack.note,
      createdAt: ack.createdAt.toISOString(),
    });
    if (updatedIncident.status !== incident.status) {
      emitIncidentUpdated(incident.id, { status: updatedIncident.status as IncidentStatus }, params.actorId);
    }

    return ack;
  });
}

// Records that a human reviewed and approved a suggested remediation step.
// This is the ONLY effect of this action — it never triggers any external
// call, script, or automated remediation. Mirrors the "no autonomous
// remediation, ever" rule from the Tableau Admin Dashboard project.
export async function approveRemediation(params: {
  incidentId: string;
  actorId: string;
  runbookId: string;
  stepIndex: number;
}) {
  return prisma.$transaction(async (tx) => {
    const incident = await requireIncident(tx, params.incidentId);
    const runbook = await tx.runbook.findUnique({ where: { id: params.runbookId } });
    if (!runbook) throw new NotFoundError(`Runbook ${params.runbookId} not found`);

    const steps = runbook.steps as Array<{ title: string; description: string }>;
    const step = steps[params.stepIndex];
    if (!step) throw new NotFoundError(`Runbook ${params.runbookId} has no step at index ${params.stepIndex}`);

    await logAudit(tx, {
      action: "REMEDIATION_APPROVED",
      actorId: params.actorId,
      incidentId: incident.id,
      metadata: { runbookId: runbook.id, stepIndex: params.stepIndex, stepTitle: step.title },
    });

    const entry = await tx.incidentTimelineEntry.create({
      data: {
        incidentId: incident.id,
        eventType: "note",
        description: `Remediation step approved: "${step.title}"`,
      },
    });

    emitTimelineEntry(incident.id, {
      id: entry.id,
      eventType: entry.eventType,
      description: entry.description,
      createdAt: entry.createdAt.toISOString(),
    });

    return { runbookId: runbook.id, stepIndex: params.stepIndex };
  });
}
