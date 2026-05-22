import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Viewer as CesiumViewer,
  Cartesian3,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
  defined,
  Math as CesiumMath,
  Rectangle,
} from "cesium";
import { createEventBus, PNW } from "@pnw/contracts";
import { configureCesium, loadGoogleTileset, createDarkBasemap } from "@/lib/cesium-config";
import { DEFAULT_CAMERA } from "@/lib/constants";
import { useEarthquakeData } from "@/hooks/useEarthquakeData";
import { useAISData } from "@/hooks/useAISData";
import { useSimClock } from "@/hooks/useSimClock";
import type { Observation as SimObservation } from "@pnw/sim";
import { BasinHealthLayer } from "@/layers/BasinHealthLayer";
import type { BasinVar } from "@/components/panels/LayerPanel";
import { sim } from "@/sim-stub";
import { useFireData } from "@/hooks/useFireData";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useGnssData } from "@/hooks/useGnssData";
import { useRoadData } from "@/hooks/useRoadData";
import { useAlerts } from "@/hooks/useAlerts";
import { useFilterMode } from "@/hooks/useFilterMode";
import { FilterPipeline } from "@/filters/FilterPipeline";
import { GridOverlay } from "@/layers/GridOverlay";
import { EarthquakeLayer } from "@/layers/EarthquakeLayer";
import { ShipLayer } from "@/layers/ShipLayer";
import { FireLayer } from "@/layers/FireLayer";
import { WeatherLayer } from "@/layers/WeatherLayer";
import { GnssLayer } from "@/layers/GnssLayer";
import { RoadParticleLayer } from "@/layers/RoadParticleLayer";
import { CousinOverlay } from "@/layers/CousinOverlay";
import { Crosshair } from "@/components/hud/Crosshair";
import { DataReadout } from "@/components/hud/DataReadout";
import { StatusBar } from "@/components/hud/StatusBar";
import { LayerPanel } from "@/components/panels/LayerPanel";
import type { LayerState } from "@/components/panels/LayerPanel";
import { FilterPanel } from "@/components/panels/FilterPanel";
import { SystemDashboard } from "@/components/panels/SystemDashboard";
import { ScenariosPanel } from "@/components/panels/ScenariosPanel";
import { BasinDetailPanel } from "@/components/panels/BasinDetailPanel";
import { TimeControlPanel } from "@/components/panels/TimeControlPanel";
import { QuakeDetailPanel } from "@/components/panels/QuakeDetailPanel";
import { ShipDetailPanel } from "@/components/panels/ShipDetailPanel";
import { FireDetailPanel } from "@/components/panels/FireDetailPanel";
import { WeatherDetailPanel } from "@/components/panels/WeatherDetailPanel";
import { StationDetailPanel } from "@/components/panels/StationDetailPanel";
import { AlertToast } from "@/components/alerts/AlertToast";
import type { Earthquake } from "@/types/usgs";
import type { Vessel } from "@/types/ais";
import type { FireHotspot } from "@/types/firms";
import type { WeatherAlert } from "@/types/nws";
import type { GnssStation } from "@/types/gnss";

configureCesium();

/** Rectangle covering the PNW bbox, used to clamp camera moves. */
const PNW_RECT = Rectangle.fromDegrees(
  PNW.bbox.west,
  PNW.bbox.south,
  PNW.bbox.east,
  PNW.bbox.north,
);

/** Don't let the camera back out past this altitude; bounds tile cost. */
const MAX_ZOOM_OUT_METERS = 1_500_000;

export function GlobeViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const [viewer, setViewer] = useState<CesiumViewer | null>(null);

  // The selection / clock bus shared with the Cousin overlay and any future
  // 2D Cousin pane. Stable across renders.
  const bus = useMemo(() => createEventBus(), []);

  const [layers, setLayers] = useState<LayerState>({
    grid: false,
    earthquakes: true,
    ships: false,
    fires: false,
    weather: true,
    gnss: true,
    roads: false,
    cousin: true,
    photoreal: false,
    basins: true,
  });
  const [basinVar, setBasinVar] = useState<BasinVar>("SST");
  const [selectedBasin, setSelectedBasin] = useState<string | null>(null);
  const [tickIntervalMs, setTickIntervalMs] = useState(30_000);
  const [simPaused, setSimPaused] = useState(false);

  const { mode: filterMode, setMode: setFilterMode } = useFilterMode();

  const quakeData = useEarthquakeData(true);
  const aisData = useAISData(true);
  const fireData = useFireData(true);
  const weatherData = useWeatherData(true);
  const gnssData = useGnssData(true);
  const roadData = useRoadData(layers.roads, viewer);

  const { alerts, dismiss: dismissAlert } = useAlerts({
    earthquakes: quakeData.earthquakes,
    weatherAlerts: weatherData.alerts,
  });

  // Sim clock: ticks the Cousin engine every 30s (one simulated month).
  // Realtime feeds are converted to engine Observations here so the engine's
  // Newtonian-relaxation assimilation nudges its state toward what we see.
  // Currently wired: AIS vessel count → underwater noise proxy.
  // Solid-earth signals (quakes, GNSS) are intentionally NOT fed back — that
  // would violate the two-contract prediction principle (observe-only).
  useSimClock({
    intervalMs: tickIntervalMs,
    enabled: !simPaused,
    getObservations: () => {
      const obs: SimObservation[] = [];
      // Vessel-density → noise: more underway vessels = more broadband noise.
      // Map count linearly between 100dB (quiet) and 145dB (saturated traffic).
      const movingVessels = aisData.vessels.filter((v) => v.sog > 2).length;
      if (movingVessels > 0) {
        const dB = Math.min(145, 100 + movingVessels * 0.3);
        obs.push({ variable: "noiseLevel", value: dB, basin: "mainBasin" });
      }
      return obs;
    },
  });

  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);
  const [selectedShip, setSelectedShip] = useState<Vessel | null>(null);
  const [selectedFire, setSelectedFire] = useState<FireHotspot | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);
  const [selectedStation, setSelectedStation] = useState<GnssStation | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const clearSelections = useCallback((except?: string) => {
    if (except !== "quake") setSelectedQuake(null);
    if (except !== "ship") setSelectedShip(null);
    if (except !== "fire") setSelectedFire(null);
    if (except !== "alert") setSelectedAlert(null);
    if (except !== "station") setSelectedStation(null);
  }, []);

  // Initialize Cesium viewer, frame on PNW, lock camera bounds.
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const v = new CesiumViewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      vrButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      creditContainer: document.createElement("div"),
      msaaSamples: 4,
    });

    v.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        DEFAULT_CAMERA.longitude,
        DEFAULT_CAMERA.latitude,
        DEFAULT_CAMERA.height,
      ),
      duration: 0,
    });

    // Cap how far the user can zoom out so Google 3D Tiles only stream PNW.
    v.scene.screenSpaceCameraController.maximumZoomDistance = MAX_ZOOM_OUT_METERS;

    // Dark CartoDB road basemap as the default visual. Photorealistic 3D is
    // an opt-in toggle (handled by the photoreal effect below).
    v.imageryLayers.removeAll();
    const baseLayer = v.imageryLayers.addImageryProvider(createDarkBasemap());
    // CartoDB Dark Matter ships near-black. Lift it so roads/coastlines read
    // without losing the dark aesthetic.
    baseLayer.brightness = 1.8;
    baseLayer.contrast = 1.2;
    baseLayer.gamma = 0.9;

    v.scene.globe.depthTestAgainstTerrain = false;

    viewerRef.current = v;
    setViewer(v);

    return () => {
      if (!v.isDestroyed()) v.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Photorealistic 3D tileset toggle. Lazy-loads on first enable, then
  // shows/hides via primitive.show on subsequent toggles so we don't re-fetch.
  const tilesetRef = useRef<Awaited<ReturnType<typeof loadGoogleTileset>>>(null);
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    if (!layers.photoreal) {
      if (tilesetRef.current) tilesetRef.current.show = false;
      return;
    }
    if (tilesetRef.current) {
      tilesetRef.current.show = true;
      return;
    }
    let cancelled = false;
    loadGoogleTileset().then((tileset) => {
      if (cancelled || !tileset || viewer.isDestroyed()) return;
      viewer.scene.primitives.add(tileset);
      tilesetRef.current = tileset;
    });
    return () => {
      cancelled = true;
    };
  }, [viewer, layers.photoreal]);

  // Clamp the camera back inside the PNW bbox when it wanders.
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const onMoveEnd = () => {
      if (viewer.isDestroyed()) return;
      const carto = viewer.camera.positionCartographic;
      const lat = CesiumMath.toDegrees(carto.latitude);
      const lon = CesiumMath.toDegrees(carto.longitude);
      const outOfBounds =
        lon < PNW.bbox.west ||
        lon > PNW.bbox.east ||
        lat < PNW.bbox.south ||
        lat > PNW.bbox.north;
      if (outOfBounds) {
        viewer.camera.flyTo({
          destination: Rectangle.clone(PNW_RECT),
          duration: 0.6,
        });
      }
    };
    viewer.camera.moveEnd.addEventListener(onMoveEnd);
    return () => {
      if (!viewer.isDestroyed()) viewer.camera.moveEnd.removeEventListener(onMoveEnd);
    };
  }, [viewer]);

  // Entity click handler. On a hit, set the detail panel state AND emit a
  // selection.set event on the bus so the Cousin overlay can trace edges.
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(
      (click: { position: import("cesium").Cartesian2 }) => {
        const picked = viewer.scene.pick(click.position);
        if (defined(picked) && picked.id) {
          const entity = picked.id;
          const id = typeof entity.id === "string" ? entity.id : "";

          if (id.startsWith("quake-")) {
            const qId = id.replace("quake-", "");
            const q = quakeData.earthquakes.find((x) => x.id === qId);
            if (q) {
              clearSelections("quake");
              setSelectedQuake(q);
              setSelectedEntityId(`quake:${q.id}`);
              bus.emit({ type: "selection.set", entityId: `quake:${q.id}` });
            }
          } else if (id.startsWith("ship-")) {
            const mmsi = Number(id.replace("ship-", ""));
            const s = aisData.vessels.find((v) => v.mmsi === mmsi);
            if (s) {
              clearSelections("ship");
              setSelectedShip(s);
              setSelectedEntityId(`vessel:${s.mmsi}`);
              bus.emit({ type: "selection.set", entityId: `vessel:${s.mmsi}` });
            }
          } else if (id.startsWith("fire-")) {
            const idx = Number(id.replace("fire-", ""));
            const f = fireData.fires[idx];
            if (f) {
              clearSelections("fire");
              setSelectedFire(f);
              setSelectedEntityId(`fire:${idx}`);
              bus.emit({ type: "selection.set", entityId: `fire:${idx}` });
            }
          } else if (id.startsWith("wx-")) {
            const wxId = id.replace("wx-", "");
            const a = weatherData.alerts.find((x) => x.id === wxId);
            if (a) {
              clearSelections("alert");
              setSelectedAlert(a);
              setSelectedEntityId(`weather:${a.id}`);
              bus.emit({ type: "selection.set", entityId: `weather:${a.id}` });
            }
          } else if (id.startsWith("gnss-station-")) {
            const sid = id.replace("gnss-station-", "");
            const st = gnssData.stations.find((x) => x.id === sid);
            if (st) {
              clearSelections("station");
              setSelectedStation(st);
              setSelectedEntityId(`gnss:${st.id}`);
              bus.emit({ type: "selection.set", entityId: `gnss:${st.id}` });
            }
          } else if (id.startsWith("cousin-")) {
            const cId = id.replace("cousin-", "");
            setSelectedEntityId(cId);
            bus.emit({ type: "selection.set", entityId: cId });
          } else if (id.startsWith("basin-")) {
            setSelectedBasin(id.replace("basin-", ""));
          }
        }
      },
      ScreenSpaceEventType.LEFT_CLICK,
    );

    return () => {
      if (!handler.isDestroyed()) handler.destroy();
    };
  }, [viewer, quakeData.earthquakes, aisData.vessels, fireData.fires, weatherData.alerts, gnssData.stations, bus, clearSelections]);

  const toggleLayer = useCallback((layer: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const feeds = [
    { label: "QUAKES", active: quakeData.count > 0, error: !!quakeData.error },
    { label: "SHIPS", active: aisData.count > 0, error: !!aisData.error },
    { label: "FIRES", active: fireData.count > 0, error: !!fireData.error },
    { label: "WX", active: weatherData.count > 0, error: false },
    { label: "GNSS", active: gnssData.count > 0, error: !!gnssData.error },
  ];

  const hasDetailOpen =
    selectedQuake || selectedShip || selectedFire || selectedAlert || selectedStation;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {layers.earthquakes && (
        <EarthquakeLayer earthquakes={quakeData.earthquakes} viewer={viewer} />
      )}
      {layers.ships && <ShipLayer vessels={aisData.vessels} viewer={viewer} />}
      {layers.fires && <FireLayer fires={fireData.fires} viewer={viewer} />}
      {layers.weather && (
        <WeatherLayer alerts={weatherData.alerts} viewer={viewer} />
      )}
      {layers.gnss && <GnssLayer stations={gnssData.stations} viewer={viewer} />}
      {layers.roads && <RoadParticleLayer roads={roadData.roads} viewer={viewer} />}
      {layers.basins && (
        <BasinHealthLayer viewer={viewer} variable={basinVar} tick={sim.result} />
      )}
      {layers.cousin && (
        <CousinOverlay viewer={viewer} selectedEntityId={selectedEntityId} />
      )}
      <GridOverlay viewer={viewer} enabled={layers.grid} />

      <FilterPipeline viewer={viewer} mode={filterMode} />

      <div className="hud-overlay">
        <StatusBar feeds={feeds} filterMode={filterMode} />
        <Crosshair />
        <DataReadout viewer={viewer} filterMode={filterMode} />

        <LayerPanel
          layers={layers}
          onToggle={toggleLayer}
          onRefreshRoads={roadData.refresh}
          roadsLoading={roadData.loading}
          roadsDownloadProgress={roadData.download.progress}
          basinVar={basinVar}
          onBasinVarChange={setBasinVar}
        />
        <FilterPanel mode={filterMode} onChange={setFilterMode} />
        {layers.cousin && <SystemDashboard />}
        <ScenariosPanel />
        <BasinDetailPanel basinId={selectedBasin} onClose={() => setSelectedBasin(null)} />
        <TimeControlPanel
          intervalMs={tickIntervalMs}
          onIntervalChange={setTickIntervalMs}
          paused={simPaused}
          onPausedChange={setSimPaused}
        />

        <QuakeDetailPanel
          earthquake={selectedQuake}
          onClose={() => setSelectedQuake(null)}
        />
        <ShipDetailPanel
          vessel={selectedShip}
          onClose={() => setSelectedShip(null)}
        />
        <FireDetailPanel fire={selectedFire} onClose={() => setSelectedFire(null)} />
        <WeatherDetailPanel
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
        <StationDetailPanel
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
        />

        <AlertToast alerts={alerts} onDismiss={dismissAlert} viewer={viewer} />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          fontSize: 9,
          color: "var(--color-text-dim)",
          textAlign: "right",
          lineHeight: 1.6,
          pointerEvents: "none",
          display: hasDetailOpen ? "none" : "block",
        }}
      >
        <div>[0] Standard [1] CRT [2] NVG [3] FLIR [4] Cel</div>
      </div>
    </div>
  );
}
