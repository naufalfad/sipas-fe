/**
 * ============================================================================
 * GEOSIPAS MAP 3D — Kanvas Geospasial WebGL 3D [MapLibre GL JS v3.0]
 * ============================================================================
 * Engine  : MapLibre GL JS (open-source, super-fast, 3D WebGL via GPU)
 * Wrapper : Native Vanilla JS integration via React useRef/useEffect
 * ============================================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useGisUIStore } from '@/app/store/useGisUIStore';
import { useConfigStore } from '@/app/store/useConfigStore';
import { useSipasMapData, type ProcessedSubmission } from '../hooks/useSipasMapData';
import { API_BASE_URL } from '@/config';

// ─── Konstanta ─────────────────────────────────────────────────────────────────
const INITIAL_ZOOM = 11;

// ─── Style Factory untuk MapLibre ──────────────────────────────────────────────
function getMapStyle(activeBaseMap: string): any {
  let tileUrl = '';
  let attribution = '';

  switch (activeBaseMap) {
    case 'dark':
      tileUrl = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
      attribution = '&copy; CartoDB';
      break;
    case 'satellite':
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri';
      break;
    case 'street':
      tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      attribution = '&copy; Google';
      break;
    case 'osm':
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap';
      break;
    case 'voyager':
    default:
      tileUrl = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
      attribution = '&copy; CartoDB';
      break;
  }

  return {
    version: 8,
    sources: {
      'raster-basemap': {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution: attribution,
        maxzoom: 18
      }
    },
    layers: [
      {
        id: 'basemap-layer',
        type: 'raster',
        source: 'raster-basemap',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  };
}

export default function SipasMap3D() {
  const activeLayers = useGisUIStore((s) => s.activeLayers);
  const activeBaseMap = useGisUIStore((s) => s.activeBaseMap);
  const mapOpacity = useGisUIStore((s) => s.mapOpacity);
  const selectedCompanyId = useGisUIStore((s) => s.selectedCompanyId);
  const flyToTarget = useGisUIStore((s) => s.flyToTarget);
  const isDroneLayerActive = useGisUIStore((s) => s.isDroneLayerActive);
  const droneLayerOpacity = useGisUIStore((s) => s.droneLayerOpacity);
  const spatialConflicts = useGisUIStore((s) => s.spatialConflicts);
  const visibleSubLayers = useGisUIStore((s) => s.visibleSubLayers);
  const isTerrainActive = useGisUIStore((s) => s.isTerrainActive);

  const setSelectedCompanyId = useGisUIStore((s) => s.setSelectedCompanyId);
  const setMapZoom = useGisUIStore((s) => s.setMapZoom);
  const setMapCenter = useGisUIStore((s) => s.setMapCenter);
  const setPitch = useGisUIStore((s) => s.setPitch);
  const setBearing = useGisUIStore((s) => s.setBearing);
  const setCursorCoords = useGisUIStore((s) => s.setCursorCoords);
  const openPanel = useGisUIStore((s) => s.openPanel);
  const closePanelsToTheRight = useGisUIStore((s) => s.closePanelsToTheRight);
  const clearFlyTo = useGisUIStore((s) => s.clearFlyTo);

  const { mapCenterLat, mapCenterLng, mapZoom } = useConfigStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [localZoom, setLocalZoom] = useState(mapZoom || INITIAL_ZOOM);

  const mapData = useSipasMapData(localZoom);
  const opacity = mapOpacity / 100;

  // Selection Handler
  const handleMarkerClick = useCallback((sub: ProcessedSubmission) => {
    setSelectedCompanyId(sub.id);
    closePanelsToTheRight(-1);
    openPanel('detil-perusahaan', `Detail: ${sub.housingName}`, sub);
  }, [setSelectedCompanyId, closePanelsToTheRight, openPanel]);

  // Cluster Expand Handler
  const handleClusterExpand = useCallback((
    clusterId: number, lng: number, lat: number
  ) => {
    try {
      const z = mapData.supercluster.getClusterExpansionZoom(clusterId);
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: z ?? 14,
          duration: 1500
        });
      }
    } catch {
      // fallback
    }
  }, [mapData.supercluster]);

  // 1. Initialize MapLibre Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Transform request to inject auth token for backend API endpoints
    const transformRequest = (url: string) => {
      if (url.startsWith(API_BASE_URL)) {
        const token = sessionStorage.getItem('token');
        return {
          url,
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        };
      }
      return { url };
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(activeBaseMap),
      center: [mapCenterLng, mapCenterLat],
      zoom: mapZoom || INITIAL_ZOOM,
      pitch: 0,
      bearing: 0,
      maxZoom: 22,
      transformRequest
    });

    mapRef.current = map;

    // Scale Control only (Built-in NavigationControl disabled to avoid double overlaps)
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.on('load', () => {
      // Setup Terrain API from public Mapzen S3 (Free, no API key required)
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15
      });
      // Enable 3D hillshade/terrain conditionally
      if (isTerrainActive) {
        map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });
      }

      // Add Drone Layer Source
      map.addSource('drone-orthophoto', {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256
      });
      map.addLayer({
        id: 'drone-layer',
        type: 'raster',
        source: 'drone-orthophoto',
        layout: { visibility: isDroneLayerActive ? 'visible' : 'none' },
        paint: { 'raster-opacity': droneLayerOpacity / 100 }
      });
    });

    // Map Interaction Listeners
    map.on('move', () => {
      const center = map.getCenter();
      setMapCenter([center.lat, center.lng]);
      setMapZoom(map.getZoom());
      setLocalZoom(map.getZoom());
      setPitch(map.getPitch());
      setBearing(map.getBearing());

      const bounds = map.getBounds();
      mapData.setViewBBox([
        bounds.getWest(), bounds.getSouth(),
        bounds.getEast(), bounds.getNorth()
      ]);
    });

    map.on('mousemove', (e) => {
      const coords = e.lngLat;
      let elevation: number | null = null;
      if (map.getTerrain()) {
        try {
          elevation = map.queryTerrainElevation(coords);
        } catch {
          elevation = null;
        }
      }
      setCursorCoords({ lat: coords.lat, lng: coords.lng, elevation });
    });

    map.on('mouseout', () => {
      setCursorCoords(null);
    });

    // Zoom and reset custom events from outer UI HUD
    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();
    const handleReset = () => {
      map.flyTo({
        center: [mapCenterLng, mapCenterLat],
        zoom: mapZoom || INITIAL_ZOOM,
        pitch: 0,
        bearing: 0,
        duration: 1200
      });
    };
    const handleFlyTo = (e: Event) => {
      const ev = e as CustomEvent<{ lat: number; lng: number }>;
      if (ev.detail) {
        map.flyTo({
          center: [ev.detail.lng, ev.detail.lat],
          zoom: 18,
          duration: 1500
        });
      }
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
      map.remove();
    };
  }, []);

  // 2. Sync basemap changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const style = getMapStyle(activeBaseMap);
    // Replace basemap source tile URL
    const source = map.getSource('raster-basemap') as maplibregl.RasterTileSource;
    if (source) {
      source.setTiles(style.sources['raster-basemap'].tiles);
    }
  }, [activeBaseMap]);

  // 3. Sync drone layer opacity and visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer('drone-layer')) return;

    map.setLayoutProperty('drone-layer', 'visibility', isDroneLayerActive ? 'visible' : 'none');
    map.setPaintProperty('drone-layer', 'raster-opacity', droneLayerOpacity / 100);
  }, [isDroneLayerActive, droneLayerOpacity]);

  // 4. Sync vector tiles source & layers for selectedCompanyId
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMvtLoad = () => {
      // Remove old sources and layers if they exist
      if (map.getLayer('mvt-batas-lahan-fill')) map.removeLayer('mvt-batas-lahan-fill');
      if (map.getLayer('mvt-batas-lahan-line')) map.removeLayer('mvt-batas-lahan-line');
      if (map.getLayer('mvt-site-plan-flat')) map.removeLayer('mvt-site-plan-flat');
      if (map.getLayer('mvt-site-plan-extrusion')) map.removeLayer('mvt-site-plan-extrusion');
      if (map.getSource('sipas-mvt')) map.removeSource('sipas-mvt');

      if (!selectedCompanyId) return;

      // Add MVT source
      map.addSource('sipas-mvt', {
        type: 'vector',
        tiles: [`${API_BASE_URL}/api/v1/submissions/${selectedCompanyId}/tiles/{z}/{x}/{y}.pbf`],
        minzoom: 4,
        maxzoom: 18
      });

      // Layer Batas Lahan (Flat nempel ke terrain/kontur)
      map.addLayer({
        id: 'mvt-batas-lahan-fill',
        type: 'fill',
        source: 'sipas-mvt',
        'source-layer': 'batas_lahan',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.15 * opacity
        }
      });
      map.addLayer({
        id: 'mvt-batas-lahan-line',
        type: 'line',
        source: 'sipas-mvt',
        'source-layer': 'batas_lahan',
        paint: {
          'line-color': '#10b981',
          'line-width': 2.5,
          'line-opacity': opacity
        }
      });

      // Layer Site Plan flat (untuk jalan, RTH, makam)
      map.addLayer({
        id: 'mvt-site-plan-flat',
        type: 'fill',
        source: 'sipas-mvt',
        'source-layer': 'site_plan',
        filter: [
          'all',
          ['!=', ['get', 'layer_name'], 'PTSP_KDB'],
          ['in', ['get', 'layer_name'], ['literal', visibleSubLayers]]
        ],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['case', ['==', ['get', 'layer_name'], 'PTSP_PSU_JALAN'], 0.45 * opacity, 0.65 * opacity]
        }
      });

      // Layer Site Plan extruded 3D (untuk bangunan kaveling PTSP_KDB)
      map.addLayer({
        id: 'mvt-site-plan-extrusion',
        type: 'fill-extrusion',
        source: 'sipas-mvt',
        'source-layer': 'site_plan',
        filter: [
          'all',
          ['==', ['get', 'layer_name'], 'PTSP_KDB'],
          ['in', ['get', 'layer_name'], ['literal', visibleSubLayers]]
        ],
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.85 * opacity
        }
      });
    };

    if (map.isStyleLoaded()) {
      handleMvtLoad();
    } else {
      map.on('style.load', handleMvtLoad);
    }
  }, [selectedCompanyId, opacity, visibleSubLayers]);

  // 5. Sync reference layers (river, contours, aqi, etc.)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const syncGeoJsonLayer = (layerId: string, type: 'fill' | 'line', sourceId: string, data: any, isVisible: boolean, paintConfig: any) => {
      if (!data) {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        return;
      }

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: 'geojson', data });
      } else {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(data);
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: type as any,
          source: sourceId,
          layout: { visibility: isVisible ? 'visible' : 'none' },
          paint: paintConfig
        });
      } else {
        map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
        Object.entries(paintConfig).forEach(([key, val]) => {
          map.setPaintProperty(layerId, key, val);
        });
      }
    };

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

    syncGeoJsonLayer('sungai-layer', 'line', 'sungai-source', mapData.sungaiData, showSungai, {
      'line-color': '#3b82f6',
      'line-width': 3,
      'line-opacity': 0.9 * opacity
    });

    syncGeoJsonLayer('kontur-layer', 'line', 'kontur-source', mapData.konturData, showKontur, {
      'line-color': '#fbbf24',
      'line-width': 1,
      'line-opacity': 0.8 * opacity,
      'line-dasharray': [4, 2]
    });

    syncGeoJsonLayer('pemukiman-layer', 'fill', 'pemukiman-source', mapData.pemukimanData, showPemukiman, {
      'fill-color': '#06b6d4',
      'fill-opacity': 0.35 * opacity
    });

    syncGeoJsonLayer('sawah-layer', 'fill', 'sawah-source', mapData.sawahData, showSawah, {
      'fill-color': '#34d399',
      'fill-opacity': 0.3 * opacity
    });

    syncGeoJsonLayer('pasir-layer', 'fill', 'pasir-source', mapData.pasirData, showPasir, {
      'fill-color': '#fed7aa',
      'fill-opacity': 0.3 * opacity
    });

    syncGeoJsonLayer('kebun-layer', 'fill', 'kebun-source', mapData.kebunData, showKebun, {
      'fill-color': '#15803d',
      'fill-opacity': 0.3 * opacity
    });

    syncGeoJsonLayer('ladang-layer', 'fill', 'ladang-source', mapData.ladangData, showLadang, {
      'fill-color': '#84cc16',
      'fill-opacity': 0.3 * opacity
    });

    syncGeoJsonLayer('administrasi-layer', 'line', 'administrasi-source', mapData.administrasiData, showAdministrasi, {
      'line-color': '#ef4444',
      'line-width': 2,
      'line-opacity': 0.8 * opacity,
      'line-dasharray': [6, 3]
    });

    syncGeoJsonLayer('desa-layer', 'fill', 'desa-source', mapData.desaData, showDesa, {
      'fill-color': '#fb923c',
      'fill-opacity': 0.08 * opacity
    });

    syncGeoJsonLayer('danau-layer', 'fill', 'danau-source', mapData.danauData, showDanau, {
      'fill-color': '#38bdf8',
      'fill-opacity': 0.5 * opacity
    });

    syncGeoJsonLayer('jalan-layer', 'line', 'jalan-source', mapData.jalanData, showJalan, {
      'line-color': '#f5f5f4',
      'line-width': 2,
      'line-opacity': 0.85 * opacity
    });

    syncGeoJsonLayer('tanamcampur-layer', 'fill', 'tanamcampur-source', mapData.tanamCampurData, showTanamCampur, {
      'fill-color': '#2dd4bf',
      'fill-opacity': 0.25 * opacity
    });

    syncGeoJsonLayer('hutankering-layer', 'fill', 'hutankering-source', mapData.hutanKeringData, showHutanKering, {
      'fill-color': '#14532d',
      'fill-opacity': 0.35 * opacity
    });

    syncGeoJsonLayer('alang-layer', 'fill', 'alang-source', mapData.alangData, showAlang, {
      'fill-color': '#fcd34d',
      'fill-opacity': 0.25 * opacity
    });

    syncGeoJsonLayer('semak-layer', 'fill', 'semak-source', mapData.semakData, showSemak, {
      'fill-color': '#d97706',
      'fill-opacity': 0.25 * opacity
    });

    syncGeoJsonLayer('punggungbukit-layer', 'line', 'punggungbukit-source', mapData.punggungBukitData, showPunggungBukit, {
      'line-color': '#a855f7',
      'line-width': 1.5,
      'line-opacity': 0.7 * opacity,
      'line-dasharray': [2, 3]
    });

    syncGeoJsonLayer('relka-layer', 'line', 'relka-source', mapData.relkaData, showRelka, {
      'line-color': '#e2e8f0',
      'line-width': 2,
      'line-opacity': 0.9 * opacity,
      'line-dasharray': [8, 4]
    });

    // ─── LAHAN KOMPENSASI & CLASH ───
    syncGeoJsonLayer('compensation-layer', 'fill', 'compensation-source', mapData.compensationGeoJSON, true, {
      'fill-color': '#10b981',
      'fill-opacity': 0.45 * opacity
    });

    // ─── 3D BIM & BANGUNAN EXTRUSION LAYER (LAYER-3D-BIM) ───
    const showBim3D = activeLayers.includes('layer-3d-bim');
    if (showBim3D && mapData.pemukimanData) {
      if (!map.getSource('bim-3d-source')) {
        map.addSource('bim-3d-source', { type: 'geojson', data: mapData.pemukimanData });
      }
      if (!map.getLayer('bim-3d-extrusion-layer')) {
        map.addLayer({
          id: 'bim-3d-extrusion-layer',
          type: 'fill-extrusion',
          source: 'bim-3d-source',
          paint: {
            'fill-extrusion-color': '#0d9488',
            'fill-extrusion-height': 24,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.85 * opacity
          }
        });
      } else {
        map.setLayoutProperty('bim-3d-extrusion-layer', 'visibility', 'visible');
      }
    } else if (map.getLayer('bim-3d-extrusion-layer')) {
      map.setLayoutProperty('bim-3d-extrusion-layer', 'visibility', 'none');
    }

    syncGeoJsonLayer('clash-layer', 'line', 'clash-source', mapData.clashGeoJSON, true, {
      'line-color': '#ff0000',
      'line-width': 3,
      'line-opacity': 1.0,
      'line-dasharray': [4, 3]
    });
  }, [activeLayers, localZoom, opacity, mapData]);

  // 6. Sync active submissions GeoJSON (Non-MVT selected layer)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (!mapData.submissionsGeoJSON) {
      if (map.getLayer('submissions-layer')) map.removeLayer('submissions-layer');
      if (map.getLayer('submissions-line-layer')) map.removeLayer('submissions-line-layer');
      if (map.getSource('submissions-source')) map.removeSource('submissions-source');
      return;
    }

    if (!map.getSource('submissions-source')) {
      map.addSource('submissions-source', { type: 'geojson', data: mapData.submissionsGeoJSON });
      map.addLayer({
        id: 'submissions-layer',
        type: 'fill',
        source: 'submissions-source',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#6b7280'],
          'fill-opacity': ['case', ['==', ['get', 'id'], selectedCompanyId || ''], 0.6, 0.35 * opacity]
        }
      });
      map.addLayer({
        id: 'submissions-line-layer',
        type: 'line',
        source: 'submissions-source',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#6b7280'],
          'line-width': ['case', ['==', ['get', 'id'], selectedCompanyId || ''], 3, 1.5],
          'line-opacity': opacity
        }
      });

      // Handle click on submission shape
      map.on('click', 'submissions-layer', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['submissions-layer'] });
        if (features && features.length > 0) {
          const feat = features[0];
          if (feat.properties && feat.properties.id) {
            const sub = mapData.processedSubmissions.find((s) => s.id === feat.properties?.id);
            if (sub) handleMarkerClick(sub);
          }
        }
      });
    } else {
      (map.getSource('submissions-source') as maplibregl.GeoJSONSource).setData(mapData.submissionsGeoJSON);
      map.setPaintProperty('submissions-layer', 'fill-opacity', ['case', ['==', ['get', 'id'], selectedCompanyId || ''], 0.6, 0.35 * opacity]);
      map.setPaintProperty('submissions-line-layer', 'line-width', ['case', ['==', ['get', 'id'], selectedCompanyId || ''], 3, 1.5]);
      map.setPaintProperty('submissions-line-layer', 'line-opacity', opacity);
    }
  }, [mapData.submissionsGeoJSON, selectedCompanyId, opacity]);

  // 7. Render markers and clusters (HTML elements)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const showClusters = localZoom < 13;

    if (showClusters) {
      mapData.clusters.forEach((cluster: any) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count, cluster_id } = cluster.properties;

        const el = document.createElement('div');
        if (isCluster) {
          const size = point_count < 10 ? 36 : point_count < 50 ? 44 : 52;
          const fontSize = size < 44 ? 12 : 14;

          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.background = 'linear-gradient(135deg,#0f766e,#14b8a6)';
          el.style.border = '3px solid #fff';
          el.style.borderRadius = '50%';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontSize = `${fontSize}px`;
          el.style.fontWeight = '900';
          el.style.color = '#fff';
          el.style.boxShadow = '0 2px 12px rgba(20,184,166,0.55)';
          el.style.cursor = 'pointer';
          el.style.fontFamily = 'sans-serif';
          el.innerText = String(point_count);

          const m = new maplibregl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map);

          el.addEventListener('click', () => {
            handleClusterExpand(cluster_id, lng, lat);
          });

          markersRef.current.push(m);
        } else {
          const sub = mapData.processedSubmissions.find(
            (s) => s.id === cluster.properties.submissionId
          );
          if (!sub) return;

          const isSelected = selectedCompanyId === sub.id;
          const size = isSelected ? 32 : 28;
          const boxShadow = isSelected
            ? `0 0 0 3px ${sub.color},0 4px 16px rgba(0,0,0,0.5)`
            : '0 2px 8px rgba(0,0,0,0.3)';

          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.background = sub.color;
          el.style.border = '3px solid #fff';
          el.style.borderRadius = '50% 50% 50% 0';
          el.style.transform = 'rotate(-45deg)';
          el.style.boxShadow = boxShadow;
          el.style.cursor = 'pointer';
          el.style.transition = 'all 0.15s ease';

          const markerLng = sub.centroidLng ?? sub.location.lng;
          const markerLat = sub.centroidLat ?? sub.location.lat;

          const m = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([markerLng, markerLat])
            .addTo(map);

          el.addEventListener('click', () => {
            mapData.setPopupInfo(sub);
            handleMarkerClick(sub);
          });

          markersRef.current.push(m);
        }
      });
    } else {
      mapData.processedSubmissions.forEach((sub) => {
        const el = document.createElement('div');
        const isSelected = selectedCompanyId === sub.id;
        const size = isSelected ? 32 : 28;
        const boxShadow = isSelected
          ? `0 0 0 3px ${sub.color},0 4px 16px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.3)';

        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.background = sub.color;
        el.style.border = '3px solid #fff';
        el.style.borderRadius = '50% 50% 50% 0';
        el.style.transform = 'rotate(-45deg)';
        el.style.boxShadow = boxShadow;
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.15s ease';

        const markerLng = sub.centroidLng ?? sub.location.lng;
        const markerLat = sub.centroidLat ?? sub.location.lat;

        const m = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([markerLng, markerLat])
          .addTo(map);

        el.addEventListener('click', () => {
          mapData.setPopupInfo(sub);
          handleMarkerClick(sub);
        });

        markersRef.current.push(m);
      });
    }
  }, [mapData.clusters, mapData.processedSubmissions, selectedCompanyId, localZoom]);

  // 8. Render Popups
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    if (!mapData.popupInfo) return;

    const popupInfo = mapData.popupInfo;
    const lat = popupInfo.centroidLat ?? popupInfo.location.lat;
    const lng = popupInfo.centroidLng ?? popupInfo.location.lng;

    const popupEl = document.createElement('div');
    popupEl.className = 'px-3.5 py-3 min-w-[180px] text-left select-none bg-white font-sans';
    popupEl.innerHTML = `
      <div class="font-black text-[13px] text-slate-900 leading-tight mb-1">
        ${popupInfo.housingName}
      </div>
      <div class="text-[11px] text-slate-500 mb-2.5">
        ${popupInfo.developerName}
      </div>
      <span
        class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
        style="color: ${popupInfo.color}; background: ${popupInfo.color}18;"
      >
        ${popupInfo.status}
      </span>
    `;

    const popup = new maplibregl.Popup({ offset: [0, -28], className: 'sipas-popup' })
      .setLngLat([lng, lat])
      .setDOMContent(popupEl)
      .addTo(map);

    popup.on('close', () => {
      mapData.setPopupInfo(null);
    });

    popupRef.current = popup;
  }, [mapData.popupInfo]);

  // 9. Sync flyTo target
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;

    const { longitude, latitude, zoom, pitch, bearing } = flyToTarget;
    map.flyTo({
      center: [longitude, latitude],
      zoom: zoom ?? 18,
      pitch: pitch ?? map.getPitch(),
      bearing: bearing ?? map.getBearing(),
      duration: 1800,
      essential: true
    });

    clearFlyTo();
  }, [flyToTarget, clearFlyTo]);

  // 10. Sync sonar/clash spatial conflicts markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Filter out conflicts layer if any, or render them using HTML elements for sonar effect
    const conflictMarkers: maplibregl.Marker[] = [];

    spatialConflicts.forEach((conflict) => {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.style.width = '20px';
      el.style.height = '20px';

      // Inner Red Dot
      const dot = document.createElement('div');
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.backgroundColor = '#ef4444';
      dot.style.borderRadius = '50%';
      dot.style.zIndex = '2';
      el.appendChild(dot);

      // Ripple effect
      const ripple = document.createElement('div');
      ripple.className = 'absolute animate-ping';
      ripple.style.width = '24px';
      ripple.style.height = '24px';
      ripple.style.backgroundColor = 'rgba(239, 68, 68, 0.4)';
      ripple.style.borderRadius = '50%';
      ripple.style.zIndex = '1';
      el.appendChild(ripple);

      const m = new maplibregl.Marker(el)
        .setLngLat(conflict.coordinates)
        .addTo(map);

      conflictMarkers.push(m);
    });

    return () => {
      conflictMarkers.forEach((m) => m.remove());
    };
  }, [spatialConflicts]);

  // 11. Sync 3D Terrain mesh (exaggeration) dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (isTerrainActive) {
      if (map.getSource('terrain-dem')) {
        map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });
      }
    } else {
      map.setTerrain(null);
    }
  }, [isTerrainActive]);

  return (
    <div className="absolute inset-0 z-0">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
