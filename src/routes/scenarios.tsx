import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { PageShell, Panel, RiskBadge, Stat } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { useDataset } from "@/lib/dataset-context";
import { ACTIONS, RISK_LEVELS, scenarioScore } from "@/lib/floodpulse";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/scenarios")({
  head: () => seo("Scenario Planner", "Test hypothetical rainfall scenarios and see how demo risk categories and priorities could shift."),
  component: () => (
    <PageShell title="Scenario Planner" description="Hypothetical what-if rainfall — not a forecast">
      <ScenarioPage />
    </PageShell>
  ),
});

const PRESETS = [
  { name: "Baseline", mult: 1, extra: 0 },
  { name: "Heavy spell (+50%)", mult: 1.5, extra: 0 },
  { name: "Extreme day (×2 +30 mm)", mult: 2, extra: 30 },
  { name: "Lighter (−30%)", mult: 0.7, extra: 0 },
];

function ScenarioPage() {
  const ds = useDataset();
  const records = ds.status === "ready" ? ds.dataset.records : [];
  const dates = useMemo(() => [...new Set(records.map((r) => r.date))].sort(), [records]);
  const [date, setDate] = useState<string>("");
  const d = date || dates.at(-1) || "";
  const [mult, setMult] = useState(1.5);
  const [extra, setExtra] = useState(0);

  const rows = useMemo(
    () => records.filter((r) => r.date === d).map((r) => ({ r, s: scenarioScore(r, records, mult, extra) })).filter((x) => x.s !== null)
      .sort((a, b) => b.s!.score - a.s!.score),
    [records, d, mult, extra],
  );
  const dist = RISK_LEVELS.map((l) => ({
    name: l,
    Original: rows.filter((x) => x.r.risk_level_demo === l).length,
    Scenario: rows.filter((x) => x.s!.level === l).length,
  }));
  const escalated = rows.filter((x) => RISK_LEVELS.indexOf(x.s!.level) > RISK_LEVELS.indexOf(x.r.risk_level_demo as never));

  const exportCsv = () => {
    const head = "location_id,location_name_demo,date,rain_24h_original_mm,rain_24h_scenario_mm,score_original_demo,score_scenario_calculated,level_original_demo,level_scenario_calculated\n";
    const body = rows.map(({ r, s }) => [r.location_id, `"${r.location_name_demo}"`, r.date, r.rain_24h_mm_synthetic, s!.newRain, r.risk_score_0_100_demo, s!.score, r.risk_level_demo, s!.level].join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `floodpulse_scenario_${d}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Scenario priorities exported", { description: "Synthetic demo — calculated values are labelled in the file." });
  };

  return (
    <div className="space-y-4">
      <Toaster />
      <Panel title="Scenario controls" subtitle="Adjusts the synthetic 24h rainfall for the chosen base date and recalculates an illustrative score.">
        <div className="flex flex-wrap items-end gap-5">
          <label className="text-xs font-semibold">Base date<br />
            <select className="rounded-md border border-border bg-card px-2 py-1.5 text-sm" value={d} onChange={(e) => setDate(e.target.value)}>{dates.map((x) => <option key={x}>{x}</option>)}</select>
          </label>
          <label className="text-xs font-semibold">Rainfall multiplier: ×{mult.toFixed(2)}<br />
            <input type="range" min={0.5} max={3} step={0.05} value={mult} onChange={(e) => setMult(+e.target.value)} className="w-48 accent-primary" />
          </label>
          <label className="text-xs font-semibold">Additional rainfall: +{extra} mm<br />
            <input type="range" min={0} max={150} step={5} value={extra} onChange={(e) => setExtra(+e.target.value)} className="w-48 accent-primary" />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => { setMult(p.mult); setExtra(p.extra); }} className="rounded border border-border bg-card px-2 py-1 text-xs font-semibold hover:bg-muted">{p.name}</button>
            ))}
          </div>
          <button onClick={exportCsv} className="ml-auto rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Export priorities CSV</button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Locations in scenario" value={rows.length} hint={d} />
        <Stat label="Escalated category" value={escalated.length} tone="warn" hint="vs original demo level" />
        <Stat label="High + Very High (scenario)" value={dist[2].Scenario + dist[3].Scenario} tone="crit" hint={`was ${dist[2].Original + dist[3].Original}`} />
        <Stat label="Max scenario score" value={rows[0]?.s!.score ?? "Not available"} tone="ok" hint="Calculated, illustrative" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Panel title="Category shift" subtitle="Original demo levels vs calculated scenario levels">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dist}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} width={30} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Original" fill="var(--chart-2)" />
                <Bar dataKey="Scenario" fill="var(--chart-4)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Prioritised response list" subtitle="Ranked by calculated scenario score">
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-1.5">#</th><th>Location</th><th className="text-right">Rain 24h</th><th className="text-right">Score</th><th>Scenario level</th></tr>
              </thead>
              <tbody>
                {rows.map(({ r, s }, i) => (
                  <tr key={r.record_id} className="border-t border-border align-top">
                    <td className="py-2 pr-2 font-bold text-muted-foreground">{i + 1}</td>
                    <td className="py-2">
                      <div className="font-semibold">{r.location_name_demo.replace(" (demo grid)", "")}</div>
                      <div className="text-xs text-muted-foreground">{ACTIONS[s!.level][0]}</div>
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs">{r.rain_24h_mm_synthetic} → <b>{s!.newRain}</b></td>
                    <td className="py-2 text-right tabular-nums text-xs">{r.risk_score_0_100_demo} → <b>{s!.score}</b></td>
                    <td className="py-2 pl-2"><RiskBadge level={s!.level} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <p className="text-xs text-muted-foreground">
        Formula: scenario score = original demo score + 45 × (Δ 24h rainfall ÷ dataset 24h rainfall range), clamped to 0–100; categories use the dataset's thresholds (30 / 50 / 70).
        Other factors are held constant. This is a sensitivity illustration, not a flood forecast.
      </p>
    </div>
  );
}
