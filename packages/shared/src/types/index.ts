import type { SourceSystem, Severity, IncidentStatus } from "../constants/sources";
import type { Role } from "../constants/sources";

export interface ScoreFactor {
  factor: string;
  weight: number;
  contribution: number;
  note?: string;
}

export interface BusinessImpact {
  customerFacing: boolean;
  revenueImpacting: boolean;
  slaBreach: boolean;
  affectedTier: "tier1" | "tier2" | "tier3" | "unknown";
  tags: string[];
}

// What a connector produces before it becomes a persisted Incident.
export interface NormalizedEvent {
  sourceSystem: SourceSystem;
  externalId: string;
  title: string;
  description: string;
  rawPayload: unknown;
  affectedResource?: string;
  occurredAt: string; // ISO timestamp
  severityHint?: Severity;
  tags: string[];
}

export interface IncidentSummary {
  id: string;
  title: string;
  sourceSystem: SourceSystem;
  severity: Severity;
  status: IncidentStatus;
  affectedResource?: string | null;
  ownerId?: string | null;
  teamId?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface IncidentDetail extends IncidentSummary {
  description: string;
  externalId?: string | null;
  severityFactors: ScoreFactor[];
  businessImpact: BusinessImpact;
  rawPayload: unknown;
  runbookId?: string | null;
  resolvedAt?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
}

// ---------- WebSocket event contract ----------
export interface ServerToClientEvents {
  "incident:created": (payload: { incident: IncidentSummary }) => void;
  "incident:updated": (payload: {
    incidentId: string;
    patch: Partial<IncidentDetail>;
    changedBy: string;
  }) => void;
  "incident:acknowledged": (payload: {
    incidentId: string;
    acknowledgment: { id: string; userId: string; note?: string | null; createdAt: string };
  }) => void;
  "incident:timeline_entry": (payload: {
    incidentId: string;
    entry: { id: string; eventType: string; description: string; createdAt: string };
  }) => void;
  "connector:health": (payload: {
    sourceSystem: SourceSystem;
    isHealthy: boolean;
    lastError?: string | null;
  }) => void;
}

export interface ClientToServerEvents {
  "subscribe:incident": (payload: { incidentId: string }) => void;
  "unsubscribe:incident": (payload: { incidentId: string }) => void;
}
