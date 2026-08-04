export const SOURCE_SYSTEMS = [
  "CLOUD_LOGGING",
  "CLOUD_MONITORING",
  "CLOUD_RUN",
  "CLOUD_FUNCTIONS",
  "DATA_FUSION",
  "BIGQUERY",
  "TABLEAU_SERVER",
] as const;

export type SourceSystem = (typeof SOURCE_SYSTEMS)[number];

export const SOURCE_SYSTEM_LABELS: Record<SourceSystem, string> = {
  CLOUD_LOGGING: "Cloud Logging",
  CLOUD_MONITORING: "Cloud Monitoring",
  CLOUD_RUN: "Cloud Run",
  CLOUD_FUNCTIONS: "Cloud Functions",
  DATA_FUSION: "Data Fusion",
  BIGQUERY: "BigQuery",
  TABLEAU_SERVER: "Tableau Server",
};

export const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
  INFO: 0,
};

export const INCIDENT_STATUSES = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "IGNORED",
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

// Legal forward transitions. IGNORED is reachable from OPEN/ACKNOWLEDGED as an
// explicit human decision; nothing transitions automatically.
export const LEGAL_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: ["ACKNOWLEDGED", "IGNORED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "IGNORED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  IGNORED: ["OPEN"],
};

export const ROLES = ["ADMIN", "RESPONDER", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];
