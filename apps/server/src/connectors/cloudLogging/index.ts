import type { SourceConnector } from "../types";
import { createMockConnector } from "../mock/mockConnectorFactory";

export function createMockCloudLoggingConnector(): SourceConnector {
  return createMockConnector("CLOUD_LOGGING");
}

// Real implementation: `@google-cloud/logging` — run a log-based metric or
// an Entries.list query filtered to severity>=ERROR since the last cursor
// timestamp, group by resource/pattern, and emit one NormalizedEvent per
// pattern that crosses a volume threshold in the polling window.
export function createRealCloudLoggingConnector(): SourceConnector {
  throw new Error(
    "Real Cloud Logging connector not implemented. Set CONNECTOR_MODE_CLOUD_LOGGING=mock, " +
      "or implement using @google-cloud/logging against apps/server/src/connectors/types.ts."
  );
}
