"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SOURCE_SYSTEMS, SOURCE_SYSTEM_LABELS, type SourceSystem } from "@incident-dash/shared";
import { fetchRunbooks, createRunbook } from "@/lib/api/runbooks";
import { queryKeys } from "@/lib/api/queryKeys";
import { usePermission } from "@/lib/auth/usePermission";

export default function RunbooksPage() {
  const canEdit = usePermission("runbook:edit");
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [sourceSystem, setSourceSystem] = useState<SourceSystem | "">("");
  const [tags, setTags] = useState("");
  const [stepTitle, setStepTitle] = useState("");
  const [stepDescription, setStepDescription] = useState("");

  const { data: runbooks, isLoading } = useQuery({
    queryKey: queryKeys.runbooks(),
    queryFn: fetchRunbooks,
  });

  const createMutation = useMutation({
    mutationFn: createRunbook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.runbooks() });
      toast.success("Runbook created");
      setShowForm(false);
      setTitle("");
      setSourceSystem("");
      setTags("");
      setStepTitle("");
      setStepDescription("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      title,
      sourceSystem: sourceSystem || null,
      triggerTags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      steps: [{ title: stepTitle, description: stepDescription }],
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Runbooks</h1>
          <p className="text-sm text-text-secondary">Remediation steps matched to incidents by trigger tags.</p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-accent-1 px-3 py-1.5 text-sm font-medium text-white"
          >
            {showForm ? "Cancel" : "New runbook"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary"
          />
          <select
            value={sourceSystem}
            onChange={(e) => setSourceSystem(e.target.value as SourceSystem | "")}
            className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary"
          >
            <option value="">Any source system</option>
            {SOURCE_SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {SOURCE_SYSTEM_LABELS[s]}
              </option>
            ))}
          </select>
          <input
            placeholder="Trigger tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary"
          />
          <input
            required
            placeholder="Step title"
            value={stepTitle}
            onChange={(e) => setStepTitle(e.target.value)}
            className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary"
          />
          <textarea
            required
            placeholder="Step description"
            value={stepDescription}
            onChange={(e) => setStepDescription(e.target.value)}
            className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="self-start rounded-md bg-accent-1 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Create
          </button>
        </form>
      )}

      {isLoading && <p className="text-sm text-text-muted">Loading runbooks…</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {runbooks?.map((runbook) => (
          <Link
            key={runbook.id}
            href={`/runbooks/${runbook.id}`}
            className="rounded-lg border border-border bg-surface p-4 transition hover:bg-surface-raised"
          >
            <p className="text-sm font-medium text-text-primary">{runbook.title}</p>
            <p className="mt-1 text-xs text-text-muted">
              {runbook.sourceSystem ? SOURCE_SYSTEM_LABELS[runbook.sourceSystem] : "Any source"} ·{" "}
              {runbook.steps.length} step{runbook.steps.length === 1 ? "" : "s"}
            </p>
            {runbook.triggerTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {runbook.triggerTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-surface-raised px-2 py-0.5 text-xs text-text-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
