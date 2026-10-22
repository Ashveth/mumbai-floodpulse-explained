import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/AppShell";
import pack from "@/data/datasetPack.json";
import { useDataset } from "@/lib/dataset-context";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo("About & Sources", "Dataset source, status, limitations, data dictionary and public sources for Mumbai FloodPulse."),
  component: () => (
    <PageShell title="About & Sources" description="Dataset provenance, limitations and the data dictionary">
      <About />
    </PageShell>
  ),
});

const linkify = (t: string) =>
  t.split(/(https?:\/\/[^\s;]+)/g).map((p, i) =>
    /^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-2">{p}</a> : p,
  );

function About() {
  const ds = useDataset();
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Panel title="About FloodPulse">
        <p className="text-sm">Mumbai FloodPulse is a hackathon decision-support prototype: Discover → Analyse → Explain → Simulate → Act. It is <b>not</b> an official government warning system and does not provide validated or real-time flood predictions. For real alerts, follow BMC Disaster Management and IMD.</p>
      </Panel>
      <Panel title="Loaded dataset">
        <dl className="grid grid-cols-[160px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-foreground">File</dt><dd>{ds.status === "ready" ? ds.dataset.sourceName : "Not available"}</dd>
          <dt className="text-muted-foreground">Status</dt><dd>{ds.status === "ready" ? Object.keys(ds.dataset.quality.statusCounts).join(", ") : "Not available"}</dd>
          <dt className="text-muted-foreground">Processed</dt><dd>{ds.status === "ready" ? ds.dataset.processedAt.toLocaleString() : "Not available"}</dd>
          <dt className="text-muted-foreground">Companion</dt><dd>Mumbai_FloodPulse_Dataset_Pack.xlsx (dictionary, README, locations)</dd>
        </dl>
      </Panel>
      <Panel title="Dataset README & limitations" subtitle="From the supplied dataset pack">
        <dl className="divide-y divide-border text-sm">
          {pack.readme.map((r) => (
            <div key={String(r.item)} className="grid gap-1 py-2 md:grid-cols-[180px_1fr]">
              <dt className="font-semibold">{String(r.item)}</dt><dd className="text-muted-foreground">{linkify(String(r.details))}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title="Data dictionary">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="py-1.5">Column</th><th>Meaning</th><th>Format</th><th>Notes</th></tr></thead>
            <tbody>
              {pack.dictionary.map((d) => (
                <tr key={String(d.column)} className="border-t border-border align-top">
                  <td className="py-1.5 pr-3 font-mono text-xs">{String(d.column)}</td>
                  <td className="pr-3">{String(d.meaning)}</td>
                  <td className="pr-3 text-xs">{String(d.format)}</td>
                  <td className="text-xs text-muted-foreground">{String(d.notes) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="text-xs text-muted-foreground">Map tiles © OpenStreetMap contributors.</p>
    </div>
  );
}
