import type { SourceSystem } from "@incident-dash/shared";
import { SOURCE_SYSTEMS } from "@incident-dash/shared";
import { prisma } from "../db/prismaClient";
import { defaultConnectorMode } from "../config/env";
import type { SourceConnector } from "./types";
import { createMockCloudRunConnector, createRealCloudRunConnector } from "./cloudRun";
import { createMockCloudFunctionsConnector, createRealCloudFunctionsConnector } from "./cloudFunctions";
import { createMockCloudLoggingConnector, createRealCloudLoggingConnector } from "./cloudLogging";
import { createMockCloudMonitoringConnector, createRealCloudMonitoringConnector } from "./cloudMonitoring";
import { createMockDataFusionConnector, createRealDataFusionConnector } from "./dataFusion";
import { createMockBigQueryConnector, createRealBigQueryConnector } from "./bigQuery";
import { createMockTableauServerConnector, createRealTableauServerConnector } from "./tableauServer";

type Factories = { mock: () => SourceConnector; real: () => SourceConnector };

const FACTORY_MAP: Record<SourceSystem, Factories> = {
  CLOUD_RUN: { mock: createMockCloudRunConnector, real: createRealCloudRunConnector },
  CLOUD_FUNCTIONS: { mock: createMockCloudFunctionsConnector, real: createRealCloudFunctionsConnector },
  CLOUD_LOGGING: { mock: createMockCloudLoggingConnector, real: createRealCloudLoggingConnector },
  CLOUD_MONITORING: { mock: createMockCloudMonitoringConnector, real: createRealCloudMonitoringConnector },
  DATA_FUSION: { mock: createMockDataFusionConnector, real: createRealDataFusionConnector },
  BIGQUERY: { mock: createMockBigQueryConnector, real: createRealBigQueryConnector },
  TABLEAU_SERVER: { mock: createMockTableauServerConnector, real: createRealTableauServerConnector },
};

// Ensures every source system has a ConnectorState row (defaulting from env)
// so the poll loop and the Admin settings UI always have durable state to
// read/write, even on a fresh database.
export async function ensureConnectorStateSeeded(): Promise<void> {
  for (const sourceSystem of SOURCE_SYSTEMS) {
    await prisma.connectorState.upsert({
      where: { sourceSystem },
      update: {},
      create: { sourceSystem, mode: defaultConnectorMode(sourceSystem), isHealthy: true },
    });
  }
}

// Builds a live connector instance per source, reading the current mode from
// the DB-backed ConnectorState — the single source of truth the background
// poll loop and the REST settings endpoint both read/write, so a mode flip
// from the Admin UI takes effect on the connector's next poll cycle without
// a server restart.
export async function getActiveConnectors(): Promise<SourceConnector[]> {
  const states = await prisma.connectorState.findMany();
  return states.map((state) => {
    const factories = FACTORY_MAP[state.sourceSystem as SourceSystem];
    return state.mode === "real" ? factories.real() : factories.mock();
  });
}

export type { SourceConnector } from "./types";
