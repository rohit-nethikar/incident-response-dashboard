import type { ScoreFactor, BusinessImpact } from "@incident-dash/shared";

// Explainability surface for the severity score: every factor is named and
// weighted rather than folded into one opaque number, mirroring the
// governance dashboard's "scoring must be explainable" principle.
export function FactorBreakdown({
  factors,
  businessImpact,
}: {
  factors: ScoreFactor[];
  businessImpact: BusinessImpact;
}) {
  const maxContribution = Math.max(1, ...factors.map((f) => Math.abs(f.contribution)));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">Severity factors</h3>
        <ul className="mt-2 space-y-2">
          {factors.map((factor, i) => (
            <li key={`${factor.factor}-${i}`} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-primary">{factor.factor}</span>
                <span className="tabular-nums text-text-secondary">+{factor.contribution}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gridline">
                <div
                  className="h-full rounded-full bg-accent-1"
                  style={{ width: `${(Math.abs(factor.contribution) / maxContribution) * 100}%` }}
                />
              </div>
              {factor.note && <p className="mt-1 text-xs text-text-muted">{factor.note}</p>}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary">Business impact</h3>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <ImpactRow label="Customer-facing" value={businessImpact.customerFacing} />
          <ImpactRow label="Revenue-impacting" value={businessImpact.revenueImpacting} />
          <ImpactRow label="SLA breach" value={businessImpact.slaBreach} />
          <div>
            <dt className="text-text-muted">Affected tier</dt>
            <dd className="text-text-primary">{businessImpact.affectedTier}</dd>
          </div>
        </dl>
        {businessImpact.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {businessImpact.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImpactRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className={value ? "font-medium text-text-primary" : "text-text-secondary"}>
        {value ? "Yes" : "No"}
      </dd>
    </div>
  );
}
