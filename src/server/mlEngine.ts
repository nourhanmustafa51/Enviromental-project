import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  DiagnosticPoint,
  DiagnosticsResponse,
  ExplainabilityResponse,
  FeatureImportanceItem,
  GaGenerationRow,
  HistogramBin,
  ModelComparisonRow,
  ModelKey,
  MofFeaturesInput,
  MofListResponse,
  MofRecord,
  NearestAnalog,
  OverviewResponse,
  PoreRegime,
  PoreRegimeSummary,
  PredictResponse,
  PredictionAttribution,
  SplitName,
} from "../types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = fs.existsSync(path.join(process.cwd(), "results"))
  ? process.cwd()
  : path.resolve(__dirname, "../..");

const MODEL_KEYS: ModelKey[] = [
  "xgboost",
  "random_forest",
  "ann",
  "ga_ann",
  "svr",
  "baseline_dummy",
  "baseline_linear",
];

// Weights calibrated from SHAP mean |phi| values on top 16 descriptors
const FEATURE_WEIGHTS: Record<keyof MofFeaturesInput | "asaGravimetric" | "cageWindowDiff", number> = {
  mcCryChi0: 2.8,
  mcCryChi2: 2.1,
  poav: 1.9,
  di: 1.75,
  df: 1.65,
  mcCryS1: 1.35,
  ponav: 1.25,
  mcCryS0: 1.15,
  fLigZ1: 1.1,
  density: 1.05,
  mcCryZ0: 0.95,
  mcCryI1: 0.88,
  mcCryChi1: 0.82,
  sumLcS0: 0.72,
  asa: 0.68,
  nasa: 0.65,
  asaGravimetric: 0.85,
  cageWindowDiff: 0.8,
};

const FEATURE_LABELS: Record<keyof MofFeaturesInput, string> = {
  asa: "ASA [m²/cm³]",
  df: "Df (Limiting Aperture, Å)",
  di: "Di (Cavity Diameter, Å)",
  nasa: "NASA [m²/cm³]",
  poav: "POAV [cm³/g]",
  ponav: "PONAV [cm³/g]",
  density: "Density [g/cm³]",
  mcCryChi0: "mc_CRY-chi-0-all",
  mcCryChi1: "mc_CRY-chi-1-all",
  mcCryChi2: "mc_CRY-chi-2-all",
  mcCryS0: "mc_CRY-S-0-all",
  mcCryS1: "mc_CRY-S-1-all",
  mcCryZ0: "mc_CRY-Z-0-all",
  mcCryI1: "mc_CRY-I-1-all",
  fLigZ1: "f-lig-Z-1",
  sumLcS0: "sum-lc-S-0-all",
};

export function classifyPoreRegime(df: number): PoreRegime {
  if (df < 3.3) return "Sub-kinetic (< 3.3 Å)";
  if (df <= 5.0) return "Ultra-microporous (3.3–5.0 Å)";
  if (df <= 7.0) return "Microporous (5.0–7.0 Å)";
  return "Large Pore (> 7.0 Å)";
}

function parseSimpleCsv(filePath: string): { headers: string[]; rows: string[][] } {
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  const lines = raw.split(/\r?\n/);
  const headers = lines[0].split(",");
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    rows.push(line.split(","));
  }
  return { headers, rows };
}

function computeMetrics(yTrue: number[], yPred: number[]) {
  const n = yTrue.length;
  if (n === 0) return { r2: 0, rmse: 0, mae: 0, count: 0 };
  let sumSqErr = 0;
  let sumAbsErr = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    const err = yTrue[i] - yPred[i];
    sumSqErr += err * err;
    sumAbsErr += Math.abs(err);
    sumY += yTrue[i];
  }
  const meanY = sumY / n;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const d = yTrue[i] - meanY;
    ssTot += d * d;
  }
  const rmse = Math.sqrt(sumSqErr / n);
  const mae = sumAbsErr / n;
  const r2 = ssTot > 0 ? 1 - sumSqErr / ssTot : 0;
  return { r2, rmse, mae, count: n };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function meanAndStd(values: number[]): { mean: number; std: number; min: number; max: number } {
  if (values.length === 0) return { mean: 0, std: 1, min: 0, max: 0 };
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const mean = sum / values.length;
  let sq = 0;
  for (const v of values) {
    const d = v - mean;
    sq += d * d;
  }
  const std = Math.sqrt(sq / values.length) || 1;
  return { mean, std, min, max };
}

function buildHistogram(values: number[], bins: number, minVal?: number, maxVal?: number): HistogramBin[] {
  if (values.length === 0) return [];
  const min = minVal ?? Math.min(...values);
  const max = maxVal ?? Math.max(...values);
  const span = max - min || 1;
  const step = span / bins;
  const counts = new Array<number>(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / step)));
    counts[idx]++;
  }
  return counts.map((count, i) => {
    const start = min + i * step;
    const end = start + step;
    return {
      label: `${start.toFixed(1)}–${end.toFixed(1)}`,
      start,
      end,
      count,
    };
  });
}

interface PredEntry {
  rowId: number;
  yTrue: number;
  yPred: number;
}

type VectorKey = keyof MofFeaturesInput | "asaGravimetric" | "cageWindowDiff";

const VECTOR_KEYS: VectorKey[] = [
  "asa",
  "df",
  "di",
  "nasa",
  "poav",
  "ponav",
  "density",
  "mcCryChi0",
  "mcCryChi1",
  "mcCryChi2",
  "mcCryS0",
  "mcCryS1",
  "mcCryZ0",
  "mcCryI1",
  "fLigZ1",
  "sumLcS0",
  "asaGravimetric",
  "cageWindowDiff",
];

class MofMlEngine {
  private trainRecords: MofRecord[] = [];
  private valRecords: MofRecord[] = [];
  private testRecords: MofRecord[] = [];
  private allRecordsById = new Map<number, MofRecord>();
  private predictions = new Map<string, Map<number, PredEntry>>();
  private modelComparisons: ModelComparisonRow[] = [];
  private gaHistory: GaGenerationRow[] = [];
  private gaBestConfig!: OverviewResponse["gaBestConfig"];
  private shapTop: FeatureImportanceItem[] = [];
  private xgbTop: FeatureImportanceItem[] = [];
  private rfTop: FeatureImportanceItem[] = [];
  private trainStats!: Record<VectorKey, { mean: number; std: number; min: number; max: number }>;
  private trainVectors: number[][] = [];
  private trainMeanUptake = 1.781;
  private surrogateMetrics = {
    valR2: 0,
    valRmse: 0,
    valMae: 0,
    testR2: 0,
    testRmse: 0,
    testMae: 0,
  };

  constructor() {
    this.loadAll();
  }

  private loadPredictionsFile(modelKey: ModelKey, split: "val" | "test"): Map<number, PredEntry> {
    const filePath = path.join(ROOT, "predictions", `${modelKey}_${split}_predictions.csv`);
    const map = new Map<number, PredEntry>();
    if (!fs.existsSync(filePath)) return map;
    const { rows } = parseSimpleCsv(filePath);
    for (const cols of rows) {
      const rowId = Number(cols[0]);
      const yTrue = Number(cols[1]);
      const yPred = Number(cols[2]);
      map.set(rowId, { rowId, yTrue, yPred });
    }
    return map;
  }

  private loadSplitCsv(split: SplitName): MofRecord[] {
    const filePath = path.join(ROOT, "data", "processed", `${split}.csv`);
    const { headers, rows } = parseSimpleCsv(filePath);
    const idx = (name: string) => headers.indexOf(name);

    const iRowId = idx("row_id");
    const iMofName = idx("MOFname");
    const iAsa = idx("ASA [m^2/cm^3]");
    const iDf = idx("Df");
    const iDi = idx("Di");
    const iNasa = idx("NASA [m^2/cm^3]");
    const iPoav = idx("POAV [cm^3/g]");
    const iPonav = idx("PONAV [cm^3/g]");
    const iDensity = idx("density [g/cm^3]");
    const iChi0 = idx("mc_CRY-chi-0-all");
    const iChi1 = idx("mc_CRY-chi-1-all");
    const iChi2 = idx("mc_CRY-chi-2-all");
    const iS0 = idx("mc_CRY-S-0-all");
    const iS1 = idx("mc_CRY-S-1-all");
    const iZ0 = idx("mc_CRY-Z-0-all");
    const iI1 = idx("mc_CRY-I-1-all");
    const iFLigZ1 = idx("f-lig-Z-1");
    const iSumLcS0 = idx("sum-lc-S-0-all");
    const iTarget = idx("CO2 uptake at 0.15 bar and 298K");

    const xgbMap = split === "train" ? undefined : this.predictions.get(`xgboost_${split}`);
    const rfMap = split === "train" ? undefined : this.predictions.get(`random_forest_${split}`);
    const annMap = split === "train" ? undefined : this.predictions.get(`ann_${split}`);
    const gaMap = split === "train" ? undefined : this.predictions.get(`ga_ann_${split}`);
    const svrMap = split === "train" ? undefined : this.predictions.get(`svr_${split}`);

    const records: MofRecord[] = [];
    for (const cols of rows) {
      const rowId = Number(cols[iRowId]);
      const asa = Number(cols[iAsa]);
      const df = Number(cols[iDf]);
      const di = Number(cols[iDi]);
      const density = Number(cols[iDensity]);
      const rec: MofRecord = {
        rowId,
        mofName: cols[iMofName],
        split,
        asa,
        df,
        di,
        nasa: Number(cols[iNasa]),
        poav: Number(cols[iPoav]),
        ponav: Number(cols[iPonav]),
        density,
        mcCryChi0: Number(cols[iChi0]),
        mcCryChi1: Number(cols[iChi1]),
        mcCryChi2: Number(cols[iChi2]),
        mcCryS0: Number(cols[iS0]),
        mcCryS1: Number(cols[iS1]),
        mcCryZ0: Number(cols[iZ0]),
        mcCryI1: Number(cols[iI1]),
        fLigZ1: Number(cols[iFLigZ1]),
        sumLcS0: Number(cols[iSumLcS0]),
        uptake: Number(cols[iTarget]),
        asaGravimetric: density > 0 ? asa / density : 0,
        cageWindowDiff: di - df,
        poreRegime: classifyPoreRegime(df),
        xgbPred: xgbMap?.get(rowId)?.yPred,
        rfPred: rfMap?.get(rowId)?.yPred,
        annPred: annMap?.get(rowId)?.yPred,
        gaAnnPred: gaMap?.get(rowId)?.yPred,
        svrPred: svrMap?.get(rowId)?.yPred,
      };
      records.push(rec);
      this.allRecordsById.set(rowId, rec);
    }
    return records;
  }

  private loadAll() {
    for (const modelKey of MODEL_KEYS) {
      this.predictions.set(`${modelKey}_val`, this.loadPredictionsFile(modelKey, "val"));
      this.predictions.set(`${modelKey}_test`, this.loadPredictionsFile(modelKey, "test"));
    }

    this.trainRecords = this.loadSplitCsv("train");
    this.valRecords = this.loadSplitCsv("val");
    this.testRecords = this.loadSplitCsv("test");

    // Load model comparison & metadata
    const compCsv = parseSimpleCsv(path.join(ROOT, "results", "model_comparison.csv"));
    const metaByDisplayName = new Map<
      string,
      {
        modelKey: ModelKey;
        searchTimeSec: number;
        cvSummary: ModelComparisonRow["cvSummary"];
        bestParams: Record<string, unknown>;
      }
    >();

    for (const mk of MODEL_KEYS) {
      const metaPath = path.join(ROOT, "results", `${mk}_meta.json`);
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        const cv = meta.cv_summary || {};
        metaByDisplayName.set(meta.display_name, {
          modelKey: mk,
          searchTimeSec: Number(meta.search_time_sec || 0),
          cvSummary: {
            r2Mean: cv.r2_mean,
            r2Std: cv.r2_std,
            rmseMean: cv.rmse_mean,
            rmseStd: cv.rmse_std,
            maeMean: cv.mae_mean,
            maeStd: cv.mae_std,
          },
          bestParams: meta.extra?.best_params || meta.extra?.best_config || meta.extra?.best_chromosome || {},
        });
      }
    }

    this.modelComparisons = compCsv.rows.map((cols) => {
      const model = cols[0];
      const meta = metaByDisplayName.get(model);
      return {
        model,
        modelKey: meta?.modelKey ?? "xgboost",
        valR2: Number(cols[1]),
        valRmse: Number(cols[2]),
        valMae: Number(cols[3]),
        testR2: Number(cols[4]),
        testRmse: Number(cols[5]),
        testMae: Number(cols[6]),
        trainingTimeSec: Number(cols[7]),
        searchTimeSec: meta?.searchTimeSec ?? 0,
        cvSummary: meta?.cvSummary ?? {},
        bestParams: meta?.bestParams ?? {},
      };
    });

    // Load GA history & best config
    const gaCsv = parseSimpleCsv(path.join(ROOT, "results", "ga_history.csv"));
    this.gaHistory = gaCsv.rows.map((cols) => ({
      generation: Number(cols[0]),
      bestFitnessValRmse: Number(cols[1]),
      meanFitnessValRmse: Number(cols[2]),
      bestSoFarValRmse: Number(cols[3]),
    }));
    this.gaBestConfig = JSON.parse(
      fs.readFileSync(path.join(ROOT, "results", "ga_best_ann_config.json"), "utf-8")
    );

    // Load feature importances
    const parseImportance = (filename: string, limit = 25): FeatureImportanceItem[] => {
      const { rows } = parseSimpleCsv(path.join(ROOT, "results", filename));
      return rows.slice(0, limit).map((c) => ({
        feature: c[0],
        importance: Number(c[1]),
      }));
    };
    this.shapTop = parseImportance("shap_feature_importance.csv", 25);
    this.xgbTop = parseImportance("xgb_feature_importance.csv", 25);
    this.rfTop = parseImportance("rf_feature_importance.csv", 25);

    // Fit StandardScaler strictly on train.csv
    const statsObj = {} as Record<VectorKey, { mean: number; std: number; min: number; max: number }>;
    for (const key of VECTOR_KEYS) {
      const vals = this.trainRecords.map((r) => r[key]);
      statsObj[key] = meanAndStd(vals);
    }
    this.trainStats = statsObj;
    this.trainMeanUptake = meanAndStd(this.trainRecords.map((r) => r.uptake)).mean;

    // Precompute weighted standardized vectors for train.csv
    this.trainVectors = this.trainRecords.map((r) =>
      VECTOR_KEYS.map((k) => {
        const { mean, std } = this.trainStats[k];
        return ((r[k] - mean) / std) * FEATURE_WEIGHTS[k];
      })
    );

    // Evaluate TypeScript RBF-Kernel k-NN surrogate on val & test splits
    const valPreds = this.valRecords.map((r) => this.predictRaw(r).predictedUptake);
    const valM = computeMetrics(
      this.valRecords.map((r) => r.uptake),
      valPreds
    );
    const testPreds = this.testRecords.map((r) => this.predictRaw(r).predictedUptake);
    const testM = computeMetrics(
      this.testRecords.map((r) => r.uptake),
      testPreds
    );
    this.surrogateMetrics = {
      valR2: Number(valM.r2.toFixed(4)),
      valRmse: Number(valM.rmse.toFixed(4)),
      valMae: Number(valM.mae.toFixed(4)),
      testR2: Number(testM.r2.toFixed(4)),
      testRmse: Number(testM.rmse.toFixed(4)),
      testMae: Number(testM.mae.toFixed(4)),
    };
  }

  private predictRaw(input: MofFeaturesInput): {
    predictedUptake: number;
    lowerBound: number;
    upperBound: number;
    neighbors: Array<{ rec: MofRecord; distSq: number; weight: number }>;
  } {
    const asaGravimetric = input.density > 0 ? input.asa / input.density : 0;
    const cageWindowDiff = input.di - input.df;
    const extended: Record<VectorKey, number> = {
      ...input,
      asaGravimetric,
      cageWindowDiff,
    };

    const qVec = VECTOR_KEYS.map((k) => {
      const { mean, std } = this.trainStats[k];
      return ((extended[k] - mean) / std) * FEATURE_WEIGHTS[k];
    });

    const K = 18;
    const topK: Array<{ idx: number; distSq: number }> = [];

    for (let i = 0; i < this.trainVectors.length; i++) {
      const tVec = this.trainVectors[i];
      let d2 = 0;
      for (let j = 0; j < qVec.length; j++) {
        const diff = qVec[j] - tVec[j];
        d2 += diff * diff;
      }
      if (topK.length < K) {
        topK.push({ idx: i, distSq: d2 });
        if (topK.length === K) {
          topK.sort((a, b) => a.distSq - b.distSq);
        }
      } else if (d2 < topK[K - 1].distSq) {
        topK[K - 1] = { idx: i, distSq: d2 };
        topK.sort((a, b) => a.distSq - b.distSq);
      }
    }
    topK.sort((a, b) => a.distSq - b.distSq);

    // Distance-weighted Gaussian kernel over top-K standardized analogs
    const bandwidth = Math.max(1.8, Math.sqrt(topK[Math.min(5, topK.length - 1)].distSq) * 1.15);
    const inv2Sigma2 = 1 / (2 * bandwidth * bandwidth);

    let sumW = 0;
    let sumWY = 0;
    const neighbors = topK.map((item) => {
      const w = item.distSq < 1e-9 ? 100.0 : Math.exp(-item.distSq * inv2Sigma2) / (1 + Math.sqrt(item.distSq) * 0.25);
      const rec = this.trainRecords[item.idx];
      sumW += w;
      sumWY += w * rec.uptake;
      return { rec, distSq: item.distSq, weight: w };
    });

    const predictedUptake = sumW > 0 ? sumWY / sumW : this.trainMeanUptake;
    const neighborUptakes = neighbors.map((n) => n.rec.uptake).sort((a, b) => a - b);
    const lowerBound = neighborUptakes[Math.max(0, Math.floor(neighborUptakes.length * 0.15))];
    const upperBound = neighborUptakes[Math.min(neighborUptakes.length - 1, Math.floor(neighborUptakes.length * 0.85))];

    return { predictedUptake, lowerBound, upperBound, neighbors };
  }

  predict(input: MofFeaturesInput, matchedRowId?: number): PredictResponse {
    const { predictedUptake, lowerBound, upperBound, neighbors } = this.predictRaw(input);
    const asaGravimetric = input.density > 0 ? input.asa / input.density : 0;
    const cageWindowDiff = input.di - input.df;
    const poreRegime = classifyPoreRegime(input.df);

    // Compute local sensitivity attributions by resetting each input feature to train mean
    const baseInput: MofFeaturesInput = {
      asa: this.trainStats.asa.mean,
      df: this.trainStats.df.mean,
      di: this.trainStats.di.mean,
      nasa: this.trainStats.nasa.mean,
      poav: this.trainStats.poav.mean,
      ponav: this.trainStats.ponav.mean,
      density: this.trainStats.density.mean,
      mcCryChi0: this.trainStats.mcCryChi0.mean,
      mcCryChi1: this.trainStats.mcCryChi1.mean,
      mcCryChi2: this.trainStats.mcCryChi2.mean,
      mcCryS0: this.trainStats.mcCryS0.mean,
      mcCryS1: this.trainStats.mcCryS1.mean,
      mcCryZ0: this.trainStats.mcCryZ0.mean,
      mcCryI1: this.trainStats.mcCryI1.mean,
      fLigZ1: this.trainStats.fLigZ1.mean,
      sumLcS0: this.trainStats.sumLcS0.mean,
    };

    const attributions: PredictionAttribution[] = (Object.keys(FEATURE_LABELS) as Array<keyof MofFeaturesInput>)
      .map((key) => {
        const perturbed = { ...input, [key]: baseInput[key] };
        const withoutFeature = this.predictRaw(perturbed).predictedUptake;
        return {
          feature: key,
          label: FEATURE_LABELS[key],
          value: input[key],
          trainMean: this.trainStats[key].mean,
          deltaContribution: Number((predictedUptake - withoutFeature).toFixed(4)),
        };
      })
      .sort((a, b) => Math.abs(b.deltaContribution) - Math.abs(a.deltaContribution))
      .slice(0, 10);

    const nearestAnalogs: NearestAnalog[] = neighbors.slice(0, 5).map(({ rec, distSq }) => ({
      rowId: rec.rowId,
      mofName: rec.mofName,
      similarity: Number((100 / (1 + Math.sqrt(distSq) * 0.18)).toFixed(1)),
      uptake: Number(rec.uptake.toFixed(4)),
      df: rec.df,
      di: rec.di,
      poav: rec.poav,
      density: rec.density,
      mcCryChi0: rec.mcCryChi0,
      poreRegime: rec.poreRegime,
    }));

    const matchedMof = matchedRowId !== undefined ? this.allRecordsById.get(matchedRowId) : undefined;

    return {
      predictedUptake: Number(predictedUptake.toFixed(4)),
      lowerBound: Number(lowerBound.toFixed(4)),
      upperBound: Number(upperBound.toFixed(4)),
      trainMeanUptake: Number(this.trainMeanUptake.toFixed(4)),
      deltaVsMean: Number((predictedUptake - this.trainMeanUptake).toFixed(4)),
      asaGravimetric: Number(asaGravimetric.toFixed(2)),
      cageWindowDiff: Number(cageWindowDiff.toFixed(3)),
      poreRegime,
      attributions,
      nearestAnalogs,
      matchedMof,
    };
  }

  getOverview(): OverviewResponse {
    const uptakes = this.trainRecords.map((r) => r.uptake);
    const tStats = meanAndStd(uptakes);

    const regimesOrder: PoreRegime[] = [
      "Ultra-microporous (3.3–5.0 Å)",
      "Microporous (5.0–7.0 Å)",
      "Large Pore (> 7.0 Å)",
      "Sub-kinetic (< 3.3 Å)",
    ];
    const poreRegimes: PoreRegimeSummary[] = regimesOrder.map((regime) => {
      const vals = this.trainRecords.filter((r) => r.poreRegime === regime).map((r) => r.uptake);
      const s = meanAndStd(vals);
      return {
        regime,
        count: vals.length,
        meanUptake: Number(s.mean.toFixed(3)),
        medianUptake: Number(median(vals).toFixed(3)),
        stdUptake: Number(s.std.toFixed(3)),
      };
    });

    const featureDefaults: MofFeaturesInput = {
      asa: Number(this.trainStats.asa.mean.toFixed(2)),
      df: 4.15,
      di: 6.45,
      nasa: Number(this.trainStats.nasa.mean.toFixed(2)),
      poav: 0.42,
      ponav: Number(this.trainStats.ponav.mean.toFixed(4)),
      density: Number(this.trainStats.density.mean.toFixed(3)),
      mcCryChi0: 1.55,
      mcCryChi1: Number(this.trainStats.mcCryChi1.mean.toFixed(2)),
      mcCryChi2: 14.5,
      mcCryS0: Number(this.trainStats.mcCryS0.mean.toFixed(3)),
      mcCryS1: Number(this.trainStats.mcCryS1.mean.toFixed(3)),
      mcCryZ0: Number(this.trainStats.mcCryZ0.mean.toFixed(1)),
      mcCryI1: Number(this.trainStats.mcCryI1.mean.toFixed(2)),
      fLigZ1: Number(this.trainStats.fLigZ1.mean.toFixed(1)),
      sumLcS0: Number(this.trainStats.sumLcS0.mean.toFixed(2)),
    };

    const featureRanges = {} as OverviewResponse["dataset"]["featureRanges"];
    for (const key of Object.keys(FEATURE_LABELS) as Array<keyof MofFeaturesInput>) {
      featureRanges[key] = {
        min: Number(this.trainStats[key].min.toFixed(4)),
        max: Number(this.trainStats[key].max.toFixed(4)),
        mean: Number(this.trainStats[key].mean.toFixed(4)),
        std: Number(this.trainStats[key].std.toFixed(4)),
      };
    }

    return {
      dataset: {
        totalCleanRows: this.trainRecords.length + this.valRecords.length + this.testRecords.length,
        trainRows: this.trainRecords.length,
        valRows: this.valRecords.length,
        testRows: this.testRecords.length,
        selectedFeatureCount: 193,
        targetMean: Number(tStats.mean.toFixed(3)),
        targetMedian: Number(median(uptakes).toFixed(3)),
        targetStd: Number(tStats.std.toFixed(3)),
        targetMin: Number(tStats.min.toFixed(4)),
        targetMax: Number(tStats.max.toFixed(4)),
        targetHistogram: buildHistogram(uptakes, 18, 0, 9.5),
        poreRegimes,
        surrogateMetrics: this.surrogateMetrics,
        featureDefaults,
        featureRanges,
      },
      models: this.modelComparisons,
      gaHistory: this.gaHistory,
      gaBestConfig: this.gaBestConfig,
      annTuningRuns: [
        {
          config: "mlp_128_64_32_lowdrop",
          hiddenDims: "[128, 64, 32]",
          lr: 0.0005,
          dropout: 0.1,
          batchSize: 32,
          weightDecay: 0.0005,
          epochsRun: 90,
          bestEpoch: 70,
          valR2: 0.6098,
          valRmse: 1.0486,
          valMae: 0.6975,
          timeS: 16.82,
        },
        {
          config: "mlp_128_64_32",
          hiddenDims: "[128, 64, 32]",
          lr: 0.001,
          dropout: 0.2,
          batchSize: 64,
          weightDecay: 0.0001,
          epochsRun: 90,
          bestEpoch: 70,
          valR2: 0.5815,
          valRmse: 1.0859,
          valMae: 0.7244,
          timeS: 10.25,
        },
        {
          config: "mlp_256_128_64_lr5e4",
          hiddenDims: "[256, 128, 64]",
          lr: 0.0005,
          dropout: 0.2,
          batchSize: 32,
          weightDecay: 0.0001,
          epochsRun: 69,
          bestEpoch: 49,
          valR2: 0.5777,
          valRmse: 1.0908,
          valMae: 0.7209,
          timeS: 15.4,
        },
        {
          config: "baseline_64_32",
          hiddenDims: "[64, 32]",
          lr: 0.001,
          dropout: 0.1,
          batchSize: 64,
          weightDecay: 0.0001,
          epochsRun: 99,
          bestEpoch: 79,
          valR2: 0.5772,
          valRmse: 1.0915,
          valMae: 0.7631,
          timeS: 8.88,
        },
        {
          config: "mlp_128_64",
          hiddenDims: "[128, 64]",
          lr: 0.001,
          dropout: 0.15,
          batchSize: 64,
          weightDecay: 0.0001,
          epochsRun: 56,
          bestEpoch: 36,
          valR2: 0.5496,
          valRmse: 1.1265,
          valMae: 0.7723,
          timeS: 5.69,
        },
        {
          config: "mlp_64_32_16_lr5e4",
          hiddenDims: "[64, 32, 16]",
          lr: 0.0005,
          dropout: 0.1,
          batchSize: 32,
          weightDecay: 0.0001,
          epochsRun: 65,
          bestEpoch: 45,
          valR2: 0.5331,
          valRmse: 1.147,
          valMae: 0.8122,
          timeS: 11.23,
        },
      ],
    };
  }

  getDiagnostics(modelKey: ModelKey, split: "val" | "test"): DiagnosticsResponse {
    const records = split === "val" ? this.valRecords : this.testRecords;
    const predMap = this.predictions.get(`${modelKey}_${split}`) ?? new Map<number, PredEntry>();
    const modelInfo = this.modelComparisons.find((m) => m.modelKey === modelKey);

    const points: DiagnosticPoint[] = [];
    const yTrueArr: number[] = [];
    const yPredArr: number[] = [];
    const residuals: number[] = [];

    for (const rec of records) {
      const pred = predMap.get(rec.rowId);
      if (!pred) continue;
      const residual = pred.yTrue - pred.yPred;
      yTrueArr.push(pred.yTrue);
      yPredArr.push(pred.yPred);
      residuals.push(residual);
      points.push({
        rowId: rec.rowId,
        mofName: rec.mofName,
        yTrue: Number(pred.yTrue.toFixed(4)),
        yPred: Number(pred.yPred.toFixed(4)),
        residual: Number(residual.toFixed(4)),
        df: rec.df,
        di: rec.di,
        poav: rec.poav,
        density: rec.density,
        mcCryChi0: rec.mcCryChi0,
        poreRegime: rec.poreRegime,
      });
    }

    const metrics = computeMetrics(yTrueArr, yPredArr);

    return {
      modelKey,
      displayName: modelInfo?.model ?? modelKey,
      split,
      metrics: {
        r2: Number(metrics.r2.toFixed(4)),
        rmse: Number(metrics.rmse.toFixed(4)),
        mae: Number(metrics.mae.toFixed(4)),
        count: metrics.count,
      },
      points,
      residualHistogram: buildHistogram(residuals, 18, -4.5, 4.5),
    };
  }

  getExplainability(): ExplainabilityResponse {
    // Deterministic stride sample of 600 training MOFs for smooth interactive scatter plots
    const scatterSamples: ExplainabilityResponse["scatterSamples"] = [];
    const step = Math.max(1, Math.floor(this.trainRecords.length / 600));
    for (let i = 0; i < this.trainRecords.length; i += step) {
      const r = this.trainRecords[i];
      scatterSamples.push({
        rowId: r.rowId,
        mofName: r.mofName,
        uptake: Number(r.uptake.toFixed(4)),
        df: Number(r.df.toFixed(3)),
        di: Number(r.di.toFixed(3)),
        poav: Number(r.poav.toFixed(4)),
        asaGravimetric: Number(r.asaGravimetric.toFixed(1)),
        density: Number(r.density.toFixed(3)),
        mcCryChi0: Number(r.mcCryChi0.toFixed(3)),
        mcCryChi2: Number(r.mcCryChi2.toFixed(3)),
        poreRegime: r.poreRegime,
      });
    }

    const figures: ExplainabilityResponse["figures"] = [
      { filename: "shap_bar_importance.png", category: "Explainability", title: "SHAP Mean |φ| Importance", caption: "Top drivers ranked by mean absolute SHAP value on the held-out test set (XGBoost)." },
      { filename: "shap_summary_beeswarm.png", category: "Explainability", title: "SHAP Summary Beeswarm", caption: "Directionality and feature-value distribution of top SHAP drivers across 750 test MOFs." },
      { filename: "shap_dependence_top3.png", category: "Explainability", title: "SHAP Dependence (Top 3)", caption: "Non-linear volcano optimum in POAV and negative electronegativity slope in mc_CRY-chi-0-all." },
      { filename: "model_comparison_metrics.png", category: "Diagnostics", title: "Model Comparison Metrics", caption: "Validation vs. Test R² and RMSE across all 7 benchmarked models." },
      { filename: "parity_xgboost_test.png", category: "Diagnostics", title: "XGBoost Parity Plot (Test)", caption: "Predicted vs. actual CO₂ uptake for the winning tuned XGBoost model (Test R² = 0.6510)." },
      { filename: "residuals_xgboost_test.png", category: "Diagnostics", title: "XGBoost Residuals (Test)", caption: "Residual scatter and centered error distribution for XGBoost on test.csv." },
      { filename: "xgb_feature_importance.png", category: "Explainability", title: "XGBoost Native Importance", caption: "Top gain-based features learned by the Optuna-tuned XGBoost regressor." },
      { filename: "rf_feature_importance.png", category: "Explainability", title: "Random Forest Importance", caption: "Top Gini importance features across 500 trees in Random Forest." },
      { filename: "ann_loss_curve.png", category: "Training", title: "PyTorch ANN Loss Curve", caption: "Training vs. validation MSE loss with early stopping (best epoch 70/90)." },
      { filename: "ga_convergence.png", category: "Training", title: "GA-ANN Evolution Convergence", caption: "Genetic Algorithm validation RMSE progression over 6 generations (pop=8)." },
      { filename: "eda_01_target_distribution.png", category: "EDA", title: "Target CO₂ Uptake Distribution", caption: "Right-skewed target distribution on train.csv (mean 1.781, median 1.377, max 9.318)." },
      { filename: "eda_04_uptake_vs_pore_size.png", category: "EDA", title: "Uptake vs. Pore Aperture (Df, Di)", caption: "Peak low-pressure uptake concentrates in narrow 3.3–5.0 Å channels." },
      { filename: "eda_05_uptake_vs_surface_area.png", category: "EDA", title: "Uptake vs. Surface Area", caption: "High volumetric surface area (>2000 m²/cm³) lowers uptake at 0.15 bar due to wide pores." },
      { filename: "eda_06_uptake_vs_pore_volume_and_density.png", category: "EDA", title: "Uptake vs. POAV & Density", caption: "Intermediate crystal densities and microporous POAV maximize low-pressure affinity." },
      { filename: "eda_07_uptake_by_pore_regime.png", category: "EDA", title: "Uptake by Pore Regime", caption: "Ultra-microporous MOFs (3.3–5.0 Å) average 2.129 vs. 1.103 for large-pore MOFs (>7.0 Å)." },
      { filename: "eda_03_correlation_heatmap.png", category: "EDA", title: "Correlation Heatmap", caption: "Pairwise linear correlation across key structural and chemical descriptors." },
    ];

    return {
      shapTop: this.shapTop,
      xgbTop: this.xgbTop,
      rfTop: this.rfTop,
      scatterSamples,
      figures,
    };
  }

  listMofs(params: {
    split?: SplitName | "all";
    search?: string;
    regime?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): MofListResponse {
    const {
      split = "test",
      search = "",
      regime = "all",
      sort = "uptake_desc",
      page = 1,
      limit = 25,
    } = params;

    let pool: MofRecord[];
    if (split === "train") pool = this.trainRecords;
    else if (split === "val") pool = this.valRecords;
    else if (split === "test") pool = this.testRecords;
    else pool = [...this.testRecords, ...this.valRecords, ...this.trainRecords];

    const q = search.trim().toLowerCase();
    const filtered = pool.filter((r) => {
      if (regime !== "all" && r.poreRegime !== regime) return false;
      if (q) {
        const matchName = r.mofName.toLowerCase().includes(q);
        const matchId = String(r.rowId).includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "uptake_asc":
          return a.uptake - b.uptake;
        case "df_asc":
          return a.df - b.df;
        case "df_desc":
          return b.df - a.df;
        case "poav_desc":
          return b.poav - a.poav;
        case "chi0_asc":
          return a.mcCryChi0 - b.mcCryChi0;
        case "error_desc": {
          const errA = a.xgbPred !== undefined ? Math.abs(a.uptake - a.xgbPred) : -1;
          const errB = b.xgbPred !== undefined ? Math.abs(b.uptake - b.xgbPred) : -1;
          return errB - errA;
        }
        case "uptake_desc":
        default:
          return b.uptake - a.uptake;
      }
    });

    const safeLimit = Math.min(100, Math.max(1, limit));
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(totalPages, Math.max(1, page));
    const startIdx = (safePage - 1) * safeLimit;

    return {
      items: sorted.slice(startIdx, startIdx + safeLimit),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  }

  getMofById(rowId: number): MofRecord | undefined {
    return this.allRecordsById.get(rowId);
  }
}

export const mlEngine = new MofMlEngine();
