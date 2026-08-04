import "dotenv/config";
import type { SourceSystem } from "@incident-dash/shared";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.SERVER_PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  databaseUrl: required("DATABASE_URL"),
  authJwtSecret: required("AUTH_JWT_SECRET", "dev-insecure-secret-change-me"),
  devBypassAuth: process.env.DEV_BYPASS_AUTH === "true",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL,
  mockGeneratorIntervalMs: Number(process.env.MOCK_GENERATOR_INTERVAL_MS ?? 8000),
  gcpProjectId: process.env.GCP_PROJECT_ID,
  gcpServiceAccountKeyPath: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
  tableau: {
    serverUrl: process.env.TABLEAU_SERVER_URL,
    siteName: process.env.TABLEAU_SITE_NAME,
    patName: process.env.TABLEAU_PAT_NAME,
    patSecret: process.env.TABLEAU_PAT_SECRET,
  },
};

const DEFAULT_CONNECTOR_MODE_ENV: Record<SourceSystem, string> = {
  CLOUD_LOGGING: "CONNECTOR_MODE_CLOUD_LOGGING",
  CLOUD_MONITORING: "CONNECTOR_MODE_CLOUD_MONITORING",
  CLOUD_RUN: "CONNECTOR_MODE_CLOUD_RUN",
  CLOUD_FUNCTIONS: "CONNECTOR_MODE_CLOUD_FUNCTIONS",
  DATA_FUSION: "CONNECTOR_MODE_DATA_FUSION",
  BIGQUERY: "CONNECTOR_MODE_BIGQUERY",
  TABLEAU_SERVER: "CONNECTOR_MODE_TABLEAU_SERVER",
};

export function defaultConnectorMode(source: SourceSystem): "mock" | "real" {
  const raw = process.env[DEFAULT_CONNECTOR_MODE_ENV[source]] ?? "mock";
  return raw === "real" ? "real" : "mock";
}
