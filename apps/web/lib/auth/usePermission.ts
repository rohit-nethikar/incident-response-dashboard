"use client";

import { useSession } from "next-auth/react";
import { roleHasPermission, type Permission, type Role } from "@incident-dash/shared";

// UX-only gate for hiding/disabling controls. The server-side
// requirePermission middleware is the actual security boundary — this hook
// must never be treated as a substitute for it.
export function usePermission(permission: Permission): boolean {
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;
  if (!role) return false;
  return roleHasPermission(role, permission);
}
