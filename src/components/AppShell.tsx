import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Map, MapPin, CloudRain, SlidersHorizontal, Table2, FlaskConical, Info,
  Menu, X, Droplets, AlertTriangle, Upload, RefreshCw, LifeBuoy, Search, Languages,
} from "lucide-react";
import { useDataset } from "@/lib/dataset-context";
import { LANGS, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "nav.home", icon: LayoutDashboard },
  { to: "/map", key: "nav.map", icon: Map },
  { to: "/locations", key: "nav.area", icon: MapPin },
  { to: "/safety", key: "nav.safety", icon: LifeBuoy },
  { to: "/rainfall", key: "nav.rain", icon: CloudRain },
  { to: "/scenarios", key: "nav.whatif", icon: SlidersHorizontal },
  { to: "/data", key: "nav.data", icon: Table2 },
  { to: "/methodology", key: "nav.how", icon: FlaskConical },
  { to: "/about", key: "nav.about", icon: Info },
] as const;

export function SyntheticBanner() {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2 border-b border-warning/40 bg-warning/15 px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
      {t("banner")}
      <span className="hidden font-normal text-muted-foreground md:inline">· {t("banner.sub")}</span>
    </div>
  );
}

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <div className={cn("flex items-center gap-1", className)} role="group" aria-label="Language">
      <Languages className="h-4 w-4 opacity-70" />
      {LANGS.map((l) => (
        <button key={l.code} onClick={() => setLang(l.code)}
          className={cn("rounded px-2 py-1 text-xs font-semibold transition-colors", lang === l.code ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent")}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function AreaSearch({ className, big }: { className?: string; big?: boolean }) {
  const { t } = useT();
  const ds = useDataset();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const areas = useMemo(() => {
    if (ds.status !== "ready") return [] as [string, string][];
    return [...new globalThis.Map(ds.dataset.records.map((r) => [r.location_id, r.location_name_demo.replace(" (demo grid)", "")])).entries()];
  }, [ds]);
  const hits = q.trim() ? areas.filter(([, n]) => n.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];
  const go = (id: string) => { setQ(""); setOpen(false); nav({ to: "/locations", search: { id } }); };
  return (
    <div className={cn("relative", className)}>
      <Search className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground", big ? "h-5 w-5" : "h-4 w-4")} />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === "Enter" && hits[0]) go(hits[0][0]); }}
        placeholder={t("search.placeholder")} aria-label={t("search.placeholder")}
        className={cn("w-full rounded-md border border-border bg-card pl-9 pr-3 text-foreground outline-none focus:border-primary", big ? "py-3 text-base" : "py-2 text-sm")} />
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-[1100] mt-1 overflow-hidden rounded-md border border-border bg-card shadow-md">
          {hits.length ? hits.map(([id, n]) => (
            <button key={id} onMouseDown={() => go(id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
              <MapPin className="h-4 w-4 text-primary" /> {n}
            </button>
          )) : <div className="px-3 py-2 text-sm text-muted-foreground">{t("search.none")}</div>}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useT();
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Droplets className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[15px] font-extrabold leading-tight tracking-tight">FloodPulse</div>
          <div className="text-[11px] text-sidebar-foreground/70">{t("brand.sub")}</div>
        </div>
      </div>
      <LanguageSwitch className="mx-5 mb-3" />
      <nav className="flex-1 space-y-0.5 overflow-auto px-3">
        {NAV.map(({ to, key, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link key={to} to={to} onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                to === "/safety" && !active && "text-sidebar-primary",
              )}>
              <Icon className="h-4 w-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <div className="m-4 border-t border-sidebar-border pt-4 text-[11px] leading-relaxed text-sidebar-foreground/70">
        {t("brand.tag")}
        <br />{t("brand.foot")}
      </div>
    </>
  );
}

export function PageShell({ page, children }: { page: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ds = useDataset();
  const { t } = useT();
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarContent />
      </aside>
      {open && (
        <div className="fixed inset-0 z-[1000] flex lg:hidden">
          <aside className="relative flex w-72 flex-col bg-sidebar text-sidebar-foreground">
            <button className="absolute right-3 top-4 rounded p-1 text-sidebar-foreground" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
          <div className="flex-1 bg-foreground/40" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <SyntheticBanner />
        <header className="border-b border-border bg-card px-4 py-4 md:px-8">
          <div className="flex flex-wrap items-start gap-4">
            <button className="rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">{t(`page.${page}.t`)}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{t(`page.${page}.d`)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <AreaSearch className="w-full sm:w-64" />
              <span className="rounded border border-warning/50 bg-warning/15 px-2 py-1 font-semibold">{t("header.mode")}</span>
              {ds.status === "ready" && <span className="text-muted-foreground">{t("header.updated")} {ds.dataset.processedAt.toLocaleTimeString()}</span>}
              {ds.status === "loading" && <span className="text-muted-foreground">…</span>}
              {ds.status === "error" && <span className="rounded bg-destructive/15 px-2 py-1 font-semibold text-destructive">Dataset error</span>}
              <Link to="/map" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                <Map className="h-4 w-4" /> {t("header.map")}
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">
          <DataGate>{children}</DataGate>
        </main>
      </div>
    </div>
  );
}

export function UploadButton({ label = "Upload CSV" }: { label?: string }) {
  const ds = useDataset();
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">
      <Upload className="h-4 w-4" /> {label}
      <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && ds.loadFile(e.target.files[0])} />
    </label>
  );
}

function DataGate({ children }: { children: ReactNode }) {
  const ds = useDataset();
  if (ds.status === "loading")
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-md bg-muted" />)}
        </div>
        <div className="h-72 animate-pulse rounded-md bg-muted" />
      </div>
    );
  if (ds.status === "error")
    return (
      <div className="mx-auto max-w-lg rounded-md border border-destructive/40 bg-card p-6">
        <div className="flex items-center gap-2 font-bold text-destructive"><AlertTriangle className="h-5 w-5" /> The dataset could not be read</div>
        <p className="mt-2 text-sm text-muted-foreground">{ds.message}</p>
        <p className="mt-2 text-sm text-muted-foreground">No replacement data has been generated. Upload a FloodPulse-format CSV or reload the supplied demo file.</p>
        <div className="mt-4 flex gap-2">
          <UploadButton />
          <button onClick={ds.reloadDemo} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <RefreshCw className="h-4 w-4" /> Reload demo
          </button>
        </div>
      </div>
    );
  return <>{children}</>;
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "warn" | "crit" | "ok" }) {
  return (
    <div className={cn("border-l-4 bg-card px-4 py-3", tone === "crit" ? "border-destructive" : tone === "warn" ? "border-warning" : tone === "ok" ? "border-accent" : "border-primary")}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, children, className, action }: { title: string; subtitle?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-md border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const { t } = useT();
  const cls: Record<string, string> = {
    Low: "bg-risk-low/25 border-risk-low",
    Moderate: "bg-risk-moderate/25 border-risk-moderate",
    High: "bg-risk-high/25 border-risk-high",
    "Very High": "bg-risk-veryhigh/20 border-risk-veryhigh text-destructive",
  };
  return <span className={cn("inline-block rounded border px-1.5 py-0.5 text-[11px] font-semibold", cls[level] ?? "border-border")}>{level ? t(`risk.${level}`) : "Not available"} <span className="font-normal opacity-70">(demo)</span></span>;
}
