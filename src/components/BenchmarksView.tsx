import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Image as ImageIcon } from "lucide-react";
import type {
  DiagnosticPoint,
  DiagnosticsResponse,
  ModelKey,
  OverviewResponse,
  PoreRegime,
} from "../types.ts";

interface BenchmarksViewProps {
  overview: OverviewResponse;
  onGoToPredictor: () => void;
}

type SortField = "valRmse" | "valR2" | "testRmse" | "testR2" | "trainingTimeSec";

const REGIME_COLORS: Record<PoreRegime, string> = {
  "Ultra-microporous (3.3–5.0 Å)": "#2563eb",
  "Microporous (5.0–7.0 Å)": "#0d9488",
  "Large Pore (> 7.0 Å)": "#d97706",
  "Sub-kinetic (< 3.3 Å)": "#64748b",
};

const MODEL_ACCENT_TEXT: Record<ModelKey, string> = {
  xgboost: "text-emerald-700",
  random_forest: "text-teal-700",
  ann: "text-indigo-700",
  ga_ann: "text-blue-700",
  svr: "text-amber-700",
  baseline_dummy: "text-slate-600",
  baseline_linear: "text-rose-700",
};

export function BenchmarksView({ overview, onGoToPredictor }: BenchmarksViewProps) {
  const [selectedModel, setSelectedModel] = useState<ModelKey>("xgboost");
  const [split, setSplit] = useState<"test" | "val">("test");
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DiagnosticPoint | null>(null);
  const [sortField, setSortField] = useState<SortField>("valRmse");
  const [sortAsc, setSortAsc] = useState(true);
  const [showStaticFigure, setShowStaticFigure] = useState(false);

  const loadingDiag = !diagnostics || diagnostics.modelKey !== selectedModel || diagnostics.split !== split;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/diagnostics?model=${selectedModel}&split=${split}`)
      .then((res) => res.json())
      .then((data: DiagnosticsResponse) => {
        if (!cancelled) {
          setDiagnostics(data);
          setHoveredPoint(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedModel, split]);

  const sortedModels = useMemo(() => {
    return [...overview.models].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      return sortAsc ? av - bv : bv - av;
    });
  }, [overview.models, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "valRmse" || field === "testRmse" || field === "trainingTimeSec");
    }
  };

  const activeModelMeta = overview.models.find((m) => m.modelKey === selectedModel);
  const winner = overview.models[0];
  const dummy = overview.models.find((m) => m.modelKey === "baseline_dummy");
  const rmseDropPct =
    winner && dummy
      ? (((dummy.testRmse - winner.testRmse) / dummy.testRmse) * 100).toFixed(1)
      : "40.9";

  const parityDomainMax = useMemo(() => {
    if (!diagnostics || diagnostics.points.length === 0) return 10;
    let maxV = 9.5;
    for (const p of diagnostics.points) {
      if (p.yTrue > maxV) maxV = p.yTrue;
      if (p.yPred > maxV) maxV = p.yPred;
    }
    return Math.ceil(maxV * 1.05);
  }, [diagnostics]);

  const parityDomainMin = useMemo(() => {
    if (!diagnostics || diagnostics.points.length === 0) return 0;
    let minV = 0;
    for (const p of diagnostics.points) {
      if (p.yPred < minV) minV = p.yPred;
    }
    return Math.max(-2, Math.floor(minV));
  }, [diagnostics]);

  const maxHistCount = useMemo(() => {
    if (!diagnostics) return 1;
    return Math.max(1, ...diagnostics.residualHistogram.map((b) => b.count));
  }, [diagnostics]);

  // Top 5 models with positive R2 for visual comparison bar chart
  const chartModels = useMemo(
    () => overview.models.filter((m) => m.valR2 > 0 && m.testR2 > 0),
    [overview.models]
  );

  return (
    <div className="space-y-8">
      {/* Rich Gradient Hero Banner */}
      <section className="rounded-lg bg-gradient-to-br from-slate-900 via-blue-950 to-teal-950 border border-slate-800 p-7 text-white flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-teal-300 font-mono">
            <span>{overview.dataset.totalCleanRows.toLocaleString()} Clean MOFs</span>
            <span aria-hidden="true">·</span>
            <span>{overview.dataset.selectedFeatureCount} Selected Features</span>
            <span aria-hidden="true">·</span>
            <span>0.15 bar, 298 K</span>
            <span aria-hidden="true">·</span>
            <span>70 / 15 / 15 Split</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
            CO₂ Uptake Regression Benchmarks &amp; Diagnostics
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Leak-free evaluation of seven regression architectures predicting low-pressure CO₂
            adsorption capacity from Metal-Organic Framework geometric pore metrics and Revised
            Autocorrelation (RAC) descriptors.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToPredictor}
          className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
        >
          Open Live MOF Predictor
        </button>
      </section>

      {/* 4-Column Tinted KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-emerald-50/90 to-white border border-emerald-200 rounded-md p-5">
          <div className="text-xs font-medium text-emerald-900/70">Top Ranked Model</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-900 font-mono tabular-nums">
            {winner?.model ?? "XGBoost"}
          </div>
          <div className="mt-1 text-xs text-emerald-700 font-mono">
            Optuna TPE · 15 trials · 5-fold CV
          </div>
        </div>

        <div className="bg-gradient-to-b from-blue-50/90 to-white border border-blue-200 rounded-md p-5">
          <div className="text-xs font-medium text-blue-900/70">Unbiased Test R²</div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-semibold text-blue-800 font-mono tabular-nums">
              {winner?.testR2.toFixed(4)}
            </span>
            <span className="text-xs font-mono text-blue-500 ml-1.5">R²</span>
          </div>
          <div className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
            Validation R² {winner?.valR2.toFixed(4)}
          </div>
        </div>

        <div className="bg-gradient-to-b from-teal-50/90 to-white border border-teal-200 rounded-md p-5">
          <div className="text-xs font-medium text-teal-900/70">Unbiased Test RMSE</div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-semibold text-teal-900 font-mono tabular-nums">
              {winner?.testRmse.toFixed(4)}
            </span>
            <span className="text-xs font-mono text-teal-600 ml-1.5">mmol/g</span>
          </div>
          <div className="mt-1 text-xs text-emerald-700 font-mono font-medium tabular-nums">
            -{rmseDropPct}% vs Dummy Mean
          </div>
        </div>

        <div className="bg-gradient-to-b from-indigo-50/90 to-white border border-indigo-200 rounded-md p-5">
          <div className="text-xs font-medium text-indigo-900/70">Live TypeScript Surrogate</div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-semibold text-indigo-800 font-mono tabular-nums">
              {overview.dataset.surrogateMetrics.testR2.toFixed(4)}
            </span>
            <span className="text-xs font-mono text-indigo-500 ml-1.5">Test R²</span>
          </div>
          <div className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
            RMSE {overview.dataset.surrogateMetrics.testRmse.toFixed(4)} mmol/g
          </div>
        </div>
      </section>

      {/* Model Performance Leaderboard + Visual R² / RMSE Comparison */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-blue-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Model Performance Leaderboard
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any model row to inspect its parity, residuals, and hyperparameters.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Train n={overview.dataset.trainRows} · Val n={overview.dataset.valRows} · Test n=
              {overview.dataset.testRows}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                  <th className="py-3 px-6">Model</th>
                  <th className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("valR2")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Val R² <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("valRmse")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Val RMSE <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("testR2")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Test R² <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("testRmse")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Test RMSE <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">Test MAE</th>
                  <th className="py-3 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("trainingTimeSec")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Fit Time <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {sortedModels.map((row) => {
                  const isSelected = row.modelKey === selectedModel;
                  return (
                    <tr
                      key={row.modelKey}
                      onClick={() => setSelectedModel(row.modelKey)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/80" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 px-6 font-medium whitespace-nowrap">
                        <span className={MODEL_ACCENT_TEXT[row.modelKey]}>{row.model}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {row.valR2.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {row.valRmse.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {row.testR2.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {row.testRmse.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {row.testMae.toFixed(4)}
                      </td>
                      <td className="py-3 px-6 text-right font-mono tabular-nums text-slate-500">
                        {row.trainingTimeSec.toFixed(2)} s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Model R² Bar Comparison */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-md p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Validation vs. Test R² Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Trained models ranked by generalization accuracy
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {chartModels.map((m) => (
              <button
                key={m.modelKey}
                type="button"
                onClick={() => setSelectedModel(m.modelKey)}
                className={`w-full text-left p-2 rounded transition-colors cursor-pointer ${
                  selectedModel === m.modelKey ? "bg-slate-100/90" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-800">{m.model}</span>
                  <span className="font-mono tabular-nums text-slate-600">
                    {m.valR2.toFixed(3)} / <strong className="text-teal-700">{m.testR2.toFixed(3)}</strong>
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-sm transition-all duration-300"
                      style={{ width: `${Math.max(4, (m.valR2 / 0.75) * 100)}%` }}
                    />
                  </div>
                  <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-sm transition-all duration-300"
                      style={{ width: `${Math.max(4, (m.testR2 / 0.75) * 100)}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-xs inline-block" /> Validation R²
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-teal-500 rounded-xs inline-block" /> Test R²
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Parity & Residual Diagnostics */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-6 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Parity Diagnostics —{" "}
                <span className={MODEL_ACCENT_TEXT[selectedModel]}>{activeModelMeta?.model}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                {diagnostics
                  ? `R² = ${diagnostics.metrics.r2.toFixed(4)} · RMSE = ${diagnostics.metrics.rmse.toFixed(4)} · MAE = ${diagnostics.metrics.mae.toFixed(4)} · n = ${diagnostics.metrics.count}`
                  : "Loading diagnostics..."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => setSplit("test")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    split === "test"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Test (750)
                </button>
                <button
                  type="button"
                  onClick={() => setSplit("val")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    split === "val"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Val (750)
                </button>
              </div>

              {selectedModel !== "baseline_dummy" && split === "test" && (
                <button
                  type="button"
                  onClick={() => setShowStaticFigure(!showStaticFigure)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                  {showStaticFigure ? "Interactive SVG" : "Saved PNG"}
                </button>
              )}
            </div>
          </div>

          <div className="relative mt-4 flex-1 min-h-[360px] flex items-center justify-center">
            {loadingDiag && (
              <div className="text-xs font-mono text-slate-500">Loading parity points...</div>
            )}

            {!loadingDiag && showStaticFigure && split === "test" && (
              <img
                src={`/figures/parity_${selectedModel}_test.png`}
                alt={`Parity plot for ${selectedModel}`}
                referrerPolicy="no-referrer"
                className="max-h-[380px] w-auto object-contain rounded border border-slate-100"
              />
            )}

            {!loadingDiag && !showStaticFigure && diagnostics && (
              <div className="w-full relative">
                <svg
                  viewBox="0 0 560 380"
                  className="w-full h-auto cursor-crosshair select-none bg-slate-50/50 rounded border border-slate-100"
                  role="img"
                  aria-label="Interactive parity scatter plot colored by pore regime"
                >
                  {(() => {
                    const padL = 56;
                    const padR = 20;
                    const padT = 18;
                    const padB = 46;
                    const w = 560 - padL - padR;
                    const h = 380 - padT - padB;
                    const span = parityDomainMax - parityDomainMin || 1;
                    const toX = (v: number) => padL + ((v - parityDomainMin) / span) * w;
                    const toY = (v: number) => padT + h - ((v - parityDomainMin) / span) * h;

                    const ticks = [0, 2, 4, 6, 8, 10].filter(
                      (t) => t >= parityDomainMin && t <= parityDomainMax
                    );

                    return (
                      <>
                        {ticks.map((t) => (
                          <g key={t}>
                            <line
                              x1={padL}
                              y1={toY(t)}
                              x2={padL + w}
                              y2={toY(t)}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                            />
                            <line
                              x1={toX(t)}
                              y1={padT}
                              x2={toX(t)}
                              y2={padT + h}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                            />
                            <text
                              x={padL - 8}
                              y={toY(t) + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[10px] font-mono"
                            >
                              {t}
                            </text>
                            <text
                              x={toX(t)}
                              y={padT + h + 16}
                              textAnchor="middle"
                              className="fill-slate-500 text-[10px] font-mono"
                            >
                              {t}
                            </text>
                          </g>
                        ))}

                        {/* Ideal y = x line */}
                        <line
                          x1={toX(Math.max(0, parityDomainMin))}
                          y1={toY(Math.max(0, parityDomainMin))}
                          x2={toX(parityDomainMax)}
                          y2={toY(parityDomainMax)}
                          stroke="#e11d48"
                          strokeWidth="1.75"
                          strokeDasharray="5 4"
                        />

                        {/* Scatter points colored by pore regime */}
                        {diagnostics.points.map((pt) => {
                          const cx = toX(pt.yTrue);
                          const cy = toY(
                            Math.max(parityDomainMin, Math.min(parityDomainMax, pt.yPred))
                          );
                          const isHovered = hoveredPoint?.rowId === pt.rowId;
                          return (
                            <circle
                              key={pt.rowId}
                              cx={cx}
                              cy={cy}
                              r={isHovered ? 5.5 : 3}
                              fill={REGIME_COLORS[pt.poreRegime]}
                              fillOpacity={isHovered ? 1 : 0.52}
                              stroke={isHovered ? "#0f172a" : "none"}
                              strokeWidth={isHovered ? 1.5 : 0}
                              onMouseEnter={() => setHoveredPoint(pt)}
                            />
                          );
                        })}

                        <text
                          x={padL + w / 2}
                          y={370}
                          textAnchor="middle"
                          className="fill-slate-600 text-[11px] font-medium"
                        >
                          Actual CO₂ Uptake (mmol/g)
                        </text>
                        <text
                          x={16}
                          y={padT + h / 2}
                          textAnchor="middle"
                          transform={`rotate(-90 16 ${padT + h / 2})`}
                          className="fill-slate-600 text-[11px] font-medium"
                        >
                          Predicted CO₂ Uptake (mmol/g)
                        </text>
                      </>
                    );
                  })()}
                </svg>

                {/* Crosshair Readout & Legend */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs">
                  <div className="font-mono tabular-nums">
                    {hoveredPoint ? (
                      <>
                        <span className="font-semibold text-slate-900">
                          {hoveredPoint.mofName} (#{hoveredPoint.rowId})
                        </span>
                        <span className="text-slate-600 ml-2">
                          Actual: <strong className="text-slate-900">{hoveredPoint.yTrue.toFixed(3)}</strong> ·
                          Pred: <strong className="text-blue-700">{hoveredPoint.yPred.toFixed(3)}</strong> ·
                          Res:{" "}
                          <strong
                            className={
                              Math.abs(hoveredPoint.residual) < 0.75
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }
                          >
                            {hoveredPoint.residual >= 0 ? "+" : ""}
                            {hoveredPoint.residual.toFixed(3)}
                          </strong>
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500">
                        Hover any point to inspect MOF name, true uptake, prediction, and residual.
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                    {(Object.keys(REGIME_COLORS) as PoreRegime[]).map((r) => (
                      <span key={r} className="inline-flex items-center gap-1">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: REGIME_COLORS[r] }}
                        />
                        {r.split(" (")[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Residual Distribution + Tuned Hyperparameters */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <h2 className="text-base font-semibold text-slate-900">Residual Error Distribution</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Actual minus predicted uptake (mmol/g) across {diagnostics?.metrics.count ?? 750} samples
            </p>

            {diagnostics && (
              <div className="mt-4">
                <svg viewBox="0 0 420 175" className="w-full h-auto" role="img" aria-label="Residual histogram">
                  {(() => {
                    const padL = 34;
                    const padB = 28;
                    const w = 420 - padL - 12;
                    const h = 175 - padB - 12;
                    const bins = diagnostics.residualHistogram;
                    const barW = w / bins.length;
                    return (
                      <>
                        {bins.map((b, i) => {
                          const barH = (b.count / maxHistCount) * h;
                          const x = padL + i * barW;
                          const y = 12 + h - barH;
                          const mid = (b.start + b.end) / 2;
                          const absMid = Math.abs(mid);
                          const fill =
                            absMid < 0.6
                              ? "#0d9488"
                              : absMid < 1.5
                                ? "#2563eb"
                                : "#d97706";
                          return (
                            <g key={b.label}>
                              <rect
                                x={x + 1}
                                y={y}
                                width={Math.max(1, barW - 2)}
                                height={barH}
                                fill={fill}
                                fillOpacity={0.85}
                                rx={1.5}
                              >
                                <title>{`${b.label} mmol/g: ${b.count} MOFs`}</title>
                              </rect>
                            </g>
                          );
                        })}
                        <line x1={padL} y1={12 + h} x2={padL + w} y2={12 + h} stroke="#cbd5e1" />
                        <text x={padL} y={170} className="fill-slate-500 text-[10px] font-mono">
                          -4.5
                        </text>
                        <text
                          x={padL + w / 2}
                          y={170}
                          textAnchor="middle"
                          className="fill-teal-700 text-[10px] font-mono font-semibold"
                        >
                          0.0 (Ideal)
                        </text>
                        <text
                          x={padL + w}
                          y={170}
                          textAnchor="end"
                          className="fill-slate-500 text-[10px] font-mono"
                        >
                          +4.5
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-6">
            <h2 className="text-base font-semibold text-slate-900">
              Selected Model Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeModelMeta?.model} · Search {activeModelMeta?.searchTimeSec.toFixed(1)} s · Fit{" "}
              {activeModelMeta?.trainingTimeSec.toFixed(2)} s
            </p>

            {activeModelMeta?.cvSummary.r2Mean !== undefined && (
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-blue-50/60 rounded">
                  <div className="text-slate-500">5-Fold CV R²</div>
                  <div className="font-mono tabular-nums font-semibold text-blue-900 mt-0.5">
                    {activeModelMeta.cvSummary.r2Mean.toFixed(4)}
                  </div>
                </div>
                <div className="p-2.5 bg-teal-50/60 rounded">
                  <div className="text-slate-500">5-Fold CV RMSE</div>
                  <div className="font-mono tabular-nums font-semibold text-teal-900 mt-0.5">
                    {activeModelMeta.cvSummary.rmseMean?.toFixed(4)}
                  </div>
                </div>
                <div className="p-2.5 bg-indigo-50/60 rounded">
                  <div className="text-slate-500">5-Fold CV MAE</div>
                  <div className="font-mono tabular-nums font-semibold text-indigo-900 mt-0.5">
                    {activeModelMeta.cvSummary.maeMean?.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-600 mb-2">Best Hyperparameters</div>
              {Object.keys(activeModelMeta?.bestParams ?? {}).length === 0 ? (
                <p className="text-xs text-slate-500 font-mono">Default unparameterized estimator</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                  {Object.entries(activeModelMeta?.bestParams ?? {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 py-0.5 border-b border-slate-100">
                      <span className="text-slate-500 truncate">{k.replace("model__", "")}</span>
                      <span className="text-slate-900 tabular-nums shrink-0">
                        {typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(4)) : JSON.stringify(v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Deep Learning & GA Hybrid Evolution Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-6">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                GA-ANN Hybrid Evolution (Option A)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Population 8 · 6 Generations · Validation RMSE fitness
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-700 font-semibold">
              Best: {overview.gaBestConfig.best_val_rmse.toFixed(4)}
            </span>
          </div>

          <div className="mt-4">
            <svg viewBox="0 0 420 190" className="w-full h-auto" role="img" aria-label="GA convergence chart">
              <defs>
                <linearGradient id="gaAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {(() => {
                const hist = overview.gaHistory;
                const padL = 46;
                const padR = 16;
                const padT = 16;
                const padB = 30;
                const w = 420 - padL - padR;
                const h = 190 - padT - padB;
                const minY = 1.085;
                const maxY = 1.135;
                const toX = (gen: number) => padL + ((gen - 1) / Math.max(1, hist.length - 1)) * w;
                const toY = (val: number) => padT + h - ((val - minY) / (maxY - minY)) * h;

                const bestPath = hist
                  .map((r, i) => `${i === 0 ? "M" : "L"}${toX(r.generation)},${toY(r.bestSoFarValRmse)}`)
                  .join(" ");
                const areaPath =
                  bestPath +
                  ` L${toX(hist[hist.length - 1].generation)},${padT + h} L${toX(hist[0].generation)},${padT + h} Z`;
                const meanPath = hist
                  .map((r, i) => `${i === 0 ? "M" : "L"}${toX(r.generation)},${toY(r.meanFitnessValRmse)}`)
                  .join(" ");

                return (
                  <>
                    {[1.09, 1.1, 1.11, 1.12, 1.13].map((t) => (
                      <g key={t}>
                        <line x1={padL} y1={toY(t)} x2={padL + w} y2={toY(t)} stroke="#e2e8f0" />
                        <text
                          x={padL - 6}
                          y={toY(t) + 3}
                          textAnchor="end"
                          className="fill-slate-500 text-[10px] font-mono"
                        >
                          {t.toFixed(2)}
                        </text>
                      </g>
                    ))}
                    <path d={areaPath} fill="url(#gaAreaGrad)" />
                    <path d={meanPath} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
                    <path d={bestPath} fill="none" stroke="#4f46e5" strokeWidth="2.4" />
                    {hist.map((r) => (
                      <g key={r.generation}>
                        <circle
                          cx={toX(r.generation)}
                          cy={toY(r.bestSoFarValRmse)}
                          r="4"
                          fill="#0d9488"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={toX(r.generation)}
                          y={padT + h + 16}
                          textAnchor="middle"
                          className="fill-slate-500 text-[10px] font-mono"
                        >
                          G{r.generation}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="text-indigo-700">Solid Indigo: Best-so-far Val RMSE</span>
              <span>Dashed Gray: Population Mean</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
              Discovered architecture{" "}
              <span className="font-mono text-indigo-800 font-medium">
                [{overview.gaBestConfig.hidden_dims.join(", ")}]
              </span>{" "}
              with <span className="font-mono text-slate-900">dropout=0.3</span> generalized better
              on the unseen Test set (<span className="font-mono text-teal-700 font-medium">0.9781</span> vs manual ANN{" "}
              <span className="font-mono">0.9985</span>).
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/60 via-white to-slate-50 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              PyTorch ANN Architecture Tuning Runs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adam optimizer · MSE loss · ReLU hidden activations · Early Stopping (patience=20)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-2.5 px-4">Config</th>
                  <th className="py-2.5 px-3">Layers</th>
                  <th className="py-2.5 px-3 text-right">LR</th>
                  <th className="py-2.5 px-3 text-right">Drop</th>
                  <th className="py-2.5 px-3 text-right">Best Ep</th>
                  <th className="py-2.5 px-3 text-right">Val R²</th>
                  <th className="py-2.5 px-4 text-right">Val RMSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                {overview.annTuningRuns.map((run, idx) => (
                  <tr key={run.config} className={idx === 0 ? "bg-indigo-50/60" : ""}>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                      {run.config}
                    </td>
                    <td className="py-2.5 px-3 text-indigo-700">{run.hiddenDims}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{run.lr}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{run.dropout}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {run.bestEpoch}/{run.epochsRun}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900">{run.valR2.toFixed(4)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-teal-800">
                      {run.valRmse.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
