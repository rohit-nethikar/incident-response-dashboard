"use client";

import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { ConnectionStatus } from "./ConnectionStatus";
import { useUiStore } from "@/lib/store/uiStore";

export function Topbar({ connected }: { connected: boolean }) {
  const { data: session } = useSession();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-raised sm:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <ConnectionStatus connected={connected} />
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {session?.user && (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-text-secondary sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <span className="rounded-full border border-border bg-surface-raised px-2 py-0.5 text-xs font-medium text-text-secondary">
              {session.user.role}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-raised"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
