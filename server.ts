import path from "node:path";
import express from "express";
import { createApiApp } from "./src/server/app";

async function startServer() {
  const app = createApiApp();
  app.use("/figures", express.static(path.resolve("figures")));

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve("dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("MOF CO2 Uptake Studio running on http://0.0.0.0:3000");
  });
}

startServer();
