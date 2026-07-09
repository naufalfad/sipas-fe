/**
 * ============================================================================
 * SIPAS MAP — Kanvas Geospasial 2D [Leaflet v2.0]
 * ============================================================================
 * Engine  : Leaflet JS (open-source, ringan, 2D murni)
 * Wrapper : react-leaflet v4
 * ============================================================================
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { Map as LeafletMap, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';

import { useGisUIStore } from '@/app/store/useGisUIStore';
import { ClusterMarker, PinMarker } from './markers';
import { SpatialGeoJSONLayers } from './layers/SpatialGeoJSONLayers';
import { useSipasMapData, type ProcessedSubmission } from '../hooks/useSipasMapData';
import ConflictMarkers from './markers/ConflictMarkers';

// ─── Konstanta ─────────────────────────────────────────────────────────────────
const BOGOR_LAT = -6.4816;
const BOGOR_LNG = 106.8560;
const INITIAL_CENTER: [number, number] = [BOGOR_LAT, BOGOR_LNG];
const INITIAL_ZOOM = 11;

// ─── Basemap URL Factory ───────────────────────────────────────────────────────
function getBasemapUrl(activeBaseMap: string): string {
  switch (activeBaseMap) {
    case 'dark':
      return 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
    case 'satellite':
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    case 'street':
      return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    case 'osm':
      return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    case 'voyager':
    default:
      return 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
  }
}

function getBasemapAttribution(activeBaseMap: string): string {
  switch (activeBaseMap) {
    case 'dark':
    case 'voyager':
      return '&copy; <a href="https://carto.com/">CartoDB</a>';
    case 'satellite':
      return '&copy; <a href="https://www.esri.com/">Esri</a>';
    case 'street':
      return '&copy; Google';
    case 'osm':
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    default:
      return '&copy; CartoDB';
  }
}

// ─── INNER MAP CONTROLLER (akses useMap hook di dalam MapContainer) ────────────
interface MapControllerProps {
  mapData: ReturnType<typeof useSipasMapData>;
  localZoom: number;
  setLocalZoom: (z: number) => void;
  selectedCompanyId: string | null;
  opacity: number;
  activeLayers: string[];
  isDroneLayerActive: boolean;
  droneLayerOpacity: number;
  spatialConflicts: any[];
  activeBaseMap: string;
  flyToTarget: any;
  clearFlyTo: () => void;
  setMapZoom: (z: number) => void;
  setMapCenter: (c: [number, number]) => void;
  setCursorCoords: (c: { lat: number; lng: number; elevation: null } | null) => void;
  onMarkerClick: (sub: ProcessedSubmission) => void;
  onClusterExpand: (clusterId: number, lng: number, lat: number, currentZoom: number) => void;
}

function MapController({
  mapData,
  localZoom,
  setLocalZoom,
  selectedCompanyId,
  opacity,
  activeLayers,
  isDroneLayerActive,
  droneLayerOpacity,
  spatialConflicts,
  activeBaseMap,
  flyToTarget,
  clearFlyTo,
  setMapZoom,
  setMapCenter,
  setCursorCoords,
  onMarkerClick,
  onClusterExpand,
}: MapControllerProps) {
  const map = useMap();
  const mapRef = useRef<LeafletMap>(map);
  mapRef.current = map;

  // Derived layer visibility
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

  // FlyTo handler
  useEffect(() => {
    if (!flyToTarget) return;
    const { latitude, longitude, zoom } = flyToTarget;
    map.flyTo([latitude, longitude], zoom ?? 18, { duration: 1.8, animate: true });
    clearFlyTo();
  }, [flyToTarget, clearFlyTo, map]);

  // Map event listeners via custom events
  useEffect(() => {
    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();
    const handleReset = () => map.flyTo(INITIAL_CENTER, INITIAL_ZOOM, { duration: 1.2, animate: true });
    const handleFlyTo = (e: Event) => {
      const ev = e as CustomEvent<{ lat: number; lng: number }>;
      if (ev.detail) map.flyTo([ev.detail.lat, ev.detail.lng], 18, { duration: 1.8, animate: true });
    };

    window.addEventListener('map-zoom-in', handleZoomIn);
    window.addEventListener('map-zoom-out', handleZoomOut);
    window.addEventListener('map-reset-view', handleReset);
    window.addEventListener('map-fly-to-coords', handleFlyTo);
    return () => {
      window.removeEventListener('map-zoom-in', handleZoomIn);
      window.removeEventListener('map-zoom-out', handleZoomOut);
      window.removeEventListener('map-reset-view', handleReset);
      window.removeEventListener('map-fly-to-coords', handleFlyTo);
    };
  }, [map]);

  // Map move/zoom event listeners
  useMapEvents({
    movestart: () => window.dispatchEvent(new Event('map-move-start')),
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setMapCenter([center.lat, center.lng]);
      setMapZoom(zoom);
      setLocalZoom(zoom);

      const bounds: LatLngBounds = map.getBounds();
      mapData.setViewBBox([
        bounds.getWest(), bounds.getSouth(),
        bounds.getEast(), bounds.getNorth(),
      ]);

      window.dispatchEvent(new Event('map-move-end'));
    },
    zoomend: () => {
      setLocalZoom(map.getZoom());
    },
    mousemove: (e) => {
      setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng, elevation: null });
    },
    mouseout: () => {
      setCursorCoords(null);
    },
  });

  return (
    <>
      {/* ─── DRONE ORTHOPHOTO OVERLAY ─── */}
      {isDroneLayerActive && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          opacity={droneLayerOpacity / 100}
          attribution="© Esri"
        />
      )}

      {/* ─── SEMUA LAYER GEOJSON SPASIAL ─── */}
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
        bangunanData={mapData.bangunanData}
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
        submissionsGeoJSON={mapData.submissionsGeoJSON}
        subPolygonsGeoJSON={mapData.subPolygonsGeoJSON}
        compensationGeoJSON={mapData.compensationGeoJSON}
        clashGeoJSON={mapData.clashGeoJSON}
        onSubmissionClick={(id, sub) => {
          onMarkerClick(sub);
        }}
      />

      {/* ─── CLUSTER MARKERS atau PIN MARKERS ─── */}
      {showClusters
        ? mapData.clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count, cluster_id } = cluster.properties;

          if (isCluster) {
            return (
              <ClusterMarker
                key={`cluster-${cluster_id}`}
                lat={lat}
                lng={lng}
                count={point_count}
                clusterId={cluster_id}
                zoom={localZoom}
                onExpand={onClusterExpand}
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
              onClickPin={onMarkerClick}
              onShowPopup={mapData.setPopupInfo}
            />
          );
        })
        : mapData.processedSubmissions.map((sub) => (
          <PinMarker
            key={`marker-hi-${sub.id}`}
            sub={sub}
            isSelected={selectedCompanyId === sub.id}
            onClickPin={onMarkerClick}
            onShowPopup={mapData.setPopupInfo}
          />
        ))}

      {/* ─── POPUP INFO ─── */}
      {mapData.popupInfo && (
        <Popup
          position={[
            mapData.popupInfo.centroidLat ?? mapData.popupInfo.location.lat,
            mapData.popupInfo.centroidLng ?? mapData.popupInfo.location.lng,
          ]}
          onClose={() => mapData.setPopupInfo(null)}
          offset={[0, -28]}
          className="sipas-popup"
        >
          <div className="px-3.5 py-3 min-w-[180px] text-left select-none bg-white">
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


      {/* ─── SONAR RIPPLE PINS UNTUK KONFLIK SPASIAL ─── */}
      <ConflictMarkers conflicts={spatialConflicts} />
    </>
  );
}

// ─── KOMPONEN UTAMA ────────────────────────────────────────────────────────────
export default function SipasMap() {
  const activeLayers = useGisUIStore((s) => s.activeLayers);
  const activeBaseMap = useGisUIStore((s) => s.activeBaseMap);
  const mapOpacity = useGisUIStore((s) => s.mapOpacity);
  const selectedCompanyId = useGisUIStore((s) => s.selectedCompanyId);
  const flyToTarget = useGisUIStore((s) => s.flyToTarget);
  const isDroneLayerActive = useGisUIStore((s) => s.isDroneLayerActive);
  const droneLayerOpacity = useGisUIStore((s) => s.droneLayerOpacity);
  const spatialConflicts = useGisUIStore((s) => s.spatialConflicts);

  const setSelectedCompanyId = useGisUIStore((s) => s.setSelectedCompanyId);
  const setMapZoom = useGisUIStore((s) => s.setMapZoom);
  const setMapCenter = useGisUIStore((s) => s.setMapCenter);
  const setCursorCoords = useGisUIStore((s) => s.setCursorCoords);
  const openPanel = useGisUIStore((s) => s.openPanel);
  const closePanelsToTheRight = useGisUIStore((s) => s.closePanelsToTheRight);
  const clearFlyTo = useGisUIStore((s) => s.clearFlyTo);

  // Local zoom state (react-leaflet doesn't have viewState like react-map-gl)
  const [localZoom, setLocalZoom] = React.useState(INITIAL_ZOOM);

  const mapData = useSipasMapData(localZoom);
  const opacity = mapOpacity / 100;

  const handleMarkerClick = useCallback((sub: ProcessedSubmission) => {
    setSelectedCompanyId(sub.id);
    closePanelsToTheRight(-1);
    openPanel('detil-perusahaan', `Detail: ${sub.housingName}`, sub);
  }, [setSelectedCompanyId, closePanelsToTheRight, openPanel]);

  const handleClusterExpand = useCallback((
    clusterId: number, lng: number, lat: number, currentZoom: number,
  ) => {
    try {
      const z = mapData.supercluster.getClusterExpansionZoom(clusterId);
      window.dispatchEvent(Object.assign(new CustomEvent('map-fly-to-coords'), {
        detail: { lat, lng },
      }));
      void z;
    } catch {
      // fallback handled in MapController
    }
  }, [mapData.supercluster]);

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={INITIAL_CENTER}
        zoom={INITIAL_ZOOM}
        minZoom={4}
        maxZoom={18}
        zoomControl={false}
        attributionControl={true}
        style={{ width: '100%', height: '100%' }}
        maxBounds={[[- 15, 90], [15, 150]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          key={activeBaseMap}
          url={getBasemapUrl(activeBaseMap)}
          attribution={getBasemapAttribution(activeBaseMap)}
          maxZoom={18}
        />

        <MapController
          mapData={mapData}
          localZoom={localZoom}
          setLocalZoom={setLocalZoom}
          selectedCompanyId={selectedCompanyId}
          opacity={opacity}
          activeLayers={activeLayers}
          isDroneLayerActive={isDroneLayerActive}
          droneLayerOpacity={droneLayerOpacity}
          spatialConflicts={spatialConflicts}
          activeBaseMap={activeBaseMap}
          flyToTarget={flyToTarget}
          clearFlyTo={clearFlyTo}
          setMapZoom={setMapZoom}
          setMapCenter={setMapCenter}
          setCursorCoords={setCursorCoords}
          onMarkerClick={handleMarkerClick}
          onClusterExpand={handleClusterExpand}
        />
      </MapContainer>
    </div>
  );
}

// React import needed for useState in module scope
import React from 'react';