import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { parseDataset, type Dataset } from "./floodpulse";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; dataset: Dataset };

type Ctx = State & { loadFile: (f: File) => Promise<void>; reloadDemo: () => void };

const DatasetCtx = createContext<Ctx | null>(null);
export const DEMO_URL = "/data/floodpulse_demo.csv";
export const DEMO_NAME = "Mumbai_FloodPulse_Synthetic_Demo.csv";

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });

  const reloadDemo = useCallback(() => {
    setState({ status: "loading" });
    fetch(DEMO_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not fetch the demo dataset (HTTP ${r.status}).`);
        return r.text();
      })
      .then((t) => setState({ status: "ready", dataset: parseDataset(t, DEMO_NAME) }))
      .catch((e: Error) => setState({ status: "error", message: e.message }));
  }, []);

  useEffect(() => reloadDemo(), [reloadDemo]);

  const loadFile = useCallback(async (f: File) => {
    try {
      const text = await f.text();
      setState({ status: "ready", dataset: parseDataset(text, f.name) });
    } catch (e) {
      setState({ status: "error", message: (e as Error).message });
    }
  }, []);

  return <DatasetCtx.Provider value={{ ...state, loadFile, reloadDemo }}>{children}</DatasetCtx.Provider>;
}

export function useDataset() {
  const c = useContext(DatasetCtx);
  if (!c) throw new Error("useDataset outside provider");
  return c;
}
