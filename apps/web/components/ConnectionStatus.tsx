export function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
      <span
        className={`h-2 w-2 rounded-full ${connected ? "bg-severity-low" : "bg-severity-medium"}`}
        aria-hidden="true"
      />
      {connected ? "Live" : "Reconnecting…"}
    </span>
  );
}
