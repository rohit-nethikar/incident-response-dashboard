"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SOURCE_SYSTEM_LABELS } from "@incident-dash/shared";
import { fetchRunbook, updateRunbook } from "@/lib/api/runbooks";
import { queryKeys } from "@/lib/api/queryKeys";
import { usePermission } from "@/lib/auth/usePermission";

export default function RunbookDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const canEdit = usePermission("runbook:edit");
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState("");

  const { data: runbook, isLoading } = useQuery({
    queryKey: queryKeys.runbook(id),
    queryFn: () => fetchRunbook(id),
  });

  useEffect(() => {
    if (runbook) setTagsInput(runbook.triggerTags.join(", "));
  }, [runbook]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRunbook(id, {
        triggerTags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.runbook(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.runbooks() });
      toast.success("Runbook updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <p className="text-sm text-text-muted">Loading runbook…</p>;
  if (!runbook) return <p className="text-sm text-severity-critical">Runbook not found.</p>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{runbook.title}</h1>
        <p className="text-sm text-text-secondary">
          {runbook.sourceSystem ? SOURCE_SYSTEM_LABELS[runbook.sourceSystem] : "Applies to any source system"}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-primary">Trigger tags</h2>
        <p className="mt-1 text-xs text-text-muted">
          Incidents whose tags overlap with these are auto-matched to this runbook.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            disabled={!canEdit}
            className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary disabled:opacity-60"
          />
          {canEdit && (
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
              className="rounded-md bg-accent-1 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Save
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-primary">Steps</h2>
        <ol className="mt-2 space-y-3">
          {runbook.steps.map((step, i) => (
            <li key={i} className="rounded-md border border-border bg-surface-raised p-3">
              <p className="text-sm font-medium text-text-primary">
                {i + 1}. {step.title}
              </p>
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
    </div>
  );
}
