import type { SourceConnector } from "../types";
import { createMockConnector } from "../mock/mockConnectorFactory";

export function createMockDataFusionConnector(): SourceConnector {
  return createMockConnector("DATA_FUSION");
}

// Real implementation: Data Fusion REST API (per-instance
// `https://<instance>-<project>-dot-<location>.datafusion.googleusercontent.com/api/v3/...`)
// to list pipeline runs with status FAILED since the cursor timestamp, one
// NormalizedEvent per failed run.
export function createRealDataFusionConnector(): SourceConnector {
  throw new Error(
    "Real Data Fusion connector not implemented. Set CONNECTOR_MODE_DATA_FUSION=mock, " +
      "or implement using the Data Fusion REST API against apps/server/src/connectors/types.ts."
  );
}
