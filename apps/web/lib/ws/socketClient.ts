import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@incident-dash/shared";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

export type IncidentSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: IncidentSocket | null = null;
let socketToken: string | null = null;

// Singleton so the sidebar's connection indicator and any page-level
// subscribers (dashboard feed, incident detail) share one connection instead
// of each opening their own.
export function getSocket(token: string): IncidentSocket {
  if (socket && socketToken === token) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socketToken = token;
  socket = io(`${WS_URL}/incidents`, {
    auth: { token },
    transports: ["websocket"],
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
