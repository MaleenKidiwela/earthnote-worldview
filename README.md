# PNW Twin

A live, regional digital twin of the Pacific Northwest (Oregon, Washington,
British Columbia) on a Cesium globe with Google Photorealistic 3D Tiles. Live
data layers are clipped to the region and connected to a Cousin causal-graph
overlay so selecting any globe object traces what it affects.

See `CLAUDE.md` for the project's standing constraints (the two-contract
prediction principle in particular) and `ULTRA_PLAN.md` for the long plan.

## Live layers

- **Earthquakes** — USGS FDSN events, PNW bbox.
- **AIS vessels** — AISStream backend collector, PNW-clipped.
- **Weather alerts** — NWS active alerts (OR/WA + Pacific NW marine zones).
- **Wildfire hotspots** — NASA FIRMS VIIRS, PNW-clipped.
- **GNSS deformation** — NOTA/WCDA station velocities (seed values flagged
  `calibrated: false` until paired with a live provider).
- **Road particles** — OSM motorway/trunk/primary via Overpass, animated as
  flowing particles on a `PointPrimitiveCollection`.
- **Cousin graph overlay** — entities and causal edges reconstructed from the
  Salish Sea Cousin production bundle. Clicking any live object emits to a
  shared event bus and traces the Cousin subgraph affected.

## Methods ingest seam

Externally-developed seismic pipelines (dv/v, HVSR, receiver functions) POST
to `/api/methods/{sample,geoproduct,event}` and arrive as
`contracts/Sample | GeoProduct | HazardEvent` records. The twin renders what
arrives; it does not build those pipelines.

## Toolchain

- Node 20+
- pnpm 9
- (Python service from earlier phases removed; the methods seam is the
  external-pipeline boundary.)

## Layout

```
apps/web                Cesium globe, layers, hooks, sim-stub, dev server proxy
apps/web/server         AIS collector, methods-ingest in-memory store
packages/contracts      Shared TypeScript types — the synchronization point
references              Cousin production bundle and source notes
```

## Dev

```
pnpm i
cp apps/web/.env.example apps/web/.env.local   # add VITE_CESIUM_ION_TOKEN, VITE_AISSTREAM_API_KEY
pnpm --filter web dev
```

## Two-contract prediction principle (load-bearing)

- Solid earth (quakes, GNSS, Axial inflation, methods ingest): observed and
  characterized only. `HazardEvent.isPrediction = false` always.
- Weather (NWS): observations and issued warnings are `HazardEvent` with
  `officialSource: 'NWS'`. Numerical model forecasts, when added, ride the
  `Forecast` contract with stated lead time and skill.

The two contracts never mix.
