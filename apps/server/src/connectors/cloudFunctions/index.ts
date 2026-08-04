import type { SourceConnector } from "../types";
import { createMockConnector } from "../mock/mockConnectorFactory";

export function createMockCloudFunctionsConnector(): SourceConnector {
  return createMockConnector("CLOUD_FUNCTIONS");
}

// Real implementation: `@google-cloud/functions` (Cloud Functions Admin API)
// for deploy/version metadata, cross-referenced with Cloud Monitoring
// metrics (execution count, error count, execution times) for the function
// resource type `cloud_function`.
export function createRealCloudFunctionsConnector(): SourceConnector {
  throw new Error(
    "Real Cloud Functions connector not implemented. Set CONNECTOR_MODE_CLOUD_FUNCTIONS=mock, " +
      "or implement using @google-cloud/functions against apps/server/src/connectors/types.ts."
  );
}
