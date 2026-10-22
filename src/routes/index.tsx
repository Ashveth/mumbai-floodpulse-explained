import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { PageShell, Panel, Stat } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { dailySeries, RISK_COLOR_VAR, RISK_LEVELS, round, summariseLocations, categorise } from "@/lib/floodpulse";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Overview", "Rainfall patterns, location risk indicators and preparedness priorities for urban flooding in Mumbai (synthetic demo data)."),
  component: () => (
    <PageShell title="Overview" description="Discover → Analyse → Explain → Simulate → Act">
      <Overview />
    </PageShell>
  ),
});

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

function Overview() {
  const ds = useDataset();
  const records = ds.status === "ready" ? ds.dataset.records : [];
  const locs = useMemo(() => summariseLocations(records), [records]);
  const daily = useMemo(() => dailySeries(records), [records]);
  const dates = daily.map((d) => d.date);

  const locByCat = RISK_LEVELS.map((lvl) => ({
    name: lvl,
    value: locs.filter((l) => l.avgScore !== null && categorise(l.avgScore) === lvl).length,
  }));
  const recByCat = RISK_LEVELS.map((lvl) => ({ name: lvl, value: records.filter((r) => r.risk_level_demo === lvl).length }));
  const ranked = [...locs].filter((l) => l.avgScore !== null).sort((a, b) => b.avgScore! - a.avgScore!).map((l) => ({
    name: l.name.replace(" (demo grid)", ""),
    avg: round(l.avgScore),
    max: l.maxScore,
  }));
  const accum = [...locs].sort((a, b) => (b.peak72h ?? 0) - (a.peak72h ?? 0)).slice(0, 12).map((l) => ({
    name: l.name.replace(" (demo grid)", "").replace(/ Grid /, " "),
    "Peak 24h": l.peak24h,
    "Peak 72h": l.peak72h,
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-6 border-b border-border pb-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Predict. Explain. Prioritise. Protect.</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            Understand the risk. See the factors. Plan the response.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Explore rainfall patterns, location-level risk indicators, and preparedness priorities for urban flooding in Mumbai.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/map" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Open the risk map <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/scenarios" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted">Run a scenario</Link>
          </div>
        </div>
        <div className="self-end rounded-md border border-warning/50 bg-warning/10 p-4 text-sm">
          <div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-warning" /> Synthetic demo data</div>
          <p className="mt-1 text-muted-foreground">
            Every rainfall value, incident count, elevation, coordinate and risk score shown here is synthetic or illustrative.
            Risk counts are demo indicators, not confirmed flood events. No verified observed-flood labels are included.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total records" value={records.length} hint="Location-day rows loaded" />
        <Stat label="Unique locations" value={locs.length} hint="Demo grid cells" />
        <Stat label="Date range" value={<span className="text-base">{dates[0] ?? "Not available"} → {dates.at(-1) ?? "—"}</span>} hint={`${dates.length} days`} />
        <Stat label="High / Very High rows" value={(recByCat[2]?.value ?? 0) + (recByCat[3]?.value ?? 0)} hint="Demo indicator, not events" tone="crit" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {locByCat.map((c) => (
          <div key={c.name} className="flex items-center justify-between border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="h-3 w-3 rounded-sm" style={{ background: RISK_COLOR_VAR[c.name] }} /> {c.name}
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold tabular-nums">{c.value}</div>
              <div className="text-[10px] text-muted-foreground">locations by avg demo score</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Rainfall trend across dates" subtitle="Mean across all locations, synthetic mm" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={daily}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={axis} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={axis} unit=" mm" width={56} />
                <Tooltip contentStyle={{ fontSize: 12, borderColor: "var(--border)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area dataKey="avg72h" name="Avg 72h" stroke="var(--chart-5)" fill="var(--secondary)" />
                <Area dataKey="avg24h" name="Avg 24h" stroke="var(--chart-1)" fill="var(--chart-2)" fillOpacity={0.35} />
                <Area dataKey="avg1h" name="Avg 1h" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Demo risk categories" subtitle="Share of all location-day records">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={recByCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {recByCat.map((c) => <Cell key={c.name} fill={RISK_COLOR_VAR[c.name]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} records`, "Demo"]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Location comparison — demo risk score" subtitle="Average and maximum over the period (0–100, illustrative index)">
          <div className="h-[520px]">
            <ResponsiveContainer>
              <BarChart data={ranked} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={axis} />
                <YAxis type="category" dataKey="name" tick={{ ...axis, fontSize: 10 }} width={150} />
                <Tooltip />
                <Bar dataKey="avg" name="Average" radius={[0, 2, 2, 0]}>
                  {ranked.map((r) => <Cell key={r.name} fill={RISK_COLOR_VAR[categorise(r.avg ?? 0)]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Rainfall accumulation" subtitle="Peak 24h vs 72h synthetic rainfall, top 12 locations">
          <div className="h-[520px]">
            <ResponsiveContainer>
              <BarChart data={accum}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ ...axis, fontSize: 9 }} angle={-35} textAnchor="end" height={90} interval={0} />
                <YAxis tick={axis} unit=" mm" width={56} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Peak 24h" fill="var(--chart-1)" />
                <Bar dataKey="Peak 72h" fill="var(--chart-3)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Average demo risk score over time" subtitle="Mean of risk_score_0_100_demo across locations">
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={daily}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={axis} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={axis} domain={[0, 100]} width={40} />
              <Tooltip />
              <Line dataKey="avgScore" name="Avg demo score" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
