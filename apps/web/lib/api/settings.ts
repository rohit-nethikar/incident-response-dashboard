import type { SourceSystem } from "@incident-dash/shared";
import { apiFetch } from "./client";
import type { ConnectorStateRecord, MockGeneratorSetting } from "@/types/api";

export function fetchConnectorStates() {
  return apiFetch<ConnectorStateRecord[]>("/api/v1/settings/connectors");
}

export function setConnectorMode(sourceSystem: SourceSystem, mode: "mock" | "real") {
  return apiFetch<ConnectorStateRecord>("/api/v1/settings/connectors", {
    method: "PATCH",
    body: JSON.stringify({ sourceSystem, mode }),
  });
}

export function fetchMockGeneratorSetting() {
  return apiFetch<MockGeneratorSetting>("/api/v1/settings/mock-generator");
}

export function updateMockGeneratorSetting(input: MockGeneratorSetting) {
  return apiFetch<MockGeneratorSetting>("/api/v1/settings/mock-generator", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
