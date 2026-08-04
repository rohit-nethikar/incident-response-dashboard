import type { IncidentStatus } from "@incident-dash/shared";

const STATUS_LABEL: Record<IncidentStatus, string> = {
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  IGNORED: "Ignored",
};

// Status is a workflow state, not a severity — deliberately neutral/ink
// styling (no reuse of the reserved severity/status color scale) with the
// label always visible, differentiated by weight/border rather than hue.
export function StatusBadge({ status }: { status: IncidentStatus }) {
  const emphasized = status === "OPEN" || status === "ACKNOWLEDGED" || status === "IN_PROGRESS";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        emphasized
          ? "border-text-primary/30 bg-surface-raised text-text-primary"
          : "border-border bg-surface text-text-muted"
      }`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
