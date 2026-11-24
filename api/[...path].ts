import type { IncomingMessage, ServerResponse } from "node:http";
import type { Express } from "express";
import { createApiApp } from "../src/server/app";

let cachedApp: Express | null = null;

function getApp(): Express {
  if (!cachedApp) {
    cachedApp = createApiApp();
  }
  return cachedApp;
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.url && !req.url.startsWith("/api")) {
      req.url = req.url.startsWith("/") ? `/api${req.url}` : `/api/${req.url}`;
    }
    const app = getApp();
    return app(req as Parameters<Express>[0], res as Parameters<Express>[1]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: message }));
    }
  }
}

