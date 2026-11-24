import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import type { MofFeaturesInput, MofRecord, OverviewResponse, PredictResponse } from "../types.ts";

interface PredictorViewProps {
  overview: OverviewResponse;
  initialMof?: MofRecord | null;
  onClearInitialMof?: () => void;
}

interface SliderSpec {
  key: keyof MofFeaturesInput;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: "geometry" | "chemistry";
}

const SLIDER_SPECS: SliderSpec[] = [
  { key: "df", label: "Limiting Aperture (Df)", unit: "Å", min: 0.5, max: 25, step: 0.05, group: "geometry" },
  { key: "di", label: "Cavity Diameter (Di)", unit: "Å", min: 1.0, max: 30, step: 0.05, group: "geometry" },
  { key: "poav", label: "Accessible Pore Vol. (POAV)", unit: "cm³/g", min: 0, max: 4.5, step: 0.01, group: "geometry" },
  { key: "ponav", label: "Non-Accessible Pore Vol. (PONAV)", unit: "cm³/g", min: 0, max: 0.6, step: 0.005, group: "geometry" },
  { key: "asa", label: "Accessible Surface Area (ASA)", unit: "m²/cm³", min: 0, max: 3200, step: 10, group: "geometry" },
  { key: "nasa", label: "Non-Accessible SA (NASA)", unit: "m²/cm³", min: 0, max: 1200, step: 10, group: "geometry" },
  { key: "density", label: "Crystal Density", unit: "g/cm³", min: 0.15, max: 3.5, step: 0.01, group: "geometry" },
  { key: "mcCryChi0", label: "Metal Electronegativity (mc_CRY-chi-0)", unit: "RAC", min: 0.65, max: 6.0, step: 0.05, group: "chemistry" },
  { key: "mcCryChi2", label: "Metal Electronegativity Depth-2 (chi-2)", unit: "RAC", min: 5.0, max: 110, step: 0.5, group: "chemistry" },
  { key: "mcCryS0", label: "Metal Covalent Radius (mc_CRY-S-0)", unit: "RAC", min: 1.0, max: 5.2, step: 0.05, group: "chemistry" },
  { key: "mcCryS1", label: "Metal Covalent Radius Depth-1 (S-1)", unit: "RAC", min: 1.0, max: 22, step: 0.1, group: "chemistry" },
  { key: "fLigZ1", label: "Ligand Nuclear Charge (f-lig-Z-1)", unit: "RAC", min: 70, max: 15000, step: 25, group: "chemistry" },
];

const CURATED_PRESETS: Array<{ label: string; description: string; values: Partial<MofFeaturesInput> }> = [
  {
    label: "Ultra-Microporous Optimal MOF",
    description: "Df 4.15 Å · POAV 0.42 cm³/g · Low metal electronegativity",
    values: { df: 4.15, di: 6.45, poav: 0.42, ponav: 0.05, asa: 1450, nasa: 120, density: 1.18, mcCryChi0: 1.55, mcCryChi2: 14.5 },
  },
  {
    label: "Wide-Pore Mesoporous MOF",
    description: "Df 11.2 Å · POAV 2.15 cm³/g · Low density framework",
    values: { df: 11.2, di: 16.8, poav: 2.15, ponav: 0.0, asa: 2550, nasa: 0, density: 0.42, mcCryChi0: 3.1, mcCryChi2: 28.0 },
  },
  {
    label: "Dense Polar-Site Framework",
    description: "Df 3.65 Å · High density 1.52 g/cm³ · Strong electrostatic nodes",
    values: { df: 3.65, di: 5.2, poav: 0.34, ponav: 0.14, asa: 1120, nasa: 260, density: 1.52, mcCryChi0: 1.25, mcCryChi2: 11.8 },
  },
];

function mofToInput(mof: MofRecord): MofFeaturesInput {
  return {
    asa: mof.asa,
    df: mof.df,
    di: mof.di,
    nasa: mof.nasa,
    poav: mof.poav,
    ponav: mof.ponav,
    density: mof.density,
    mcCryChi0: mof.mcCryChi0,
    mcCryChi1: mof.mcCryChi1,
    mcCryChi2: mof.mcCryChi2,
    mcCryS0: mof.mcCryS0,
    mcCryS1: mof.mcCryS1,
    mcCryZ0: mof.mcCryZ0,
    mcCryI1: mof.mcCryI1,
    fLigZ1: mof.fLigZ1,
    sumLcS0: mof.sumLcS0,
  };
}

export function PredictorView({ overview, initialMof, onClearInitialMof }: PredictorViewProps) {
  const [form, setForm] = useState<MofFeaturesInput>(() =>
    initialMof ? mofToInput(initialMof) : overview.dataset.featureDefaults
  );
  const [matchedRowId, setMatchedRowId] = useState<number | undefined>(() => initialMof?.rowId);
  const [activeLabel, setActiveLabel] = useState<string>(() =>
    initialMof
      ? `${initialMof.mofName} (#${initialMof.rowId}, ${initialMof.split})`
      : "Ultra-Microporous Optimal MOF"
  );
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runPredict = useCallback(async (payload: MofFeaturesInput, rowId?: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, matchedRowId: rowId }),
      });
      const data: PredictResponse = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const payload = initialMof ? mofToInput(initialMof) : overview.dataset.featureDefaults;
    fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, matchedRowId: initialMof?.rowId }),
    })
      .then((res) => res.json())
      .then((data: PredictResponse) => {
        if (!cancelled) setResult(data);
      });
    return () => {
      cancelled = true;
    };
  }, [initialMof, overview.dataset.featureDefaults]);

  const handleFieldChange = (key: keyof MofFeaturesInput, val: number) => {
    const next = { ...form, [key]: val };
    setForm(next);
    setMatchedRowId(undefined);
    setActiveLabel("Custom Parameter Profile");
    onClearInitialMof?.();
  };

  const applyPreset = (preset: (typeof CURATED_PRESETS)[number]) => {
    const next = { ...overview.dataset.featureDefaults, ...preset.values };
    setForm(next);
    setMatchedRowId(undefined);
    setActiveLabel(preset.label);
    onClearInitialMof?.();
    runPredict(next);
  };

  const handleReset = () => {
    setForm(overview.dataset.featureDefaults);
    setMatchedRowId(undefined);
    setActiveLabel("Default Baseline Profile");
    onClearInitialMof?.();
    runPredict(overview.dataset.featureDefaults);
  };

  const asaGravimetric = form.density > 0 ? form.asa / form.density : 0;
  const cageWindowDiff = form.di - form.df;

  const maxAttrAbs = result
    ? Math.max(0.15, ...result.attributions.map((a) => Math.abs(a.deltaContribution)))
    : 1;

  const gaugeMax = 9.32;
  const predPct = result ? Math.min(100, Math.max(0, (result.predictedUptake / gaugeMax) * 100)) : 0;
  const lowPct = result ? Math.min(100, Math.max(0, (result.lowerBound / gaugeMax) * 100)) : 0;
  const highPct = result ? Math.min(100, Math.max(0, (result.upperBound / gaugeMax) * 100)) : 0;
  const meanPct = result ? Math.min(100, Math.max(0, (result.trainMeanUptake / gaugeMax) * 100)) : 19;

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-gradient-to-r from-blue-50 via-white to-teal-50 border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-teal-800 font-medium">
            RBF-Kernel Surrogate · Fitted strictly on train.csv (n=3,499) · 0.15 bar, 298 K
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Interactive MOF Screening &amp; Uptake Predictor
          </h1>
        </div>
        <div className="text-xs font-mono text-slate-600">
          Active profile: <span className="font-semibold text-blue-800">{activeLabel}</span>
        </div>
      </section>

      {/* Asymmetric Split Console */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Control Column */}
        <aside className="w-full lg:w-[370px] shrink-0 bg-white border border-slate-200 rounded-md p-5 space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-800">Load Benchmark Preset</div>
            <div className="grid grid-cols-1 gap-1.5">
              {CURATED_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`text-left px-3 py-2 rounded border text-xs transition-colors cursor-pointer ${
                    activeLabel === p.label
                      ? "bg-gradient-to-r from-blue-50 to-teal-50 border-blue-400 text-slate-900"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="text-xs font-semibold text-blue-800">Geometric Pore Structure</div>
            {SLIDER_SPECS.filter((s) => s.group === "geometry").map((spec) => (
              <div key={spec.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs gap-2">
                  <label htmlFor={`input-${spec.key}`} className="text-slate-700 truncate">
                    {spec.label}
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      id={`input-${spec.key}`}
                      type="number"
                      step={spec.step}
                      min={spec.min}
                      max={spec.max}
                      value={Number(form[spec.key].toFixed(3))}
                      onChange={(e) => handleFieldChange(spec.key, Number(e.target.value))}
                      className="w-20 px-1.5 py-0.5 text-right font-mono tabular-nums text-xs border border-slate-200 rounded bg-slate-50 text-slate-900"
                    />
                    <span className="text-[11px] font-mono text-slate-400 w-11">{spec.unit}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={Math.min(spec.max, Math.max(spec.min, form[spec.key]))}
                  onChange={(e) => handleFieldChange(spec.key, Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="text-xs font-semibold text-teal-800">Chemical RAC Descriptors</div>
            {SLIDER_SPECS.filter((s) => s.group === "chemistry").map((spec) => (
              <div key={spec.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs gap-2">
                  <label htmlFor={`input-${spec.key}`} className="text-slate-700 truncate">
                    {spec.label}
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      id={`input-${spec.key}`}
                      type="number"
                      step={spec.step}
                      min={spec.min}
                      max={spec.max}
                      value={Number(form[spec.key].toFixed(2))}
                      onChange={(e) => handleFieldChange(spec.key, Number(e.target.value))}
                      className="w-20 px-1.5 py-0.5 text-right font-mono tabular-nums text-xs border border-slate-200 rounded bg-slate-50 text-slate-900"
                    />
                    <span className="text-[11px] font-mono text-slate-400 w-11">{spec.unit}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={Math.min(spec.max, Math.max(spec.min, form[spec.key]))}
                  onChange={(e) => handleFieldChange(spec.key, Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Derived Engineered Features */}
          <div className="pt-4 border-t border-slate-200 space-y-2 text-xs font-mono bg-slate-50/80 -mx-5 px-5 py-3 border-b">
            <div className="flex justify-between">
              <span className="text-slate-500">ASA_gravimetric</span>
              <span className="text-blue-800 font-semibold tabular-nums">
                {asaGravimetric.toFixed(1)} m²/g
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">cage_window_diff (Di - Df)</span>
              <span className="text-teal-800 font-semibold tabular-nums">
                {cageWindowDiff.toFixed(2)} Å
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => runPredict(form, matchedRowId)}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-60 rounded-md transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Predicting..." : "Predict Uptake"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
              title="Reset parameters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Viewport Stage */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Primary Readout Card with Calibrated Uptake Spectrum */}
          <div className="rounded-md bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-slate-800 p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <div className="text-xs font-medium text-teal-300">
                  Predicted CO₂ Uptake (0.15 bar, 298 K)
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-4xl font-bold font-mono tabular-nums text-white">
                    {result ? result.predictedUptake.toFixed(3) : "—"}
                  </span>
                  <span className="text-xs font-mono text-slate-300 ml-2">mmol/g (assumed)</span>
                </div>
                {result && (
                  <div
                    className={`mt-1.5 text-xs font-mono tabular-nums ${
                      result.deltaVsMean >= 0 ? "text-emerald-400" : "text-amber-300"
                    }`}
                  >
                    {result.deltaVsMean >= 0 ? "+" : ""}
                    {result.deltaVsMean.toFixed(3)} mmol/g vs. train mean (
                    {result.trainMeanUptake.toFixed(3)})
                  </div>
                )}
              </div>

              <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                <div className="text-xs font-medium text-slate-400">
                  Neighbor Analog Spread (15th–85th %)
                </div>
                <div className="mt-2 text-xl font-semibold font-mono tabular-nums text-teal-300">
                  {result ? `${result.lowerBound.toFixed(2)} – ${result.upperBound.toFixed(2)}` : "—"}
                  <span className="text-xs font-normal text-slate-400 ml-1.5">mmol/g</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Derived from 18 nearest training MOFs
                </div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                <div className="text-xs font-medium text-slate-400">Pore Confinement Regime</div>
                <div className="mt-2 text-base font-semibold text-white">
                  {result?.poreRegime ?? "—"}
                </div>
                <div className="mt-1 text-xs text-slate-400 font-mono tabular-nums">
                  CO₂ kinetic diameter: 3.30 Å
                </div>
              </div>
            </div>

            {/* Calibrated Spectrum Gauge (0 to 9.32 mmol/g) */}
            {result && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-2">
                  <span>0.0 mmol/g (Non-adsorbing)</span>
                  <span>Train Mean ({result.trainMeanUptake.toFixed(2)})</span>
                  <span>9.32 mmol/g (Dataset Max)</span>
                </div>
                <div className="relative h-3.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/70 via-teal-500/80 to-blue-500/90 opacity-35" />
                  <div
                    className="absolute top-0 bottom-0 bg-teal-400/45 border-x border-teal-300"
                    style={{
                      left: `${lowPct}%`,
                      width: `${Math.max(1.5, highPct - lowPct)}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-300/70"
                    style={{ left: `${meanPct}%` }}
                    title={`Train Mean: ${result.trainMeanUptake}`}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-white shadow-sm"
                    style={{ left: `calc(${predPct}% - 3px)` }}
                  />
                </div>
              </div>
            )}

            {/* If viewing an actual Val/Test MOF, display all benchmark model predictions */}
            {result?.matchedMof && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="text-xs font-medium text-slate-300 mb-3">
                  Benchmark Model Predictions vs. Ground Truth for {result.matchedMof.mofName} (
                  {result.matchedMof.split} split)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono tabular-nums">
                  <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded">
                    <div className="text-slate-400 font-sans">Ground Truth</div>
                    <div className="text-sm font-bold text-white mt-1">
                      {result.matchedMof.uptake.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-2.5 bg-emerald-950/70 border border-emerald-700/70 rounded">
                    <div className="text-emerald-300 font-sans">XGBoost (#1)</div>
                    <div className="text-sm font-bold text-white mt-1">
                      {result.matchedMof.xgbPred?.toFixed(3) ?? "—"}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded">
                    <div className="text-teal-300 font-sans">Random Forest</div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {result.matchedMof.rfPred?.toFixed(3) ?? "—"}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded">
                    <div className="text-indigo-300 font-sans">ANN (PyTorch)</div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {result.matchedMof.annPred?.toFixed(3) ?? "—"}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded">
                    <div className="text-blue-300 font-sans">GA-ANN Hybrid</div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {result.matchedMof.gaAnnPred?.toFixed(3) ?? "—"}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded">
                    <div className="text-amber-300 font-sans">SVR (RBF)</div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {result.matchedMof.svrPred?.toFixed(3) ?? "—"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Local Sensitivity Attribution Chart */}
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <h2 className="text-base font-semibold text-slate-900">
              Local Feature Sensitivity Attribution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Directional shift in predicted CO₂ uptake (mmol/g) when moving each descriptor from
              the training mean to the current input value.
            </p>

            {result && (
              <div className="mt-4 space-y-2.5">
                {result.attributions.map((attr) => {
                  const pct = Math.min(100, (Math.abs(attr.deltaContribution) / maxAttrAbs) * 100);
                  const isPos = attr.deltaContribution >= 0;
                  return (
                    <div key={attr.feature} className="grid grid-cols-12 items-center gap-3 text-xs">
                      <div className="col-span-5 sm:col-span-4 truncate font-medium text-slate-700">
                        {attr.label}
                      </div>
                      <div className="col-span-5 sm:col-span-6 flex items-center gap-2">
                        <div className="flex-1 h-4 bg-slate-100 rounded-sm overflow-hidden flex items-center">
                          <div
                            className={`h-full transition-all duration-200 ${
                              isPos
                                ? "bg-gradient-to-r from-teal-500 to-blue-600"
                                : "bg-gradient-to-r from-amber-500 to-rose-500"
                            }`}
                            style={{ width: `${Math.max(2, pct)}%` }}
                          />
                        </div>
                      </div>
                      <div
                        className={`col-span-2 text-right font-mono tabular-nums font-semibold ${
                          isPos ? "text-teal-700" : "text-amber-700"
                        }`}
                      >
                        {isPos ? "+" : ""}
                        {attr.deltaContribution.toFixed(3)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nearest Training MOF Analogs */}
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-teal-50/40 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                Top 5 Nearest Training MOF Analogs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any analog row to load its exact structural and chemical profile.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <th className="py-2.5 px-6">MOFname</th>
                    <th className="py-2.5 px-3 text-right">Similarity</th>
                    <th className="py-2.5 px-3 text-right">Df (Å)</th>
                    <th className="py-2.5 px-3 text-right">Di (Å)</th>
                    <th className="py-2.5 px-3 text-right">POAV</th>
                    <th className="py-2.5 px-3 text-right">chi-0</th>
                    <th className="py-2.5 px-6 text-right">True Uptake</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  {result?.nearestAnalogs.map((analog) => (
                    <tr
                      key={analog.rowId}
                      onClick={async () => {
                        const res = await fetch(`/api/mofs/${analog.rowId}`);
                        if (res.ok) {
                          const full: MofRecord = await res.json();
                          const next = mofToInput(full);
                          setForm(next);
                          setMatchedRowId(full.rowId);
                          setActiveLabel(`${full.mofName} (#${full.rowId}, train)`);
                          runPredict(next, full.rowId);
                        }
                      }}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-6 font-medium text-slate-900">
                        {analog.mofName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-teal-700">
                        {analog.similarity}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{analog.df.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{analog.di.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{analog.poav.toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{analog.mcCryChi0.toFixed(2)}</td>
                      <td className="py-2.5 px-6 text-right font-semibold text-blue-800">
                        {analog.uptake.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
