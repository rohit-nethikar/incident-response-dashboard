import { apiFetch } from "./client";
import type { Team } from "@/types/api";

export function fetchTeams() {
  return apiFetch<Team[]>("/api/v1/teams");
}

export function createTeam(input: { name: string; description?: string }) {
  return apiFetch<Team>("/api/v1/teams", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function addTeamMember(teamId: string, userId: string) {
  return apiFetch<unknown>(`/api/v1/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function removeTeamMember(teamId: string, userId: string) {
  return apiFetch<void>(`/api/v1/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
  });
}
