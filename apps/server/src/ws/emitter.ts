import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  IncidentSummary,
  IncidentDetail,
  SourceSystem,
} from "@incident-dash/shared";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Set once at server startup by ws/socketServer.ts. Services (incident
// ingestion, lifecycle, connector health checks) call the emit* helpers
// below rather than importing socket.io directly — keeps a one-way
// dependency (services -> emitter -> socket.io) instead of a circular one.
let io: IoServer | null = null;

export function attachIoServer(server: IoServer) {
  io = server;
}

export function emitIncidentCreated(incident: IncidentSummary) {
  io?.to("all").emit("incident:created", { incident });
}

export function emitIncidentUpdated(incidentId: string, patch: Partial<IncidentDetail>, changedBy: string) {
  io?.to("all").to(`incident:${incidentId}`).emit("incident:updated", { incidentId, patch, changedBy });
}

export function emitIncidentAcknowledged(
  incidentId: string,
  acknowledgment: { id: string; userId: string; note?: string | null; createdAt: string }
) {
  io?.to("all")
    .to(`incident:${incidentId}`)
    .emit("incident:acknowledged", { incidentId, acknowledgment });
}

export function emitTimelineEntry(
  incidentId: string,
  entry: { id: string; eventType: string; description: string; createdAt: string }
) {
  io?.to("all").to(`incident:${incidentId}`).emit("incident:timeline_entry", { incidentId, entry });
}

export function emitConnectorHealth(sourceSystem: SourceSystem, isHealthy: boolean, lastError?: string | null) {
  io?.to("all").emit("connector:health", { sourceSystem, isHealthy, lastError });
}
