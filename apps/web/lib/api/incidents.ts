import type { IncidentStatus } from "@incident-dash/shared";
import { apiFetch, buildQueryString } from "./client";
import type {
  Acknowledgment,
  IncidentDetailRecord,
  IncidentListResponse,
  IncidentRecord,
} from "@/types/api";

export interface ListIncidentsParams {
  status?: IncidentStatus;
  severity?: string;
  sourceSystem?: string;
  teamId?: string;
  ownerId?: string;
  cursor?: string;
  limit?: number;
}

export function fetchIncidents(params: ListIncidentsParams = {}) {
  return apiFetch<IncidentListResponse>(
    `/api/v1/incidents${buildQueryString(params as Record<string, string | number | undefined>)}`
  );
}

export function fetchIncidentDetail(id: string) {
  return apiFetch<IncidentDetailRecord>(`/api/v1/incidents/${id}`);
}

export function changeIncidentStatus(id: string, status: IncidentStatus, note?: string) {
  return apiFetch<IncidentRecord>(`/api/v1/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export function assignIncident(
  id: string,
  input: { ownerId?: string | null; teamId?: string | null }
) {
  return apiFetch<IncidentRecord>(`/api/v1/incidents/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function acknowledgeIncident(id: string, note?: string) {
  return apiFetch<Acknowledgment>(`/api/v1/incidents/${id}/acknowledge`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function approveRemediation(id: string, runbookId: string, stepIndex: number) {
  return apiFetch<unknown>(`/api/v1/incidents/${id}/approve-remediation`, {
    method: "POST",
    body: JSON.stringify({ runbookId, stepIndex }),
  });
}
