import { z } from "zod";
import { SOURCE_SYSTEMS, SEVERITIES, INCIDENT_STATUSES } from "../constants/sources";

export const severitySchema = z.enum(SEVERITIES);
export const sourceSystemSchema = z.enum(SOURCE_SYSTEMS);
export const incidentStatusSchema = z.enum(INCIDENT_STATUSES);

export const scoreFactorSchema = z.object({
  factor: z.string(),
  weight: z.number(),
  contribution: z.number(),
  note: z.string().optional(),
});

export const businessImpactSchema = z.object({
  customerFacing: z.boolean(),
  revenueImpacting: z.boolean(),
  slaBreach: z.boolean(),
  affectedTier: z.enum(["tier1", "tier2", "tier3", "unknown"]),
  tags: z.array(z.string()),
});

export const normalizedEventSchema = z.object({
  sourceSystem: sourceSystemSchema,
  externalId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  rawPayload: z.unknown(),
  affectedResource: z.string().optional(),
  occurredAt: z.string(),
  severityHint: severitySchema.optional(),
  tags: z.array(z.string()),
});

export const listIncidentsQuerySchema = z.object({
  status: incidentStatusSchema.optional(),
  severity: severitySchema.optional(),
  sourceSystem: sourceSystemSchema.optional(),
  teamId: z.string().optional(),
  ownerId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const changeStatusSchema = z.object({
  status: incidentStatusSchema,
  note: z.string().max(2000).optional(),
});

export const assignIncidentSchema = z.object({
  ownerId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
});

export const acknowledgeIncidentSchema = z.object({
  note: z.string().max(2000).optional(),
});

export const approveRemediationSchema = z.object({
  runbookId: z.string(),
  stepIndex: z.number().int().min(0),
});

export const runbookStepSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  link: z.string().url().optional(),
});

export const createRunbookSchema = z.object({
  title: z.string().min(1),
  sourceSystem: sourceSystemSchema.nullable().optional(),
  triggerTags: z.array(z.string()).default([]),
  steps: z.array(runbookStepSchema).min(1),
  ownerTeamId: z.string().nullable().optional(),
});

export const updateRunbookSchema = createRunbookSchema.partial();

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "RESPONDER", "VIEWER"]),
});

export const connectorSettingsSchema = z.object({
  sourceSystem: sourceSystemSchema,
  mode: z.enum(["mock", "real"]),
});
