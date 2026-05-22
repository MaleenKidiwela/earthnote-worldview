# CLAUDE.md

Persistent context for Claude Code. Read this fully before any task. Keep it open in every agent session.

## What this project is

A living, real-time digital twin of the Pacific Northwest as one coupled system, from the solid earth up through the ocean and atmosphere to rivers, ecology, economy, and people. One region, one clock, a stack of realities laid over the same ground.

Geographic scope: Oregon, Washington, and British Columbia. Nothing outside that bound is in scope for v1. The region is chosen because it is a coherent natural unit, one subduction zone, one transboundary inland sea, one set of coupled watersheds, one Portland-to-Vancouver corridor, and because it is where we have the deepest ground truth.

The twin fuses three things, two of which already exist:

- The Salish Sea Cousin is the model. A mechanistic system-dynamics engine with a causal graph, scenarios, and hindcasts. It answers why and what-if. It is the seed, centered on the Salish Sea and extended outward across the Pacific Northwest.
- WorldView is the view. A cinematic 3D globe on Google Photorealistic 3D Tiles with live human-pulse layers (aircraft, satellites, vessels, road traffic, cameras) and post-process visual modes. It answers where and what is happening right now.
- The five-plane control plane is the fusion. It senses, monitors, models, and makes the whole thing live and queryable.

The Cousin explains, WorldView shows, the control plane fuses. The mechanistic model is the thread that turns coincident dots into cause and effect.

This is transboundary by nature. Roughly half the data is United States and half Canadian, under two regimes, and Coast Salish sovereignty crosses the very border that the data infrastructure splits along. Treat that as a first-class constraint, not an afterthought.

### Scope and integrity rules (non-negotiable)

This system is for situational awareness, rapid characterization, scenario exploration, and, for the atmosphere only, skillful forecasting. It is not a general prediction engine and it does not replace official warning systems (ShakeAlert, the NWS, the tsunami centers). It contextualizes those, it does not issue authoritative warnings.

Two-contract prediction principle. This is the most important rule in the project.

- Solid earth (seismic, geodetic, volcanic): observe and characterize, never forecast. Output carries `isPrediction: false`. Earthquake timing is unsolved. Episodic Tremor and Slip is observable and quasi-periodic and loads the locked megathrust, but it is not a deterministic countdown to a great earthquake, and nothing in the UI or the agent may describe it as one. The one documented exception is Axial Seamount, where inflation-based eruption forecasting has demonstrated real skill. Treat it as an explicitly labeled, evidence-based threshold readout with a window (inflation relative to the level that preceded past eruptions), never a precise date, and never generalized to other volcanoes or to earthquakes.
- Atmosphere and hydromet: numerical weather prediction is real, skillful, and calibrated, so the weather plane is allowed to be predictive. It does so only through the separate `Forecast` contract, which carries a valid-time window, a lead time, a probability or deterministic value, the source model, and stated skill. Never route a forecast through the seismic contracts and never let weather-style confidence attach to a solid-earth signal.

Other rules:

- Every modeled or simulated value carries an uncertainty and a provenance. A number with no error bound and no source is a bug.
- Hand-tuned thresholds and illustrative coefficients are marked as such in the data, so they are never mistaken for calibrated science.
- Sovereignty and sensitivity. Treaty and Usual and Accustomed data, and any sensitive ecological location such as deliberately fuzzed orca positions, are flagged and handled with consent, not just an API call.

## What already exists (the Cousin)

A Vite + React single-page app, rendered in 2D SVG with hand-built coastlines. No map tiles, no globe, low dependency count by design. It contains:

- A mechanistic system-dynamics simulator: hundreds of parameterized, literature-cited relationships with weights and time lags. Real equations for logistic growth and carrying capacity, air-sea CO2 gas transfer, aragonite saturation thresholds, marine-heatwave thermal stress, harmful-algal-bloom closure triggers, deep-water renewal, ballast-water invasive pressure, and an atmospheric-river-on-burn-scar sediment term.
- Coupled human dimensions: commercial salmon prices, whale-watching revenue, recreational-trip value, health cost, ports, FRED economic series, and legal structure including treaty priority and the Sparrow decision.
- A scenario and policy engine: spill operations, dam removal, hatchery, restoration, vessel speed, carbon, nutrient management, with baseline-versus-scenario comparison and hindcast runs that back-test against observations.
- Three product surfaces, all of which must keep working: Explorer (public, fast question and answer), Research (model internals and validation), Policy (levers and outcomes).
- A live-data layer already wired to: NWS (KBLI, KSEA), NOAA Tides and Currents, USGS earthquakes (FDSN), USGS volcano API, USGS NWIS streamflow, NANOOS ERDDAP, Ocean Networks Canada ERDDAP, OOI ERDDAP, Environment Canada hydrometric, USDA SNOTEL, FRED.

### Source assumption and fallback

The default is to extend the existing Cousin repository in place and lift its simulation engine into `packages/sim`, then widen its geography to the full Pacific Northwest. If only the production build is present and the source is unavailable, reconstruct the typed model interfaces and the entity and edge definitions from the bundle, behavior-identical, and flag every reconstructed coefficient for review. Do not silently invent coefficients.

## What we are fusing in (WorldView)

The 3D body the Cousin never had, plus its live human-pulse layers:

- Globe: CesiumJS with Google Photorealistic 3D Tiles for land and built areas, plus a bathymetric quantized-mesh terrain so the camera can go below the waterline.
- Human-pulse layers: aircraft (OpenSky, airplanes.live for unfiltered coverage), satellites overhead (CelesTrak TLE propagated with satellite.js), vessels (AIS), road traffic as an OpenStreetMap particle system, and public DOT cameras (WSDOT, Oregon TripCheck, Drive BC).
- Visual modes as Cesium post-process stages, repurposed from WorldView's military aesthetic into scientific ones: bathy-xray to see below the surface, hydrophone to render and sonify the acoustic field, causal-web to lift the ontology edges as links over the globe.

These layers map onto the `GlobeLayer` contract and ride the same shared clock as everything else.

## What we are adding (the five planes)

1. Sensing and event intelligence: real-time geophysical streams, the weather and hydromet stack, and normalized multi-hazard feeds.
2. Observability plane: every signal becomes a monitored metric with a baseline, monitors as code, anomaly detection, and an event, forecast, and alert lifecycle.
3. Spatial and causal twin (the canvas): the existing 2D Cousin plus the WorldView 3D globe and its layers, sharing one clock and one selection bus.
4. Subsurface modeling: 4D geophysical models with explicit uncertainty, updated when the observability plane reports meaningful change.
5. Decision and agents: a typed ontology over entities, events, and forecasts, a scenario API, and a Gemini agent that reasons over the ontology and the observability API.

## Architecture

### Monorepo layout

```
apps/web              Cousin SPA, extended. Explorer, Research, Policy, and the
                      WorldView Globe canvas. Cloudflare Pages.
packages/contracts    Shared TypeScript types. The single source of truth that
                      lets the planes be built in parallel. Includes the PNW
                      region bound and the data source registry.
packages/sim          The Cousin mechanistic model, extracted into a package and
                      widened to the Pacific Northwest. Extended into solid-earth state.
workers/api           Cloudflare Worker. API proxy, auth gate, key hiding, CORS,
                      caching, Gemini answering model. Same pattern as the notes RAG.
workers/observability Durable Objects + Queues + Cron. Ingestion, baselines, monitors,
                      anomaly detection, the event, forecast, and alert lifecycle, SSE.
services/geocompute   Python. Seismic and geodetic methods, weather and hydromet
                      processing, inversion and modeling. Runs off-edge.
infra                 wrangler config, DVC config, deploy scripts, env templates.
```

### Runtime

Cloudflare-native for everything except the Python geocompute service.

- Frontend: static React + Vite SPA on Cloudflare Pages.
- Edge API: Cloudflare Worker for proxying, auth, key hiding, caching, and the Gemini agent.
- Real-time observability: Durable Objects hold per-stream rolling buffers, baselines, and alert state. Queues fan work out. A Cron Trigger polls feeds that do not push.
- Storage: D1 (SQLite) for metric, event, and forecast records, R2 for archived series and model artifacts. Migrate to a dedicated time-series database only if testbed scale is exceeded.
- Geocompute: a separate Python service for waveform and weather processing and inversions, which Workers cannot run. Triggered by the observability plane, returns artifacts through the API. Runs on a small VM or UW hardware.

### The parallel-build contract

The planes are built by separate agents at the same time. They do not edit each other's directories. They synchronize only through `packages/contracts`. Any change to a shared type is a contract change: update `packages/contracts` first, commit, then let each plane adapt. This is what makes the parallel workflow safe.

## Tech stack per plane

- Canvas and globe: CesiumJS, Google Photorealistic 3D Tiles, a bathymetric quantized-mesh terrain (NOAA NCEI Puget Sound and Salish Sea bathymetry, GEBCO elsewhere). WorldView human-pulse layers (OpenSky and airplanes.live, CelesTrak with satellite.js, AISStream, OpenStreetMap via Overpass, WSDOT and Oregon TripCheck and Drive BC cameras), plus Global Fishing Watch fishing-effort and SAR-detection layers for the offshore picture beyond terrestrial AIS. The existing SVG Cousin stays as a parallel 2D view.
- Observability: TypeScript on Workers, Durable Objects, Queues, Cron, D1, R2. Server-sent events to the frontend. Monitors and the forecast path defined as code and committed.
- Sensing, solid earth: EarthScope as the federated waveform and GNSS backbone (FDSN web services and SeedLink, Network of the Americas GNSS), with PNSN and ONC for regional and offshore coverage. Methods in `services/geocompute/methods`: SeisBench (PhaseNet or EQTransformer) and RSAM, MSNoise for dv/v, single-station HVSR for H/V, time-lapse receiver functions, and network deep-tremor detection plus the PNSN tremor catalog. Offshore solid earth: seafloor geodesy (bottom pressure recorders for vertical, GNSS-Acoustic for horizontal, acoustic ranging for caldera baselines), cabled ocean-bottom seismometers on ONC and OOI plus the archived Cascadia Initiative OBS via EarthScope, and Axial Seamount as a first-class volcanic and deformation node.
- Sensing, weather and hydromet: NWS observations and the NWS alerts API, numerical forecast models (HRRR and GFS, ECMWF where licensing allows), NEXRAD radar, marine wind and waves (WaveWatch III), storm surge, atmospheric-river tracking from integrated vapor transport, NOAA Tides, USGS NWIS and Environment Canada streamflow, SNOTEL snow, NOAA SWPC space weather.
- Sensing, ocean and offshore: DART tsunami bottom-pressure buoys (NDBC), satellite ocean state for marine heatwaves (SST, sea-level anomaly, ocean color via PODAAC, NOAA Coral Reef Watch, Copernicus), shelf hypoxia and ocean acidification (NANOOS and the OOI Oregon shelf moorings, which the Cousin already reads for dissolved oxygen and pH), and Global Fishing Watch (4Wings fishing effort and SAR detections, the Events API for encounters, loitering, and AIS-off gaps).
- Subsurface: SimPEG and PyGIMLi for inversion, GemPy for implicit geological modeling, PyVista and VTK for the 3D field, DVC for versioned model artifacts. Export volumes to the globe as 3D Tiles voxels or glTF.
- Decision and agents: a typed ontology in `packages/contracts`, an event and forecast store in D1, a scenario API on the Worker, a Gemini agent behind the Worker proxy that reads the ontology and the observability API and can command the view. It must obey the two-contract prediction principle.

## Conventions

- Language: TypeScript everywhere except the geocompute service, which is Python. Strict mode on. No `any` without a written reason.
- Dependency ethos: minimal and long-lived. Match the existing low-dependency style. Justify every new dependency in the PR description.
- Writing style in all generated docs, code comments, and UI copy: no em dashes. Use commas, colons, or separate sentences.
- Git: conventional commit messages. Never add a Claude co-author line, commit attribution, or any AI authorship trailer. Commits read as the human author only.
- Secrets: never hardcode keys and never write real key values into any file. All secrets are set with `wrangler secret put` or environment variables and referenced by name.
- The three modes (Explorer, Research, Policy) must stay green at every milestone. A change that breaks any mode is not done.
- Tests: every plane ships with at least contract tests against `packages/contracts` and one integration test of its main loop.

### Required secrets (set yourself, never commit)

| Name | Used by | Notes |
|------|---------|-------|
| `GOOGLE_MAPS_TILES_KEY` | web, api | Map Tiles API enabled. 3D Tiles bills as an Enterprise SKU. |
| `CESIUM_ION_TOKEN` | web | Free tier fine for dev. |
| `GEMINI_API_KEY` | api | Behind the Worker proxy only. Never exposed to the client. |
| `ONC_API_TOKEN` | geocompute, api | Ocean Networks Canada. |
| `EARTHSCOPE_TOKEN` | geocompute | EarthScope data services. FDSN waveforms are largely open, GNSS and some products want a token. |
| `OPENSKY_CLIENT` | observability | Optional. Raises the aircraft rate limit above anonymous. |
| `AISSTREAM_KEY` | observability | Vessel traffic and modeled noise. |
| `GFW_API_TOKEN` | geocompute | Global Fishing Watch. Free key. Fishing effort, SAR detections, vessel events. |
| `APP_SHARED_PASSWORD` | api | Simple gate, same idea as the notes site. |

Most weather, river, satellite, and camera feeds are open and need no key.

## Data sources registry

Keep a single machine-readable registry at `packages/contracts/src/sources.ts` listing every feed with: id, name, endpoint, cadence, auth requirement, license, jurisdiction (US or CA), and whether it is push or poll. Every fetcher clips to the Pacific Northwest bound defined in `packages/contracts/src/region.ts` (Oregon, Washington, British Columbia).

Register at least:

- Solid earth: EarthScope FDSN dataselect and station, EarthScope SeedLink, EarthScope Network of the Americas GNSS, the PNSN tremor catalog, USGS FDSN events, USGS volcano API, ShakeAlert, NTWC tsunami, ONC and OOI.
- Weather and hydromet: NWS observations, the NWS alerts API, HRRR and GFS, NEXRAD, WaveWatch III, NOAA storm surge, NOAA Tides, USGS NWIS, Environment Canada hydrometric, SNOTEL, NOAA SWPC.
- Human pulse (WorldView): OpenSky and airplanes.live, CelesTrak, AISStream, OpenStreetMap via Overpass, WSDOT and Oregon TripCheck and Drive BC cameras, Global Fishing Watch (4Wings, Events, Vessels).
- Offshore and marine: DART buoys (NDBC), cabled OBS and bottom pressure on ONC and OOI, archived Cascadia Initiative OBS via EarthScope, Axial Seamount (OOI Cabled Array), seafloor GNSS-Acoustic and acoustic-ranging campaigns, satellite SST and altimetry and ocean color (PODAAC, Coral Reef Watch, Copernicus).
- Ecology and economy: NANOOS, Acartia and The Whale Museum, dam counts, FRED.

Mark `sovereign: true` or `sensitive: true` where it applies. Mark every source `isPrediction: false` except forecast-model sources, which feed the `Forecast` contract.

## Dev commands

```
pnpm i                          install workspace
pnpm --filter web dev           run the SPA locally
pnpm --filter api dev           run the API worker (wrangler dev)
pnpm --filter observability dev run the observability worker
cd services/geocompute && make dev   run the python geocompute service
pnpm test                       run all contract and integration tests
```
