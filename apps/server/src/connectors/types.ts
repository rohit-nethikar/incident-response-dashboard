import type { NormalizedEvent, SourceSystem } from "@incident-dash/shared";

export type ConnectorMode = "mock" | "real";

export interface PollResult {
  events: NormalizedEvent[];
  nextCursor: unknown;
}

// The seam between the rest of the system and any given data source. A real
// implementation (Cloud Logging/Monitoring/Run/Functions/Data Fusion/
// BigQuery SDKs, Tableau REST API) implements exactly this interface — the
// poll loop, scoring, ingestion, and WebSocket layers never know or care
// whether they're talking to a mock or a real backend.
export interface SourceConnector {
  readonly sourceSystem: SourceSystem;
  readonly mode: ConnectorMode;
  poll(cursor: unknown | null): Promise<PollResult>;
  healthCheck(): Promise<boolean>;
}
