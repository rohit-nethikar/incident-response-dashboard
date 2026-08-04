import type { SourceConnector } from "../types";
import { createMockConnector } from "../mock/mockConnectorFactory";

export function createMockCloudRunConnector(): SourceConnector {
  return createMockConnector("CLOUD_RUN");
}

// Real implementation would use the Cloud Run Admin API
// (google-auth-library + `run.googleapis.com` REST, or
// `@google-cloud/run` client) to list services/revisions and derive
// NormalizedEvents from revision failure conditions and Cloud Monitoring
// metrics scoped to Cloud Run. Same SourceConnector interface — poll(cursor)
// returns { events, nextCursor }, healthCheck() pings the API.
export function createRealCloudRunConnector(): SourceConnector {
  throw new Error(
    "Real Cloud Run connector not implemented. Set CONNECTOR_MODE_CLOUD_RUN=mock, " +
      "or implement this using @google-cloud/run against apps/server/src/connectors/types.ts."
  );
}
