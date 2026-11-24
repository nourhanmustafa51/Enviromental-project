import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { ExplainabilityResponse, OverviewResponse, PoreRegime } from "../types.ts";

interface ExplainabilityViewProps {
  overview: OverviewResponse;
}

type ImportanceSource = "shap" | "xgb" | "rf";
type ScatterAxisKey = "df" | "di" | "poav" | "mcCryChi0" | "density" | "asaGravimetric";
type FigureCategory = "All" | "Explainability" | "EDA" | "Diagnostics" | "Training";

const AXIS_META: Record<ScatterAxisKey, { label: string; unit: string; maxClamp?: number }> = {
  df: { label: "Limiting Aperture (Df)", unit: "Å", maxClamp: 22 },
  di: { label: "Cavity Diameter (Di)", unit: "Å", maxClamp: 28 },
  poav: { label: "Accessible Pore Volume (POAV)", unit: "cm³/g", maxClamp: 4.5 },
  mcCryChi0: { label: "Metal Electronegativity (mc_CRY-chi-0-all)", unit: "RAC" },
  density: { label: "Crystal Density", unit: "g/cm³", maxClamp: 3.2 },
  asaGravimetric: { label: "Gravimetric Surface Area (ASA_gravimetric)", unit: "m²/g", maxClamp: 6000 },
};

const REGIME_COLORS: Record<PoreRegime, string> = {
  "Ultra-microporous (3.3–5.0 Å)": "#2563eb",
  "Microporous (5.0–7.0 Å)": "#0d9488",
  "Large Pore (> 7.0 Å)": "#d97706",
  "Sub-kinetic (< 3.3 Å)": "#64748b",
};

const SCIENTIFIC_FINDINGS = [
  {
    title: "01. Metal-Center Electronegativity Dominates",
    accent: "text-blue-800",
    surface: "bg-blue-50/50 border-blue-200/70",
    body: "mc_CRY-chi-0-all (mean |SHAP| = 0.2823) and mc_CRY-chi-2-all (0.2086) rank #1 and #2. Lower electronegativity metal nodes carry stronger partial positive charge, deepening electrostatic quadrupole interactions with CO₂.",
  },
  {
    title: "02. Non-Monotonic Microporous Pore Optimum",
    accent: "text-teal-800",
    surface: "bg-teal-50/50 border-teal-200/70",
    body: "POAV exhibits a volcano curve: non-porous MOFs (POAV ≈ 0) and wide mesopores (> 1.2 cm³/g) receive negative SHAP contributions, whereas the 0.25–0.65 cm³/g window adds +0.30 to +0.45 mmol/g.",
  },
  {
    title: "03. Pore Confinement at 0.15 bar",
    accent: "text-indigo-800",
    surface: "bg-indigo-50/50 border-indigo-200/70",
    body: "Smaller cavity diameters (Di) and ultra-microporous apertures (Df = 3.3–5.0 Å) maximize overlapping van der Waals dispersion potentials with linear CO₂ (kinetic diameter 3.3 Å).",
  },
  {
    title: "04. Affinity-Limited vs. Capacity-Limited Regime",
    accent: "text-amber-800",
    surface: "bg-amber-50/50 border-amber-200/70",
    body: "Unlike high-pressure storage (30+ bar), high volumetric surface area (> 2,000 m²/cm³) lowers 0.15 bar uptake because high-SA structures tend to feature wide, low-density pores.",
  },
];

function classifyFeatureDomain(featureName: string): { barClass: string; domain: string } {
  const geometric = ["POAV", "PONAV", "Di", "Df", "density", "ASA", "NASA", "cage_window_diff"];
  if (geometric.some((g) => featureName.includes(g))) {
    return { barClass: "bg-teal-600", domain: "Geometric Pore" };
  }
  if (featureName.includes("mc_CRY")) {
    return { barClass: "bg-blue-600", domain: "Metal RAC" };
  }
  return { barClass: "bg-indigo-600", domain: "Ligand / Func RAC" };
}

export function ExplainabilityView({ overview }: ExplainabilityViewProps) {
  const [data, setData] = useState<ExplainabilityResponse | null>(null);
  const [importanceSource, setImportanceSource] = useState<ImportanceSource>("shap");
  const [xAxis, setXAxis] = useState<ScatterAxisKey>("poav");
  const [hoveredSample, setHoveredSample] = useState<
    ExplainabilityResponse["scatterSamples"][number] | null
  >(null);
  const [figCategory, setFigCategory] = useState<FigureCategory>("All");
  const [lightboxFigure, setLightboxFigure] = useState<
    ExplainabilityResponse["figures"][number] | null
  >(null);

  useEffect(() => {
    fetch("/api/explainability")
      .then((res) => res.json())
      .then((d: ExplainabilityResponse) => setData(d));
  }, []);

  const activeImportances = useMemo(() => {
    if (!data) return [];
    const list =
      importanceSource === "shap"
        ? data.shapTop
        : importanceSource === "xgb"
          ? data.xgbTop
          : data.rfTop;
    return list.slice(0, 15);
  }, [data, importanceSource]);

  const maxImportance = useMemo(() => {
    if (activeImportances.length === 0) return 1;
    return Math.max(...activeImportances.map((i) => i.importance));
  }, [activeImportances]);

  const filteredFigures = useMemo(() => {
    if (!data) return [];
    if (figCategory === "All") return data.figures;
    return data.figures.filter((f) => f.category === figCategory);
  }, [data, figCategory]);

  const xBounds = useMemo(() => {
    if (!data || data.scatterSamples.length === 0) return { min: 0, max: 10 };
    const clampMax = AXIS_META[xAxis].maxClamp;
    let min = Infinity;
    let max = -Infinity;
    for (const s of data.scatterSamples) {
      const v = s[xAxis];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return {
      min: Math.max(0, Math.floor(min * 10) / 10),
      max: clampMax ? Math.min(max, clampMax) : max,
    };
  }, [data, xAxis]);

  const maxRegimeMean = Math.max(
    1,
    ...overview.dataset.poreRegimes.map((r) => r.meanUptake)
  );

  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-gradient-to-r from-indigo-50 via-white to-teal-50 border border-slate-200 p-6">
        <div className="text-xs font-mono text-indigo-700 font-medium">
          XGBoost TreeSHAP (n=750 test) · Training EDA (n=3,499) · 193 Pruned Features
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Explainability, SHAP Drivers &amp; Adsorption Physics
        </h1>
      </section>

      {/* Top Row: Domain-Colored Feature Importance + Pore Regime Table */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Top 15 Feature Drivers
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Color-coded by chemical vs. geometric descriptor family.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                {(
                  [
                    { id: "shap", label: "SHAP |φ|" },
                    { id: "xgb", label: "XGBoost" },
                    { id: "rf", label: "Random Forest" },
                  ] as Array<{ id: ImportanceSource; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setImportanceSource(tab.id)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      importanceSource === tab.id
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {activeImportances.map((item, idx) => {
                const pct = (item.importance / maxImportance) * 100;
                const { barClass } = classifyFeatureDomain(item.feature);
                return (
                  <div key={item.feature} className="grid grid-cols-12 items-center gap-3 text-xs">
                    <div className="col-span-5 sm:col-span-4 font-mono text-slate-800 truncate">
                      <span className="text-slate-400 mr-2">{String(idx + 1).padStart(2, "0")}</span>
                      {item.feature}
                    </div>
                    <div className="col-span-5 sm:col-span-6">
                      <div className="h-3.5 bg-slate-100 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${barClass} transition-all duration-200`}
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-mono tabular-nums text-slate-800 font-medium">
                      {item.importance.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-xs inline-block" /> Metal-Centered RAC
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-teal-600 rounded-xs inline-block" /> Geometric Pore Metric
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs inline-block" /> Ligand / Functional RAC
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-50/70 to-white border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                Uptake by Pore-Size Regime (train.csv)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Grouped by limiting aperture Df relative to CO₂ kinetic diameter (3.3 Å)
              </p>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-2.5 px-5">Pore Regime</th>
                  <th className="py-2.5 px-3 text-right">n</th>
                  <th className="py-2.5 px-3 text-right">Mean</th>
                  <th className="py-2.5 px-5">Relative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                {overview.dataset.poreRegimes.map((reg) => (
                  <tr key={reg.regime}>
                    <td className="py-3 px-5 font-sans font-medium text-slate-900">
                      {reg.regime}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {reg.count.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900">
                      {reg.meanUptake.toFixed(3)}
                    </td>
                    <td className="py-3 px-5 w-28">
                      <div className="h-2.5 bg-slate-100 rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm"
                          style={{
                            width: `${(reg.meanUptake / maxRegimeMean) * 100}%`,
                            backgroundColor: REGIME_COLORS[reg.regime],
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3">
              Key Adsorption Findings
            </h2>
            <div className="space-y-3">
              {SCIENTIFIC_FINDINGS.map((f) => (
                <div key={f.title} className={`p-3.5 rounded-md border ${f.surface}`}>
                  <div className={`text-xs font-semibold ${f.accent}`}>{f.title}</div>
                  <p className="text-xs text-slate-700 leading-relaxed mt-1">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Structure-Property Scatter Explorer */}
      <section className="bg-white border border-slate-200 rounded-md p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Structure–Property Explorer (Sampled Training MOFs, n=600)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect non-linear thresholds across pore geometry and framework electronegativity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md">
            {(Object.keys(AXIS_META) as ScatterAxisKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setXAxis(key)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  xAxis === key
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {key === "mcCryChi0"
                  ? "chi-0"
                  : key === "asaGravimetric"
                    ? "ASA_grav"
                    : key.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {data && (
          <div className="mt-4">
            <svg
              viewBox="0 0 880 310"
              className="w-full h-auto cursor-crosshair select-none bg-slate-50/60 rounded border border-slate-100"
              role="img"
              aria-label="Structure property scatter plot"
            >
              {(() => {
                const padL = 54;
                const padR = 24;
                const padT = 16;
                const padB = 42;
                const w = 880 - padL - padR;
                const h = 310 - padT - padB;
                const spanX = xBounds.max - xBounds.min || 1;
                const toX = (v: number) =>
                  padL + (Math.min(xBounds.max, Math.max(xBounds.min, v)) - xBounds.min) / spanX * w;
                const toY = (v: number) => padT + h - (Math.min(9.5, Math.max(0, v)) / 9.5) * h;

                return (
                  <>
                    {[0, 2, 4, 6, 8].map((yTick) => (
                      <g key={yTick}>
                        <line x1={padL} y1={toY(yTick)} x2={padL + w} y2={toY(yTick)} stroke="#e2e8f0" />
                        <text
                          x={padL - 8}
                          y={toY(yTick) + 4}
                          textAnchor="end"
                          className="fill-slate-500 text-[10px] font-mono"
                        >
                          {yTick}
                        </text>
                      </g>
                    ))}
                    {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                      const val = xBounds.min + frac * spanX;
                      return (
                        <g key={frac}>
                          <line x1={toX(val)} y1={padT} x2={toX(val)} y2={padT + h} stroke="#e2e8f0" />
                          <text
                            x={toX(val)}
                            y={padT + h + 16}
                            textAnchor="middle"
                            className="fill-slate-500 text-[10px] font-mono"
                          >
                            {val >= 100 ? Math.round(val) : val.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}

                    {data.scatterSamples.map((pt) => {
                      const cx = toX(pt[xAxis]);
                      const cy = toY(pt.uptake);
                      const isHovered = hoveredSample?.rowId === pt.rowId;
                      return (
                        <circle
                          key={pt.rowId}
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 6 : 3.3}
                          fill={REGIME_COLORS[pt.poreRegime]}
                          fillOpacity={isHovered ? 1 : 0.62}
                          stroke={isHovered ? "#0f172a" : "none"}
                          strokeWidth={1.5}
                          onMouseEnter={() => setHoveredSample(pt)}
                        />
                      );
                    })}

                    <text
                      x={padL + w / 2}
                      y={302}
                      textAnchor="middle"
                      className="fill-slate-600 text-[11px] font-medium"
                    >
                      {AXIS_META[xAxis].label} ({AXIS_META[xAxis].unit})
                    </text>
                    <text
                      x={16}
                      y={padT + h / 2}
                      textAnchor="middle"
                      transform={`rotate(-90 16 ${padT + h / 2})`}
                      className="fill-slate-600 text-[11px] font-medium"
                    >
                      CO₂ Uptake (mmol/g)
                    </text>
                  </>
                );
              })()}
            </svg>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs">
              <div className="font-mono tabular-nums text-slate-700">
                {hoveredSample ? (
                  <>
                    <strong className="text-slate-900">{hoveredSample.mofName}</strong> · Uptake:{" "}
                    <strong className="text-blue-700">{hoveredSample.uptake.toFixed(3)}</strong> · Df:{" "}
                    {hoveredSample.df.toFixed(2)} Å · POAV: {hoveredSample.poav.toFixed(3)} · chi-0:{" "}
                    {hoveredSample.mcCryChi0.toFixed(2)}
                  </>
                ) : (
                  <span className="text-slate-500">
                    Hover points to inspect MOF geometry and uptake values.
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                {(Object.keys(REGIME_COLORS) as PoreRegime[]).map((r) => (
                  <span key={r} className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: REGIME_COLORS[r] }}
                    />
                    {r.split(" (")[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Authentic Pipeline Figures Gallery */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Pipeline Figures Archive
            </h2>
            <p className="text-xs text-slate-500">
              Original publication figures generated by the EDA, Modeling, and TreeSHAP notebooks.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-md overflow-x-auto">
            {(["All", "Explainability", "EDA", "Diagnostics", "Training"] as FigureCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFigCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    figCategory === cat
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFigures.map((fig) => (
            <button
              key={fig.filename}
              type="button"
              onClick={() => setLightboxFigure(fig)}
              className="text-left bg-white border border-slate-200 hover:border-teal-500 rounded-md overflow-hidden transition-colors cursor-pointer flex flex-col"
            >
              <div className="aspect-[4/3] w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center p-2">
                <img
                  src={`/figures/${fig.filename}`}
                  alt={fig.title}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="p-3.5 space-y-1">
                <div className="text-[11px] font-mono text-teal-700 font-medium">{fig.category}</div>
                <div className="text-sm font-semibold text-slate-900 leading-snug">
                  {fig.title}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{fig.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxFigure && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-6"
          onClick={() => setLightboxFigure(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-md max-w-4xl w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-teal-700 font-medium">
                  {lightboxFigure.category}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{lightboxFigure.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxFigure(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                aria-label="Close figure preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center justify-center max-h-[70vh]">
              <img
                src={`/figures/${lightboxFigure.filename}`}
                alt={lightboxFigure.title}
                referrerPolicy="no-referrer"
                className="max-h-[64vh] w-auto object-contain"
              />
            </div>
            <p className="text-sm text-slate-600">{lightboxFigure.caption}</p>
          </div>
        </div>
      )}
    </div>
  );
}
