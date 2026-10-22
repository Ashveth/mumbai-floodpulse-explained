import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/methodology")({
  head: () => seo("Methodology & Validation", "How FloodPulse processes data, explains demo scores, runs scenarios — and what has not been validated."),
  component: () => (
    <PageShell page="how">
      <Methodology />
    </PageShell>
  ),
});

function Methodology() {
  const ds = useDataset();
  const q = ds.status === "ready" ? ds.dataset.quality : null;
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Panel title="Validation status">
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <b>Not validated.</b> No verified observed-flood labels exist in this dataset, so no accuracy, precision or recall can be reported.
          The demo risk level must not be used as ground truth for training or evaluating a classifier.
        </div>
      </Panel>
      <Panel title="Processing steps">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>Load the supplied CSV in the browser and parse with headers.</li>
          <li>Check all 16 expected columns{q ? ` (${16 - q.missingColumns.length} found)` : ""}; empty cells become “Not available”.</li>
          <li>Count duplicate record IDs{q ? ` (${q.duplicateRecordIds})` : ""} and invalid coordinates{q ? ` (${q.invalidCoordinates})` : ""}; invalid points are excluded from the map, never re-positioned.</li>
          <li>Keep original values unchanged. Aggregates (daily means, peaks, location averages) are calculated on the fly and labelled as calculated.</li>
          <li>Generate factor explanations and scenarios as described below.</li>
        </ol>
      </Panel>
      <Panel title="Demo risk score (from the dataset README)">
        <p className="text-sm">Illustrative weighted index: <b>45%</b> rainfall indicator, <b>25%</b> synthetic historical incidents, <b>20%</b> synthetic terrain, <b>10%</b> inverse drainage proxy, plus small synthetic noise. It is not a calibrated flood probability.</p>
        <p className="mt-2 text-sm">Categories observed in the data: Low &lt; 30 ≤ Moderate &lt; 50 ≤ High &lt; 70 ≤ Very High.</p>
      </Panel>
      <Panel title="Factor explanation (Location Intelligence)">
        <p className="text-sm">Each factor is min–max normalised across the loaded dataset (elevation and drainage inverted), then multiplied by its README weight. The result is an approximate view of what drives a score; it will not exactly equal the original score because the generator's normalisation and noise are not published.</p>
      </Panel>
      <Panel title="Scenario model">
        <p className="text-sm">The 24h rainfall is scaled by a multiplier and an additive amount. The score shifts by 45 × (change in rainfall ÷ dataset 24h range), all other factors held constant. Outputs are hypothetical sensitivity tests, not forecasts.</p>
      </Panel>
      <Panel title="What would be needed for real use">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Sourced rainfall observations (e.g. IMD) and documented ward boundaries.</li>
          <li>Verified historical waterlogging incidents for labelling.</li>
          <li>Real elevation (DEM) and drainage network data.</li>
          <li>Out-of-sample validation against observed flood events before any operational claim.</li>
        </ul>
      </Panel>
    </div>
  );
}
