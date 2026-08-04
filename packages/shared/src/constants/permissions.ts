import type { Role } from "./sources";

// Single source of truth for the RBAC matrix. Consumed by:
//  - apps/server/src/auth/requireRole.ts (the actual security boundary)
//  - apps/web (to hide/disable controls the current user can't use — UX
//    only, never a substitute for the server-side check)
export const PERMISSIONS = [
  "incident:view",
  "incident:acknowledge",
  "incident:change_status",
  "incident:assign",
  "incident:approve_remediation",
  "runbook:view",
  "runbook:edit",
  "team:view",
  "team:manage",
  "user:manage_roles",
  "settings:manage_connectors",
  "audit:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  VIEWER: ["incident:view", "runbook:view", "team:view", "audit:view"],
  RESPONDER: [
    "incident:view",
    "incident:acknowledge",
    "incident:change_status",
    "incident:assign",
    "incident:approve_remediation",
    "runbook:view",
    "runbook:edit",
    "team:view",
    "audit:view",
  ],
  ADMIN: [...PERMISSIONS],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
