import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@incident-dash/shared";
import { env } from "../config/env";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface ApiTokenPayload {
  userId: string;
  email: string;
  role: Role;
}

// Express trusts API tokens minted by the Next.js/Auth.js side because both
// processes share AUTH_JWT_SECRET — no second OAuth flow needed against the
// backend. See apps/web/auth.config.ts for where this token is issued.
export function verifyJwt(req: Request, res: Response, next: NextFunction) {
  if (env.devBypassAuth) {
    req.user = { id: "dev-user", email: "dev@example.com", role: "ADMIN" };
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.authJwtSecret) as ApiTokenPayload;
    req.user = { id: payload.userId, email: payload.email, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
