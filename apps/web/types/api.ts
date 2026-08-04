import type {
  BusinessImpact,
  IncidentStatus,
  Role,
  ScoreFactor,
  Severity,
  SourceSystem,
} from "@incident-dash/shared";

// Local view-model types for API responses that come back as raw Prisma
// records (richer than the shared IncidentSummary/IncidentDetail contracts
// used on the WebSocket wire). Field names mirror apps/server/prisma/schema.prisma.

export interface UserRef {
  id: string;
  name: string | null;
  email: string;
  role?: Role;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  members?: { id: string; user: UserRef }[];
}

export interface RunbookStep {
  title: string;
  description: string;
  link?: string;
}

export interface Runbook {
  id: string;
  title: string;
  sourceSystem: SourceSystem | null;
  triggerTags: string[];
  steps: RunbookStep[];
  ownerTeamId: string | null;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Acknowledgment {
  id: string;
  incidentId: string;
  userId: string;
  user: UserRef;
  note: string | null;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  incidentId: string;
  eventType: string;
  description: string;
  createdAt: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  description: string;
  sourceSystem: SourceSystem;
  externalId: string | null;
  severity: Severity;
  severityFactors: ScoreFactor[];
  businessImpact: BusinessImpact;
  status: IncidentStatus;
  affectedResource: string | null;
  rawPayload: unknown;
  ownerId: string | null;
  teamId: string | null;
  runbookId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
}

export interface IncidentDetailRecord extends IncidentRecord {
  runbook: Runbook | null;
  owner: UserRef | null;
  team: Team | null;
  acknowledgments: Acknowledgment[];
  timelineEntries: TimelineEntry[];
}

export interface IncidentListResponse {
  incidents: IncidentRecord[];
  nextCursor: string | null;
}

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  incidentId: string | null;
  actorId: string;
  actor: UserRef;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ConnectorStateRecord {
  sourceSystem: SourceSystem;
  mode: "mock" | "real";
  lastPolledAt: string | null;
  cursor: unknown;
  isHealthy: boolean;
  lastError: string | null;
}

export interface MockGeneratorSetting {
  enabled: boolean;
  intervalMs: number;
}
