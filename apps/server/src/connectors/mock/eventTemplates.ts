import type { Severity, SourceSystem } from "@incident-dash/shared";

export interface EventTemplate {
  title: string;
  description: string;
  severityHint: Severity;
  tags: string[];
  resourcePool: string[];
}

// Realistic-looking synthetic incident templates per source system. Each
// mock connector cycle randomly emits 0-N of these, with randomized
// resource names/timestamps, to make the live feed feel real without any
// cloud credentials.
export const EVENT_TEMPLATES: Record<SourceSystem, EventTemplate[]> = {
  CLOUD_RUN: [
    {
      title: "Container crash-loop detected",
      description: "Revision is repeatedly restarting; container exited with non-zero status shortly after startup.",
      severityHint: "HIGH",
      tags: ["crash-loop"],
      resourcePool: ["checkout-api", "user-profile-svc", "billing-webhook", "search-indexer"],
    },
    {
      title: "Container OOMKilled",
      description: "Container exceeded its configured memory limit and was killed by the runtime.",
      severityHint: "HIGH",
      tags: ["oom", "crash-loop"],
      resourcePool: ["image-resize-svc", "report-generator", "checkout-api"],
    },
    {
      title: "5xx error rate spike",
      description: "Percentage of 5xx responses exceeded 5% over a 5 minute window.",
      severityHint: "MEDIUM",
      tags: ["error-rate-spike"],
      resourcePool: ["checkout-api", "user-profile-svc", "notifications-svc"],
    },
  ],
  CLOUD_FUNCTIONS: [
    {
      title: "Function error rate spike",
      description: "Invocation error rate exceeded threshold following a recent deployment.",
      severityHint: "MEDIUM",
      tags: ["error-rate-spike"],
      resourcePool: ["sendWelcomeEmail", "resizeUploadedImage", "syncInventory"],
    },
    {
      title: "Elevated cold-start latency",
      description: "P95 cold-start latency doubled compared to the trailing 7-day baseline.",
      severityHint: "LOW",
      tags: ["cold-start"],
      resourcePool: ["generateInvoicePdf", "syncInventory"],
    },
  ],
  CLOUD_MONITORING: [
    {
      title: "Uptime check failure",
      description: "Synthetic uptime check failed 3 consecutive times from 2+ regions.",
      severityHint: "CRITICAL",
      tags: ["uptime-check-failed"],
      resourcePool: ["api.example.com", "app.example.com", "status.example.com"],
    },
    {
      title: "Alert policy fired: latency SLO burn",
      description: "Error budget burn rate for the latency SLO exceeded the fast-burn alerting threshold.",
      severityHint: "HIGH",
      tags: ["alert-fired"],
      resourcePool: ["checkout-api", "search-indexer"],
    },
  ],
  CLOUD_LOGGING: [
    {
      title: "Error-level log spike",
      description: "Log-based metric matched a recurring ERROR-severity pattern well above baseline volume.",
      severityHint: "MEDIUM",
      tags: ["log-error-spike"],
      resourcePool: ["checkout-api", "billing-webhook", "search-indexer"],
    },
    {
      title: "Unhandled exception pattern detected",
      description: "A previously unseen stack trace signature appeared more than 20 times in 10 minutes.",
      severityHint: "HIGH",
      tags: ["log-error-spike"],
      resourcePool: ["user-profile-svc", "notifications-svc"],
    },
  ],
  DATA_FUSION: [
    {
      title: "Pipeline run failed",
      description: "Batch pipeline run terminated with a failure status at the transform stage.",
      severityHint: "HIGH",
      tags: ["pipeline-failed"],
      resourcePool: ["daily_sales_etl", "customer_360_pipeline", "inventory_sync_pipeline"],
    },
    {
      title: "Plugin stage error",
      description: "A custom plugin stage threw an unhandled error while processing a batch.",
      severityHint: "MEDIUM",
      tags: ["plugin-error"],
      resourcePool: ["customer_360_pipeline", "marketing_attribution_pipeline"],
    },
  ],
  BIGQUERY: [
    {
      title: "Query slot contention",
      description: "Reserved slot utilization sustained above 95% causing queued jobs to slow significantly.",
      severityHint: "MEDIUM",
      tags: ["slot-contention"],
      resourcePool: ["analytics-prod", "reporting-dw"],
    },
    {
      title: "Job timeout",
      description: "A scheduled query exceeded its configured timeout and was cancelled.",
      severityHint: "MEDIUM",
      tags: ["job-timeout"],
      resourcePool: ["analytics-prod.daily_rollup", "reporting-dw.exec_summary"],
    },
    {
      title: "Cost anomaly detected",
      description: "Bytes billed for a recurring job increased more than 4x versus its 30-day average.",
      severityHint: "LOW",
      tags: ["cost-anomaly"],
      resourcePool: ["analytics-prod.daily_rollup"],
    },
  ],
  TABLEAU_SERVER: [
    {
      title: "Extract refresh failure",
      description: "Scheduled extract refresh failed; workbook is now serving stale data.",
      severityHint: "MEDIUM",
      tags: ["extract-refresh-failed"],
      resourcePool: ["Exec Revenue Dashboard", "Regional Sales Overview", "Support Ops KPIs"],
    },
    {
      title: "Background job queue backed up",
      description: "Background job queue depth exceeded the healthy threshold for over 30 minutes.",
      severityHint: "HIGH",
      tags: ["queue-backed-up"],
      resourcePool: ["InteractiveDashboards-TST", "InteractiveDashboards-INT"],
    },
    {
      title: "Site storage over quota",
      description: "Site content storage exceeded 90% of its configured quota.",
      severityHint: "LOW",
      tags: ["storage-quota"],
      resourcePool: ["ClientFeeSchedule-DEV"],
    },
  ],
};
