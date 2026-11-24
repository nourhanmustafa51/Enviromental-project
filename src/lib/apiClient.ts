import type {
  DiagnosticsResponse,
  ExplainabilityResponse,
  ModelKey,
  MofFeaturesInput,
  MofListResponse,
  MofRecord,
  OverviewResponse,
  PredictResponse,
  SplitName,
} from "../types.ts";

let cachedEnginePromise: Promise<typeof import("../server/mlEngine.ts")["mlEngine"]> | null = null;

function getLocalEngine() {
  if (!cachedEnginePromise) {
    cachedEnginePromise = import("../server/mlEngine.ts").then((m) => m.mlEngine);
  }
  return cachedEnginePromise;
}

async function fetchJsonWithFallback<T>(
  url: string,
  init: RequestInit | undefined,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    const res = await fetch(url, init);
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // Fall back to local engine when API endpoint is unavailable
  }
  return fallback();
}

export function fetchOverview(): Promise<OverviewResponse> {
  return fetchJsonWithFallback("/api/overview", undefined, async () => {
    const engine = await getLocalEngine();
    return engine.getOverview();
  });
}

export function fetchDiagnostics(
  modelKey: ModelKey,
  split: "val" | "test"
): Promise<DiagnosticsResponse> {
  return fetchJsonWithFallback(
    `/api/diagnostics?model=${encodeURIComponent(modelKey)}&split=${split}`,
    undefined,
    async () => {
      const engine = await getLocalEngine();
      return engine.getDiagnostics(modelKey, split);
    }
  );
}

export function fetchExplainability(): Promise<ExplainabilityResponse> {
  return fetchJsonWithFallback("/api/explainability", undefined, async () => {
    const engine = await getLocalEngine();
    return engine.getExplainability();
  });
}

export function fetchMofs(params: {
  split: SplitName | "all";
  regime: string;
  search: string;
  sort: string;
  page: number;
  limit: number;
}): Promise<MofListResponse> {
  const query = new URLSearchParams({
    split: params.split,
    regime: params.regime,
    search: params.search,
    sort: params.sort,
    page: String(params.page),
    limit: String(params.limit),
  }).toString();

  return fetchJsonWithFallback(`/api/mofs?${query}`, undefined, async () => {
    const engine = await getLocalEngine();
    return engine.listMofs(params);
  });
}

export async function fetchMofById(rowId: number): Promise<MofRecord | null> {
  try {
    const res = await fetch(`/api/mofs/${rowId}`);
    if (res.ok) {
      return (await res.json()) as MofRecord;
    }
  } catch {
    // Fall back to local engine
  }
  const engine = await getLocalEngine();
  return engine.getMofById(rowId) ?? null;
}

export function postPredict(
  payload: MofFeaturesInput,
  matchedRowId?: number
): Promise<PredictResponse> {
  return fetchJsonWithFallback(
    "/api/predict",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, matchedRowId }),
    },
    async () => {
      const engine = await getLocalEngine();
      const defaults = engine.getOverview().dataset.featureDefaults;
      const num = (val: unknown, fallback: number) => {
        const parsed = Number(val);
        return Number.isFinite(parsed) ? parsed : fallback;
      };
      const sanitized: MofFeaturesInput = {
        asa: Math.max(0, num(payload.asa, defaults.asa)),
        df: Math.max(0, num(payload.df, defaults.df)),
        di: Math.max(0, num(payload.di, defaults.di)),
        nasa: Math.max(0, num(payload.nasa, defaults.nasa)),
        poav: Math.max(0, num(payload.poav, defaults.poav)),
        ponav: Math.max(0, num(payload.ponav, defaults.ponav)),
        density: Math.max(0.05, num(payload.density, defaults.density)),
        mcCryChi0: num(payload.mcCryChi0, defaults.mcCryChi0),
        mcCryChi1: num(payload.mcCryChi1, defaults.mcCryChi1),
        mcCryChi2: num(payload.mcCryChi2, defaults.mcCryChi2),
        mcCryS0: num(payload.mcCryS0, defaults.mcCryS0),
        mcCryS1: num(payload.mcCryS1, defaults.mcCryS1),
        mcCryZ0: num(payload.mcCryZ0, defaults.mcCryZ0),
        mcCryI1: num(payload.mcCryI1, defaults.mcCryI1),
        fLigZ1: num(payload.fLigZ1, defaults.fLigZ1),
        sumLcS0: num(payload.sumLcS0, defaults.sumLcS0),
      };
      return engine.predict(sanitized, matchedRowId);
    }
  );
}

export async function downloadComparisonCsv(): Promise<void> {
  let csvText = "";
  try {
    const res = await fetch("/api/export/comparison.csv");
    if (res.ok) {
      csvText = await res.text();
    }
  } catch {
    // Fall back to local bundle CSV
  }
  if (!csvText) {
    const engine = await getLocalEngine();
    csvText = engine.getComparisonCsv();
  }
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mof_model_comparison.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
