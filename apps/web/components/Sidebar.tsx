"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermission } from "@/lib/auth/usePermission";
import { useUiStore } from "@/lib/store/uiStore";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/runbooks", label: "Runbooks" },
  { href: "/teams", label: "Teams" },
  { href: "/history", label: "History" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const canManageConnectors = usePermission("settings:manage_connectors");

  const items = canManageConnectors ? [...NAV_ITEMS, { href: "/settings", label: "Settings" }] : NAV_ITEMS;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-border bg-surface transition-transform sm:static sm:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold text-text-primary">Incident Response</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-surface-raised text-text-primary"
                    : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
