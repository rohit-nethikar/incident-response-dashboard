import type { SourceSystem } from "@incident-dash/shared";
import { apiFetch } from "./client";
import type { Runbook, RunbookStep } from "@/types/api";

export function fetchRunbooks() {
  return apiFetch<Runbook[]>("/api/v1/runbooks");
}

export function fetchRunbook(id: string) {
  return apiFetch<Runbook>(`/api/v1/runbooks/${id}`);
}

export interface RunbookInput {
  title: string;
  sourceSystem?: SourceSystem | null;
  triggerTags: string[];
  steps: RunbookStep[];
  ownerTeamId?: string | null;
}

export function createRunbook(input: RunbookInput) {
  return apiFetch<Runbook>("/api/v1/runbooks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateRunbook(id: string, input: Partial<RunbookInput>) {
  return apiFetch<Runbook>(`/api/v1/runbooks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
