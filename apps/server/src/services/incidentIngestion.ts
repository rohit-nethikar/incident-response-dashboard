import type { NormalizedEvent, IncidentSummary } from "@incident-dash/shared";
import { prisma } from "../db/prismaClient";
import { computeSeverityAndImpact } from "./scoring";
import { logAudit } from "./audit";
import { emitIncidentCreated, emitTimelineEntry } from "../ws/emitter";
import type { Prisma } from "@prisma/client";

async function findMatchingRunbook(event: NormalizedEvent) {
  if (event.tags.length === 0) return null;
  const candidates = await prisma.runbook.findMany({
    where: {
      OR: [{ sourceSystem: event.sourceSystem }, { sourceSystem: null }],
      triggerTags: { hasSome: event.tags },
    },
  });
  if (candidates.length === 0) return null;
  // Prefer the candidate with the most overlapping tags.
  candidates.sort(
    (a, b) =>
      b.triggerTags.filter((t) => event.tags.includes(t)).length -
      a.triggerTags.filter((t) => event.tags.includes(t)).length
  );
  return candidates[0];
}

function toSummary(incident: {
  id: string;
  title: string;
  sourceSystem: string;
  severity: string;
  status: string;
  affectedResource: string | null;
  ownerId: string | null;
  teamId: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
}): IncidentSummary {
  return {
    id: incident.id,
    title: incident.title,
    sourceSystem: incident.sourceSystem as IncidentSummary["sourceSystem"],
    severity: incident.severity as IncidentSummary["severity"],
    status: incident.status as IncidentSummary["status"],
    affectedResource: incident.affectedResource,
    ownerId: incident.ownerId,
    teamId: incident.teamId,
    firstSeenAt: incident.firstSeenAt.toISOString(),
    lastSeenAt: incident.lastSeenAt.toISOString(),
  };
}

// A distinguished "system actor" user id used for audit entries that
// originate from an automated process (event ingestion) rather than a human
// action. Created lazily so seed order doesn't matter.
async function getSystemActorId(): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: "system@incident-dashboard.local" } });
  if (existing) return existing.id;
  const created = await prisma.user.create({
    data: {
      googleSub: "system:ingestion",
      email: "system@incident-dashboard.local",
      name: "System (event ingestion)",
      role: "VIEWER",
    },
  });
  return created.id;
}

// Ingests one normalized event: dedupes by (sourceSystem, externalId),
// scores it, matches a runbook, and — if it's genuinely new — persists,
// audit-logs, and broadcasts it over WebSocket. Existing incidents just get
// their lastSeenAt bumped and a timeline entry noting the repeat signal,
// rather than spawning duplicate incidents for the same underlying problem.
export async function ingestEvent(event: NormalizedEvent): Promise<void> {
  const existing = await prisma.incident.findUnique({
    where: { sourceSystem_externalId: { sourceSystem: event.sourceSystem, externalId: event.externalId } },
  });

  if (existing) {
    await prisma.incident.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date() },
    });
    return;
  }

  const { severity, severityFactors, businessImpact } = await computeSeverityAndImpact(event);
  const runbook = await findMatchingRunbook(event);
  const systemActorId = await getSystemActorId();

  const incident = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.incident.create({
      data: {
        title: event.title,
        description: event.description,
        sourceSystem: event.sourceSystem,
        externalId: event.externalId,
        severity,
        severityFactors: severityFactors as unknown as Prisma.InputJsonValue,
        businessImpact: businessImpact as unknown as Prisma.InputJsonValue,
        affectedResource: event.affectedResource,
        rawPayload: event.rawPayload as Prisma.InputJsonValue,
        runbookId: runbook?.id,
      },
    });

    await tx.incidentTimelineEntry.create({
      data: {
        incidentId: created.id,
        eventType: "source_update",
        description: `Detected via ${event.sourceSystem} connector.`,
      },
    });

    await logAudit(tx, {
      action: "INCIDENT_CREATED",
      actorId: systemActorId,
      incidentId: created.id,
      metadata: { sourceSystem: event.sourceSystem, externalId: event.externalId, severity },
    });

    if (runbook) {
      await logAudit(tx, {
        action: "REMEDIATION_SUGGESTED",
        actorId: systemActorId,
        incidentId: created.id,
        metadata: { runbookId: runbook.id, runbookTitle: runbook.title },
      });
    }

    return created;
  });

  emitIncidentCreated(toSummary(incident));
  emitTimelineEntry(incident.id, {
    id: incident.id,
    eventType: "source_update",
    description: `Detected via ${event.sourceSystem} connector.`,
    createdAt: incident.firstSeenAt.toISOString(),
  });
}
