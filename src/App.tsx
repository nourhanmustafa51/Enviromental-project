import { useEffect, useState } from "react";
import { TopBar, type NavTab } from "./components/TopBar.tsx";
import { BenchmarksView } from "./components/BenchmarksView.tsx";
import { PredictorView } from "./components/PredictorView.tsx";
import { ExplainabilityView } from "./components/ExplainabilityView.tsx";
import { ExplorerView } from "./components/ExplorerView.tsx";
import { fetchOverview } from "./lib/apiClient.ts";
import type { MofRecord, OverviewResponse } from "./types.ts";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("benchmarks");
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predictorSeedMof, setPredictorSeedMof] = useState<MofRecord | null>(null);

  useEffect(() => {
    fetchOverview()
      .then((data: OverviewResponse) => setOverview(data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to initialize application");
      });
  }, []);

  const handleSendToPredictor = (mof: MofRecord) => {
    setPredictorSeedMof(mof);
    setActiveTab("predictor");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-8">
        {error && (
          <div className="bg-rose-50 border border-rose-300 rounded-md p-6 text-sm text-rose-900">
            {error}
          </div>
        )}

        {!error && !overview && (
          <div className="py-20 text-center text-sm font-mono text-slate-500">
            Loading MOF dataset, model benchmarks, and SHAP results...
          </div>
        )}

        {overview && activeTab === "benchmarks" && (
          <BenchmarksView
            overview={overview}
            onGoToPredictor={() => setActiveTab("predictor")}
          />
        )}

        {overview && activeTab === "predictor" && (
          <PredictorView
            key={predictorSeedMof ? `mof-${predictorSeedMof.rowId}` : "default"}
            overview={overview}
            initialMof={predictorSeedMof}
            onClearInitialMof={() => setPredictorSeedMof(null)}
          />
        )}

        {overview && activeTab === "explainability" && (
          <ExplainabilityView overview={overview} />
        )}

        {overview && activeTab === "explorer" && (
          <ExplorerView onSendToPredictor={handleSendToPredictor} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            CO₂ Uptake Prediction Using Machine Learning (Adsorbents &amp; MOFs) · 0.15 bar, 298 K
          </span>
          <span className="font-mono text-slate-600">
            4,999 MOFs · 193 features · RANDOM_SEED = 42
          </span>
        </div>
      </footer>
    </div>
  );
}
