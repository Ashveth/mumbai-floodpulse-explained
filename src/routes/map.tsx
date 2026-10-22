import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PageShell, RiskBadge } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { fmt, RISK_COLOR_VAR, RISK_LEVELS, validCoord, type FloodRecord } from "@/lib/floodpulse";
import { seo } from "@/lib/seo";

const RiskMap = lazy(() => import("@/components/RiskMap"));

export const Route = createFileRoute("/map")({
  head: () => seo("Flood Risk Map", "Interactive map of demo flood-risk indicators across approximate Mumbai locations."),
  component: () => (
    <PageShell title="Flood Risk Map" description="Demo risk indicators plotted at approximate demonstration coordinates">
      <MapPage />
    </PageShell>
  ),
});

const sel = "rounded-md border border-border bg-card px-2 py-1.5 text-sm";

function MapPage() {
  const ds = useDataset();
  const records = ds.status === "ready" ? ds.dataset.records : [];
  const dates = useMemo(() => [...new Set(records.map((r) => r.date))].sort(), [records]);
  const locations = useMemo(() => [...new Map(records.map((r) => [r.location_id, r.location_name_demo])).entries()], [records]);
  const [date, setDate] = useState("");
  const [levels, setLevels] = useState<string[]>([...RISK_LEVELS]);
  const [loc, setLoc] = useState("all");
  const [minRain, setMinRain] = useState(0);
  const [measure, setMeasure] = useState<"rain_1h_mm_synthetic" | "rain_24h_mm_synthetic" | "rain_72h_mm_synthetic">("rain_24h_mm_synthetic");
  const [selected, setSelected] = useState<FloodRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  useEffect(() => { if (!date && dates.length) setDate(dates[dates.length - 1] ?? ""); }, [dates, date]);

  const dayRecords = records.filter((r) => r.date === date);
  const excluded = dayRecords.filter((r) => !validCoord(r)).length;
  const points = useMemo(
    () => dayRecords.filter((r) => validCoord(r) && levels.includes(r.risk_level_demo) && (loc === "all" || r.location_id === loc) && (r[measure] ?? -1) >= minRain),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, date, levels, loc, minRain, measure],
  );
  useEffect(() => {
    if (selected && selected.date !== date) setSelected(records.find((r) => r.date === date && r.location_id === selected.location_id) ?? null);
  }, [date, records, selected]);
  const onSelect = useCallback((r: FloodRecord) => setSelected(r), []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 border-b border-border pb-3">
        <label className="text-xs font-semibold">Date<br />
          <select className={sel} value={date} onChange={(e) => setDate(e.target.value)}>{dates.map((d) => <option key={d}>{d}</option>)}</select>
        </label>
        <label className="text-xs font-semibold">Location<br />
          <select className={sel} value={loc} onChange={(e) => setLoc(e.target.value)}>
            <option value="all">All locations</option>
            {locations.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">Rainfall measure<br />
          <select className={sel} value={measure} onChange={(e) => setMeasure(e.target.value as typeof measure)}>
            <option value="rain_1h_mm_synthetic">1h rainfall</option>
            <option value="rain_24h_mm_synthetic">24h rainfall</option>
            <option value="rain_72h_mm_synthetic">72h rainfall</option>
          </select>
        </label>
        <label className="text-xs font-semibold">Minimum: {minRain} mm<br />
          <input type="range" min={0} max={200} step={5} value={minRain} onChange={(e) => setMinRain(+e.target.value)} className="w-40 accent-primary" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {RISK_LEVELS.map((l) => (
            <button key={l} onClick={() => setLevels((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]))}
              className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-semibold transition ${levels.includes(l) ? "border-foreground/30 bg-card" : "border-border bg-muted opacity-50"}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLOR_VAR[l] }} /> {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="relative h-[560px] overflow-hidden rounded-md border border-border">
          {hydrated && <Suspense fallback={<div className="h-full animate-pulse bg-muted" />}><RiskMap points={points} selectedId={selected?.location_id} onSelect={onSelect} /></Suspense>}
          <div className="absolute bottom-3 left-3 z-[500] rounded-md border border-border bg-card/95 p-3 text-xs shadow-sm">
            <div className="mb-1 font-bold">Demo risk category</div>
            {RISK_LEVELS.map((l) => <div key={l} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLOR_VAR[l] }} />{l}</div>)}
            <div className="mt-2 max-w-[200px] text-[10px] leading-snug text-muted-foreground">Markers are illustrative indicators, not flood alerts. Coordinates are approximate demo positions.</div>
          </div>
          {points.length === 0 && <div className="absolute inset-0 z-[400] flex items-center justify-center bg-background/70 text-sm font-medium">No locations match these filters.</div>}
        </div>
        <aside className="rounded-md border border-border bg-card p-4 text-sm">
          <div className="mb-3 text-xs text-muted-foreground">
            Showing <b className="text-foreground">{points.length}</b> of {dayRecords.length} locations for {date || "—"}.
            {" "}{excluded} record(s) excluded for missing or invalid coordinates.
          </div>
          {selected ? (
            <div className="space-y-3">
              <div>
                <div className="text-base font-extrabold">{selected.location_name_demo}</div>
                <div className="text-xs text-muted-foreground">{selected.location_id} · {selected.date}</div>
              </div>
              <div className="flex items-center gap-2"><span className="text-3xl font-extrabold tabular-nums">{fmt(selected.risk_score_0_100_demo)}</span><RiskBadge level={selected.risk_level_demo} /></div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-3 text-xs">
                <dt className="text-muted-foreground">Rain 1h</dt><dd className="text-right font-semibold">{fmt(selected.rain_1h_mm_synthetic, " mm")}</dd>
                <dt className="text-muted-foreground">Rain 24h</dt><dd className="text-right font-semibold">{fmt(selected.rain_24h_mm_synthetic, " mm")}</dd>
                <dt className="text-muted-foreground">Rain 72h</dt><dd className="text-right font-semibold">{fmt(selected.rain_72h_mm_synthetic, " mm")}</dd>
                <dt className="text-muted-foreground">Incidents (synthetic)</dt><dd className="text-right font-semibold">{fmt(selected.historical_incident_count_synthetic, "", 0)}</dd>
                <dt className="text-muted-foreground">Elevation (demo)</dt><dd className="text-right font-semibold">{fmt(selected.elevation_m_synthetic_demo, " m", 0)}</dd>
                <dt className="text-muted-foreground">Drainage proxy</dt><dd className="text-right font-semibold">{fmt(selected.drainage_coverage_proxy_synthetic, "", 2)}</dd>
                <dt className="text-muted-foreground">Approx. coords</dt><dd className="text-right font-semibold">{fmt(selected.latitude_approx, "", 4)}, {fmt(selected.longitude_approx, "", 4)}</dd>
                <dt className="text-muted-foreground">Observed label</dt><dd className="text-right font-semibold">{selected.observed_flood_label === "NOT_AVAILABLE" ? "Not available" : selected.observed_flood_label || "Not available"}</dd>
                <dt className="text-muted-foreground">Data status</dt><dd className="text-right font-semibold text-warning">{selected.data_status || "Not available"}</dd>
              </dl>
              <Link to="/locations" search={{ id: selected.location_id }} className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90">Explain this location</Link>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">Click a marker to see its location summary.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
