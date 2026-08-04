import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../db/prismaClient";

type AuditAction =
  | "INCIDENT_CREATED"
  | "INCIDENT_ACKNOWLEDGED"
  | "INCIDENT_STATUS_CHANGED"
  | "INCIDENT_ASSIGNED"
  | "REMEDIATION_SUGGESTED"
  | "REMEDIATION_APPROVED"
  | "RUNBOOK_CREATED"
  | "RUNBOOK_UPDATED"
  | "USER_ROLE_CHANGED"
  | "CONNECTOR_MODE_CHANGED"
  | "SEED_ADMIN_PROMOTED";

// The only writer of AuditLogEntry rows in the whole codebase. There is
// deliberately no update/delete counterpart — see
// apps/server/src/rest/audit.routes.ts, which only exposes GET.
export async function logAudit(
  client: Prisma.TransactionClient | PrismaClient,
  params: {
    action: AuditAction;
    actorId: string;
    incidentId?: string | null;
    metadata: Record<string, unknown>;
  }
) {
  return client.auditLogEntry.create({
    data: {
      action: params.action,
      actorId: params.actorId,
      incidentId: params.incidentId ?? undefined,
      metadata: params.metadata as Prisma.InputJsonValue,
    },
  });
}

export async function listAudit(params: { incidentId?: string; limit?: number }) {
  return prisma.auditLogEntry.findMany({
    where: params.incidentId ? { incidentId: params.incidentId } : undefined,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 100,
    include: { actor: { select: { id: true, email: true, name: true } } },
  });
}
