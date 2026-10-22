import { createFileRoute } from "@tanstack/react-router";
import { Phone, ExternalLink, CloudRain, Waves, Sun } from "lucide-react";
import { PageShell, Panel } from "@/components/AppShell";
import { useT } from "@/lib/i18n";
import { ALERT_SOURCES, HELPLINES, TIPS } from "@/lib/safety";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/safety")({
  head: () => seo("Stay Safe", "Simple monsoon flood safety tips for Mumbai and official BMC emergency helpline numbers, in English, Hindi and Marathi."),
  component: () => (
    <PageShell page="safety">
      <Safety />
    </PageShell>
  ),
});

function Safety() {
  const { t, lang } = useT();
  const sections = [
    { k: "before", icon: CloudRain },
    { k: "during", icon: Waves },
    { k: "after", icon: Sun },
  ] as const;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Panel title={t("safety.helplines")} subtitle={t("safety.helplines.sub")}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {HELPLINES.map((h) => (
            <a key={h.number} href={`tel:${h.number.replace(/-/g, "")}`}
              className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-3 transition-colors hover:border-primary hover:bg-secondary">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Phone className="h-4 w-4" /></span>
              <span>
                <span className="block text-xl font-extrabold tabular-nums">{h.number}</span>
                <span className="block text-xs text-muted-foreground">{h.label[lang]}</span>
              </span>
            </a>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{t("safety.source")}</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map(({ k, icon: Icon }) => (
          <Panel key={k} title={t(`safety.${k}`)}>
            <Icon className="mb-2 h-6 w-6 text-primary" />
            <ul className="space-y-2 text-sm">
              {TIPS[k][lang].map((tip) => (
                <li key={tip} className="flex gap-2 border-b border-border pb-2 last:border-0"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />{tip}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <Panel title={t("safety.alerts")}>
        <div className="flex flex-wrap gap-2">
          {ALERT_SOURCES.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-muted">
              {s.name} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}
