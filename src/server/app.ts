import fs from "node:fs";
import path from "node:path";
import express from "express";
import { mlEngine } from "./mlEngine.ts";
import type { ModelKey, MofFeaturesInput, SplitName } from "../types.ts";

const VALID_MODELS = new Set<ModelKey>([
  "xgboost",
  "random_forest",
  "ann",
  "ga_ann",
  "svr",
  "baseline_dummy",
  "baseline_linear",
]);

export function createApiApp() {
  const app = express();
  app.use(express.json());

  // Serve original repository figures when running via Node/Express
  app.use("/figures", express.static(path.resolve("figures")));

  app.get("/api/overview", (_req, res) => {
    res.json(mlEngine.getOverview());
  });

  app.get("/api/diagnostics", (req, res) => {
    const rawModel = String(req.query.model || "xgboost") as ModelKey;
    const modelKey: ModelKey = VALID_MODELS.has(rawModel) ? rawModel : "xgboost";
    const split = req.query.split === "val" ? "val" : "test";
    res.json(mlEngine.getDiagnostics(modelKey, split));
  });

  app.get("/api/explainability", (_req, res) => {
    res.json(mlEngine.getExplainability());
  });

  app.get("/api/mofs", (req, res) => {
    const splitRaw = String(req.query.split || "test");
    const split = (["train", "val", "test", "all"].includes(splitRaw)
      ? splitRaw
      : "test") as SplitName | "all";
    const search = String(req.query.search || "");
    const regime = String(req.query.regime || "all");
    const sort = String(req.query.sort || "uptake_desc");
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 25);

    res.json(
      mlEngine.listMofs({
        split,
        search,
        regime,
        sort,
        page: Number.isFinite(page) ? page : 1,
        limit: Number.isFinite(limit) ? limit : 25,
      })
    );
  });

  app.get("/api/mofs/:rowId", (req, res) => {
    const rowId = Number(req.params.rowId);
    if (!Number.isFinite(rowId)) {
      return res.status(400).json({ error: "Invalid rowId" });
    }
    const mof = mlEngine.getMofById(rowId);
    if (!mof) {
      return res.status(404).json({ error: "MOF not found" });
    }
    return res.json(mof);
  });

  app.post("/api/predict", (req, res) => {
    const body = req.body as Partial<MofFeaturesInput> & { matchedRowId?: number };
    const overview = mlEngine.getOverview();
    const defaults = overview.dataset.featureDefaults;

    const num = (val: unknown, fallback: number) => {
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const density = Math.max(0.05, num(body.density, defaults.density));
    const input: MofFeaturesInput = {
      asa: Math.max(0, num(body.asa, defaults.asa)),
      df: Math.max(0, num(body.df, defaults.df)),
      di: Math.max(0, num(body.di, defaults.di)),
      nasa: Math.max(0, num(body.nasa, defaults.nasa)),
      poav: Math.max(0, num(body.poav, defaults.poav)),
      ponav: Math.max(0, num(body.ponav, defaults.ponav)),
      density,
      mcCryChi0: num(body.mcCryChi0, defaults.mcCryChi0),
      mcCryChi1: num(body.mcCryChi1, defaults.mcCryChi1),
      mcCryChi2: num(body.mcCryChi2, defaults.mcCryChi2),
      mcCryS0: num(body.mcCryS0, defaults.mcCryS0),
      mcCryS1: num(body.mcCryS1, defaults.mcCryS1),
      mcCryZ0: num(body.mcCryZ0, defaults.mcCryZ0),
      mcCryI1: num(body.mcCryI1, defaults.mcCryI1),
      fLigZ1: num(body.fLigZ1, defaults.fLigZ1),
      sumLcS0: num(body.sumLcS0, defaults.sumLcS0),
    };

    const matchedRowId =
      body.matchedRowId !== undefined && Number.isFinite(Number(body.matchedRowId))
        ? Number(body.matchedRowId)
        : undefined;

    const result = mlEngine.predict(input, matchedRowId);
    return res.json(result);
  });

  app.get("/api/export/comparison.csv", (_req, res) => {
    const rootDir = fs.existsSync(path.join(process.cwd(), "results"))
      ? process.cwd()
      : path.resolve(import.meta.dirname, "../..");
    const csvPath = path.join(rootDir, "results", "model_comparison.csv");
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: "Comparison CSV not found" });
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="mof_model_comparison.csv"');
    return res.send(fs.readFileSync(csvPath, "utf-8"));
  });

  return app;
}
