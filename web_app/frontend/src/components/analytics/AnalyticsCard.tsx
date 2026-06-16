export function AnalyticsGrid({ metrics }: { metrics: Array<{ label: string; value: string; sub: string }> }) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-3">
      {metrics.map(m => (
        <div key={m.label} className="bg-card border border-border rounded-xl px-4 py-3">
          <div className="text-[11px] text-text-muted font-medium mb-1">{m.label}</div>
          <div className="text-lg font-semibold text-text-primary tabular-nums">{m.value}</div>
          <div className="text-[11px] text-text-muted mt-0.5">{m.sub}</div>
        </div>
      ))}
    </div>
  )
}
