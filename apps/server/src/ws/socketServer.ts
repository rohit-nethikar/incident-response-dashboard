import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import type { ClientToServerEvents, ServerToClientEvents, Role } from "@incident-dash/shared";
import { env } from "../config/env";
import { attachIoServer } from "./emitter";

interface ApiTokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true },
    path: "/socket.io",
  });

  const incidentsNsp = io.of("/incidents");

  incidentsNsp.use((socket, next) => {
    if (env.devBypassAuth) {
      socket.data.user = { id: "dev-user", email: "dev@example.com", role: "ADMIN" as Role };
      return next();
    }

    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));

    try {
      const payload = jwt.verify(token, env.authJwtSecret) as ApiTokenPayload;
      socket.data.user = { id: payload.userId, email: payload.email, role: payload.role };
      next();
    } catch {
      next(new Error("Invalid auth token"));
    }
  });

  incidentsNsp.on("connection", (socket) => {
    // Every connected client sees the global live feed; incident-detail
    // pages additionally subscribe to a per-incident room for fine-grained
    // updates (comments/acks on that one incident).
    socket.join("all");

    socket.on("subscribe:incident", ({ incidentId }) => {
      socket.join(`incident:${incidentId}`);
    });

    socket.on("unsubscribe:incident", ({ incidentId }) => {
      socket.leave(`incident:${incidentId}`);
    });
  });

  // The emitter module is what services actually call; here we just hand it
  // the live `/incidents` namespace server instance.
  attachIoServer(incidentsNsp as unknown as Server<ClientToServerEvents, ServerToClientEvents>);

  return io;
}
