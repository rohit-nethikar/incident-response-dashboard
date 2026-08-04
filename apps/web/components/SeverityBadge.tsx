import type { Severity } from "@incident-dash/shared";

const SEVERITY_LABEL: Record<Severity, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  INFO: "Info",
};

const SEVERITY_DOT: Record<Severity, string> = {
  CRITICAL: "bg-severity-critical",
  HIGH: "bg-severity-high",
  MEDIUM: "bg-severity-medium",
  LOW: "bg-severity-low",
  INFO: "bg-severity-info",
};

// Severity is the one place color carries meaning on its own — it's always
// paired with the text label too, so it's never color-alone.
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-text-primary">
      <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[severity]}`} aria-hidden="true" />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
