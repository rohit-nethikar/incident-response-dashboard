"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket, disconnectSocket } from "./socketClient";
import { queryKeys } from "@/lib/api/queryKeys";

// Mounted once near the root of the dashboard shell. Every WS event patches
// the React Query cache directly rather than feeding a second parallel
// store — REST + WS end up rendering from the same source of truth.
export function useIncidentSocket() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.apiToken) {
      return;
    }

    const socket = getSocket(session.apiToken);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    const handleIncidentCreated = (payload: { incident: { id: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["incidents", "list"] });
      toast.info(`New incident: ${(payload.incident as { title?: string }).title ?? payload.incident.id}`);
    };

    const handleIncidentUpdated = (payload: { incidentId: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentDetail(payload.incidentId) });
      queryClient.invalidateQueries({ queryKey: ["incidents", "list"] });
    };

    const handleIncidentAcknowledged = (payload: { incidentId: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentDetail(payload.incidentId) });
      queryClient.invalidateQueries({ queryKey: ["incidents", "list"] });
    };

    const handleTimelineEntry = (payload: { incidentId: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentDetail(payload.incidentId) });
    };

    const handleConnectorHealth = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connectorStates() });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("incident:created", handleIncidentCreated);
    socket.on("incident:updated", handleIncidentUpdated);
    socket.on("incident:acknowledged", handleIncidentAcknowledged);
    socket.on("incident:timeline_entry", handleTimelineEntry);
    socket.on("connector:health", handleConnectorHealth);

    setConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("incident:created", handleIncidentCreated);
      socket.off("incident:updated", handleIncidentUpdated);
      socket.off("incident:acknowledged", handleIncidentAcknowledged);
      socket.off("incident:timeline_entry", handleTimelineEntry);
      socket.off("connector:health", handleConnectorHealth);
    };
  }, [status, session?.apiToken, queryClient]);

  useEffect(() => {
    if (status === "unauthenticated") {
      disconnectSocket();
      setConnected(false);
    }
  }, [status]);

  return { connected };
}
