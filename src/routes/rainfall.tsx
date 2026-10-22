import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { PageShell, Panel, Stat } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { dailySeries, fmt } from "@/lib/floodpulse";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/rainfall")({
  head: () => seo("Rainfall Analysis", "Explore synthetic 1h, 24h and 72h rainfall patterns across Mumbai demo locations."),
  component: () => (
    <PageShell page="rain">
      <RainfallPage />
    </PageShell>
  ),
});

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
const BINS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120];

function RainfallPage() {
  const ds = useDataset();
  const all = ds.status === "ready" ? ds.dataset.records : [];
  const locs = useMemo(() => [...new Map(all.map((r) => [r.location_id, r.location_name_demo])).entries()], [all]);
  const [loc, setLoc] = useState("all");
  const records = loc === "all" ? all : all.filter((r) => r.location_id === loc);
  const daily = useMemo(() => dailySeries(records), [records]);
  const r24 = records.map((r) => r.rain_24h_mm_synthetic).filter((x): x is number => x !== null);
  const wettest = daily.reduce((a, b) => ((b.avg24h ?? 0) > (a?.avg24h ?? 0) ? b : a), daily[0]);
  const hist = BINS.slice(0, -1).map((lo, i) => ({ bin: `${lo}–${BINS[i + 1]}`, count: r24.filter((v) => v >= lo && v < (BINS[i + 1] ?? Infinity)).length }));
  const scatter = records.filter((r) => r.rain_24h_mm_synthetic !== null && r.risk_score_0_100_demo !== null).map((r) => ({ x: r.rain_24h_mm_synthetic, y: r.risk_score_0_100_demo }));

  return (
    <div className="space-y-4">
      <label className="text-xs font-semibold">Location<br />
        <select className="rounded-md border border-border bg-card px-2 py-1.5 text-sm" value={loc} onChange={(e) => setLoc(e.target.value)}>
          <option value="all">All locations (mean)</option>
          {locs.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Mean 24h rain" value={fmt(r24.length ? r24.reduce((a, b) => a + b, 0) / r24.length : null, " mm")} />
        <Stat label="Max 24h rain" value={fmt(r24.length ? Math.max(...r24) : null, " mm")} tone="warn" />
        <Stat label="Wettest day (avg 24h)" value={<span className="text-lg">{wettest?.date ?? "Not available"}</span>} hint={fmt(wettest?.avg24h, " mm")} tone="crit" />
        <Stat label="Records with 24h ≥ 64.5 mm" value={r24.filter((v) => v >= 64.5).length} hint="IMD 'heavy' band used as a reference threshold only" tone="ok" />
      </div>
      <Panel title="Rainfall by accumulation window" subtitle="Synthetic mm per day">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={daily}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={axis} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={axis} unit=" mm" width={56} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="avg1h" name="1h" stroke="var(--chart-3)" dot={false} strokeWidth={2} />
              <Line dataKey="avg24h" name="24h" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
              <Line dataKey="avg72h" name="72h" stroke="var(--chart-5)" dot={false} strokeWidth={2} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Distribution of 24h rainfall" subtitle="Number of location-day records per band (mm)">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={hist}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bin" tick={{ ...axis, fontSize: 10 }} />
                <YAxis tick={axis} width={36} />
                <Tooltip />
                <Bar dataKey="count" name="Records" fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="24h rainfall vs demo risk score" subtitle="Each point is a location-day record. Association in synthetic data only.">
          <div className="h-64">
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid stroke="var(--border)" />
                <XAxis type="number" dataKey="x" name="Rain 24h" unit=" mm" tick={axis} />
                <YAxis type="number" dataKey="y" name="Demo score" domain={[0, 100]} tick={axis} width={36} />
                <ZAxis range={[18, 18]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={scatter} fill="var(--chart-4)" fillOpacity={0.55} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
