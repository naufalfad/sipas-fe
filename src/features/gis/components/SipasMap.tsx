/**
 * ============================================================================
 * SIPAS MAP — Immersive 3D GIS Canvas [MODULARIZED v3.0]
 * ============================================================================
 * Engine  : MapLibre GL JS (WebGL, open-source)
 * Wrapper : react-map-gl v7
 * ============================================================================
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import Map, {
  Source,
  Marker,
  Popup,
  type MapRef,
  type MapLayerMouseEvent,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toast } from 'sonner';

import { useGisUIStore } from '@/app/store/useGisUIStore';
import { ClusterMarker, PinMarker } from './markers';
import { SpatialGeoJSONLayers } from './layers/SpatialGeoJSONLayers';
import { useSipasMapData, type ProcessedSubmission } from '../hooks/useSipasMapData';
import { useCustom3DLayer } from '../hooks/useCustom3DLayer';

// ─── Konstanta ─────────────────────────────────────────────────────────────────
const BOGOR_LNG = 106.8560;
const BOGOR_LAT = -6.4816;

const INITIAL_VIEW_STATE = {
  longitude: BOGOR_LNG,
  latitude: BOGOR_LAT,
  zoom: 11,
  pitch: 45,
  bearing: -10,
};

type MapViewState = typeof INITIAL_VIEW_STATE;

const REGIONAL_BOUNDS: [[number, number], [number, number]] = [
  [90.0, -15.0],   // SW: Samudra Hindia selatan Jawa
  [150.0, 15.0],   // NE: Pasifik timur Filipina
];

// ─── Basemap Style Factory ─────────────────────────────────────────────────────
const styleCache = new globalThis.Map<string, StyleSpecification>();

function buildRasterStyle(tileUrl: string, attribution: string): StyleSpecification {
  const cached = styleCache.get(tileUrl);
  if (cached) return cached;

  const style: StyleSpecification = {
    version: 8,
    sources: {
      'raster-base': {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution,
        maxzoom: 18,
      },
    },
    layers: [
      {
        id: 'raster-base-layer',
        type: 'raster',
        source: 'raster-base',
        paint: { 'raster-opacity': 1 },
      },
    ],
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  } as StyleSpecification;

  styleCache.set(tileUrl, style);
  return style;
}

function getMapStyle(activeBaseMap: string): StyleSpecification {
  switch (activeBaseMap) {
    case 'dark':
      return buildRasterStyle('https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', '© CartoDB');
    case 'satellite':
      return buildRasterStyle(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        '© Esri'
      );
    case 'street':
      return buildRasterStyle('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', '© Google');
    case 'voyager':
    default:
      return buildRasterStyle('https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', '© CartoDB');
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function calculateCentroid(polygon: [number, number][]): [number, number] {
  let totalLng = 0;
  let totalLat = 0;
  polygon.forEach((coord) => {
    const [a, b] = coord;
    if (a >= -15 && a <= 10 && b >= 90 && b <= 145) {
      totalLng += b;
      totalLat += a;
    } else {
      totalLng += a;
      totalLat += b;
    }
  });
  return [totalLng / polygon.length, totalLat / polygon.length];
}

// ─── KOMPONEN UTAMA ────────────────────────────────────────────────────────────
export default function SipasMap() {
  // ── Zustand State Subscriptions ──
  const activeLayers = useGisUIStore((s) => s.activeLayers);
  const activeBaseMap = useGisUIStore((s) => s.activeBaseMap);
  const mapOpacity = useGisUIStore((s) => s.mapOpacity);
  const selectedCompanyId = useGisUIStore((s) => s.selectedCompanyId);
  const is3DMode = useGisUIStore((s) => s.is3DMode);
  const isTerrainActive = useGisUIStore((s) => s.isTerrainActive);
  const flyToTarget = useGisUIStore((s) => s.flyToTarget);
  const mapPitch = useGisUIStore((s) => s.mapPitch);
  const mapBearing = useGisUIStore((s) => s.mapBearing);
  const isDroneLayerActive = useGisUIStore((s) => s.isDroneLayerActive);
  const droneLayerOpacity = useGisUIStore((s) => s.droneLayerOpacity);
  const spatialConflicts = useGisUIStore((s) => s.spatialConflicts);

  const setSelectedCompanyId = useGisUIStore((s) => s.setSelectedCompanyId);
  const setMapZoom = useGisUIStore((s) => s.setMapZoom);
  const setMapCenter = useGisUIStore((s) => s.setMapCenter);
  const setMapPitch = useGisUIStore((s) => s.setMapPitch);
  const setMapBearing = useGisUIStore((s) => s.setMapBearing);
  const setCursorCoords = useGisUIStore((s) => s.setCursorCoords);
  const openPanel = useGisUIStore((s) => s.openPanel);
  const closePanelsToTheRight = useGisUIStore((s) => s.closePanelsToTheRight);
  const clearFlyTo = useGisUIStore((s) => s.clearFlyTo);

  const mapRef = useRef<MapRef>(null);
  const [localViewState, setLocalViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const localZoom = localViewState.zoom;

  // Custom Modular Hooks
  const mapData = useSipasMapData(localZoom);
  const { customUser3DLayer, customUser3DLayerRef } = useCustom3DLayer();

  const handleMouseMove = useCallback((e: any) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const { lng, lat } = e.lngLat;
    let elevation: number | null = null;
    try {
      elevation = map.queryTerrainElevation([lng, lat]);
    } catch {
      // ignore
    }
    setCursorCoords({ lng, lat, elevation });
  }, [setCursorCoords]);

  // Load custom 3D model layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const mapNative = map.getMap();

    const handleStyleData = () => {
      if (mapNative && !mapNative.getLayer('user-3d-model-layer')) {
        try {
          mapNative.addLayer(customUser3DLayer);
        } catch (e) {
          console.warn('[THREE-BIM] Failed to add layer:', e);
        }
      }
    };

    mapNative.on('styledata', handleStyleData);
    handleStyleData();

    return () => {
      if (mapNative) {
        mapNative.off('styledata', handleStyleData);
      }
    };
  }, [activeBaseMap, customUser3DLayer]);

  // Handle terrain configuration updates
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const applyTerrain = () => {
      const hasSource = map.getSource('aws-terrain-source');
      if (isTerrainActive && is3DMode) {
        if (hasSource) {
          map.setTerrain({ source: 'aws-terrain-source', exaggeration: 1.2 });
        }
      } else {
        map.setTerrain(null);
      }
    };

    applyTerrain();
    map.on('styledata', applyTerrain);
    return () => {
      map.off('styledata', applyTerrain);
    };
  }, [isTerrainActive, is3DMode]);

  // Handle selected company BIM model updates
  useEffect(() => {
    if (selectedCompanyId && localZoom >= 16) {
      const sub = mapData.processedSubmissions.find((s) => s.id === selectedCompanyId);
      if (sub && sub.location.polygon && sub.location.polygon.length >= 3) {
        const centroid = calculateCentroid(sub.location.polygon);
        const modelUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb';
        customUser3DLayer.loadModel(selectedCompanyId, centroid, modelUrl);
      }
    } else {
      customUser3DLayer.clearModel();
    }
  }, [selectedCompanyId, localZoom, mapData.processedSubmissions, customUser3DLayer]);

  useEffect(() => {
    return () => {
      customUser3DLayerRef.current?.onRemove();
    };
  }, [customUser3DLayerRef]);

  // Handle flyTo triggers
  useEffect(() => {
    if (!flyToTarget || !mapRef.current) return;
    const { longitude, latitude, zoom, pitch, bearing } = flyToTarget;
    const currentIs3D = useGisUIStore.getState().is3DMode;
    const targetPitch = currentIs3D ? (pitch ?? localViewState.pitch) : 0;
    const targetBearing = currentIs3D ? (bearing ?? localViewState.bearing) : 0;
    setLocalViewState((prev) => ({
      ...prev,
      longitude,
      latitude,
      zoom: zoom ?? 18,
      pitch: targetPitch,
      bearing: targetBearing,
    }));
    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom: zoom ?? 18,
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 1800,
      essential: true,
    });
    clearFlyTo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToTarget, clearFlyTo]);

  // Handle map state change events
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (Math.round(localViewState.pitch) !== Math.round(mapPitch) ||
      Math.round(localViewState.bearing) !== Math.round(mapBearing)) {
      setLocalViewState((prev) => ({
        ...prev,
        pitch: mapPitch,
        bearing: mapBearing,
      }));
      map.easeTo({
        pitch: mapPitch,
        bearing: mapBearing,
        duration: 300,
      });
    }
  }, [mapPitch, mapBearing, localViewState.pitch, localViewState.bearing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const nativeMap = map.getMap();
    if (nativeMap) {
      if (is3DMode) {
        nativeMap.dragRotate.enable();
        nativeMap.touchZoomRotate.enable();
      } else {
        nativeMap.dragRotate.disable();
        nativeMap.touchZoomRotate.disable();
      }
    }

    const targetPitch = is3DMode ? 45 : 0;
    const targetBearing = is3DMode ? -10 : 0;
    setLocalViewState((prev) => ({
      ...prev,
      pitch: targetPitch,
      bearing: targetBearing,
    }));
    map.easeTo({
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 600,
    });
  }, [is3DMode]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleZoomIn = () => map.zoomIn({ duration: 300 });
    const handleZoomOut = () => map.zoomOut({ duration: 300 });
    const handleReset = () => {
      const store = useGisUIStore.getState();
      const currentIs3D = store.is3DMode;
      const targetPitch = currentIs3D ? 45 : 0;
      const targetBearing = currentIs3D ? -10 : 0;

      store.setMapPitch(targetPitch);
      store.setMapBearing(targetBearing);

      map.flyTo({
        center: [BOGOR_LNG, BOGOR_LAT],
        zoom: 11,
        pitch: targetPitch,
        bearing: targetBearing,
        duration: 1200,
      });
    };
    const handleFlyTo = (e: Event) => {
      const ev = e as CustomEvent<{ lat: number; lng: number }>;
      const currentState = useGisUIStore.getState();
      const safeZoom = (currentState.isTerrainActive && currentState.is3DMode) ? 15 : 18;
      if (ev.detail) map.flyTo({ center: [ev.detail.lng, ev.detail.lat], zoom: safeZoom, pitch: 55, duration: 1800 });
    };

    window.addEventListener('map-zoom-in', handleZoomIn);
    window.addEventListener('map-zoom-out', handleZoomOut);
    window.addEventListener('map-reset-view', handleReset);
    window.addEventListener('map-fly-to-coords', handleFlyTo);

    const mapNative = map.getMap();
    const onRemove = () => {
      window.removeEventListener('map-zoom-in', handleZoomIn);
      window.removeEventListener('map-zoom-out', handleZoomOut);
      window.removeEventListener('map-reset-view', handleReset);
      window.removeEventListener('map-fly-to-coords', handleFlyTo);
    };
    mapNative.once('remove', onRemove);
  }, []);

  useEffect(() => {
    return () => {
      try {
        mapRef.current?.getMap()?.remove();
      } catch {
        // ignore map destruction errors
      }
    };
  }, []);

  const handleMoveStart = useCallback(() => {
    window.dispatchEvent(new Event('map-move-start'));
  }, []);

  const handleMove = useCallback((e: ViewStateChangeEvent) => {
    const currentIs3D = useGisUIStore.getState().is3DMode;
    if (!currentIs3D) {
      setLocalViewState({ ...(e.viewState as MapViewState), pitch: 0, bearing: 0 });
    } else {
      setLocalViewState(e.viewState as MapViewState);
    }
  }, []);

  const handleMoveEnd = useCallback((e: ViewStateChangeEvent) => {
    const { longitude, latitude, zoom } = e.viewState;
    let { pitch, bearing } = e.viewState;

    const currentIs3D = useGisUIStore.getState().is3DMode;
    if (!currentIs3D) {
      pitch = 0;
      bearing = 0;
    }

    setMapCenter([latitude, longitude]);
    setMapZoom(zoom);
    setMapPitch(pitch);
    setMapBearing(bearing);

    const map = mapRef.current;
    if (map) {
      const bounds = map.getBounds();
      if (bounds) {
        mapData.setViewBBox([
          bounds.getWest(), bounds.getSouth(),
          bounds.getEast(), bounds.getNorth(),
        ]);
      }
    }

    window.dispatchEvent(new Event('map-move-end'));
  }, [setMapCenter, setMapZoom, setMapPitch, setMapBearing, mapData]);

  const handleSubmissionClick = useCallback((e: MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties;
    if (!props?.id) return;
    const sub = mapData.processedSubmissions.find((s) => s.id === props.id);
    if (!sub) return;
    setSelectedCompanyId(sub.id);
    closePanelsToTheRight(-1);
    openPanel('detil-perusahaan', `Detail: ${sub.housingName}`, sub);
    const currentIs3D = useGisUIStore.getState().is3DMode;
    const currentIsTerrainActive = useGisUIStore.getState().isTerrainActive;
    const targetPitch = currentIs3D ? 60 : 0;
    const targetBearing = currentIs3D ? -10 : 0;
    const rawZoom = Math.max(localZoom, 15);
    const safeZoom = (currentIsTerrainActive && currentIs3D) ? Math.min(rawZoom, 15) : rawZoom;
    setLocalViewState((prev) => ({
      ...prev,
      longitude: sub.location.lng,
      latitude: sub.location.lat,
      zoom: safeZoom,
      pitch: targetPitch,
      bearing: targetBearing,
    }));
    mapRef.current?.flyTo({
      center: [sub.location.lng, sub.location.lat],
      zoom: safeZoom,
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 1200,
    });
  }, [mapData.processedSubmissions, setSelectedCompanyId, closePanelsToTheRight, openPanel, localZoom]);

  const handleMarkerClick = useCallback((sub: ProcessedSubmission) => {
    setSelectedCompanyId(sub.id);
    closePanelsToTheRight(-1);
    openPanel('detil-perusahaan', `Detail: ${sub.housingName}`, sub);
    const currentIs3D = useGisUIStore.getState().is3DMode;
    const currentIsTerrainActive = useGisUIStore.getState().isTerrainActive;
    const targetPitch = currentIs3D ? 55 : 0;
    const targetBearing = currentIs3D ? -10 : 0;
    const safeZoom = (currentIsTerrainActive && currentIs3D) ? 15 : 16;
    setLocalViewState((prev) => ({
      ...prev,
      longitude: sub.location.lng,
      latitude: sub.location.lat,
      zoom: safeZoom,
      pitch: targetPitch,
      bearing: targetBearing,
    }));
    mapRef.current?.flyTo({
      center: [sub.location.lng, sub.location.lat],
      zoom: safeZoom,
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 1200,
    });
  }, [setSelectedCompanyId, closePanelsToTheRight, openPanel]);

  const handleClusterExpand = useCallback((
    clusterId: number, lng: number, lat: number, currentZoom: number,
  ) => {
    try {
      const z = mapData.supercluster.getClusterExpansionZoom(clusterId);
      mapRef.current?.flyTo({ center: [lng, lat], zoom: z, duration: 800 });
    } catch {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: currentZoom + 2, duration: 800 });
    }
  }, [mapData.supercluster]);

  const opacity = mapOpacity / 100;
  const showSungai = activeLayers.includes('layer-river') && localZoom >= 10;
  const showKontur = activeLayers.includes('layer-kontur') && localZoom >= 10;
  const showPemukiman = activeLayers.includes('layer-aqi') && localZoom >= 10;
  const showSawah = activeLayers.includes('layer-sawah') && localZoom >= 10;
  const showPasir = activeLayers.includes('layer-pasir') && localZoom >= 10;
  const showKebun = activeLayers.includes('layer-kebun') && localZoom >= 10;
  const showLadang = activeLayers.includes('layer-ladang') && localZoom >= 10;
  const showAdministrasi = activeLayers.includes('layer-administrasi') && localZoom >= 8;
  const showDesa = activeLayers.includes('layer-desa') && localZoom >= 10;
  const showDanau = activeLayers.includes('layer-danau') && localZoom >= 8;
  const showJalan = activeLayers.includes('layer-jalan') && localZoom >= 10;
  const showTanamCampur = activeLayers.includes('layer-tanamcampur') && localZoom >= 10;
  const showHutanKering = activeLayers.includes('layer-hutankering') && localZoom >= 10;
  const showAlang = activeLayers.includes('layer-alang') && localZoom >= 10;
  const showSemak = activeLayers.includes('layer-semak') && localZoom >= 10;
  const showPunggungBukit = activeLayers.includes('layer-punggungbukit') && localZoom >= 10;
  const showRelka = activeLayers.includes('layer-relka') && localZoom >= 8;
  const showDetail = localZoom >= 14;
  const showClusters = localZoom < 13;
  const bangunanTolerance = localZoom < 15 ? 1.0 : 0.5;

  return (
    <div className="absolute inset-0 z-0">
      <Map
        ref={mapRef}
        mapLib={import('maplibre-gl')}
        mapStyle={getMapStyle(activeBaseMap)}
        {...localViewState}
        onMove={handleMove}
        onMouseMove={handleMouseMove}
        style={{ width: '100%', height: '100%' }}
        maxZoom={18}
        minZoom={4}
        pitchWithRotate={is3DMode}
        dragRotate={is3DMode}
        touchZoomRotate={is3DMode}
        maxPitch={85}
        interactiveLayerIds={['submissions-fill-flat', 'sub-poly-extrusion']}
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        onClick={handleSubmissionClick}
        onLoad={handleMapLoad}
        renderWorldCopies={false}
        maxBounds={REGIONAL_BOUNDS}
      >
        <Source
          id="aws-terrain-source"
          type="raster-dem"
          tiles={['https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png']}
          encoding="terrarium"
          tileSize={256}
          maxzoom={18}
        />

        <SpatialGeoJSONLayers
          opacity={opacity}
          localZoom={localZoom}
          selectedCompanyId={selectedCompanyId}
          showPemukiman={showPemukiman}
          showKontur={showKontur}
          showSungai={showSungai}
          showSawah={showSawah}
          showPasir={showPasir}
          showKebun={showKebun}
          showLadang={showLadang}
          showAdministrasi={showAdministrasi}
          showDesa={showDesa}
          showDanau={showDanau}
          showJalan={showJalan}
          showTanamCampur={showTanamCampur}
          showHutanKering={showHutanKering}
          showAlang={showAlang}
          showSemak={showSemak}
          showPunggungBukit={showPunggungBukit}
          showRelka={showRelka}
          showDetail={showDetail}
          isDroneLayerActive={isDroneLayerActive}
          droneLayerOpacity={droneLayerOpacity}
          bangunanTolerance={bangunanTolerance}
          pemukimanData={mapData.pemukimanData}
          konturData={mapData.konturData}
          sungaiData={mapData.sungaiData}
          sawahData={mapData.sawahData}
          pasirData={mapData.pasirData}
          kebunData={mapData.kebunData}
          ladangData={mapData.ladangData}
          administrasiData={mapData.administrasiData}
          desaData={mapData.desaData}
          danauData={mapData.danauData}
          jalanData={mapData.jalanData}
          tanamCampurData={mapData.tanamCampurData}
          hutanKeringData={mapData.hutanKeringData}
          alangData={mapData.alangData}
          semakData={mapData.semakData}
          punggungBukitData={mapData.punggungBukitData}
          relkaData={mapData.relkaData}
          bangunanData={mapData.bangunanData}
          submissionsGeoJSON={mapData.submissionsGeoJSON}
          subPolygonsGeoJSON={mapData.subPolygonsGeoJSON}
          compensationGeoJSON={mapData.compensationGeoJSON}
          clashGeoJSON={mapData.clashGeoJSON}
        />

        {showClusters
          ? mapData.clusters.map((cluster) => {
            const [lng, lat] = cluster.geometry.coordinates;
            const { cluster: isCluster, point_count, cluster_id } = cluster.properties;

            if (isCluster) {
              return (
                <ClusterMarker
                  key={`cluster-${cluster_id}`}
                  lng={lng} lat={lat}
                  count={point_count}
                  clusterId={cluster_id}
                  zoom={localZoom}
                  onExpand={handleClusterExpand}
                />
              );
            }

            const sub = mapData.processedSubmissions.find(
              (s) => s.id === cluster.properties.submissionId
            );
            if (!sub) return null;

            return (
              <PinMarker
                key={`marker-${sub.id}`}
                sub={sub}
                isSelected={selectedCompanyId === sub.id}
                sizeBase={28}
                onClickPin={handleMarkerClick}
                onShowPopup={mapData.setPopupInfo}
              />
            );
          })
          : mapData.processedSubmissions.map((sub) => (
            <PinMarker
              key={`marker-hi-${sub.id}`}
              sub={sub}
              isSelected={selectedCompanyId === sub.id}
              sizeBase={24}
              onClickPin={handleMarkerClick}
              onShowPopup={mapData.setPopupInfo}
            />
          ))}

        {/* Sonar Ripple Pins for Conflicts */}
        {spatialConflicts.map((conflict) => (
          <Marker
            key={conflict.id}
            longitude={conflict.coordinates[0]}
            latitude={conflict.coordinates[1]}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              toast.error(`Konflik Spasial Terdeteksi: ${conflict.description}`, {
                description: `Kategori: ${conflict.category}`,
                duration: 4000
              });
            }}
          >
            <div className="relative flex items-center justify-center h-8 w-8 cursor-pointer">
              <div className="absolute h-full w-full rounded-full sonar-ripple-rose pointer-events-none" />
              <div className="relative h-3.5 w-3.5 rounded-full bg-rose-600 border border-white shadow-md" />
            </div>
          </Marker>
        ))}

        {mapData.popupInfo && (
          <Popup
            longitude={mapData.popupInfo.location.lng}
            latitude={mapData.popupInfo.location.lat}
            anchor="bottom"
            offset={[0, -36] as [number, number]}
            onClose={() => mapData.setPopupInfo(null)}
            closeButton={false}
            className="!rounded-none !border-0 !p-0 !shadow-2xl"
          >
            <div className="px-3.5 py-3 min-w-[180px] bg-white text-left select-none">
              <div className="font-black text-[13px] text-slate-900 leading-tight mb-1">
                {mapData.popupInfo.housingName}
              </div>
              <div className="text-[11px] text-slate-500 mb-2.5">
                {mapData.popupInfo.developerName}
              </div>
              <span
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
                style={{
                  color: mapData.popupInfo.color,
                  background: `${mapData.popupInfo.color}18`,
                }}
              >
                {mapData.popupInfo.status}
              </span>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}