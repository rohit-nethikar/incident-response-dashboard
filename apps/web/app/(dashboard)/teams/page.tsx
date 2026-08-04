"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchTeams, createTeam, addTeamMember, removeTeamMember } from "@/lib/api/teams";
import { fetchUsers } from "@/lib/api/users";
import { queryKeys } from "@/lib/api/queryKeys";
import { usePermission } from "@/lib/auth/usePermission";

export default function TeamsPage() {
  const canManage = usePermission("team:manage");
  const queryClient = useQueryClient();
  const [newTeamName, setNewTeamName] = useState("");
  const [memberSelections, setMemberSelections] = useState<Record<string, string>>({});

  const { data: teams, isLoading } = useQuery({ queryKey: queryKeys.teams(), queryFn: fetchTeams });
  const { data: users } = useQuery({ queryKey: queryKeys.users(), queryFn: fetchUsers, enabled: canManage });

  function invalidateTeams() {
    queryClient.invalidateQueries({ queryKey: queryKeys.teams() });
  }

  const createMutation = useMutation({
    mutationFn: () => createTeam({ name: newTeamName }),
    onSuccess: () => {
      invalidateTeams();
      setNewTeamName("");
      toast.success("Team created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => addTeamMember(teamId, userId),
    onSuccess: () => {
      invalidateTeams();
      toast.success("Member added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => removeTeamMember(teamId, userId),
    onSuccess: () => {
      invalidateTeams();
      toast.success("Member removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Teams</h1>
        <p className="text-sm text-text-secondary">Ownership groups incidents can be assigned to.</p>
      </div>

      {canManage && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newTeamName.trim()) createMutation.mutate();
          }}
          className="flex gap-2"
        >
          <input
            placeholder="New team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md bg-accent-1 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Create
          </button>
        </form>
      )}

      {isLoading && <p className="text-sm text-text-muted">Loading teams…</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {teams?.map((team) => (
          <div key={team.id} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-text-primary">{team.name}</p>
            {team.description && <p className="text-xs text-text-muted">{team.description}</p>}
            <ul className="mt-3 space-y-1">
              {team.members?.map((membership) => (
                <li key={membership.id} className="flex items-center justify-between text-sm text-text-secondary">
                  <span>{membership.user.name ?? membership.user.email}</span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: membership.user.id })}
                      className="text-xs text-text-muted hover:text-severity-critical"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
              {(!team.members || team.members.length === 0) && (
                <li className="text-xs text-text-muted">No members yet.</li>
              )}
            </ul>
            {canManage && (
              <div className="mt-3 flex gap-2">
                <select
                  value={memberSelections[team.id] ?? ""}
                  onChange={(e) => setMemberSelections((prev) => ({ ...prev, [team.id]: e.target.value }))}
                  className="flex-1 rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text-primary"
                >
                  <option value="">Add member…</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name ?? user.email}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const userId = memberSelections[team.id];
                    if (userId) addMemberMutation.mutate({ teamId: team.id, userId });
                  }}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-surface-raised"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
