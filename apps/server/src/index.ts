import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { apiRouter } from "./rest";
import { createSocketServer } from "./ws/socketServer";
import { startPollLoop } from "./jobs/pollLoop";

async function main() {
  const app = express();
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use("/api/v1", apiRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
  });

  await startPollLoop();
  console.log("[server] mock/real connector poll loop started");
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
