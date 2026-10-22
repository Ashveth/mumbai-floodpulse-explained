import Papa from "papaparse";

export const REQUIRED_COLUMNS = [
  "record_id",
  "location_id",
  "location_name_demo",
  "date",
  "latitude_approx",
  "longitude_approx",
  "rain_1h_mm_synthetic",
  "rain_24h_mm_synthetic",
  "rain_72h_mm_synthetic",
  "historical_incident_count_synthetic",
  "elevation_m_synthetic_demo",
  "drainage_coverage_proxy_synthetic",
  "risk_score_0_100_demo",
  "risk_level_demo",
  "observed_flood_label",
  "data_status",
] as const;

export const NUMERIC_COLUMNS = [
  "latitude_approx",
  "longitude_approx",
  "rain_1h_mm_synthetic",
  "rain_24h_mm_synthetic",
  "rain_72h_mm_synthetic",
  "historical_incident_count_synthetic",
  "elevation_m_synthetic_demo",
  "drainage_coverage_proxy_synthetic",
  "risk_score_0_100_demo",
] as const;

export type FloodRecord = {
  record_id: string;
  location_id: string;
  location_name_demo: string;
  date: string;
  latitude_approx: number | null;
  longitude_approx: number | null;
  rain_1h_mm_synthetic: number | null;
  rain_24h_mm_synthetic: number | null;
  rain_72h_mm_synthetic: number | null;
  historical_incident_count_synthetic: number | null;
  elevation_m_synthetic_demo: number | null;
  drainage_coverage_proxy_synthetic: number | null;
  risk_score_0_100_demo: number | null;
  risk_level_demo: string;
  observed_flood_label: string;
  data_status: string;
};

export const RISK_LEVELS = ["Low", "Moderate", "High", "Very High"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** Category thresholds observed in the supplied dataset (Low <30, Moderate <50, High <70, Very High >=70). */
export function categorise(score: number): RiskLevel {
  if (score >= 70) return "Very High";
  if (score >= 50) return "High";
  if (score >= 30) return "Moderate";
  return "Low";
}

export const RISK_COLOR_VAR: Record<string, string> = {
  Low: "var(--risk-low)",
  Moderate: "var(--risk-moderate)",
  High: "var(--risk-high)",
  "Very High": "var(--risk-veryhigh)",
};

export type QualityReport = {
  rowCount: number;
  missingColumns: string[];
  extraColumns: string[];
  missingByColumn: Record<string, number>;
  duplicateRecordIds: number;
  invalidCoordinates: number;
  statusCounts: Record<string, number>;
  observedLabelCounts: Record<string, number>;
};

export type Dataset = {
  records: FloodRecord[];
  quality: QualityReport;
  sourceName: string;
  processedAt: Date;
};

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function validCoord(r: FloodRecord) {
  return (
    r.latitude_approx !== null &&
    r.longitude_approx !== null &&
    Math.abs(r.latitude_approx) <= 90 &&
    Math.abs(r.longitude_approx) <= 180 &&
    !(r.latitude_approx === 0 && r.longitude_approx === 0)
  );
}

export function parseDataset(text: string, sourceName: string): Dataset {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const fields = parsed.meta.fields ?? [];
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !fields.includes(c));
  if (fields.length === 0 || parsed.data.length === 0) {
    throw new Error("The file contains no readable rows.");
  }
  if (missingColumns.length > 5) {
    throw new Error(
      `This file does not match the FloodPulse format. Missing columns: ${missingColumns.join(", ")}`,
    );
  }
  const missingByColumn: Record<string, number> = {};
  REQUIRED_COLUMNS.forEach((c) => (missingByColumn[c] = 0));

  const records: FloodRecord[] = parsed.data.map((row) => {
    REQUIRED_COLUMNS.forEach((c) => {
      const v = row[c];
      if (v === undefined || String(v).trim() === "") missingByColumn[c]++;
    });
    const str = (k: string) => (row[k] ?? "").toString().trim();
    return {
      record_id: str("record_id"),
      location_id: str("location_id"),
      location_name_demo: str("location_name_demo"),
      date: str("date"),
      latitude_approx: num(row.latitude_approx),
      longitude_approx: num(row.longitude_approx),
      rain_1h_mm_synthetic: num(row.rain_1h_mm_synthetic),
      rain_24h_mm_synthetic: num(row.rain_24h_mm_synthetic),
      rain_72h_mm_synthetic: num(row.rain_72h_mm_synthetic),
      historical_incident_count_synthetic: num(row.historical_incident_count_synthetic),
      elevation_m_synthetic_demo: num(row.elevation_m_synthetic_demo),
      drainage_coverage_proxy_synthetic: num(row.drainage_coverage_proxy_synthetic),
      risk_score_0_100_demo: num(row.risk_score_0_100_demo),
      risk_level_demo: str("risk_level_demo"),
      observed_flood_label: str("observed_flood_label"),
      data_status: str("data_status"),
    };
  });

  const seen = new Set<string>();
  let duplicateRecordIds = 0;
  for (const r of records) {
    if (!r.record_id) continue;
    if (seen.has(r.record_id)) duplicateRecordIds++;
    seen.add(r.record_id);
  }
  const countBy = (k: keyof FloodRecord) =>
    records.reduce<Record<string, number>>((a, r) => {
      const v = String(r[k] || "Not available");
      a[v] = (a[v] ?? 0) + 1;
      return a;
    }, {});

  return {
    records,
    sourceName,
    processedAt: new Date(),
    quality: {
      rowCount: records.length,
      missingColumns,
      extraColumns: fields.filter((f) => !(REQUIRED_COLUMNS as readonly string[]).includes(f)),
      missingByColumn,
      duplicateRecordIds,
      invalidCoordinates: records.filter((r) => !validCoord(r)).length,
      statusCounts: countBy("data_status"),
      observedLabelCounts: countBy("observed_flood_label"),
    },
  };
}

export type LocationSummary = {
  location_id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  days: number;
  avgScore: number | null;
  maxScore: number | null;
  peak24h: number | null;
  peak72h: number | null;
  incidents: number | null;
  elevation: number | null;
  drainage: number | null;
  latest: FloodRecord;
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const max = (xs: number[]) => (xs.length ? Math.max(...xs) : null);
const nn = (xs: (number | null)[]) => xs.filter((x): x is number => x !== null);

export function summariseLocations(records: FloodRecord[]): LocationSummary[] {
  const groups = new Map<string, FloodRecord[]>();
  records.forEach((r) => {
    const g = groups.get(r.location_id) ?? [];
    g.push(r);
    groups.set(r.location_id, g);
  });
  return [...groups.entries()].map(([id, rs]) => {
    const sorted = [...rs].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    return {
      location_id: id,
      name: latest.location_name_demo || id,
      lat: latest.latitude_approx,
      lng: latest.longitude_approx,
      days: rs.length,
      avgScore: mean(nn(rs.map((r) => r.risk_score_0_100_demo))),
      maxScore: max(nn(rs.map((r) => r.risk_score_0_100_demo))),
      peak24h: max(nn(rs.map((r) => r.rain_24h_mm_synthetic))),
      peak72h: max(nn(rs.map((r) => r.rain_72h_mm_synthetic))),
      incidents: latest.historical_incident_count_synthetic,
      elevation: latest.elevation_m_synthetic_demo,
      drainage: latest.drainage_coverage_proxy_synthetic,
      latest,
    };
  });
}

export function dailySeries(records: FloodRecord[]) {
  const by = new Map<string, FloodRecord[]>();
  records.forEach((r) => by.set(r.date, [...(by.get(r.date) ?? []), r]));
  return [...by.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rs]) => ({
      date,
      avg1h: round(mean(nn(rs.map((r) => r.rain_1h_mm_synthetic)))),
      avg24h: round(mean(nn(rs.map((r) => r.rain_24h_mm_synthetic)))),
      avg72h: round(mean(nn(rs.map((r) => r.rain_72h_mm_synthetic)))),
      max24h: round(max(nn(rs.map((r) => r.rain_24h_mm_synthetic)))),
      avgScore: round(mean(nn(rs.map((r) => r.risk_score_0_100_demo)))),
    }));
}

export function round(n: number | null, d = 1) {
  if (n === null) return null;
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function fmt(n: number | null | undefined, unit = "", d = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "Not available";
  return `${round(n, d)}${unit}`;
}

/** Min–max normalisation bounds within the loaded dataset (calculated, not original). */
export function bounds(records: FloodRecord[], k: keyof FloodRecord) {
  const xs = nn(records.map((r) => r[k] as number | null));
  return { min: xs.length ? Math.min(...xs) : 0, max: xs.length ? Math.max(...xs) : 1 };
}
const norm = (v: number | null, b: { min: number; max: number }) =>
  v === null || b.max === b.min ? null : Math.min(1, Math.max(0, (v - b.min) / (b.max - b.min)));

export type FactorBreakdown = {
  key: string;
  label: string;
  weight: number;
  indicator: number | null; // 0..1
  points: number | null; // weight*indicator*100
};

/**
 * Approximate factor view using the README weights (45/25/20/10). Indicators are
 * min–max normalised within the loaded dataset; this is an explanatory approximation,
 * not the exact generator formula (which includes unpublished noise).
 */
export function explainRecord(r: FloodRecord, all: FloodRecord[]): FactorBreakdown[] {
  const rain = norm(r.rain_24h_mm_synthetic, bounds(all, "rain_24h_mm_synthetic"));
  const inc = norm(r.historical_incident_count_synthetic, bounds(all, "historical_incident_count_synthetic"));
  const elevN = norm(r.elevation_m_synthetic_demo, bounds(all, "elevation_m_synthetic_demo"));
  const drN = norm(r.drainage_coverage_proxy_synthetic, bounds(all, "drainage_coverage_proxy_synthetic"));
  const rows: Omit<FactorBreakdown, "points">[] = [
    { key: "rain", label: "Rainfall (24h, synthetic)", weight: 0.45, indicator: rain },
    { key: "incidents", label: "Historical incidents (synthetic)", weight: 0.25, indicator: inc },
    { key: "terrain", label: "Low terrain (inverse elevation)", weight: 0.2, indicator: elevN === null ? null : 1 - elevN },
    { key: "drainage", label: "Drainage gap (inverse coverage)", weight: 0.1, indicator: drN === null ? null : 1 - drN },
  ];
  return rows.map((f) => ({ ...f, points: f.indicator === null ? null : round(f.weight * f.indicator * 100) }));
}

/**
 * Hypothetical scenario: rescale the 24h rainfall and shift the original demo score by
 * the rainfall-weight share of the change in the normalised rainfall indicator.
 */
export function scenarioScore(r: FloodRecord, all: FloodRecord[], rainMultiplier: number, extraMm: number) {
  if (r.risk_score_0_100_demo === null || r.rain_24h_mm_synthetic === null) return null;
  const b = bounds(all, "rain_24h_mm_synthetic");
  const span = b.max - b.min || 1;
  const newRain = Math.max(0, r.rain_24h_mm_synthetic * rainMultiplier + extraMm);
  const delta = 0.45 * ((newRain - r.rain_24h_mm_synthetic) / span) * 100;
  const score = Math.min(100, Math.max(0, r.risk_score_0_100_demo + delta));
  return { newRain: round(newRain)!, score: round(score)!, delta: round(delta)!, level: categorise(score) };
}

export const ACTIONS: Record<RiskLevel, string[]> = {
  Low: ["Routine drain inspection", "Keep public advisories current"],
  Moderate: ["Clear inlets and culverts ahead of heavy spells", "Pre-position portable pumps at known low points"],
  High: [
    "Deploy pumps and field teams to low-lying stretches",
    "Coordinate traffic diversions with local authorities",
    "Check readiness of nearby shelters",
  ],
  "Very High": [
    "Prioritise this area for pumping and response crews",
    "Prepare evacuation support for vulnerable residents",
    "Follow official BMC / IMD advisories before acting",
  ],
};
