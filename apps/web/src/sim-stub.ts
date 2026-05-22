/**
 * sim-stub: the Cousin model surface, reconstructed from the production
 * bundle at references/index-Bg7RT65S.js.
 *
 * What's real:
 *   - Entity ids and labels are lifted verbatim from the bundle (species,
 *     ports, terminals, tribes, scenarios) so click-throughs map to things
 *     the real Cousin actually represents.
 *
 * What's stub:
 *   - Coordinates are approximate centroids, sufficient to render a marker
 *     on the globe. They are NOT survey-grade and are marked accordingly.
 *   - Causal edges are seeded with the documented "hero cascade" and the
 *     carbonate chain; weights and lags are illustrative. Every edge carries
 *     calibrated: false until validated against the real engine or primary
 *     literature.
 *
 * Replace this file with a binding to the real Cousin engine when source
 * becomes available, preserving the SimModel interface so the rest of the
 * app does not change.
 */
import type { CausalEdge, Entity, EntityKind } from "@pnw/contracts";

export interface ScenarioSpec {
  id: string;
  label: string;
  /** Cousin domain prefix: ocean, marine, port, carbonate, infra, climate, governance, seismic. */
  domain: string;
}

export interface TraceResult {
  entityIds: string[];
  edges: CausalEdge[];
}

export interface SimModel {
  readonly entities: ReadonlyMap<string, Entity & { lonLat: readonly [number, number] }>;
  readonly edges: ReadonlyArray<CausalEdge>;
  readonly scenarios: ReadonlyArray<ScenarioSpec>;
  /** Walk causal edges outward from an entity. */
  trace(entityId: string, depth?: number): TraceResult;
  /** Look up by id. */
  get(entityId: string): (Entity & { lonLat: readonly [number, number] }) | undefined;
}

type Seed = Omit<Entity, "id"> & {
  id: string;
  lonLat: readonly [number, number];
  kind: EntityKind;
};

// Approximate centroids. Survey-grade positions come with the real Cousin.
const SEEDS: Seed[] = [
  // Orca pods (positions deliberately approximate; resident pods are sensitive)
  { id: "orca.srkw", kind: "orcaPod", label: "Southern Resident Killer Whales", lonLat: [-123.1, 48.5], sensitive: true },
  { id: "orca.bigg", kind: "orcaPod", label: "Bigg's (Transient) Killer Whales", lonLat: [-123.5, 48.8] },

  // Salmon runs (mouth of natal rivers)
  { id: "salmon.chinook.fraser", kind: "salmonRun", label: "Fraser Chinook", jurisdiction: "CA-BC", lonLat: [-123.1, 49.1] },
  { id: "salmon.chinook.skagit", kind: "salmonRun", label: "Skagit Chinook", jurisdiction: "US-WA", lonLat: [-122.4, 48.3] },
  { id: "salmon.coho.snohomish", kind: "salmonRun", label: "Snohomish Coho", jurisdiction: "US-WA", lonLat: [-122.2, 48.0] },
  { id: "salmon.pink.fraser", kind: "salmonRun", label: "Fraser Pink", jurisdiction: "CA-BC", lonLat: [-123.1, 49.1] },
  { id: "salmon.chum.hood", kind: "salmonRun", label: "Hood Canal Chum", jurisdiction: "US-WA", lonLat: [-123.0, 47.6] },
  { id: "salmon.sockeye.fraser", kind: "salmonRun", label: "Fraser Sockeye", jurisdiction: "CA-BC", lonLat: [-123.1, 49.1] },

  // Forage fish + habitat (anchors for the hero cascade)
  { id: "forage.herring.cherrypoint", kind: "fishery", label: "Cherry Point Herring", jurisdiction: "US-WA", lonLat: [-122.75, 48.86] },
  { id: "habitat.eelgrass.boundarybay", kind: "fishery", label: "Boundary Bay Eelgrass", jurisdiction: "CA-BC", lonLat: [-122.9, 49.0] },
  { id: "habitat.eelgrass.hoodcanal", kind: "fishery", label: "Hood Canal Eelgrass", jurisdiction: "US-WA", lonLat: [-123.0, 47.5] },
  { id: "habitat.estuary.duwamish", kind: "fishery", label: "Duwamish Estuary", jurisdiction: "US-WA", lonLat: [-122.32, 47.55] },
  { id: "habitat.estuary.fraser", kind: "fishery", label: "Fraser River Estuary", jurisdiction: "CA-BC", lonLat: [-123.2, 49.1] },

  // Ports
  { id: "port.vancouver", kind: "port", label: "Port of Vancouver", jurisdiction: "CA-BC", lonLat: [-123.10, 49.29] },
  { id: "port.seattle", kind: "port", label: "Port of Seattle", jurisdiction: "US-WA", lonLat: [-122.34, 47.60] },
  { id: "port.tacoma", kind: "port", label: "Port of Tacoma", jurisdiction: "US-WA", lonLat: [-122.42, 47.27] },
  { id: "port.bellingham", kind: "port", label: "Port of Bellingham", jurisdiction: "US-WA", lonLat: [-122.51, 48.75] },
  { id: "port.bremerton", kind: "port", label: "Port of Bremerton", jurisdiction: "US-WA", lonLat: [-122.62, 47.57] },
  { id: "port.victoria", kind: "port", label: "Port of Victoria", jurisdiction: "CA-BC", lonLat: [-123.37, 48.43] },
  { id: "port.anacortes", kind: "port", label: "Port of Anacortes", jurisdiction: "US-WA", lonLat: [-122.61, 48.51] },

  // Vancouver terminals (drive port economics)
  { id: "term.van.centerm", kind: "offshoreInfra", label: "Vancouver Centerm Terminal", jurisdiction: "CA-BC", lonLat: [-123.08, 49.29] },
  { id: "term.van.deltaport", kind: "offshoreInfra", label: "Deltaport Terminal", jurisdiction: "CA-BC", lonLat: [-123.13, 49.01] },
  { id: "term.van.neptune", kind: "offshoreInfra", label: "Neptune Terminal", jurisdiction: "CA-BC", lonLat: [-123.04, 49.31] },
  { id: "term.van.westshore", kind: "offshoreInfra", label: "Westshore (coal) Terminal", jurisdiction: "CA-BC", lonLat: [-123.15, 49.00] },
  { id: "term.van.transmtn", kind: "offshoreInfra", label: "Trans Mountain Terminal", jurisdiction: "CA-BC", lonLat: [-122.93, 49.29] },
  { id: "term.van.vanterm", kind: "offshoreInfra", label: "Vanterm Terminal", jurisdiction: "CA-BC", lonLat: [-123.09, 49.29] },

  // Tribes / First Nations (label-only marker; treaty + UAFA scope is sovereign)
  { id: "tribe.swinomish", kind: "tribe", label: "Swinomish Indian Tribal Community", jurisdiction: "US-WA", lonLat: [-122.51, 48.40], sovereign: true },
  { id: "tribe.tulalip", kind: "tribe", label: "Tulalip Tribes", jurisdiction: "US-WA", lonLat: [-122.30, 48.07], sovereign: true },
  { id: "tribe.snoqualmie", kind: "tribe", label: "Snoqualmie Indian Tribe", jurisdiction: "US-WA", lonLat: [-121.83, 47.53], sovereign: true },
  { id: "tribe.muckleshoot", kind: "tribe", label: "Muckleshoot Indian Tribe", jurisdiction: "US-WA", lonLat: [-122.14, 47.27], sovereign: true },

  // Climate / economy drivers (no geometry; centered for visualization)
  { id: "driver.fred.housing", kind: "climateDriver", label: "FRED housing-pressure index", lonLat: [-122.7, 48.0] },
  { id: "driver.development_pressure", kind: "climateDriver", label: "Regional development pressure", lonLat: [-122.7, 48.0] },
  { id: "driver.shoreline_armoring", kind: "infrastructure", label: "Shoreline armoring", lonLat: [-122.7, 47.9] },

  // Carbonate chain anchors
  { id: "driver.atm_co2", kind: "climateDriver", label: "Atmospheric CO₂ forcing", lonLat: [-122.7, 47.6] },
  { id: "state.ocean_dic", kind: "climateDriver", label: "Ocean DIC (carbonate state)", lonLat: [-122.9, 47.6] },
  { id: "state.aragonite_sat", kind: "climateDriver", label: "Aragonite saturation", lonLat: [-122.9, 47.7] },
  { id: "state.shellfish_larvae", kind: "fishery", label: "Shellfish larvae viability", lonLat: [-122.9, 47.7] },

  // Hazards as Entities (so seismic Entities can light up affected nodes)
  { id: "hazard.cascadia_m9", kind: "fault", label: "Cascadia Subduction Zone (M9 scenario)", lonLat: [-125.0, 46.0] },
  { id: "volcano.axial", kind: "volcano", label: "Axial Seamount", lonLat: [-130.0, 45.95] },
];

const ENTITY_MAP = new Map<string, Entity & { lonLat: readonly [number, number] }>(
  SEEDS.map((s) => [s.id, s as Entity & { lonLat: readonly [number, number] }]),
);

// Hero cascade + carbonate chain + Cascadia downstream.
// Mechanisms named to match the Cousin coupling vocabulary (drives/affects/
// feedback/cascades). Every edge calibrated: false until validated.
const EDGE_SEEDS: CausalEdge[] = [
  // Hero cascade: FRED housing → shoreline armoring → eelgrass → herring → Chinook → SRKW
  e("driver.fred.housing", "driver.development_pressure", 1, 0.7, 30, "drives", "FRED housing-pressure index drives regional development pressure"),
  e("driver.development_pressure", "driver.shoreline_armoring", 1, 0.6, 90, "drives", "Development pressure increases shoreline armoring"),
  e("driver.shoreline_armoring", "habitat.eelgrass.boundarybay", -1, 0.5, 180, "affects", "Armoring reduces nearshore eelgrass extent"),
  e("driver.shoreline_armoring", "habitat.eelgrass.hoodcanal", -1, 0.5, 180, "affects", "Armoring reduces nearshore eelgrass extent"),
  e("habitat.eelgrass.boundarybay", "forage.herring.cherrypoint", 1, 0.6, 365, "drives", "Eelgrass supports Pacific herring spawn substrate"),
  e("forage.herring.cherrypoint", "salmon.chinook.fraser", 1, 0.5, 180, "drives", "Herring forage availability affects Chinook condition"),
  e("forage.herring.cherrypoint", "salmon.chinook.skagit", 1, 0.5, 180, "drives", "Herring forage availability affects Chinook condition"),
  e("salmon.chinook.fraser", "orca.srkw", 1, 0.8, 60, "drives", "Chinook is the primary SRKW prey base"),
  e("salmon.chinook.skagit", "orca.srkw", 1, 0.6, 60, "drives", "Chinook is the primary SRKW prey base"),

  // Carbonate chain: atm CO₂ → ocean DIC → aragonite saturation → shellfish larvae
  e("driver.atm_co2", "state.ocean_dic", 1, 0.7, 30, "drives", "Atmospheric CO₂ drives ocean DIC uptake"),
  e("state.ocean_dic", "state.aragonite_sat", -1, 0.6, 30, "affects", "Higher DIC lowers aragonite saturation"),
  e("state.aragonite_sat", "state.shellfish_larvae", 1, 0.7, 30, "drives", "Aragonite saturation governs shellfish larvae viability"),

  // Estuary support of salmon
  e("habitat.estuary.duwamish", "salmon.chinook.skagit", 1, 0.3, 365, "affects", "Estuary rearing supports Chinook smolt survival"),
  e("habitat.estuary.fraser", "salmon.chinook.fraser", 1, 0.4, 365, "affects", "Estuary rearing supports Chinook smolt survival"),
  e("habitat.estuary.fraser", "salmon.sockeye.fraser", 1, 0.4, 365, "affects", "Estuary rearing supports sockeye smolt survival"),
  e("habitat.estuary.fraser", "salmon.pink.fraser", 1, 0.3, 365, "affects", "Estuary rearing supports pink smolt survival"),

  // Tribal co-management edges (illustrative, calibrated: false)
  e("tribe.swinomish", "habitat.estuary.duwamish", 1, 0.4, 365, "feedback", "Co-management improves estuary outcomes"),
  e("tribe.tulalip", "salmon.chinook.skagit", 1, 0.4, 365, "feedback", "Co-management contributes to Chinook recovery"),
  e("tribe.muckleshoot", "salmon.chinook.skagit", 1, 0.4, 365, "feedback", "Co-management contributes to Chinook recovery"),

  // Cascadia M9 cascade: rupture → ports + terminals + cities
  e("hazard.cascadia_m9", "port.seattle", -1, 0.9, 0, "cascades", "M9 cascades into port damage and throughput collapse"),
  e("hazard.cascadia_m9", "port.tacoma", -1, 0.9, 0, "cascades", "M9 cascades into port damage and throughput collapse"),
  e("hazard.cascadia_m9", "port.bellingham", -1, 0.7, 0, "cascades", "M9 cascades into port damage and throughput collapse"),
  e("hazard.cascadia_m9", "port.bremerton", -1, 0.8, 0, "cascades", "M9 cascades into port damage and throughput collapse"),
  e("hazard.cascadia_m9", "port.victoria", -1, 0.7, 0, "cascades", "M9 cascades into port damage and throughput collapse"),
  e("hazard.cascadia_m9", "port.vancouver", -1, 0.5, 0, "cascades", "M9 cascades into Vancouver port damage (more distal)"),

  // Vessel-noise feedback (vessel Entities are dynamic; selecting any vessel
  // can fall back to this edge from the vessel category):
  e("orca.srkw", "forage.herring.cherrypoint", 1, 0.2, 30, "feedback", "Whale presence indirectly tied to forage health"),
];

function e(
  source: string,
  target: string,
  polarity: 1 | -1,
  weight: number,
  lagDays: number,
  mechanism: string,
  citation?: string,
): CausalEdge {
  return {
    id: `${source}->${target}`,
    sourceId: source,
    targetId: target,
    polarity,
    weight,
    lagDays,
    mechanism,
    citation,
    calibrated: false,
  };
}

const SCENARIOS: ScenarioSpec[] = [
  { id: "cascadia_m9", label: "Cascadia M9 rupture", domain: "seismic" },
  { id: "big_one_plus_climate", label: "M9 layered on 2040 climate", domain: "seismic" },
  { id: "seismic_preparedness", label: "Increased seismic preparedness", domain: "infrastructure" },
  { id: "cherry_point_coal", label: "Cherry Point coal terminal", domain: "port" },
  { id: "commencement_bay_superfund", label: "Commencement Bay Superfund", domain: "infrastructure" },
  { id: "ag_nutrient_mgmt", label: "Agricultural nutrient management", domain: "ocean" },
  { id: "eco_eelgrass_boundarybay", label: "Eelgrass restoration: Boundary Bay", domain: "marine" },
  { id: "eco_eelgrass_hoodcanal", label: "Eelgrass restoration: Hood Canal", domain: "marine" },
  { id: "eco_estuary_duwamish", label: "Estuary restoration: Duwamish", domain: "marine" },
  { id: "eco_estuary_fraser", label: "Estuary restoration: Fraser", domain: "marine" },
  { id: "eco_herring_cherrypoint", label: "Herring restoration: Cherry Point", domain: "marine" },
  { id: "tribal_tulalip_estuary", label: "Tulalip estuary co-management", domain: "governance" },
  { id: "tribal_swinomish_estuary", label: "Swinomish estuary co-management", domain: "governance" },
];

export function createSimStub(): SimModel {
  const adjacencyOut = new Map<string, CausalEdge[]>();
  for (const edge of EDGE_SEEDS) {
    const list = adjacencyOut.get(edge.sourceId) ?? [];
    list.push(edge);
    adjacencyOut.set(edge.sourceId, list);
  }

  function trace(entityId: string, depth = 3): TraceResult {
    const seen = new Set<string>([entityId]);
    const collected: CausalEdge[] = [];
    let frontier: string[] = [entityId];
    for (let i = 0; i < depth; i++) {
      const next: string[] = [];
      for (const id of frontier) {
        const out = adjacencyOut.get(id) ?? [];
        for (const edge of out) {
          if (!seen.has(edge.targetId)) {
            seen.add(edge.targetId);
            next.push(edge.targetId);
            collected.push(edge);
          }
        }
      }
      if (next.length === 0) break;
      frontier = next;
    }
    return { entityIds: [...seen], edges: collected };
  }

  return {
    entities: ENTITY_MAP,
    edges: EDGE_SEEDS,
    scenarios: SCENARIOS,
    trace,
    get: (id) => ENTITY_MAP.get(id),
  };
}

/** Shared singleton; the entire app reads from one Cousin model. */
export const sim: SimModel = createSimStub();
