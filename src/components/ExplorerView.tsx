import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { MofListResponse, MofRecord, PoreRegime, SplitName } from "../types.ts";

interface ExplorerViewProps {
  onSendToPredictor: (mof: MofRecord) => void;
}

const REGIMES: Array<"all" | PoreRegime> = [
  "all",
  "Ultra-microporous (3.3–5.0 Å)",
  "Microporous (5.0–7.0 Å)",
  "Large Pore (> 7.0 Å)",
  "Sub-kinetic (< 3.3 Å)",
];

export function ExplorerView({ onSendToPredictor }: ExplorerViewProps) {
  const [split, setSplit] = useState<SplitName | "all">("test");
  const [regime, setRegime] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("uptake_desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MofListResponse | null>(null);
  const [loadedQuery, setLoadedQuery] = useState("");
  const [selectedMof, setSelectedMof] = useState<MofRecord | null>(null);

  const currentQuery = new URLSearchParams({
    split,
    regime,
    search,
    sort,
    page: String(page),
    limit: "20",
  }).toString();

  const loading = loadedQuery !== currentQuery;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/mofs?${currentQuery}`)
      .then((res) => res.json())
      .then((d: MofListResponse) => {
        if (!cancelled) {
          setData(d);
          setLoadedQuery(currentQuery);
          if (d.items.length > 0) {
            setSelectedMof((prev) => prev ?? d.items[0]);
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentQuery]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-gradient-to-r from-teal-50 via-white to-blue-50 border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-teal-800 font-medium">
            4,999 Deduplicated MOFs · Fixed 70 / 15 / 15 Split (seed=42)
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
            MOF Dataset &amp; Predictions Explorer
          </h1>
        </div>
        <div className="text-xs font-mono tabular-nums text-blue-800 font-medium">
          {data ? `${data.total.toLocaleString()} matching structures` : "Loading..."}
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-white border border-slate-200 rounded-md p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            {(
              [
                { id: "test", label: "Test (750)" },
                { id: "val", label: "Val (750)" },
                { id: "train", label: "Train (3,499)" },
                { id: "all", label: "All (4,999)" },
              ] as Array<{ id: SplitName | "all"; label: string }>
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSplit(s.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  split === s.id
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search MOFname or row_id..."
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-900 placeholder:text-slate-400 w-60 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 text-slate-600">
            <span>Regime:</span>
            <select
              value={regime}
              onChange={(e) => {
                setRegime(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-900"
            >
              {REGIMES.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All Pore Regimes" : r}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-slate-600">
            <span>Sort:</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-900"
            >
              <option value="uptake_desc">Highest CO₂ Uptake</option>
              <option value="uptake_asc">Lowest CO₂ Uptake</option>
              <option value="df_asc">Narrowest Df (Å)</option>
              <option value="poav_desc">Highest POAV</option>
              <option value="chi0_asc">Lowest chi-0</option>
              <option value="error_desc">Largest XGBoost |Error|</option>
            </select>
          </label>
        </div>
      </section>

      {/* Main Split Table + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">MOFname</th>
                  <th className="py-3 px-3 text-right">Df (Å)</th>
                  <th className="py-3 px-3 text-right">POAV</th>
                  <th className="py-3 px-3 text-right">chi-0</th>
                  <th className="py-3 px-3 text-right">Actual</th>
                  <th className="py-3 px-4 text-right">XGBoost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                {loading && !data && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading MOF records...
                    </td>
                  </tr>
                )}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No structures match the active filters.
                    </td>
                  </tr>
                )}
                {data?.items.map((row) => {
                  const isSelected = selectedMof?.rowId === row.rowId;
                  return (
                    <tr
                      key={row.rowId}
                      onClick={() => setSelectedMof(row)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-teal-50/80" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-2.5 px-4 text-slate-500">{row.rowId}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 truncate max-w-[180px]">
                        {row.mofName}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{row.df.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {row.poav.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {row.mcCryChi0.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-teal-800">
                        {row.uptake.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-blue-700">
                        {row.xgbPred !== undefined ? row.xgbPred.toFixed(3) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="font-mono tabular-nums text-slate-600">
                Page {data.page} of {data.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white rounded disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white rounded disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Inspector */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-md overflow-hidden">
          {selectedMof ? (
            <>
              <div className="p-6 bg-gradient-to-br from-slate-900 to-blue-950 text-white">
                <div className="text-xs font-mono text-teal-300">
                  row_id #{selectedMof.rowId} · {selectedMof.split} split
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5 break-all">
                  {selectedMof.mofName}
                </h2>
                <div className="text-xs text-slate-300 mt-1">{selectedMof.poreRegime}</div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs font-medium text-slate-400">
                    Measured CO₂ Uptake (0.15 bar, 298 K)
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-3xl font-bold font-mono tabular-nums text-white">
                      {selectedMof.uptake.toFixed(4)}
                    </span>
                    <span className="text-xs font-mono text-teal-300 ml-1.5">mmol/g</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {selectedMof.xgbPred !== undefined && (
                  <div className="space-y-1.5 text-xs font-mono tabular-nums">
                    <div className="font-sans font-semibold text-slate-700 mb-2">
                      Model Predictions
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">XGBoost</span>
                      <span className="font-semibold text-emerald-700">
                        {selectedMof.xgbPred.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Random Forest</span>
                      <span className="text-teal-700 font-medium">{selectedMof.rfPred?.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">ANN (PyTorch)</span>
                      <span className="text-indigo-700 font-medium">{selectedMof.annPred?.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">GA-ANN Hybrid</span>
                      <span className="text-blue-700 font-medium">{selectedMof.gaAnnPred?.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">SVR (RBF)</span>
                      <span className="text-amber-700 font-medium">{selectedMof.svrPred?.toFixed(4)}</span>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs font-mono tabular-nums">
                  <div className="font-sans font-semibold text-slate-700 mb-2">
                    Key Descriptors
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Df / Di</span>
                    <span className="text-slate-900">
                      {selectedMof.df.toFixed(2)} / {selectedMof.di.toFixed(2)} Å
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">cage_window_diff</span>
                    <span className="text-slate-900">{selectedMof.cageWindowDiff.toFixed(2)} Å</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">POAV / PONAV</span>
                    <span className="text-slate-900">
                      {selectedMof.poav.toFixed(3)} / {selectedMof.ponav.toFixed(3)} cm³/g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ASA_gravimetric</span>
                    <span className="text-slate-900">
                      {selectedMof.asaGravimetric.toFixed(1)} m²/g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Density</span>
                    <span className="text-slate-900">{selectedMof.density.toFixed(3)} g/cm³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">mc_CRY-chi-0-all</span>
                    <span className="text-slate-900">{selectedMof.mcCryChi0.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">mc_CRY-chi-2-all</span>
                    <span className="text-slate-900">{selectedMof.mcCryChi2.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">f-lig-Z-1</span>
                    <span className="text-slate-900">{selectedMof.fLigZ1.toFixed(1)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSendToPredictor(selectedMof)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded-md transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Load into Predictor
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 p-10 text-center">
              Select a MOF row to inspect its descriptors and predictions.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
