"use client";

import { useRouter } from "next/navigation";
import { SOURCE_SYSTEM_LABELS } from "@incident-dash/shared";
import type { IncidentRecord } from "@/types/api";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { IncidentCard } from "./IncidentCard";

export function IncidentTable({ incidents }: { incidents: IncidentRecord[] }) {
  const router = useRouter();

  if (incidents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-text-muted">
        No incidents match the current filters.
      </div>
    );
  }

  return (
    <>
      {/* Stacked cards below sm; table at sm and up */}
      <div className="flex flex-col gap-3 sm:hidden">
        {incidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {incidents.map((incident) => (
              <tr
                key={incident.id}
                onClick={() => router.push(`/incidents/${incident.id}`)}
                className="cursor-pointer bg-surface transition hover:bg-surface-raised"
              >
                <td className="px-4 py-3">
                  <SeverityBadge severity={incident.severity} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-text-primary">{incident.title}</div>
                  {incident.affectedResource && (
                    <div className="text-xs text-text-muted">{incident.affectedResource}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {SOURCE_SYSTEM_LABELS[incident.sourceSystem]}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={incident.status} />
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {new Date(incident.lastSeenAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
