import type { NextFunction, Request, Response } from "express";
import type { Permission } from "@incident-dash/shared";
import { roleHasPermission } from "@incident-dash/shared";

// The actual RBAC security boundary. The frontend hides/disables controls
// using the same @incident-dash/shared ROLE_PERMISSIONS map for UX, but
// that is never sufficient on its own — every mutating route is gated here.
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roleHasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: `Role ${req.user.role} lacks permission ${permission}` });
    }
    next();
  };
}
