"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAuditLog } from "@/lib/api/audit";
import { queryKeys } from "@/lib/api/queryKeys";

export default function HistoryPage() {
  const { data: entries, isLoading } = useQuery({
    queryKey: queryKeys.auditLog({ limit: 200 }),
    queryFn: () => fetchAuditLog({ limit: 200 }),
  });

  const actionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries ?? []) {
      counts.set(entry.action, (counts.get(entry.action) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const maxCount = Math.max(1, ...actionCounts.map(([, count]) => count));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">History</h1>
        <p className="text-sm text-text-secondary">
          Append-only audit trail — every state change, assignment, and remediation approval.
        </p>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading audit log…</p>}

      {actionCounts.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text-primary">Activity by action</h2>
          <ul className="mt-3 space-y-2">
            {actionCounts.map(([action, count]) => (
              <li key={action} className="flex items-center gap-3 text-sm">
                <span className="w-48 shrink-0 text-text-secondary">{action}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gridline">
                  <div
                    className="h-full rounded-full bg-accent-1"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums text-text-muted">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Actor</th>
              <th className="px-4 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries?.map((entry) => (
              <tr key={entry.id} className="bg-surface">
                <td className="whitespace-nowrap px-4 py-2 text-text-muted">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2 font-medium text-text-primary">{entry.action}</td>
                <td className="px-4 py-2 text-text-secondary">{entry.actor.name ?? entry.actor.email}</td>
                <td className="max-w-md truncate px-4 py-2 text-xs text-text-muted">
                  {JSON.stringify(entry.metadata)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
