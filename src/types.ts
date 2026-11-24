export type SplitName = "train" | "val" | "test";

export type ModelKey =
  | "xgboost"
  | "random_forest"
  | "ann"
  | "ga_ann"
  | "svr"
  | "baseline_dummy"
  | "baseline_linear";

export type PoreRegime =
  | "Sub-kinetic (< 3.3 Å)"
  | "Ultra-microporous (3.3–5.0 Å)"
  | "Microporous (5.0–7.0 Å)"
  | "Large Pore (> 7.0 Å)";

export interface MofFeaturesInput {
  asa: number;
  df: number;
  di: number;
  nasa: number;
  poav: number;
  ponav: number;
  density: number;
  mcCryChi0: number;
  mcCryChi1: number;
  mcCryChi2: number;
  mcCryS0: number;
  mcCryS1: number;
  mcCryZ0: number;
  mcCryI1: number;
  fLigZ1: number;
  sumLcS0: number;
}

export interface MofRecord extends MofFeaturesInput {
  rowId: number;
  mofName: string;
  split: SplitName;
  uptake: number;
  asaGravimetric: number;
  cageWindowDiff: number;
  poreRegime: PoreRegime;
  xgbPred?: number;
  rfPred?: number;
  annPred?: number;
  gaAnnPred?: number;
  svrPred?: number;
}

export interface ModelComparisonRow {
  model: string;
  modelKey: ModelKey;
  valR2: number;
  valRmse: number;
  valMae: number;
  testR2: number;
  testRmse: number;
  testMae: number;
  trainingTimeSec: number;
  searchTimeSec: number;
  cvSummary: {
    r2Mean?: number;
    r2Std?: number;
    rmseMean?: number;
    rmseStd?: number;
    maeMean?: number;
    maeStd?: number;
  };
  bestParams: Record<string, unknown>;
}

export interface GaGenerationRow {
  generation: number;
  bestFitnessValRmse: number;
  meanFitnessValRmse: number;
  bestSoFarValRmse: number;
}

export interface PoreRegimeSummary {
  regime: PoreRegime;
  count: number;
  meanUptake: number;
  medianUptake: number;
  stdUptake: number;
}

export interface HistogramBin {
  label: string;
  start: number;
  end: number;
  count: number;
}

export interface OverviewResponse {
  dataset: {
    totalCleanRows: number;
    trainRows: number;
    valRows: number;
    testRows: number;
    selectedFeatureCount: number;
    targetMean: number;
    targetMedian: number;
    targetStd: number;
    targetMin: number;
    targetMax: number;
    targetHistogram: HistogramBin[];
    poreRegimes: PoreRegimeSummary[];
    surrogateMetrics: {
      valR2: number;
      valRmse: number;
      valMae: number;
      testR2: number;
      testRmse: number;
      testMae: number;
    };
    featureDefaults: MofFeaturesInput;
    featureRanges: Record<keyof MofFeaturesInput, { min: number; max: number; mean: number; std: number }>;
  };
  models: ModelComparisonRow[];
  gaHistory: GaGenerationRow[];
  gaBestConfig: {
    chromosome: Record<string, number>;
    hidden_dims: number[];
    best_val_rmse: number;
  };
  annTuningRuns: Array<{
    config: string;
    hiddenDims: string;
    lr: number;
    dropout: number;
    batchSize: number;
    weightDecay: number;
    epochsRun: number;
    bestEpoch: number;
    valR2: number;
    valRmse: number;
    valMae: number;
    timeS: number;
  }>;
}

export interface DiagnosticPoint {
  rowId: number;
  mofName: string;
  yTrue: number;
  yPred: number;
  residual: number;
  df: number;
  di: number;
  poav: number;
  density: number;
  mcCryChi0: number;
  poreRegime: PoreRegime;
}

export interface DiagnosticsResponse {
  modelKey: ModelKey;
  displayName: string;
  split: "val" | "test";
  metrics: {
    r2: number;
    rmse: number;
    mae: number;
    count: number;
  };
  points: DiagnosticPoint[];
  residualHistogram: HistogramBin[];
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface ExplainabilityResponse {
  shapTop: FeatureImportanceItem[];
  xgbTop: FeatureImportanceItem[];
  rfTop: FeatureImportanceItem[];
  scatterSamples: Array<{
    rowId: number;
    mofName: string;
    uptake: number;
    df: number;
    di: number;
    poav: number;
    asaGravimetric: number;
    density: number;
    mcCryChi0: number;
    mcCryChi2: number;
    poreRegime: PoreRegime;
  }>;
  figures: Array<{
    filename: string;
    category: "EDA" | "Diagnostics" | "Explainability" | "Training";
    title: string;
    caption: string;
  }>;
}

export interface PredictionAttribution {
  feature: string;
  label: string;
  value: number;
  trainMean: number;
  deltaContribution: number;
}

export interface NearestAnalog {
  rowId: number;
  mofName: string;
  similarity: number;
  uptake: number;
  df: number;
  di: number;
  poav: number;
  density: number;
  mcCryChi0: number;
  poreRegime: PoreRegime;
}

export interface PredictResponse {
  predictedUptake: number;
  lowerBound: number;
  upperBound: number;
  trainMeanUptake: number;
  deltaVsMean: number;
  asaGravimetric: number;
  cageWindowDiff: number;
  poreRegime: PoreRegime;
  attributions: PredictionAttribution[];
  nearestAnalogs: NearestAnalog[];
  matchedMof?: MofRecord;
}

export interface MofListResponse {
  items: MofRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
