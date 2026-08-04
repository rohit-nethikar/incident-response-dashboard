"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SOURCE_SYSTEM_LABELS, type Role } from "@incident-dash/shared";
import { fetchConnectorStates, setConnectorMode, fetchMockGeneratorSetting, updateMockGeneratorSetting } from "@/lib/api/settings";
import { fetchUsers, updateUserRole } from "@/lib/api/users";
import { queryKeys } from "@/lib/api/queryKeys";
import { usePermission } from "@/lib/auth/usePermission";

export default function SettingsPage() {
  const canManage = usePermission("settings:manage_connectors");
  const canManageRoles = usePermission("user:manage_roles");
  const queryClient = useQueryClient();
  const [intervalMs, setIntervalMs] = useState(8000);

  const { data: connectors } = useQuery({
    queryKey: queryKeys.connectorStates(),
    queryFn: fetchConnectorStates,
    enabled: canManage,
  });

  const { data: mockGenerator } = useQuery({
    queryKey: queryKeys.mockGeneratorSetting(),
    queryFn: fetchMockGeneratorSetting,
    enabled: canManage,
  });

  const { data: users } = useQuery({
    queryKey: queryKeys.users(),
    queryFn: fetchUsers,
    enabled: canManageRoles,
  });

  useEffect(() => {
    if (mockGenerator) setIntervalMs(mockGenerator.intervalMs);
  }, [mockGenerator]);

  const modeMutation = useMutation({
    mutationFn: ({ sourceSystem, mode }: { sourceSystem: Parameters<typeof setConnectorMode>[0]; mode: "mock" | "real" }) =>
      setConnectorMode(sourceSystem, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connectorStates() });
      toast.success("Connector mode updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generatorMutation = useMutation({
    mutationFn: () => updateMockGeneratorSetting({ enabled: mockGenerator?.enabled ?? true, intervalMs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mockGeneratorSetting() });
      toast.success("Mock generator updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleGeneratorMutation = useMutation({
    mutationFn: (enabled: boolean) => updateMockGeneratorSetting({ enabled, intervalMs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mockGeneratorSetting() });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      toast.success("Role updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!canManage) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-text-muted">
        You don't have permission to view settings.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Connector modes, mock data generation, and user roles.</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-primary">Connectors</h2>
        <p className="mt-1 text-xs text-text-muted">
          Swap a source between the built-in mock generator and its real API integration.
        </p>
        <ul className="mt-3 divide-y divide-border">
          {connectors?.map((connector) => (
            <li key={connector.sourceSystem} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-text-primary">{SOURCE_SYSTEM_LABELS[connector.sourceSystem]}</p>
                <p className="text-xs text-text-muted">
                  {connector.isHealthy ? "Healthy" : `Unhealthy${connector.lastError ? `: ${connector.lastError}` : ""}`}
                </p>
              </div>
              <select
                value={connector.mode}
                onChange={(e) =>
                  modeMutation.mutate({ sourceSystem: connector.sourceSystem, mode: e.target.value as "mock" | "real" })
                }
                className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text-primary"
              >
                <option value="mock">Mock</option>
                <option value="real">Real</option>
              </select>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-primary">Mock generator</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={mockGenerator?.enabled ?? true}
              onChange={(e) => toggleGeneratorMutation.mutate(e.target.checked)}
            />
            Enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            Interval (ms)
            <input
              type="number"
              min={1000}
              max={120000}
              step={1000}
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="w-28 rounded-md border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
            />
          </label>
          <button
            type="button"
            onClick={() => generatorMutation.mutate()}
            disabled={generatorMutation.isPending}
            className="rounded-md bg-accent-1 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {canManageRoles && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text-primary">Users &amp; roles</h2>
          <ul className="mt-3 divide-y divide-border">
            {users?.map((user) => (
              <li key={user.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-text-primary">{user.name ?? user.email}</p>
                  <p className="text-xs text-text-muted">{user.email}</p>
                </div>
                <select
                  value={user.role}
                  onChange={(e) => roleMutation.mutate({ id: user.id, role: e.target.value as Role })}
                  className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text-primary"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="RESPONDER">Responder</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
