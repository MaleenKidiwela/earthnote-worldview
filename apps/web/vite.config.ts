import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { startCollector, getVessels, getSource } from "./server/ais-collector.ts";
import { handleMethodsIngest, handleMethodsRecent } from "./server/methods-ingest.ts";

// AIS collector plugin. Starts an AISStream WebSocket server-side and serves
// vessels via /api/ais. Falls back to Digitraffic REST when AISStream is empty.
// PNW clipping is enforced at render time, not here, so we keep raw global
// vessels in cache and let the client filter against region.PNW.bbox.
function aisCollectorPlugin(): Plugin {
  return {
    name: "ais-collector",
    configureServer(server) {
      // loadEnv reads .env* files; fall back to shell-exported vars too.
      const env = loadEnv("development", process.cwd(), "VITE_");
      const key =
        env.VITE_AISSTREAM_API_KEY || process.env.VITE_AISSTREAM_API_KEY;
      startCollector(key);

      server.middlewares.use("/api/ais/vessel", async (req, res) => {
        const mmsi = req.url?.replace(/^\//, "") || "";
        if (!mmsi) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "mmsi required" }));
          return;
        }
        try {
          const r = await fetch(
            `https://meri.digitraffic.fi/api/ais/v1/vessels/${mmsi}`,
            { headers: { "Accept-Encoding": "gzip" } },
          );
          const data = await r.text();
          res.writeHead(r.status, { "Content-Type": "application/json" });
          res.end(data);
        } catch {
          res.writeHead(502);
          res.end(JSON.stringify({ error: "upstream failed" }));
        }
      });

      server.middlewares.use("/api/ais", async (_req, res) => {
        const vessels = await getVessels();
        res.writeHead(200, {
          "Content-Type": "application/json",
          "X-AIS-Source": getSource(),
        });
        res.end(JSON.stringify(vessels));
      });

      // Methods ingest seam — external pipelines (dv/v, HVSR, RF) POST here.
      server.middlewares.use("/api/methods/sample", (req, res) =>
        handleMethodsIngest(req, res, "sample"),
      );
      server.middlewares.use("/api/methods/geoproduct", (req, res) =>
        handleMethodsIngest(req, res, "geoproduct"),
      );
      server.middlewares.use("/api/methods/event", (req, res) =>
        handleMethodsIngest(req, res, "event"),
      );
      server.middlewares.use("/api/methods/recent", handleMethodsRecent);
    },
  };
}

// Under JupyterHub, the SPA is reached via /user/<name>/proxy/5173/.
// Vite's default base "/" makes asset URLs resolve to the hub root, not the
// proxy prefix, so the page 200s but every /src/* and /@vite/* 404s. Derive
// the base from JUPYTERHUB_SERVICE_URL when present.
const hubProxyBase = (() => {
  const url = process.env.JUPYTERHUB_SERVICE_URL;
  if (!url) return "/";
  const path = new URL(url).pathname;
  return `${path}proxy/absolute/5173/`;
})();

export default defineConfig({
  base: hubProxyBase,
  plugins: [react(), cesium(), tailwindcss(), aisCollectorPlugin()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    strictPort: true,
    // Accept the JupyterHub proxy host header (varies by hub).
    allowedHosts: true,
    // Behind jupyter-server-proxy, HMR over WSS via the hub's TLS port.
    hmr: process.env.JUPYTERHUB_SERVICE_URL
      ? { clientPort: 443, protocol: "wss", path: `${hubProxyBase}` }
      : true,
    proxy: {
      // PNW earthquakes via USGS FDSN events API. The PNW bbox query is
      // built client-side in feeds/usgs.ts and appended verbatim.
      "/api/quakes-fdsn": {
        target: "https://earthquake.usgs.gov",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/quakes-fdsn/, "/fdsnws/event/1/query"),
      },
      "/api/fires": {
        target: "https://firms.modaps.eosdis.nasa.gov",
        changeOrigin: true,
        rewrite: () =>
          "/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv",
      },
      "/api/weather": {
        target: "https://api.weather.gov",
        changeOrigin: true,
        rewrite: () => "/alerts/active",
        headers: { "User-Agent": "pnw-twin/0.0 (research prototype)" },
      },
    },
  },
  build: {
    target: "es2020",
  },
});
