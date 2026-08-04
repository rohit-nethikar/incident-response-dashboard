import type { Role } from "@incident-dash/shared";
import { apiFetch } from "./client";
import type { AppUser } from "@/types/api";

export function fetchUsers() {
  return apiFetch<AppUser[]>("/api/v1/users");
}

export function updateUserRole(id: string, role: Role) {
  return apiFetch<AppUser>(`/api/v1/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}
