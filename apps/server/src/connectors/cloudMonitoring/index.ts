import type { SourceConnector } from "../types";
import { createMockConnector } from "../mock/mockConnectorFactory";

export function createMockCloudMonitoringConnector(): SourceConnector {
  return createMockConnector("CLOUD_MONITORING");
}

// Real implementation: `@google-cloud/monitoring` — list open/recently
// fired AlertPolicy incidents via the Alerting API, plus Uptime Check
// results, and emit one NormalizedEvent per fired/open condition.
export function createRealCloudMonitoringConnector(): SourceConnector {
  throw new Error(
    "Real Cloud Monitoring connector not implemented. Set CONNECTOR_MODE_CLOUD_MONITORING=mock, " +
      "or implement using @google-cloud/monitoring against apps/server/src/connectors/types.ts."
  );
}
