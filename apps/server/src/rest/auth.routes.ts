import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db/prismaClient";
import { env } from "../config/env";

export const authRouter = Router();

const syncUserSchema = z.object({
  googleSub: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
});

interface InternalTokenPayload {
  internal: true;
}

// Not a user-facing route: called server-to-server by apps/web's Auth.js
// `jwt` callback on every sign-in, authenticated with a short-lived
// "internal" token signed with the same AUTH_JWT_SECRET (rather than a
// per-user bearer token, since the user record may not exist yet on first
// login). Upserts the User row and returns its id/role so Auth.js can mint
// the real per-user API token used for all subsequent REST/WS calls.
authRouter.post("/sync-user", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing internal token" });

  try {
    const payload = jwt.verify(header.slice("Bearer ".length), env.authJwtSecret) as InternalTokenPayload;
    if (!payload.internal) throw new Error("not an internal token");
  } catch {
    return res.status(401).json({ error: "Invalid internal token" });
  }

  const parsed = syncUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { googleSub, email, name, avatarUrl } = parsed.data;

  try {
    // Auto-promotion is limited to exactly one case: SEED_ADMIN_EMAIL, and
    // only applies the first time that email signs in (a brand-new user row).
    // Every other role change requires an explicit Admin action via
    // PATCH /api/v1/users/:id/role.
    const existing = await prisma.user.findUnique({ where: { email } });
    const shouldSeedAdmin = !existing && env.seedAdminEmail && email === env.seedAdminEmail;

    const user = await prisma.user.upsert({
      where: { email },
      update: { googleSub, name, avatarUrl, lastLoginAt: new Date() },
      create: {
        googleSub,
        email,
        name,
        avatarUrl,
        role: shouldSeedAdmin ? "ADMIN" : "VIEWER",
        lastLoginAt: new Date(),
      },
    });

    res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
  } catch (err) {
    console.error("[auth] Error syncing user:", err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.message.includes("connect")) {
      return res.status(503).json({
        error: "Database connection error. Ensure DATABASE_URL is configured and the database is accessible.",
      });
    }
    res.status(500).json({ error: "Failed to sync user with database" });
  }
});
