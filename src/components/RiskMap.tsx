import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FloodRecord } from "@/lib/floodpulse";

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const COLOR_VAR: Record<string, string> = { Low: "--risk-low", Moderate: "--risk-moderate", High: "--risk-high", "Very High": "--risk-veryhigh" };

export default function RiskMap({ points, selectedId, onSelect }: { points: FloodRecord[]; selectedId?: string; onSelect: (r: FloodRecord) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true }).setView([19.07, 72.88], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
      className: "fp-muted-tiles",
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    const fg = css("--foreground");
    points.forEach((r) => {
      const sel = r.location_id === selectedId;
      const m = L.circleMarker([r.latitude_approx!, r.longitude_approx!], {
        radius: sel ? 13 : 9,
        color: sel ? fg : "#ffffff",
        weight: sel ? 3 : 1.5,
        fillColor: css(COLOR_VAR[r.risk_level_demo] ?? "--muted-foreground"),
        fillOpacity: 0.9,
      });
      m.bindTooltip(`${r.location_name_demo}<br/>Demo score ${r.risk_score_0_100_demo ?? "Not available"} · ${r.risk_level_demo || "Not available"}`);
      m.on("click", () => onSelect(r));
      m.addTo(layer.current!);
    });
    if (points.length && !fitted.current) {
      map.current.fitBounds(L.latLngBounds(points.map((p) => [p.latitude_approx!, p.longitude_approx!])), { padding: [30, 30] });
      fitted.current = true;
    }
  }, [points, selectedId, onSelect]);

  return <div ref={el} className="h-full w-full" />;
}
