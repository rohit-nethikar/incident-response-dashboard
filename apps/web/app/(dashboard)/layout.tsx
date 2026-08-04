"use client";

import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useIncidentSocket } from "@/lib/ws/useIncidentSocket";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { connected } = useIncidentSocket();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar connected={connected} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
