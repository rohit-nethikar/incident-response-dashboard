"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { LEGAL_TRANSITIONS, SOURCE_SYSTEM_LABELS, type IncidentStatus } from "@incident-dash/shared";
import {
  fetchIncidentDetail,
  changeIncidentStatus,
  acknowledgeIncident,
  assignIncident,
  approveRemediation,
} from "@/lib/api/incidents";
import { fetchTeams } from "@/lib/api/teams";
import { queryKeys } from "@/lib/api/queryKeys";
import { usePermission } from "@/lib/auth/usePermission";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { FactorBreakdown } from "@/components/FactorBreakdown";

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [ackNote, setAckNote] = useState("");

  const canChangeStatus = usePermission("incident:change_status");
  const canAcknowledge = usePermission("incident:acknowledge");
  const canAssign = usePermission("incident:assign");
  const canApproveRemediation = usePermission("incident:approve_remediation");

  const { data: incident, isLoading } = useQuery({
    queryKey: queryKeys.incidentDetail(id),
    queryFn: () => fetchIncidentDetail(id),
  });

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: fetchTeams,
    enabled: canAssign,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.incidentDetail(id) });
    queryClient.invalidateQueries({ queryKey: ["incidents", "list"] });
  }

  const statusMutation = useMutation({
    mutationFn: (status: IncidentStatus) => changeIncidentStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success("Status updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const ackMutation = useMutation({
    mutationFn: () => acknowledgeIncident(id, ackNote || undefined),
    onSuccess: () => {
      invalidate();
      setAckNote("");
      toast.success("Incident acknowledged");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const assignMutation = useMutation({
    mutationFn: (teamId: string) => assignIncident(id, { teamId }),
    onSuccess: () => {
      invalidate();
      toast.success("Incident assigned");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const claimMutation = useMutation({
    mutationFn: () => assignIncident(id, { ownerId: session?.user?.id }),
    onSuccess: () => {
      invalidate();
      toast.success("Incident claimed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remediationMutation = useMutation({
    mutationFn: (stepIndex: number) => approveRemediation(id, incident!.runbook!.id, stepIndex),
    onSuccess: () => {
      invalidate();
      toast.success("Remediation step approved — no external action was triggered, this only records approval.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <p className="text-sm text-text-muted">Loading incident…</p>;
  if (!incident) return <p className="text-sm text-severity-critical">Incident not found.</p>;

  const nextStatuses = LEGAL_TRANSITIONS[incident.status];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          <span className="text-xs text-text-muted">{SOURCE_SYSTEM_LABELS[incident.sourceSystem]}</span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-text-primary">{incident.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{incident.description}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted sm:grid-cols-4">
          <div>
            <dt>Affected resource</dt>
            <dd className="text-text-secondary">{incident.affectedResource ?? "—"}</dd>
          </div>
          <div>
            <dt>First seen</dt>
            <dd className="text-text-secondary">{new Date(incident.firstSeenAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Last seen</dt>
            <dd className="text-text-secondary">{new Date(incident.lastSeenAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd className="text-text-secondary">{incident.owner?.name ?? incident.owner?.email ?? "Unassigned"}</dd>
          </div>
        </dl>
      </div>

      {canChangeStatus && nextStatuses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-4">
          <span className="text-sm font-medium text-text-primary">Change status:</span>
          {nextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(status)}
              className="rounded-md border border-border px-3 py-1 text-sm text-text-primary hover:bg-surface-raised disabled:opacity-50"
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {canAcknowledge && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text-primary">Acknowledge</h2>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="Optional note"
              value={ackNote}
              onChange={(e) => setAckNote(e.target.value)}
              className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted"
            />
            <button
              type="button"
              disabled={ackMutation.isPending}
              onClick={() => ackMutation.mutate()}
              className="rounded-md bg-accent-1 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {canAssign && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text-primary">Ownership</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={claimMutation.isPending}
              onClick={() => claimMutation.mutate()}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-surface-raised disabled:opacity-50"
            >
              Claim for myself
            </button>
            <select
              defaultValue={incident.teamId ?? ""}
              onChange={(e) => e.target.value && assignMutation.mutate(e.target.value)}
              className="rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-text-primary"
            >
              <option value="">Assign to team…</option>
              {teams?.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-4">
        <FactorBreakdown factors={incident.severityFactors} businessImpact={incident.businessImpact} />
      </div>

      {incident.runbook && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text-primary">Suggested runbook: {incident.runbook.title}</h2>
          <ol className="mt-2 space-y-3">
            {incident.runbook.steps.map((step, i) => (
              <li key={i} className="rounded-md border border-border bg-surface-raised p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text-primary">
                    {i + 1}. {step.title}
                  </p>
                  {canApproveRemediation && (
                    <button
                      type="button"
                      disabled={remediationMutation.isPending}
                      onClick={() => remediationMutation.mutate(i)}
                      className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-surface disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-text-secondary">{step.description}</p>
                {step.link && (
                  <a href={step.link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent-1 underline">
                    Reference
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-primary">Timeline</h2>
        <ul className="mt-2 space-y-2">
          {incident.timelineEntries.map((entry) => (
            <li key={entry.id} className="flex gap-3 text-sm">
              <time className="w-40 shrink-0 text-xs text-text-muted">
                {new Date(entry.createdAt).toLocaleString()}
              </time>
              <span className="text-text-secondary">{entry.description}</span>
            </li>
          ))}
        </ul>
      </div>

      {incident.acknowledgments.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text-primary">Acknowledgments</h2>
          <ul className="mt-2 space-y-2">
            {incident.acknowledgments.map((ack) => (
              <li key={ack.id} className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{ack.user.name ?? ack.user.email}</span>{" "}
                {new Date(ack.createdAt).toLocaleString()}
                {ack.note && <span className="italic"> — {ack.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="rounded-lg border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-text-primary">Raw payload</summary>
        <pre className="mt-2 overflow-x-auto rounded-md bg-plane p-3 text-xs text-text-secondary">
          {JSON.stringify(incident.rawPayload, null, 2)}
        </pre>
      </details>
    </div>
  );
}
