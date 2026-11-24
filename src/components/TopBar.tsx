import { downloadComparisonCsv } from "../lib/apiClient.ts";

export type NavTab = "benchmarks" | "predictor" | "explainability" | "explorer";

interface TopBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string }> = [
  { id: "benchmarks", label: "Benchmarks" },
  { id: "predictor", label: "Predictor" },
  { id: "explainability", label: "Explainability" },
  { id: "explorer", label: "Explorer" },
];

export function TopBar({ activeTab, onSelectTab }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onSelectTab("benchmarks")}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-400 rounded"
        >
          MOF CO₂ Studio
        </button>

        <nav aria-label="Primary navigation" className="flex items-center gap-6 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-400 ${
                  isActive
                    ? "border-teal-400 text-white"
                    : "border-transparent text-slate-300 hover:text-white hover:border-slate-600"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              void downloadComparisonCsv();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
          >
            Download CSV
          </button>
        </div>
      </div>
    </header>
  );
}
