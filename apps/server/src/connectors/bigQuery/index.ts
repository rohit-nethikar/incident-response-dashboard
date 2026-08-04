import type { SourceConnector } from "../types";
import { createMockConnector } from "../mock/mockConnectorFactory";

export function createMockBigQueryConnector(): SourceConnector {
  return createMockConnector("BIGQUERY");
}

// Real implementation: `@google-cloud/bigquery` — query
// INFORMATION_SCHEMA.JOBS_BY_PROJECT for failed/timed-out jobs and slot
// contention (via reservation utilization), emitting one NormalizedEvent
// per job/anomaly since the cursor timestamp.
export function createRealBigQueryConnector(): SourceConnector {
  throw new Error(
    "Real BigQuery connector not implemented. Set CONNECTOR_MODE_BIGQUERY=mock, " +
      "or implement using @google-cloud/bigquery against apps/server/src/connectors/types.ts."
  );
}
