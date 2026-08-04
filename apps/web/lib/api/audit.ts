import { apiFetch, buildQueryString } from "./client";
import type { AuditLogEntry } from "@/types/api";

export interface ListAuditParams {
  incidentId?: string;
  limit?: number;
}

export function fetchAuditLog(params: ListAuditParams = {}) {
  return apiFetch<AuditLogEntry[]>(`/api/v1/audit${buildQueryString(params)}`);
}
