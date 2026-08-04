import { randomUUID } from "node:crypto";
import type { NormalizedEvent, SourceSystem } from "@incident-dash/shared";
import type { PollResult, SourceConnector } from "../types";
import { EVENT_TEMPLATES } from "./eventTemplates";

export interface MockConnectorOptions {
  // Probability [0,1] of emitting an event on any given poll cycle. Tunable
  // later via SystemSetting from the Admin settings page.
  emitProbability?: number;
  maxEventsPerCycle?: number;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createMockConnector(
  sourceSystem: SourceSystem,
  options: MockConnectorOptions = {}
): SourceConnector {
  const emitProbability = options.emitProbability ?? 0.6;
  const maxEventsPerCycle = options.maxEventsPerCycle ?? 2;
  const templates = EVENT_TEMPLATES[sourceSystem];

  return {
    sourceSystem,
    mode: "mock",
    async poll(): Promise<PollResult> {
      const events: NormalizedEvent[] = [];
      const eventCount =
        Math.random() < emitProbability ? 1 + Math.floor(Math.random() * maxEventsPerCycle) : 0;

      for (let i = 0; i < eventCount; i++) {
        const template = pick(templates);
        const resource = pick(template.resourcePool);
        const now = new Date();
        events.push({
          sourceSystem,
          externalId: `mock-${sourceSystem.toLowerCase()}-${randomUUID()}`,
          title: `${template.title}: ${resource}`,
          description: template.description,
          rawPayload: {
            source: sourceSystem,
            resource,
            simulated: true,
            template: template.title,
            generatedAt: now.toISOString(),
          },
          affectedResource: resource,
          occurredAt: now.toISOString(),
          severityHint: template.severityHint,
          tags: template.tags,
        });
      }

      return { events, nextCursor: null };
    },
    async healthCheck() {
      // A mock connector is always "healthy" — real connectors would ping
      // the underlying API here.
      return true;
    },
  };
}
