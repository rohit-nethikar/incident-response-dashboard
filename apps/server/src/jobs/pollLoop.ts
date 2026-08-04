import { prisma } from "../db/prismaClient";
import { env } from "../config/env";
import { getActiveConnectors, ensureConnectorStateSeeded } from "../connectors";
import { ingestEvent } from "../services/incidentIngestion";
import { emitConnectorHealth } from "../ws/emitter";
import type { Prisma } from "@prisma/client";

let timer: ReturnType<typeof setInterval> | null = null;

async function runCycle(): Promise<void> {
  const connectors = await getActiveConnectors();

  for (const connector of connectors) {
    try {
      const state = await prisma.connectorState.findUnique({ where: { sourceSystem: connector.sourceSystem } });
      const cursor = state?.cursor ?? null;

      const { events, nextCursor } = await connector.poll(cursor);

      for (const event of events) {
        await ingestEvent(event);
      }

      const healthy = await connector.healthCheck();

      await prisma.connectorState.update({
        where: { sourceSystem: connector.sourceSystem },
        data: {
          lastPolledAt: new Date(),
          cursor: (nextCursor ?? null) as Prisma.InputJsonValue,
          isHealthy: healthy,
          lastError: null,
        },
      });

      if (state && state.isHealthy !== healthy) {
        emitConnectorHealth(connector.sourceSystem, healthy, null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.connectorState.update({
        where: { sourceSystem: connector.sourceSystem },
        data: { isHealthy: false, lastError: message, lastPolledAt: new Date() },
      });
      emitConnectorHealth(connector.sourceSystem, false, message);
      console.error(`[pollLoop] ${connector.sourceSystem} poll failed:`, message);
    }
  }
}

// The single scheduler tying connectors -> scoring -> ingestion -> WS
// together. Runs identically whether every connector is mocked or a mix of
// mock/real — the only thing that changes per source is what poll() does
// internally.
export async function startPollLoop(): Promise<void> {
  await ensureConnectorStateSeeded();
  if (timer) return;
  timer = setInterval(() => {
    void runCycle();
  }, env.mockGeneratorIntervalMs);
  void runCycle();
}

export function stopPollLoop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
