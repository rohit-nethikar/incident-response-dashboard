import Link from "next/link";
import { SOURCE_SYSTEM_LABELS } from "@incident-dash/shared";
import type { IncidentRecord } from "@/types/api";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";

export function IncidentCard({ incident }: { incident: IncidentRecord }) {
  return (
    <Link
      href={`/incidents/${incident.id}`}
      className="block rounded-lg border border-border bg-surface p-4 transition hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary">{incident.title}</p>
        <SeverityBadge severity={incident.severity} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <span>{SOURCE_SYSTEM_LABELS[incident.sourceSystem]}</span>
        {incident.affectedResource && (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">{incident.affectedResource}</span>
          </>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={incident.status} />
        <time className="text-xs text-text-muted" dateTime={incident.lastSeenAt}>
          {new Date(incident.lastSeenAt).toLocaleString()}
        </time>
      </div>
    </Link>
  );
}
