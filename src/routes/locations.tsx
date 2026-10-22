import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { PageShell, Panel, RiskBadge, Stat } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { ACTIONS, categorise, explainRecord, fmt, summariseLocations, type RiskLevel } from "@/lib/floodpulse";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/locations")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  head: () => seo("Location Intelligence", "Explain demo risk scores for each Mumbai location by rainfall, incidents, terrain and drainage."),
  component: () => (
    <PageShell title="Location Intelligence" description="Why a location scores the way it does — factor by factor">
      <LocationPage />
    </PageShell>
  ),
});

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
const FACTOR_COLORS = ["var(--chart-1)", "var(--chart-4)", "var(--chart-3)", "var(--chart-2)"];

function LocationPage() {
  const ds = useDataset();
  const { id } = Route.useSearch();
  const nav = useNavigate({ from: "/locations" });
  const records = ds.status === "ready" ? ds.dataset.records : [];
  const locs = useMemo(() => summariseLocations(records).sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0)), [records]);
  const loc = locs.find((l) => l.location_id === id) ?? locs[0];
  if (!loc) return <div className="text-muted-foreground">No locations in the dataset.</div>;
  const series = records.filter((r) => r.location_id === loc.location_id).sort((a, b) => a.date.localeCompare(b.date));
  const peak = series.reduce((a, b) => ((b.risk_score_0_100_demo ?? -1) > (a.risk_score_0_100_demo ?? -1) ? b : a), series[0]);
  const factors = explainRecord(peak, records);
  const level = loc.avgScore !== null ? categorise(loc.avgScore) : null;
  const peakLevel = (peak.risk_level_demo as RiskLevel) in ACTIONS ? (peak.risk_level_demo as RiskLevel) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="max-h-[80vh] overflow-auto rounded-md border border-border bg-card">
        <div className="sticky top-0 border-b border-border bg-card px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Ranked by avg demo score</div>
        {locs.map((l, i) => (
          <button key={l.location_id} onClick={() => nav({ search: { id: l.location_id } })}
            className={`flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${l.location_id === loc.location_id ? "bg-secondary font-semibold" : ""}`}>
            <span className="truncate"><span className="mr-1.5 text-xs text-muted-foreground">{i + 1}</span>{l.name.replace(" (demo grid)", "")}</span>
            <span className="tabular-nums text-xs">{fmt(l.avgScore)}</span>
          </button>
        ))}
      </aside>
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight">{loc.name}</h2>
          {level && <RiskBadge level={level} />}
          <span className="text-xs text-muted-foreground">{loc.location_id} · approx. {fmt(loc.lat, "", 4)}, {fmt(loc.lng, "", 4)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Avg demo score" value={fmt(loc.avgScore)} hint={`${loc.days} days`} />
          <Stat label="Peak demo score" value={fmt(loc.maxScore)} hint={peak.date} tone="crit" />
          <Stat label="Peak 72h rain" value={fmt(loc.peak72h, " mm")} hint="Synthetic" tone="warn" />
          <Stat label="Elevation · drainage" value={<span className="text-lg">{fmt(loc.elevation, " m", 0)} · {fmt(loc.drainage, "", 2)}</span>} hint="Synthetic demo" tone="ok" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title={`Factor view on peak day (${peak.date})`} subtitle="Approximate points per factor using README weights 45/25/20/10. Calculated, not original data.">
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={factors} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 45]} tick={axis} />
                  <YAxis type="category" dataKey="label" tick={{ ...axis, fontSize: 10 }} width={170} />
                  <Tooltip formatter={(v: number) => [`${v} pts`, "Approx. contribution"]} />
                  <Bar dataKey="points">{factors.map((f, i) => <Cell key={f.key} fill={FACTOR_COLORS[i]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Sum of approximate factors: <b>{fmt(factors.reduce((a, f) => a + (f.points ?? 0), 0))}</b> vs. original demo score <b>{fmt(peak.risk_score_0_100_demo)}</b>.
              The difference reflects unknown normalisation and synthetic noise in the generator.
            </p>
          </Panel>
          <Panel title="Preparedness priorities" subtitle={`Suggested for the peak-day demo category: ${peak.risk_level_demo || "Not available"}`}>
            {peakLevel ? (
              <ol className="space-y-2 text-sm">
                {ACTIONS[peakLevel].map((a, i) => (
                  <li key={a} className="flex gap-3 border-b border-border pb-2 last:border-0"><span className="font-extrabold text-primary">{i + 1}</span>{a}</li>
                ))}
              </ol>
            ) : <p className="text-sm text-muted-foreground">Not available</p>}
            <p className="mt-3 text-xs text-muted-foreground">Illustrative planning prompts only — not operational instructions.</p>
          </Panel>
        </div>
        <Panel title="Daily rainfall and demo score" subtitle="Synthetic 24h / 72h rainfall (bars) with demo risk score (line)">
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={series}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={axis} tickFormatter={(d) => d.slice(5)} />
                <YAxis yAxisId="mm" tick={axis} unit=" mm" width={56} />
                <YAxis yAxisId="s" orientation="right" domain={[0, 100]} tick={axis} width={36} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="mm" dataKey="rain_24h_mm_synthetic" name="Rain 24h (mm)" fill="var(--chart-2)" />
                <Bar yAxisId="mm" dataKey="rain_72h_mm_synthetic" name="Rain 72h (mm)" fill="var(--secondary)" stroke="var(--chart-5)" />
                <Line yAxisId="s" dataKey="risk_score_0_100_demo" name="Demo score" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
