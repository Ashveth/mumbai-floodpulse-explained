import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageShell, Panel, Stat, UploadButton, RiskBadge } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { REQUIRED_COLUMNS, type FloodRecord } from "@/lib/floodpulse";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/data")({
  head: () => seo("Data Explorer", "Inspect, filter and quality-check the Mumbai FloodPulse synthetic demo dataset."),
  component: () => (
    <PageShell page="data">
      <DataPage />
    </PageShell>
  ),
});

const PAGE = 25;

function DataPage() {
  const ds = useDataset();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<keyof FloodRecord>("date");
  const [asc, setAsc] = useState(true);
  const records = ds.status === "ready" ? ds.dataset.records : [];
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    const f = s ? records.filter((r) => `${r.location_name_demo} ${r.location_id} ${r.date} ${r.risk_level_demo}`.toLowerCase().includes(s)) : records;
    return [...f].sort((a, b) => {
      const x = a[sortKey] ?? "", y = b[sortKey] ?? "";
      return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1);
    });
  }, [records, q, sortKey, asc]);
  if (ds.status !== "ready") return null;
  const { quality, sourceName } = ds.dataset;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const totalMissing = Object.values(quality.missingByColumn).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto text-sm">Source file: <b>{sourceName}</b></div>
        <UploadButton label="Load another CSV" />
        <button onClick={ds.reloadDemo} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"><RefreshCw className="h-4 w-4" /> Reset to demo</button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Rows" value={quality.rowCount} />
        <Stat label="Columns matched" value={`${REQUIRED_COLUMNS.length - quality.missingColumns.length}/${REQUIRED_COLUMNS.length}`} tone={quality.missingColumns.length ? "warn" : "ok"} />
        <Stat label="Missing values" value={totalMissing} tone={totalMissing ? "warn" : "ok"} />
        <Stat label="Duplicate record IDs" value={quality.duplicateRecordIds} tone={quality.duplicateRecordIds ? "crit" : "ok"} />
        <Stat label="Invalid coordinates" value={quality.invalidCoordinates} tone={quality.invalidCoordinates ? "crit" : "ok"} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Data-status field">
          {Object.entries(quality.statusCounts).map(([k, v]) => <div key={k} className="flex justify-between border-b border-border py-1 text-sm last:border-0"><span className="font-mono text-xs">{k}</span><b>{v}</b></div>)}
        </Panel>
        <Panel title="Observed flood label">
          {Object.entries(quality.observedLabelCounts).map(([k, v]) => <div key={k} className="flex justify-between border-b border-border py-1 text-sm last:border-0"><span className="font-mono text-xs">{k}</span><b>{v}</b></div>)}
          <p className="mt-2 text-xs text-muted-foreground">NOT_AVAILABLE is deliberate: no verified flood observations are included.</p>
        </Panel>
      </div>
      {quality.missingColumns.length > 0 && <div className="rounded-md border border-warning bg-warning/10 p-3 text-sm">Missing columns: {quality.missingColumns.join(", ")} — affected fields show “Not available”.</div>}

      <Panel title="Records (original values)" subtitle={`${filtered.length} matching rows`} action={
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search location, date, level…" className="w-56 rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
      }>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-xs">
            <thead className="text-left uppercase tracking-wider text-muted-foreground">
              <tr>
                {(["date", "location_name_demo", "rain_1h_mm_synthetic", "rain_24h_mm_synthetic", "rain_72h_mm_synthetic", "historical_incident_count_synthetic", "elevation_m_synthetic_demo", "drainage_coverage_proxy_synthetic", "risk_score_0_100_demo", "risk_level_demo"] as (keyof FloodRecord)[]).map((k) => (
                  <th key={k} className="cursor-pointer px-2 py-2 hover:text-foreground" onClick={() => { if (sortKey === k) setAsc(!asc); else { setSortKey(k); setAsc(true); } }}>
                    {k.replace(/_synthetic|_demo|_mm/g, "").replace(/_/g, " ")}{sortKey === k ? (asc ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.map((r) => (
                <tr key={r.record_id + r.date} className="border-t border-border hover:bg-muted/50">
                  <td className="px-2 py-1.5">{r.date}</td>
                  <td className="px-2">{r.location_name_demo}</td>
                  {[r.rain_1h_mm_synthetic, r.rain_24h_mm_synthetic, r.rain_72h_mm_synthetic, r.historical_incident_count_synthetic, r.elevation_m_synthetic_demo, r.drainage_coverage_proxy_synthetic, r.risk_score_0_100_demo].map((v, i) => (
                    <td key={i} className="px-2 text-right tabular-nums">{v ?? <span className="text-muted-foreground">Not available</span>}</td>
                  ))}
                  <td className="px-2"><RiskBadge level={r.risk_level_demo} /></td>
                </tr>
              ))}
              {view.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">No records match your search.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-xs">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border border-border px-2 py-1 disabled:opacity-40">Prev</button>
          Page {page + 1} / {pages}
          <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="rounded border border-border px-2 py-1 disabled:opacity-40">Next</button>
        </div>
      </Panel>
    </div>
  );
}
