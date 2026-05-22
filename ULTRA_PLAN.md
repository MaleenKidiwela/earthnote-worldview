# Ultra plan: Pacific Northwest digital twin

A build plan for Claude Code, sized for a parallel-agent terminal workflow. Read `CLAUDE.md` first. This document tells each agent what to build, what contract it owns, and what done means.

## The thing we are building

One living, real-time digital twin of the Pacific Northwest as a single coupled system, scoped to Oregon, Washington, and British Columbia. It fuses the Salish Sea Cousin (the mechanistic model), WorldView (the 3D globe and its live human-pulse layers), and the five-plane control plane (sensing, observability, subsurface, decision) into one region on one clock. The Cousin explains, WorldView shows, the control plane fuses. The payoff is compound hazards, the couplings that define this region's risk, made spatial, live, and multi-physics.

## How to run this

You are the conductor. Open one terminal per plane and one for yourself. Each plane agent owns one directory tree and never edits another's. All agents synchronize through `packages/contracts`. When a shared type must change, change it in `packages/contracts` first, commit, then let the affected planes adapt.

Agent assignment:

- Agent A, Canvas, globe, and WorldView layers: `apps/web` globe surface, the human-pulse layers, and the 2D-to-3D bridge.
- Agent B, Observability: `workers/observability`, including the forecast path.
- Agent C, Sensing: `services/geocompute`, split across terminals. C1 solid-earth continuous and noise methods, C2 solid-earth event and network methods, C3 weather and hydromet, C4 multi-hazard normalizers.
- Agent D, Subsurface modeling: `services/geocompute` inversion and `apps/web` volume rendering.
- Agent E, Ontology, agents, and model extension: `packages/sim`, the ontology in `packages/contracts`, the Gemini agent in `workers/api`.
- Conductor (you): `packages/contracts`, the region bound, the clock and event bus, CI, integration, keeping the three modes green.

## Phase 0: foundations (conductor first, before agents fan out)

Sequential. Do not start the plane agents until Phase 0 is committed, because they all depend on the contracts.

- [ ] Confirm the source. Set the monorepo up around the existing Cousin repo, or reconstruct the typed interfaces from the bundle if only the build is present, flagging every reconstructed coefficient.
- [ ] Stand up the monorepo. Move the app into `apps/web`. Extract the simulator into `packages/sim` and widen its geography to the Pacific Northwest.
- [ ] Create `packages/contracts` with the core types below, including the region bound. This is the most important deliverable of Phase 0.
- [ ] Wire CI: typecheck, contract tests, a smoke test that all three modes render.
- [ ] Seed `sources.ts` with every feed, each tagged jurisdiction (US or CA), push or poll, license, and `isPrediction`. Add `region.ts` with the OR, WA, BC bound that all fetchers clip to.
- [ ] Establish the shared clock and a typed event bus that the 2D Cousin and the globe both subscribe to.

### Core contracts to write in Phase 0

```ts
// packages/contracts/src/region.ts  (the scope, enforced everywhere)
export const PNW = {
  jurisdictions: ['US-OR', 'US-WA', 'CA-BC'] as const,
  bbox: { west: -125.5, south: 41.9, east: -114.0, north: 54.5 },
};

// packages/contracts/src/clock.ts
export interface SimClock {
  now: number;            // unix ms, the single time cursor for view and model
  mode: 'live' | 'replay' | 'scenario';
  rangeStart: number;
  rangeEnd: number;
}

// packages/contracts/src/entities.ts  (the ontology nodes)
export type EntityKind =
  | 'orcaPod' | 'salmonRun' | 'port' | 'tribe' | 'station'
  | 'fault' | 'volcano' | 'fluidReservoir' | 'watershed' | 'riverGauge'
  | 'noiseSource' | 'climateDriver' | 'population' | 'infrastructure'
  | 'seafloorStation' | 'fishery' | 'offshoreInfra';

export interface Entity {
  id: string;
  kind: EntityKind;
  label: string;
  jurisdiction?: 'US-OR' | 'US-WA' | 'CA-BC';
  geom?: GeoJSON.Geometry;
  sensitive?: boolean;
  sovereign?: boolean;
}

// packages/contracts/src/edges.ts  (the causal relations the Cousin already encodes)
export interface CausalEdge {
  id: string;
  sourceId: string;
  targetId: string;
  polarity: 1 | -1;
  weight: number;
  lagDays: number;
  mechanism: string;
  citation?: string;
  calibrated: boolean;         // false means illustrative, must surface in UI
}

// packages/contracts/src/metrics.ts  (the observability unit)
export interface Metric {
  id: string;                  // e.g. "pnsn.station.RSAM.MBW", "hrrr.ivt.gridcell"
  source: string;
  unit: string;
  cadenceSec: number;
  entityId?: string;
}
export interface Sample { metricId: string; t: number; v: number; quality?: number; }

// packages/contracts/src/monitors.ts
export interface Monitor {
  id: string;
  metricId: string;
  method: 'staLta' | 'zscore' | 'changePoint' | 'mlAnomaly';
  params: Record<string, number>;
  baselineWindow: string;
  severity: 'info' | 'watch' | 'warning';
  note: string;
}
export interface CompositeMonitor {
  id: string;
  metricIds: string[];
  method: 'composite';
  combine: string;             // named, reviewed fusion rule
  emits: string;               // derived metric id, e.g. "cascadia.slowSlipIndex"
  severity: 'info' | 'watch' | 'warning';
  note: string;
  isPrediction: false;
}

// packages/contracts/src/events.ts  (observed, characterized, never forecast)
export interface HazardEvent {
  id: string;
  kind: 'seismic' | 'volcanic' | 'tsunami' | 'flood' | 'wildfire'
      | 'marineHeatwave' | 'hab' | 'weather' | 'spaceWeather' | 'anomaly';
  t0: number;
  status: 'open' | 'ack' | 'resolved';
  entityIds: string[];
  metricIds: string[];
  characterization?: Record<string, unknown>;  // magnitudes, locations, with uncertainty
  isPrediction: false;         // hard literal. observed events do not predict.
  officialSource?: string;     // set when this mirrors an issued warning (NWS, ShakeAlert)
}

// packages/contracts/src/forecasts.ts  (the weather exception, predictive on purpose)
// Only the atmosphere and hydromet may use this. Solid-earth code must not import it.
export interface Forecast {
  id: string;
  metricId?: string;
  hazardKind?: HazardEvent['kind'];
  issuedAt: number;
  validStart: number;
  validEnd: number;
  leadTimeHours: number;
  value?: number;              // deterministic
  probability?: number;        // 0..1 if probabilistic
  model: 'HRRR' | 'GFS' | 'ECMWF' | 'WaveWatch3' | 'NWS' | 'surge';
  skill?: Record<string, number>;  // stated skill, e.g. brier, crps, lead-time skill
}

// packages/contracts/src/geoproducts.ts  (heavy artifacts, R2-backed, DVC-versioned)
export interface GeoProduct {
  id: string;
  kind: 'dvvMatrix' | 'hvsrCurve' | 'rfStack' | 'rfTimeSeries'
      | 'tremorCatalog' | 'gnssSeries' | 'noiseCorrelation'
      | 'radarSweep' | 'forecastGrid' | 'subsurfaceVolume'
      | 'gnssAcoustic' | 'fishingEffort' | 'sarDetections' | 'sstField';
  uri: string;
  t0: number; t1: number;
  entityId?: string;
  uncertainty?: Record<string, number>;
  method: string;
}

// packages/contracts/src/layers.ts  (what the globe can render)
export interface GlobeLayer {
  id: string;
  title: string;
  kind: 'points' | 'primitives' | 'field' | 'volume' | 'video' | 'particles';
  visualMode?: 'default' | 'bathyXray' | 'hydrophone' | 'causalWeb';
  source: string;
}
```

## Workstreams

Each runs in parallel after Phase 0. Each lists its tasks, the contract it owns, and its definition of done.

### Agent A: Canvas, globe, and WorldView layers

Owns: the globe surface, the WorldView human-pulse layers, and the bridge that lets the 2D Cousin and the 3D globe coexist on one clock and one selection.

- [ ] Add a Cesium viewer as a new canvas in `apps/web`, behind a mode toggle alongside Explorer, Research, and Policy. The 2D SVG Cousin stays fully intact.
- [ ] Load Google Photorealistic 3D Tiles for land and built areas. Set `showCreditsOnScreen: true`. Tune the per-host request budget.
- [ ] Add a bathymetric quantized-mesh terrain so the camera can descend below the waterline.
- [ ] Implement the `GlobeLayer` renderer with `PointPrimitiveCollection` and `BillboardCollection`, not `Entity`, for anything above a few hundred moving items.
- [ ] Bring in the WorldView human-pulse layers, clipped to the PNW bound: aircraft (OpenSky, airplanes.live), satellites (CelesTrak with satellite.js), vessels (AISStream), road traffic as an OpenStreetMap particle system, and DOT cameras (WSDOT, Oregon TripCheck, Drive BC).
- [ ] Bind the globe to the shared `SimClock` and the selection bus. Selecting an entity highlights it across the globe and the Cousin graph.
- [ ] Build the visual modes as Cesium post-process stages: `bathyXray`, `hydrophone`, `causalWeb`.

Done when: a user can switch into Globe mode, scrub the clock, toggle layers including live aircraft and vessels, dive below the waterline, click an entity and see it light up across both views, and all three original modes still render.

### Agent B: Observability plane

Owns: `workers/observability`, the metric, monitor, event, and forecast lifecycle.

- [ ] Durable Object per stream holding a rolling buffer and a learned baseline. Cron Trigger polls poll-type sources. Queues fan ingestion out.
- [ ] Detectors: STA over LTA, z-score, change-point first. A typed seam for an ML anomaly detector. Composite monitors for fused indices.
- [ ] Monitors and composite monitors as code, committed and reviewed like source.
- [ ] On a trip, instantiate a `HazardEvent`, link entities and metrics, persist to D1, emit over SSE.
- [ ] Forecast path: ingest `Forecast` records from the weather methods, store them, and serve them to the frontend distinctly from events. The UI must render a forecast as a forward-looking band with a lead time, never as an observed event.
- [ ] Event lifecycle: open, acknowledge, resolve, annotate, post-event record.
- [ ] Read API for the agent layer: current metrics, baselines, open events, active forecasts.

Done when: a real Cascadia metric stream is buffered with a baseline, a monitor trips on injected data, an event is created and linked, a `Forecast` from a weather model is stored and served separately, and both reach the globe over SSE.

### Agent C: Sensing

Owns: `services/geocompute`. Split across terminals: C1 solid-earth continuous and noise, C2 solid-earth event and network, C3 weather and hydromet, C4 multi-hazard normalizers, C5 ocean and offshore. EarthScope is the federated backbone for waveforms and GNSS, with PNSN and ONC alongside.

Solid earth (C1, C2):

- [ ] EarthScope ingest: FDSN dataselect and station, SeedLink real-time, Network of the Americas GNSS. Register in `sources.ts`.
- [ ] dv/v: ambient-noise cross-correlation and autocorrelation via MSNoise. dv/v `Sample` per pair, `dvvMatrix` GeoProduct.
- [ ] H/V (HVSR): single-station spectral ratio, track f0 and amplitude. f0 and A0 `Sample`, `hvsrCurve` GeoProduct.
- [ ] Receiver functions: event-triggered per teleseism, deconvolve and stack, track conversion timing and amplitude over time. `Sample` per phase, `rfStack` GeoProduct.
- [ ] Deep tremor: network envelope cross-correlation or ML, plus the PNSN tremor catalog. tremor rate `Sample`, episode `HazardEvent`, `tremorCatalog` GeoProduct.
- [ ] Picker and amplitude: SeisBench, RSAM.

Weather and hydromet (C3):

- [ ] Observations and official warnings: NWS observations as `Sample`, the NWS alerts API as `HazardEvent` with `officialSource` set.
- [ ] Forecast models: HRRR and GFS, ECMWF where licensed. Emit `Forecast` records and `forecastGrid` GeoProducts. Never emit these as events.
- [ ] NEXRAD radar: sweeps as `radarSweep` GeoProduct for the globe `field` layer.
- [ ] Marine and surge: WaveWatch III wind and waves, NOAA storm surge, NOAA Tides.
- [ ] Atmospheric-river tracking: compute integrated vapor transport from model fields, emit an AR intensity metric and, when thresholds and lead time warrant, an AR `Forecast`.
- [ ] Hydrology and snow: USGS NWIS and Environment Canada streamflow as `Sample` tied to `riverGauge` entities, SNOTEL snow water equivalent.
- [ ] Space weather: NOAA SWPC.

Ocean and offshore (C5):

- [ ] Seafloor geodesy: bottom pressure recorders for vertical seafloor motion (Sample), GNSS-Acoustic and acoustic-ranging baselines for horizontal (`gnssAcoustic` GeoProduct), from ONC and OOI cabled nodes and campaign sites. Feed these into the slow-slip composite so it sees the offshore updip portion, not just the onshore downdip edge.
- [ ] DART tsunami buoys (NDBC): bottom-pressure residual as `Sample`, detected events as `HazardEvent` of kind tsunami with `officialSource` where mirrored. DART is the offshore tsunami sensor the plan was missing.
- [ ] Offshore OBS: fold the cabled ONC and OOI ocean-bottom seismometers and the archived Cascadia Initiative OBS into the EarthScope FDSN ingest so dv/v and deep tremor are not onshore-weighted.
- [ ] Axial Seamount as a first-class node: bottom-pressure inflation rate and seismicity as `Sample`, an inflation `HazardEvent` only as a labeled threshold readout per the integrity rule. This is the rare volcanic case where inflation-based forecasting has skill, so it is scoped and labeled, never generalized.
- [ ] Satellite ocean state: SST, sea-level anomaly, and ocean color (PODAAC, Coral Reef Watch, Copernicus) as `sstField` GeoProducts and marine-heatwave metrics.
- [ ] Shelf hypoxia and acidification: extend the OOI Oregon shelf dissolved-oxygen and pH series the Cousin already reads, tied to the acidification and calcifier nodes.
- [ ] Global Fishing Watch: 4Wings apparent fishing effort (`fishingEffort` GeoProduct) and SAR vessel detections (`sarDetections`, which catch vessels with AIS off), plus Events API encounters, loitering, and AIS-off gaps. Fishing effort drives the fishing-pressure edges on salmon and groundfish nodes. SAR extends the offshore vessel picture past terrestrial AIS. Hold dark-vessel and IUU detection as a future monitor, not v1.

Shared (C4):

- [ ] Multi-hazard normalizers for any remaining feeds into `Sample`, `HazardEvent`, or `Forecast` shapes.
- [ ] Publish everything to the observability plane through the API. Geocompute never talks to the browser.
- [ ] Provenance and uncertainty on every emitted value and product.

Done when: EarthScope waveforms and GNSS ingest, dv/v and H/V and deep tremor produce contract-valid output on one Cascadia network, a receiver-function stack accumulates, the NWS alerts and at least one forecast model produce contract-valid `HazardEvent` and `Forecast` records, NEXRAD renders as a globe field, and river gauges stream against `riverGauge` entities.

### Agent D: Subsurface modeling

Owns: `services/geocompute` inversion and modeling, plus volume rendering in `apps/web`.

- [ ] Inversion with SimPEG or PyGIMLi, implicit geological modeling with GemPy, versioned `subsurfaceVolume` GeoProduct with explicit uncertainty.
- [ ] Version artifacts with DVC so the 4D model has history.
- [ ] Trigger: a meaningful change from the observability plane runs a model update and publishes a new artifact.
- [ ] Export volumes to the globe as 3D Tiles voxels or glTF for Agent A to render below the surface.

Done when: a fired event triggers a re-inversion stub, produces a versioned volume with uncertainty, and that volume renders below the surface on the globe.

### Agent E: Ontology, agents, and model extension

Owns: `packages/sim`, the ontology in `packages/contracts`, the Gemini agent in `workers/api`.

- [ ] Formalize the Cousin entities and edges into the ontology. Preserve every coefficient and citation. Mark uncalibrated edges `calibrated: false`. Widen geography to the PNW.
- [ ] Extend the model downward and outward with first-class state nodes: seismicity rate, dv/v, H/V f0, receiver-function conversion timing, deep-tremor rate, GNSS strain, a fused slow-slip index, plus the weather and hydromet couplings below. Define the Cascadia ETS index as a `CompositeMonitor` over tremor rate, GNSS reversal, and dv/v.
- [ ] Wire the compound-hazard couplings (see below) as edges so atmosphere and hydrology drive ecology, ports, and people.
- [ ] Scenario and what-if API on the Worker, reusing the baseline-versus-scenario engine across all three modes.
- [ ] Gemini agent behind the Worker proxy, reusing the notes-RAG pattern. It reads the ontology and the observability API and commands the view. It obeys the two-contract prediction principle: it may relay weather forecasts with their stated skill, and it must never phrase a solid-earth signal as a forecast.

Done when: the ontology round-trips the existing model with no behavior change, a solid-earth and a weather state node each participate in a causal chain, and the agent answers a grounded why-question that spans both.

## Seismic and geodetic methods integration

All of these are geocompute modules under `services/geocompute/methods`. They differ only in cadence and output shape, and they all reduce to the shared contracts: continuous outputs become `Sample`, heavy outputs become `GeoProduct`, threshold crossings become `HazardEvent`, derived state nodes live in the ontology.

| Method | Cadence | Inputs | Emits | Detects |
|--------|---------|--------|-------|---------|
| dv/v | continuous, daily | ambient noise, pairs and autocorr | dv/v `Sample`, `dvvMatrix` | stress, fluids, thermal, hydrology, co-seismic and ETS-related change |
| H/V (HVSR) | continuous, rolling | 3-component noise, single station | f0 and A0 `Sample`, `hvsrCurve` | near-surface velocity, water table, damage |
| Receiver functions | per teleseism, accumulate | teleseismic events, broadband | conversion time and amplitude `Sample`, `rfStack` | crustal and slab structure, Vp/Vs, deep fluid change |
| Deep tremor | continuous | network waveforms | tremor rate `Sample`, episode `HazardEvent`, `tremorCatalog` | slow slip on the deep interface |
| GNSS | daily and high-rate | EarthScope NOTA positions | displacement and strain `Sample`, `gnssSeries` | crustal deformation, slow-slip surface reversal |

EarthScope is the source layer beneath this table, not a row in it. PNSN and ONC supply regional and offshore stations.

### The Cascadia payoff: an observable slow-slip composite

Deep tremor, a GNSS surface-displacement reversal, and a dv/v change are three views of one Episodic Tremor and Slip event on the deep Cascadia interface. The plan fuses them in one `CompositeMonitor` emitting `cascadia.slowSlipIndex`, and adds offshore seafloor geodesy (bottom pressure and GNSS-Acoustic) so the index sees the offshore updip portion of the megathrust where the tsunamigenic slip sits, not just the onshore downdip edge that land GNSS resolves. ETS in northern Cascadia recurs near a 14-month interval, so this index is genuinely trackable and is a real leading indicator of slow slip. Integrity boundary: slow slip is observable and quasi-periodic and loads the locked megathrust, but it is not a deterministic predictor of a great earthquake. The contract carries `isPrediction: false`, and the UI and agent describe it as ongoing slow slip, never a countdown.

## Weather and hydromet integration

This is the one domain that is allowed to predict, because numerical weather prediction is calibrated and skillful. The discipline is the contract split: observations and issued warnings are `HazardEvent` records, model output is a `Forecast`. They never mix.

| Product | Contract | Source | Role |
|---------|----------|--------|------|
| Station observations | `Sample` | NWS | current conditions |
| Issued warnings | `HazardEvent` (officialSource) | NWS alerts API | official, mirror only |
| Model forecasts | `Forecast` | HRRR, GFS, ECMWF | predictive, with stated skill |
| Radar | `GeoProduct` (radarSweep) | NEXRAD | precipitation field on the globe |
| Marine wind and waves | `Sample`, `Forecast` | WaveWatch III | vessel and ocean-mixing forcing |
| Storm surge and tides | `Sample`, `Forecast` | NOAA surge, Tides | coastal-flood forcing |
| Atmospheric river | metric and `Forecast` | model IVT | the region's signature winter hazard |
| Streamflow | `Sample` on `riverGauge` | USGS NWIS, Environment Canada | flood state |
| Snow water equivalent | `Sample` | SNOTEL | rain-on-snow setup |

## Offshore and marine geophysics integration

The Cascadia megathrust and the tsunami source are offshore, so a twin that stops sensing at the coastline is blind to where its defining hazard originates. This tier extends the solid earth and ocean state past the shelf. Like the others, everything reduces to the shared contracts.

| Product | Cadence | Source | Emits | Role |
|---------|---------|--------|-------|------|
| Seafloor pressure (vertical) | continuous | ONC, OOI bottom pressure | `Sample` | offshore vertical deformation, Axial inflation |
| GNSS-Acoustic (horizontal) | campaign | seafloor sites | `gnssAcoustic` | offshore strain into the slow-slip composite |
| DART tsunami | continuous | NDBC buoys | `Sample`, tsunami `HazardEvent` | the offshore tsunami sensor |
| Offshore OBS | continuous and archived | ONC, OOI, Cascadia Initiative via EarthScope | folds into FDSN | rebalances dv/v and tremor offshore |
| Axial inflation | continuous | OOI Cabled Array | `Sample`, labeled threshold readout | the one skillful volcanic forecast, scoped |
| Satellite ocean state | daily | PODAAC, Coral Reef Watch, Copernicus | `sstField`, MHW metric | marine heatwaves, upwelling |
| Shelf hypoxia and OA | continuous | OOI Oregon shelf, NANOOS | `Sample` | the Oregon dead zone into the calcifier nodes |
| Fishing effort and SAR | daily to weekly | Global Fishing Watch 4Wings | `fishingEffort`, `sarDetections` | offshore human pulse, fishing pressure |

Two honest limits. Seafloor geodesy is sparse and partly campaign-based, not a dense real-time network like land GNSS, so the offshore deformation signal is thinner and slower than the onshore one. And terrestrial AIS thins past the shelf, which is exactly why Global Fishing Watch matters here: its satellite AIS and SAR detections see the vessels, including the dark ones, that AISStream misses offshore.

The Axial nuance, restated because it is the one place the prediction line bends. Axial Seamount inflates to a fairly repeatable threshold before it erupts, and that has produced genuinely skillful eruption windows. The plan treats this as an explicitly labeled, evidence-based threshold readout with a window, never a precise date, never generalized to other volcanoes or to earthquakes. It is a `Sample` and a labeled state, not a `Forecast`.

## Compound hazards

This is why the twin exists rather than a set of separate dashboards. The region's signature risks are couplings, and the Cousin already models couplings, so the work is to make them spatial, live, and multi-physics by wiring atmosphere and hydrology into the existing graph as edges:

- Atmospheric river onto a burn scar drives the debris-flow and sediment term the Cousin already has.
- Rain on snow, the SNOTEL layer against an AR, drives a flood through the river-gauge nodes.
- Storm surge stacked on a king tide on rising sea level drives coastal flooding.
- Vessel noise from the AIS layer against orca foraging efficiency, an edge the Cousin already encodes.
- Fishing effort from Global Fishing Watch against salmon and groundfish, a fishing-mortality edge onto the prey base the resident orca depend on.
- Cascadia under all of it, where a great-earthquake scenario cascades into tsunami, liquefaction, and port and population exposure.

Each coupling is a `CausalEdge` with a mechanism and, where possible, a citation. Uncalibrated couplings are marked `calibrated: false`.

## Transboundary handling

Roughly half the data is United States and half Canadian, under two regimes, and Coast Salish sovereignty crosses the border. Tag every source and entity with jurisdiction. Reconcile units, datums, and cadences at ingest, not in the UI. Treaty and Usual and Accustomed data and sensitive ecological locations are flagged and handled with consent. The border is a data-engineering and ethics constraint, not a visual one. The twin renders one continuous region.

## Milestones

- M0, scaffold: Phase 0 complete. Monorepo, contracts including region and forecast, CI, three modes green, globe shell with one WorldView layer.
- M1, flagship vertical slice: one story wired end to end through every plane. This is the open decision (see below).
- M2, integration: all three modes work with the globe and live feeds. Weather forecasts render distinctly from events. The agent answers grounded questions spanning solid earth and weather. Compound-hazard couplings online.
- M3, hardening: calibrated baselines on real station noise, uncertainty everywhere, cost controls on 3D Tiles, jurisdiction and sovereignty enforcement, post-event records, forecast-skill display.

### Open decision: which flagship slice proves the twin

Pick one to wire first. Both touch every plane.

- Cascadia slow-slip and tremor: shows off the seismic depth. Tremor plus GNSS plus dv/v fuse into the slow-slip index, render on the globe, and the agent explains the ongoing ETS without forecasting a quake.
- Atmospheric river to flood: shows off weather and compound hazards. An AR forecast plus radar plus SNOTEL plus river gauges cascade into a flood setup through the Cousin couplings, with the forecast band rendered as forward-looking and skill-stated.
- Axial Seamount: shows off the offshore and marine-geophysics depth. Bottom-pressure inflation, seismicity, and the OOI Cabled Array on one offshore volcanic node, with the inflation threshold rendered as a labeled, windowed readout. It is the one place a solid-earth forecast is defensible, and it is a system you know firsthand.

## v1 definition of done

- Explorer, Research, and Policy all work, now able to open into the globe.
- The globe renders land and bathymetry, goes below the waterline, and shows at least one WorldView human-pulse layer and one geophysical layer on the shared clock.
- The chosen flagship slice runs end to end on real PNW data.
- A weather `Forecast` renders as forward-looking with a lead time and stated skill, visibly distinct from observed events.
- One compound-hazard coupling is live, driving a downstream ecology, port, or population node.
- At least one offshore layer is live below or beyond the shelf: seafloor pressure or GNSS-Acoustic feeding the slow-slip composite, a DART buoy, Axial inflation, or Global Fishing Watch SAR detections.
- One real inversion update flows from a fired event to a versioned, uncertainty-tagged volume on the globe.
- The agent answers a grounded question spanning solid earth and weather, relaying forecasts with skill and never phrasing a solid-earth signal as a forecast.
- No real secret committed. No commit carries Claude attribution. No em dashes in shipped copy.

## Risks and honest caveats

- The two-contract prediction line is the central integrity risk. Weather may forecast, the solid earth may not, and the contracts keep them apart. A polished command center invites over-reading, so this is load-bearing.
- This is the Pacific Northwest only. It is not a global system, and scope creep beyond OR, WA, BC is a v1 failure.
- It does not replace official warnings. It mirrors and contextualizes ShakeAlert, the NWS, and the tsunami centers, with `officialSource` set, and never presents itself as the authority.
- Transboundary data is two regimes and two sets of units and licenses. Reconcile at ingest. Sovereignty is consent, not a flag toggled after the fact.
- Cost: Google Photorealistic 3D Tiles is an Enterprise SKU. Cache aggressively, consider NASA GIBS or self-hosted tiles for heavy public traffic.
- The geocompute service is the one non-edge piece. Keep it small so it runs on modest hardware.
- Offshore data is thinner than onshore. Seafloor geodesy is sparse and partly campaign-based, not a dense real-time network, so offshore deformation is slower and less certain. Terrestrial AIS thins past the shelf, which is why Global Fishing Watch satellite AIS and SAR are the offshore vessel picture. State these limits in the UI rather than implying uniform coverage.
- Axial is the only solid-earth forecast the plan allows, scoped and labeled. Do not let it soften the no-forecast rule for earthquakes or other volcanoes.
- The line between an impressive demo and a real instrument is calibrated baselines, real inversions, and stated forecast skill, not a prettier overlay.
