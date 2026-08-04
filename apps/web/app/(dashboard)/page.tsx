"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SEVERITIES,
  INCIDENT_STATUSES,
  SOURCE_SYSTEMS,
  SOURCE_SYSTEM_LABELS,
  type Severity,
  type IncidentStatus,
  type SourceSystem,
} from "@incident-dash/shared";
import { fetchIncidents } from "@/lib/api/incidents";
import { queryKeys } from "@/lib/api/queryKeys";
import { useUiStore } from "@/lib/store/uiStore";
import { IncidentTable } from "@/components/IncidentTable";

const SEVERITY_TILE_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];

export default function OverviewPage() {
  const filters = useUiStore((s) => s.filters);
  const setFilters = useUiStore((s) => s.setFilters);

  const apiParams = {
    status: filters.status,
    severity: filters.severity,
    sourceSystem: filters.sourceSystem,
    limit: 100,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.incidents(apiParams),
    queryFn: () => fetchIncidents(apiParams),
    refetchInterval: 30_000,
  });

  const incidents = data?.incidents ?? [];

  const filtered = useMemo(() => {
    if (!filters.search.trim()) return incidents;
    const term = filters.search.trim().toLowerCase();
    return incidents.filter(
      (incident) =>
        incident.title.toLowerCase().includes(term) ||
        incident.affectedResource?.toLowerCase().includes(term)
    );
  }, [incidents, filters.search]);

  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
    for (const incident of incidents) counts[incident.severity]++;
    return counts;
  }, [incidents]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Live incident feed</h1>
        <p className="text-sm text-text-secondary">
          Aggregated from Cloud Logging, Monitoring, Run, Functions, Data Fusion, BigQuery, and Tableau Server.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SEVERITY_TILE_ORDER.map((severity) => (
          <div key={severity} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase text-text-muted">{severity}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
              {severityCounts[severity]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search incidents…"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="w-full max-w-xs rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-1"
        />
        <select
          value={filters.severity ?? ""}
          onChange={(e) => setFilters({ severity: (e.target.value || undefined) as Severity | undefined })}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
        >
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.status ?? ""}
          onChange={(e) => setFilters({ status: (e.target.value || undefined) as IncidentStatus | undefined })}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
        >
          <option value="">All statuses</option>
          {INCIDENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.sourceSystem ?? ""}
          onChange={(e) =>
            setFilters({ sourceSystem: (e.target.value || undefined) as SourceSystem | undefined })
          }
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
        >
          <option value="">All sources</option>
          {SOURCE_SYSTEMS.map((s) => (
            <option key={s} value={s}>
              {SOURCE_SYSTEM_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading incidents…</p>}
      {isError && <p className="text-sm text-severity-critical">Failed to load incidents.</p>}
      {!isLoading && !isError && <IncidentTable incidents={filtered} />}
    </div>
  );
}
