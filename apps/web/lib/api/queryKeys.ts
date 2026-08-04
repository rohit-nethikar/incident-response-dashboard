export const queryKeys = {
  incidents: (params?: Record<string, unknown>) =>
    ["incidents", "list", params ?? {}] as const,
  incidentDetail: (id: string) => ["incidents", "detail", id] as const,
  runbooks: () => ["runbooks"] as const,
  runbook: (id: string) => ["runbooks", id] as const,
  teams: () => ["teams"] as const,
  users: () => ["users"] as const,
  auditLog: (params?: Record<string, unknown>) => ["audit", params ?? {}] as const,
  connectorStates: () => ["settings", "connectors"] as const,
  mockGeneratorSetting: () => ["settings", "mock-generator"] as const,
};
