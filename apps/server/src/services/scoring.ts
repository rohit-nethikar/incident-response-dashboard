import type { NormalizedEvent, ScoreFactor, BusinessImpact, Severity } from "@incident-dash/shared";
import { SEVERITY_WEIGHT } from "@incident-dash/shared";
import { prisma } from "../db/prismaClient";

const CUSTOMER_FACING_RESOURCES = new Set([
  "checkout-api",
  "user-profile-svc",
  "app.example.com",
  "api.example.com",
  "Exec Revenue Dashboard",
  "Regional Sales Overview",
]);

const REVENUE_IMPACTING_TAGS = new Set(["crash-loop", "oom", "uptime-check-failed", "extract-refresh-failed"]);

const TIER1_RESOURCES = new Set(["checkout-api", "api.example.com", "app.example.com", "billing-webhook"]);

function weightToSeverity(totalWeight: number): Severity {
  if (totalWeight >= 90) return "CRITICAL";
  if (totalWeight >= 65) return "HIGH";
  if (totalWeight >= 40) return "MEDIUM";
  if (totalWeight >= 15) return "LOW";
  return "INFO";
}

export interface ScoringResult {
  severity: Severity;
  severityFactors: ScoreFactor[];
  businessImpact: BusinessImpact;
}

// Every factor that contributes to the final severity is recorded by name
// and weight — the incident detail drill-down renders this list directly so
// nothing about the categorization is a black box.
export async function computeSeverityAndImpact(event: NormalizedEvent): Promise<ScoringResult> {
  const factors: ScoreFactor[] = [];

  const baseWeight = event.severityHint ? SEVERITY_WEIGHT[event.severityHint] : SEVERITY_WEIGHT.MEDIUM;
  factors.push({
    factor: "Source-reported severity",
    weight: baseWeight,
    contribution: baseWeight,
    note: event.severityHint ?? "no hint provided, defaulted to MEDIUM",
  });

  const customerFacing = event.affectedResource ? CUSTOMER_FACING_RESOURCES.has(event.affectedResource) : false;
  if (customerFacing) {
    factors.push({ factor: "Customer-facing resource", weight: 15, contribution: 15 });
  }

  const revenueImpacting = event.tags.some((tag) => REVENUE_IMPACTING_TAGS.has(tag));
  if (revenueImpacting) {
    factors.push({ factor: "Revenue-impacting event type", weight: 10, contribution: 10 });
  }

  // Repetition escalation: if this resource/source combo has fired more
  // than twice in the last 15 minutes, treat it as worsening rather than
  // a one-off blip.
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentCount = event.affectedResource
    ? await prisma.incident.count({
        where: {
          sourceSystem: event.sourceSystem,
          affectedResource: event.affectedResource,
          firstSeenAt: { gte: fifteenMinAgo },
        },
      })
    : 0;
  if (recentCount >= 2) {
    const repetitionWeight = Math.min(20, recentCount * 5);
    factors.push({
      factor: "Repeated recent occurrences",
      weight: repetitionWeight,
      contribution: repetitionWeight,
      note: `${recentCount} prior occurrence(s) on this resource in the last 15 minutes`,
    });
  }

  const now = new Date();
  const hour = now.getUTCHours();
  const isBusinessHours = hour >= 13 && hour <= 23; // ~9am-7pm US Eastern in UTC, rough heuristic
  if (isBusinessHours) {
    factors.push({ factor: "Occurred during business hours", weight: 5, contribution: 5 });
  }

  const totalWeight = factors.reduce((sum, f) => sum + f.contribution, 0);
  const severity = weightToSeverity(totalWeight);

  const affectedTier: BusinessImpact["affectedTier"] = event.affectedResource
    ? TIER1_RESOURCES.has(event.affectedResource)
      ? "tier1"
      : "tier2"
    : "unknown";

  const businessImpact: BusinessImpact = {
    customerFacing,
    revenueImpacting,
    slaBreach: severity === "CRITICAL" || severity === "HIGH",
    affectedTier,
    tags: event.tags,
  };

  return { severity, severityFactors: factors, businessImpact };
}
