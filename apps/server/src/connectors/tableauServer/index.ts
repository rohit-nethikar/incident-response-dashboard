import type { SourceConnector } from "../types";
import { createMockConnector } from "../mock/mockConnectorFactory";

export function createMockTableauServerConnector(): SourceConnector {
  return createMockConnector("TABLEAU_SERVER");
}

// Real implementation: Tableau REST API (sign in with a PAT via
// TABLEAU_PAT_NAME/TABLEAU_PAT_SECRET against TABLEAU_SERVER_URL +
// TABLEAU_SITE_NAME), poll the Background Jobs endpoint for failed extract
// refreshes and the job queue depth, emitting one NormalizedEvent per
// failure/threshold breach. If multi-site support is needed later, model it
// the same way the existing Tableau Admin Dashboard does: iterate configured
// sites with one shared PAT rather than per-site credentials.
export function createRealTableauServerConnector(): SourceConnector {
  throw new Error(
    "Real Tableau Server connector not implemented. Set CONNECTOR_MODE_TABLEAU_SERVER=mock, " +
      "or implement using the Tableau REST API against apps/server/src/connectors/types.ts."
  );
}
