import { Router } from "express";
import { verifyJwt } from "../auth/verifyJwt";
import { healthRouter } from "./health.routes";
import { authRouter } from "./auth.routes";
import { incidentsRouter } from "./incidents.routes";
import { runbooksRouter } from "./runbooks.routes";
import { teamsRouter } from "./teams.routes";
import { usersRouter } from "./users.routes";
import { auditRouter } from "./audit.routes";
import { settingsRouter } from "./settings.routes";

export const apiRouter = Router();

// Health checks and the internal user-sync endpoint are unauthenticated by
// a per-user JWT (sync-user has its own internal-token check).
apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);

// Everything past this point requires a verified per-user API token.
apiRouter.use(verifyJwt);
apiRouter.use("/incidents", incidentsRouter);
apiRouter.use("/runbooks", runbooksRouter);
apiRouter.use("/teams", teamsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/audit", auditRouter);
apiRouter.use("/settings", settingsRouter);
