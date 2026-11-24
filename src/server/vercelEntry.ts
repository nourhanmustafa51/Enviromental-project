import type { IncomingMessage, ServerResponse } from "node:http";
import { mlEngine } from "./mlEngine";
import type { ModelKey, MofFeaturesInput, SplitName } from "../types";

const VALID_MODELS = new Set<ModelKey>([
  "xgboost",
  "random_forest",
  "ann",
  "ga_ann",
  "svr",
  "baseline_dummy",
  "baseline_linear",
]);

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: IncomingMessage & { body?: unknown }): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === "string" && req.body.trim().length > 0) {
    return JSON.parse(req.body) as Record<string, unknown>;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  try {
    const rawUrl = req.url || "/api/overview";
    const parsed = new URL(rawUrl, "http://localhost");
    const routeParam = parsed.searchParams.get("__route");
    let pathname = routeParam ? `/api/${routeParam.replace(/^\/+/, "")}` : parsed.pathname;
    if (!pathname.startsWith("/api")) {
      pathname = pathname.startsWith("/") ? `/api${pathname}` : `/api/${pathname}`;
    }
    const method = (req.method || "GET").toUpperCase();

    if (method === "GET" && pathname === "/api/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (method === "GET" && pathname === "/api/overview") {
      return sendJson(res, 200, mlEngine.getOverview());
    }

    if (method === "GET" && pathname === "/api/diagnostics") {
      const rawModel = String(parsed.searchParams.get("model") || "xgboost") as ModelKey;
      const modelKey: ModelKey = VALID_MODELS.has(rawModel) ? rawModel : "xgboost";
      const split = parsed.searchParams.get("split") === "val" ? "val" : "test";
      return sendJson(res, 200, mlEngine.getDiagnostics(modelKey, split));
    }

    if (method === "GET" && pathname === "/api/explainability") {
      return sendJson(res, 200, mlEngine.getExplainability());
    }

    if (method === "GET" && pathname === "/api/mofs") {
      const splitRaw = String(parsed.searchParams.get("split") || "test");
      const split = (["train", "val", "test", "all"].includes(splitRaw)
        ? splitRaw
        : "test") as SplitName | "all";
      const search = String(parsed.searchParams.get("search") || "");
      const regime = String(parsed.searchParams.get("regime") || "all");
      const sort = String(parsed.searchParams.get("sort") || "uptake_desc");
      const page = Number(parsed.searchParams.get("page") || 1);
      const limit = Number(parsed.searchParams.get("limit") || 25);

      return sendJson(
        res,
        200,
        mlEngine.listMofs({
          split,
          search,
          regime,
          sort,
          page: Number.isFinite(page) ? page : 1,
          limit: Number.isFinite(limit) ? limit : 25,
        })
      );
    }

    if (method === "GET" && pathname.startsWith("/api/mofs/")) {
      const idStr = pathname.slice("/api/mofs/".length);
      const rowId = Number(idStr);
      if (!Number.isFinite(rowId)) {
        return sendJson(res, 400, { error: "Invalid rowId" });
      }
      const mof = mlEngine.getMofById(rowId);
      if (!mof) {
        return sendJson(res, 404, { error: "MOF not found" });
      }
      return sendJson(res, 200, mof);
    }

    if (method === "POST" && pathname === "/api/predict") {
      const body = (await readJsonBody(req)) as Partial<MofFeaturesInput> & { matchedRowId?: number };
      const defaults = mlEngine.getOverview().dataset.featureDefaults;
      const num = (val: unknown, fallback: number) => {
        const valNum = Number(val);
        return Number.isFinite(valNum) ? valNum : fallback;
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

      return sendJson(res, 200, mlEngine.predict(input, matchedRowId));
    }

    if (method === "GET" && pathname === "/api/export/comparison.csv") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="mof_model_comparison.csv"');
      res.end(mlEngine.getComparisonCsv());
      return;
    }

    return sendJson(res, 404, { error: `Unknown API route: ${pathname}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (!res.headersSent) {
      sendJson(res, 500, { error: message });
    }
  }
}
