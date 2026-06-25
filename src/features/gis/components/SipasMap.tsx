/**
 * ============================================================================
 * SIPAS MAP — Immersive 3D GIS Canvas  [PERFORMANCE-OPTIMIZED v2]
 * ============================================================================
 * Engine  : MapLibre GL JS (WebGL, open-source)
 * Wrapper : react-map-gl v7
 * Cluster : supercluster (client-side, zero-dependency)
 *
 * OPTIMASI KRITIS yang diimplementasikan di versi ini:
 *
 * [OPT-1] ELIMINASI RE-RENDER LOOP saat peta bergerak
 *   Sebelumnya: onMoveEnd dan onMove keduanya menulis ke Zustand store,
 *   menyebabkan seluruh React tree (panel samping, HUD, dll) ikut re-render
 *   60× per detik selama gesture pan/zoom.
 *
 *   Sesudahnya: Gerakan halus dikelola oleh LOCAL viewState internal Map
 *   (pola "controlled component" react-map-gl). Zustand HANYA diperbarui
 *   pada event onMoveEnd (saat jari/mouse dilepas). Ini mengurangi Zustand
 *   writes dari ~3600/menit → ~1–3/menit selama normal panning.
 *
 * [OPT-2] MEMOIZATION STABIL untuk GeoJSON Sources
 *   Layer GeoJSON hanya dibangun ulang jika data atau aktiveLayers berubah,
 *   bukan setiap kali viewState berubah. Ini mencegah WebGL dari membongkar
 *   dan rebuild vertex buffer di GPU tanpa alasan.
 *
 * [OPT-3] LAZY LOAD + GUARD yang benar untuk BANGUNAN_AR_25K (3.5 MB)
 *   File 3.5 MB hanya dimuat saat zoom >= 14 (bukan zoom >= 10), memberikan
 *   waktu lebih lama sebelum browser perlu mengalokasikan GPU memory.
 *   tolerance=1.0 dipakai di zoom rendah, 0.5 di zoom detail.
 *
 * [OPT-4] WebGL CONTEXT CLEANUP via onRemove
 *   MapLibre instance dihancurkan secara eksplisit lewat map.remove() saat
 *   komponen unmount untuk mencegah WebGL context leak.
 *
 * [OPT-5] STABLE SUPERCLUSTER BBOX — cluster hanya dikalkuasi saat
 *   viewBBox atau zoom (dibulatkan ke integer) benar-benar berubah,
 *   bukan setiap frame animasi.
 *
 * Arsitektur Layer (bottom → top):
 *   1. Basemap       — Raster tiles (OSM/Carto/ArcGIS) dibungkus MapLibre Style
 *   2. GeoJSON Env   — Sungai (line), Kontur (line), Pemukiman (fill)
 *   3. Bangunan      — Flat fill (zoom<17), Fill-extrusion (zoom≥17)
 *   4. Submissions   — Flat fill (zoom<14), Fill-extrusion 3D (zoom≥14)
 *   5. Sub-polygons  — Kavling, RTH, PSU, Jalan (zoom≥14)
 *   6. Clash Layer   — Area pelanggaran sempadan (merah pulsing)
 *   7. Markers       — Supercluster (zoom<13), Individual (zoom≥13)
 * ============================================================================
 */

import {
    useEffect, useMemo, useState,
    useCallback, useRef, memo,
} from 'react';
import Map, {
    Source,
    Layer,
    Marker,
    Popup,
    type MapRef,
    type MapLayerMouseEvent,
    type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import { MercatorCoordinate } from 'maplibre-gl';
import * as THREE from 'three';
import Supercluster from 'supercluster';
import type { BBox, GeoJsonProperties } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useGisUIStore } from '@/app/store/useGisUIStore';
import { mockSubmissions } from '@/mock/submission/submissions';
import type { Submission } from '@/features/submission/types';
import {
    leafletRingToGeoJSON,
    calcExtrusionHeight,
    resolveStatusColor,
    resolveLayerCategory,
} from '@/lib/geoUtils';

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

// ─── Basemap Style Factory (dimemoize di luar komponen) ────────────────────────

/**
 * Cache style per basemap agar tidak membuat object baru setiap render.
 * Tanpa cache ini, mapStyle prop yang selalu baru memaksa MapLibre reload
 * seluruh tile source bahkan ketika basemap tidak berubah.
 */
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

function vis(active: boolean): 'visible' | 'none' {
    return active ? 'visible' : 'none';
}

function calculateCentroid(polygon: [number, number][]): [number, number] {
    let totalLat = 0;
    let totalLng = 0;
    polygon.forEach(([lat, lng]) => {
        totalLat += lat;
        totalLng += lng;
    });
    return [totalLng / polygon.length, totalLat / polygon.length];
}

function disposeHierarchy(obj: any) {
    obj.traverse((child: any) => {
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
            } else {
                child.material.dispose();
            }
        }
    });
}

function createMockSitePlanModel() {
    const mainGroup = new THREE.Group();

    // Materials using MeshLambertMaterial for lightweight GPU rendering
    const lawnMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20 }); // dark green
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2d3748 }); // dark gray
    const houseMat = new THREE.MeshLambertMaterial({ color: 0x0f766e }); // teal
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x134e4a }); // dark teal
    const facilityMat = new THREE.MeshLambertMaterial({ color: 0xd97706 }); // orange
    const facilityRoofMat = new THREE.MeshLambertMaterial({ color: 0x92400e }); // dark orange

    // Ground Lawn Base
    const lawnGeo = new THREE.BoxGeometry(80, 0.2, 80);
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.position.y = 0.1;
    mainGroup.add(lawn);

    // Roads (mimicking BimViewerPage.tsx)
    const road1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 80), roadMat);
    road1.position.set(0, 0.2, 0);
    mainGroup.add(road1);

    const road2 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.3, 6), roadMat);
    road2.position.set(0, 0.2, 0);
    mainGroup.add(road2);

    // Function to place a building with BoxGeometry (body) and ConeGeometry (roof)
    const placeBuilding = (
        x: number, z: number, w: number, d: number, h: number,
        bodyMat: THREE.Material, roofMaterial: THREE.Material
    ) => {
        const bodyGeom = new THREE.BoxGeometry(w, h, d);
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(x, h / 2 + 0.2, z);
        mainGroup.add(body);

        // Roof (pyramid-like via scaled ConeGeometry with 4 radial segments)
        const roofGeom = new THREE.ConeGeometry(Math.max(w, d) * 0.75, h * 0.3, 4);
        const roof = new THREE.Mesh(roofGeom, roofMaterial);
        roof.position.set(x, h + (h * 0.15) + 0.2, z);
        roof.rotation.y = Math.PI / 4;
        mainGroup.add(roof);
    };

    // Grid-based layout mimicking BimViewerPage.tsx
    const rows = 5;
    const cols = 5;
    const spacingX = 14;
    const spacingZ = 16;
    const offsetX = -((cols - 1) * spacingX) / 2;
    const offsetZ = -((rows - 1) * spacingZ) / 2;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = offsetX + col * spacingX;
            const z = offsetZ + row * spacingZ;
            
            // Skip center area for road intersection
            if (Math.abs(x) < 6 || Math.abs(z) < 8) continue;

            const isFacility = (row === 0 && col === 0) || (row === 4 && col === 4);
            const bw = 4 + (row % 2) * 1.5 + (col % 2) * 0.5;
            const bd = 5 + (col % 2) * 1.5 + (row % 2) * 0.5;
            const bh = isFacility ? 10 : 4 + (row % 3) * 1;

            placeBuilding(
                x,
                z,
                bw, bd, bh,
                isFacility ? facilityMat : houseMat,
                isFacility ? facilityRoofMat : roofMat
            );
        }
    }

    return mainGroup;
}

// ─── Tipe Internal ─────────────────────────────────────────────────────────────

interface ProcessedSubmission extends Submission {
    color: string;
    categoryLayer: string;
    extrusionHeight: number;
}

// ─── Sub-komponen Marker yang di-memo ──────────────────────────────────────────
// Memisahkan JSX marker ke komponen tersendiri mencegah re-render semua marker
// hanya karena salah satu state (misal popupInfo) berubah.

interface ClusterMarkerProps {
    lng: number;
    lat: number;
    count: number;
    clusterId: number;
    zoom: number;
    onExpand: (clusterId: number, lng: number, lat: number, zoom: number) => void;
}

const ClusterMarker = memo(function ClusterMarker({
    lng, lat, count, clusterId, zoom, onExpand,
}: ClusterMarkerProps) {
    const size = count < 10 ? 36 : count < 50 ? 44 : 52;
    return (
        <Marker longitude={lng} latitude={lat} anchor="center"
            onClick={(e) => { e.originalEvent.stopPropagation(); onExpand(clusterId, lng, lat, zoom); }}>
            <div style={{
                width: size, height: size,
                background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
                border: '3px solid #fff', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: size < 44 ? 12 : 14, fontWeight: 900, color: '#fff',
                boxShadow: '0 2px 12px rgba(20,184,166,0.55)', cursor: 'pointer',
            }}>
                {count}
            </div>
        </Marker>
    );
});

interface PinMarkerProps {
    sub: ProcessedSubmission;
    isSelected: boolean;
    sizeBase?: number;
    onClickPin: (sub: ProcessedSubmission) => void;
    onShowPopup: (sub: ProcessedSubmission) => void;
}

const PinMarker = memo(function PinMarker({
    sub, isSelected, sizeBase = 28, onClickPin, onShowPopup,
}: PinMarkerProps) {
    const size = isSelected ? sizeBase + 4 : sizeBase;
    return (
        <Marker longitude={sub.location.lng} latitude={sub.location.lat} anchor="bottom"
            onClick={(e) => {
                e.originalEvent.stopPropagation();
                onShowPopup(sub);
                onClickPin(sub);
            }}>
            <div style={{
                width: size, height: size, background: sub.color,
                border: '3px solid #fff',
                borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
                boxShadow: isSelected
                    ? `0 0 0 3px ${sub.color}, 0 4px 16px rgba(0,0,0,0.5)`
                    : '0 2px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer', transition: 'all 0.15s ease',
            }} />
        </Marker>
    );
});

// ─── KOMPONEN UTAMA ────────────────────────────────────────────────────────────

export default function SipasMap() {
    // ── Zustand: hanya baca state yang benar-benar diperlukan ─────────────────
    // Pisahkan pembacaan store agar perubahan satu state tidak memaksa
    // re-subscribe semua state lain dalam satu destructuring.
    const activeLayers         = useGisUIStore((s) => s.activeLayers);
    const activeBaseMap        = useGisUIStore((s) => s.activeBaseMap);
    const mapOpacity           = useGisUIStore((s) => s.mapOpacity);
    const selectedCompanyId    = useGisUIStore((s) => s.selectedCompanyId);
    const is3DMode             = useGisUIStore((s) => s.is3DMode);
    const flyToTarget          = useGisUIStore((s) => s.flyToTarget);
    // Actions (stable references — tidak menyebabkan re-render)
    const setSelectedCompanyId = useGisUIStore((s) => s.setSelectedCompanyId);
    const setMapZoom           = useGisUIStore((s) => s.setMapZoom);
    const setMapCenter         = useGisUIStore((s) => s.setMapCenter);
    const setMapPitch          = useGisUIStore((s) => s.setMapPitch);
    const setMapBearing        = useGisUIStore((s) => s.setMapBearing);
    const openPanel            = useGisUIStore((s) => s.openPanel);
    const closePanelsToTheRight = useGisUIStore((s) => s.closePanelsToTheRight);
    const clearFlyTo           = useGisUIStore((s) => s.clearFlyTo);

    const mapRef = useRef<MapRef>(null);

    // ── [OPT-1] LOCAL VIEW STATE ───────────────────────────────────────────────
    // react-map-gl "controlled" mode: viewState dikelola secara lokal di sini.
    // Perubahan halus (pan/pinch/rotate) tidak menyentuh Zustand sama sekali
    // → panel samping tidak pernah re-render selama gesture berlangsung.
    const [localViewState, setLocalViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

    // ── State GeoJSON Layer (Lazy Loaded) ──────────────────────────────────────
    const [sungaiData, setSungaiData]       = useState<any>(null);
    const [konturData, setKonturData]       = useState<any>(null);
    const [pemukimanData, setPemukimanData] = useState<any>(null);
    const [bangunanData, setBangunanData]   = useState<any>(null);

    // ── State Cluster & Popup ──────────────────────────────────────────────────
    const [clusters, setClusters]   = useState<any[]>([]);
    const [popupInfo, setPopupInfo] = useState<ProcessedSubmission | null>(null);
    const [viewBBox, setViewBBox]   = useState<BBox>([-180, -85, 180, 85]);

    // ── State Clash Layer ──────────────────────────────────────────────────────
    const [clashGeoJSON, setClashGeoJSON] = useState<any>(null);



    // ── [OPT-3] LAZY LOAD GeoJSON — guard ketat, hanya load sekali ────────────
    // Bangunan hanya dimuat saat zoom >= 14 (bukan >= 10) untuk menunda
    // alokasi 3.5 MB GPU buffer hingga benar-benar dibutuhkan.
    const localZoom = localViewState.zoom;

    useEffect(() => {
        if (activeLayers.includes('layer-river') && localZoom >= 10 && !sungaiData) {
            import('@/assets/geojson/bogor/SUNGAI_LN_25K.json')
                .then((m) => setSungaiData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, sungaiData]);

    useEffect(() => {
        if (activeLayers.includes('layer-kontur') && localZoom >= 10 && !konturData) {
            import('@/assets/geojson/bogor/KONTUR_LN_25K.json')
                .then((m) => setKonturData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, konturData]);

    useEffect(() => {
        if (activeLayers.includes('layer-aqi') && localZoom >= 10 && !pemukimanData) {
            import('@/assets/geojson/bogor/PEMUKIMAN_AR_25K.json')
                .then((m) => setPemukimanData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, pemukimanData]);

    useEffect(() => {
        // [OPT-3] Bangunan: tunda load hingga zoom detail (>= 14) untuk hemat memori awal
        if (localZoom >= 14 && !bangunanData) {
            import('@/assets/geojson/bogor/BANGUNAN_AR_25K.json')
                .then((m) => setBangunanData(m.default)).catch(console.error);
        }
    }, [localZoom, bangunanData]);

    // ── Proses Submissions (stable — hanya recalc jika activeLayers berubah) ──
    const processedSubmissions = useMemo<ProcessedSubmission[]>(() =>
        mockSubmissions
            .map((sub: Submission) => ({
                ...sub,
                color: resolveStatusColor(sub.status),
                categoryLayer: resolveLayerCategory(sub.landArea),
                extrusionHeight: calcExtrusionHeight(sub),
            }))
            .filter((sub) => activeLayers.includes(sub.categoryLayer)),
        [activeLayers]
    );

    // ── Three.js Custom WebGL Layer for 3D GLB/CAD Models ────────────────────
    const customUser3DLayerRef = useRef<any>(null);
    const customUser3DLayer = useMemo(() => {
        const layer: any = {
            id: 'user-3d-model-layer',
            type: 'custom',
            renderingMode: '3d',
            map: null,
            renderer: null,
            scene: null,
            camera: null,
            modelMesh: null,
            currentModelId: null,
            modelTransform: null,
            pendingCentroid: null,
            pendingModelUrl: null,

            onAdd(map: any, gl: any) {
                this.map = map;
                
                // Initialize Three.js renderer wrapping the existing WebGL context
                this.renderer = new THREE.WebGLRenderer({
                    canvas: map.getCanvas(),
                    context: gl,
                    antialias: true,
                });
                this.renderer.autoClear = false;

                this.scene = new THREE.Scene();
                this.camera = new THREE.PerspectiveCamera();

                // Setup lights
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
                this.scene.add(ambientLight);
                
                const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
                dirLight.position.set(0, -70, 100).normalize();
                this.scene.add(dirLight);

                const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
                dirLight2.position.set(0, 70, 100).normalize();
                this.scene.add(dirLight2);

                // Load any queued/pending model once the scene is ready
                if (this.currentModelId && this.pendingCentroid) {
                    const id = this.currentModelId;
                    const centroid = this.pendingCentroid;
                    const url = this.pendingModelUrl;
                    this.currentModelId = null; // Reset to bypass deduplication check
                    this.loadModel(id, centroid, url);
                }
            },

            loadModel(id: string, centroid: [number, number], modelUrl: string) {
                if (this.currentModelId === id && this.scene) return; // already loading/loaded
                
                this.clearModel();
                this.currentModelId = id;
                this.pendingCentroid = centroid;
                this.pendingModelUrl = modelUrl;

                // Guard: If scene is not yet initialized by onAdd, wait and let onAdd trigger it.
                if (!this.scene) {
                    return;
                }

                // 2. Konversikan koordinat centroid poligon pengajuan yang dipilih ke unit Mercator
                const center = MercatorCoordinate.fromLngLat(centroid, 0);
                const scale = center.meterInMercatorCoordinateUnits();

                this.modelTransform = {
                    translateX: center.x,
                    translateY: center.y,
                    translateZ: center.z,
                    scale: scale,
                    rx: Math.PI / 2, // Rotate upright
                    ry: 0,
                    rz: 0,
                };

                const useFallback = () => {
                    if (this.currentModelId !== id || !this.scene) return;
                    if (this.modelMesh) {
                        this.scene.remove(this.modelMesh);
                        disposeHierarchy(this.modelMesh);
                    }
                    const mockModel = createMockSitePlanModel();
                    this.modelMesh = mockModel;
                    this.scene.add(mockModel);
                    if (this.map) this.map.triggerRepaint();
                };

                if (modelUrl) {
                    import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
                        if (this.currentModelId !== id) return;

                        const loader = new GLTFLoader();
                        loader.load(
                            modelUrl,
                            (gltf) => {
                                if (this.currentModelId !== id) {
                                    disposeHierarchy(gltf.scene);
                                    return;
                                }

                                if (this.modelMesh && this.scene) {
                                    this.scene.remove(this.modelMesh);
                                    disposeHierarchy(this.modelMesh);
                                }

                                const model = gltf.scene;
                                // Scale standard GLTF Box if needed to be visible and nicely sized on the map
                                model.scale.set(10, 10, 10);

                                this.modelMesh = model;
                                this.scene.add(model);
                                if (this.map) this.map.triggerRepaint();
                            },
                            undefined,
                            (err) => {
                                console.warn('[THREE-BIM] Failed to load external GLTF model, using procedural fallback.', err);
                                useFallback();
                            }
                        );
                    }).catch((err) => {
                        console.warn('[THREE-BIM] Failed to import GLTFLoader, using procedural fallback.', err);
                        useFallback();
                    });
                } else {
                    useFallback();
                }
            },

            clearModel() {
                this.currentModelId = null;
                this.modelTransform = null;
                this.pendingCentroid = null;
                this.pendingModelUrl = null;
                if (this.modelMesh && this.scene) {
                    this.scene.remove(this.modelMesh);
                    disposeHierarchy(this.modelMesh);
                    this.modelMesh = null;
                    if (this.map) this.map.triggerRepaint();
                }
            },

            render(_gl: any, matrix: number[]) {
                if (!this.renderer || !this.scene || !this.camera || !this.modelMesh || !this.modelTransform) return;

                const { translateX, translateY, translateZ, scale, rx, ry, rz } = this.modelTransform;

                const rotationX = new THREE.Matrix4().makeRotationX(rx);
                const rotationY = new THREE.Matrix4().makeRotationY(ry);
                const rotationZ = new THREE.Matrix4().makeRotationZ(rz);

                const m = new THREE.Matrix4().fromArray(matrix);
                const l = new THREE.Matrix4()
                    .makeTranslation(translateX, translateY, translateZ)
                    .scale(new THREE.Vector3(scale, -scale, scale))
                    .multiply(rotationX)
                    .multiply(rotationY)
                    .multiply(rotationZ);

                this.camera.projectionMatrix = m.multiply(l);
                this.renderer.resetState();
                this.renderer.render(this.scene, this.camera);
            },

            onRemove() {
                this.clearModel();
                if (this.renderer) {
                    this.renderer.dispose();
                    this.renderer = null;
                }
            }
        };

        customUser3DLayerRef.current = layer;
        return layer;
    }, []);

    // Effect: Re-add custom WebGL layer when style changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const mapNative = map.getMap();

        const handleStyleData = () => {
            if (mapNative && !mapNative.getLayer('user-3d-model-layer')) {
                try {
                    mapNative.addLayer(customUser3DLayer);
                } catch (e) {
                    console.warn('[THREE-BIM] Failed to add custom WebGL layer:', e);
                }
            }
        };

        mapNative.on('styledata', handleStyleData);
        handleStyleData(); // try to add it immediately if style is loaded
        
        return () => {
            if (mapNative) {
                mapNative.off('styledata', handleStyleData);
            }
        };
    }, [activeBaseMap, customUser3DLayer]);

    // Effect: Dynamically load/unload BIM model based on selection and zoom
    useEffect(() => {
        if (selectedCompanyId && localZoom >= 16) {
            const sub = processedSubmissions.find((s) => s.id === selectedCompanyId);
            if (sub && sub.location.polygon && sub.location.polygon.length >= 3) {
                const centroid = calculateCentroid(sub.location.polygon);
                const modelUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb';
                customUser3DLayer.loadModel(selectedCompanyId, centroid, modelUrl);
            }
        } else {
            customUser3DLayer.clearModel();
        }
    }, [selectedCompanyId, localZoom, processedSubmissions, customUser3DLayer]);

    // Effect: Cleanup Three.js Layer on component unmount
    useEffect(() => {
        return () => {
            customUser3DLayerRef.current?.onRemove();
        };
    }, []);

    // ── [OPT-2] STABLE GeoJSON MEMOS ──────────────────────────────────────────
    // Dependencies: hanya processedSubmissions (bukan localViewState)
    // Ini menjamin WebGL tidak rebuild GPU buffer saat peta digeser.
    const submissionsGeoJSON = useMemo(() => {
        const features = processedSubmissions
            .filter((sub) => sub.location.polygon && sub.location.polygon.length >= 3)
            .map((sub) => {
                try {
                    const ring = leafletRingToGeoJSON(sub.location.polygon as [number, number][]);
                    return {
                        type: 'Feature' as const,
                        geometry: { type: 'Polygon' as const, coordinates: [ring] },
                        properties: {
                            id: sub.id,
                            color: sub.color,
                            height: sub.extrusionHeight,
                            status: sub.status,
                            housingName: sub.housingName,
                            categoryLayer: sub.categoryLayer,
                        },
                    };
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        return { type: 'FeatureCollection' as const, features };
    }, [processedSubmissions]);

    const subPolygonsGeoJSON = useMemo(() => {
        const features: any[] = [];
        processedSubmissions.forEach((sub) => {
            const loc = sub.location;
            const addPoly = (rings: [number, number][][], color: string, type: string) => {
                rings.forEach((ring) => {
                    try {
                        features.push({
                            type: 'Feature',
                            geometry: { type: 'Polygon', coordinates: [leafletRingToGeoJSON(ring)] },
                            properties: { color, type, submissionId: sub.id },
                        });
                    } catch { /* skip invalid */ }
                });
            };
            if (loc.roadPolygons)    addPoly(loc.roadPolygons,    '#cbd5e1', 'road');
            if (loc.rthPolygons)     addPoly(loc.rthPolygons,     '#10b981', 'rth');
            if (loc.psuPolygons)     addPoly(loc.psuPolygons,     '#14b8a6', 'psu');
            if (loc.kavlingPolygons) addPoly(loc.kavlingPolygons, '#64748b', 'kavling');
        });
        return { type: 'FeatureCollection' as const, features };
    }, [processedSubmissions]);

    // ── [OPT-5] SUPERCLUSTER: stable, hanya rebuild jika data berubah ─────────
    const supercluster = useMemo(() => {
        const sc = new Supercluster<GeoJsonProperties>({ radius: 80, maxZoom: 12, minZoom: 0 });
        sc.load(processedSubmissions.map((sub) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [sub.location.lng, sub.location.lat] },
            properties: {
                submissionId: sub.id, color: sub.color,
                housingName: sub.housingName, developerName: sub.developerName, status: sub.status,
            },
        })));
        return sc;
    }, [processedSubmissions]);

    // [OPT-5] Cluster hanya dikalkuasi saat bbox atau integer zoom berubah
    const intZoom = Math.floor(localZoom);
    useEffect(() => {
        try {
            setClusters(supercluster.getClusters(viewBBox, intZoom));
        } catch {
            setClusters([]);
        }
    }, [supercluster, viewBBox, intZoom]);

    // ── Clash Polygon Listener ────────────────────────────────────────────────
    useEffect(() => {
        const handleRenderClash = (e: Event) => {
            const ev = e as CustomEvent;
            if (!ev.detail?.clashGeometry?.geometry) return;
            try {
                setClashGeoJSON({ type: 'FeatureCollection', features: [ev.detail.clashGeometry] });
            } catch {
                setClashGeoJSON(null);
            }
        };
        const handleClearClash = () => setClashGeoJSON(null);
        window.addEventListener('map-render-clash', handleRenderClash);
        window.addEventListener('map-clear-clash',  handleClearClash);
        return () => {
            window.removeEventListener('map-render-clash', handleRenderClash);
            window.removeEventListener('map-clear-clash',  handleClearClash);
        };
    }, []);

    // ── Observer: is3DMode Toggle ─────────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current) return;
        const targetPitch = is3DMode ? 45 : 0;
        const targetBearing = is3DMode ? -10 : 0;
        setLocalViewState((prev) => ({
            ...prev,
            pitch: targetPitch,
            bearing: targetBearing,
        }));
        mapRef.current.easeTo({
            pitch: targetPitch,
            bearing: targetBearing,
            duration: 600,
        });
    }, [is3DMode]);

    // ── FlyTo Observer (Zustand → MapLibre imperative) ────────────────────────
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

    // ── Legacy Window Event Bridge ─────────────────────────────────────────────
    // Dijaga oleh onLoad agar mapRef sudah terisi saat event pertama diterima.
    const handleMapLoad = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleZoomIn  = () => map.zoomIn({ duration: 300 });
        const handleZoomOut = () => map.zoomOut({ duration: 300 });
        const handleReset   = () => {
            const currentIs3D = useGisUIStore.getState().is3DMode;
            const targetPitch = currentIs3D ? 45 : 0;
            const targetBearing = currentIs3D ? -10 : 0;
            console.log(`[GEOSIPAS] Resetting map view. Mode: ${currentIs3D ? "3D" : "2D"}, Target Pitch: ${targetPitch}, Target Bearing: ${targetBearing}`);
            setLocalViewState((prev) => ({
                ...prev,
                longitude: BOGOR_LNG,
                latitude: BOGOR_LAT,
                zoom: 11,
                pitch: targetPitch,
                bearing: targetBearing,
            }));
            map.flyTo({
                center: [BOGOR_LNG, BOGOR_LAT],
                zoom: 11,
                pitch: targetPitch,
                bearing: targetBearing,
                duration: 1200,
            });
        };
        const handleFlyTo   = (e: Event) => {
            const ev = e as CustomEvent<{ lat: number; lng: number }>;
            if (ev.detail) map.flyTo({ center: [ev.detail.lng, ev.detail.lat], zoom: 18, pitch: 60, duration: 1800 });
        };

        window.addEventListener('map-zoom-in',       handleZoomIn);
        window.addEventListener('map-zoom-out',      handleZoomOut);
        window.addEventListener('map-reset-view',    handleReset);
        window.addEventListener('map-fly-to-coords', handleFlyTo);

        // [OPT-4] WebGL cleanup: daftarkan event remove di sini juga
        // agar cleanup terikat lifecycle map yang sama, bukan closure komponen.
        const mapNative = map.getMap();
        const onRemove = () => {
            window.removeEventListener('map-zoom-in',       handleZoomIn);
            window.removeEventListener('map-zoom-out',      handleZoomOut);
            window.removeEventListener('map-reset-view',    handleReset);
            window.removeEventListener('map-fly-to-coords', handleFlyTo);
        };
        mapNative.once('remove', onRemove);
    }, []);

    // ── [OPT-4] WebGL Context Cleanup ─────────────────────────────────────────
    // Memanggil map.remove() secara eksplisit saat komponen unmount.
    // Tanpa ini, browser bisa kehabisan WebGL context (max ~16 context per tab)
    // setelah pengguna berpindah halaman berkali-kali.
    useEffect(() => {
        return () => {
            try {
                mapRef.current?.getMap()?.remove();
            } catch {
                // map mungkin sudah ter-destroy oleh React, abaikan
            }
        };
    }, []);

    // ── [OPT-1] Handler: onMove — HANYA update localViewState (TIDAK Zustand) ─
    const handleMove = useCallback((e: ViewStateChangeEvent) => {
        setLocalViewState(e.viewState as MapViewState);
    }, []);

    const handleMoveStart = useCallback(() => {
        window.dispatchEvent(new Event('map-move-start'));
    }, []);

    // ── [OPT-1] Handler: onMoveEnd — baru sync ke Zustand & supercluster ──────
    // Dipanggil HANYA saat gesture selesai (touchend / mouseup / wheel stop).
    // Frekuensi: ~1–3× per interaksi, bukan 60× per detik.
    const handleMoveEnd = useCallback((e: ViewStateChangeEvent) => {
        const { longitude, latitude, zoom, pitch, bearing } = e.viewState;

        // Sync ke Zustand (satu batch write, bukan 60 writes/detik)
        setMapCenter([latitude, longitude]);
        setMapZoom(zoom);
        setMapPitch(pitch);
        setMapBearing(bearing);

        // Update bbox untuk supercluster setelah gerakan selesai
        const map = mapRef.current;
        if (map) {
            const bounds = map.getBounds();
            if (bounds) {
                setViewBBox([
                    bounds.getWest(), bounds.getSouth(),
                    bounds.getEast(), bounds.getNorth(),
                ]);
            }
        }

        window.dispatchEvent(new Event('map-move-end'));
    }, [setMapCenter, setMapZoom, setMapPitch, setMapBearing]);

    // ── Handler: Klik Layer Submissions ───────────────────────────────────────
    const handleSubmissionClick = useCallback((e: MapLayerMouseEvent) => {
        const props = e.features?.[0]?.properties;
        if (!props?.id) return;
        const sub = processedSubmissions.find((s) => s.id === props.id);
        if (!sub) return;
        setSelectedCompanyId(sub.id);
        closePanelsToTheRight(-1);
        openPanel('detil-perusahaan', `Detail: ${sub.housingName}`, sub);
        const currentIs3D = useGisUIStore.getState().is3DMode;
        const targetPitch = currentIs3D ? 60 : 0;
        const targetBearing = currentIs3D ? -10 : 0;
        setLocalViewState((prev) => ({
            ...prev,
            longitude: sub.location.lng,
            latitude: sub.location.lat,
            zoom: Math.max(localZoom, 15),
            pitch: targetPitch,
            bearing: targetBearing,
        }));
        mapRef.current?.flyTo({
            center: [sub.location.lng, sub.location.lat],
            zoom: Math.max(localZoom, 15),
            pitch: targetPitch,
            bearing: targetBearing,
            duration: 1200,
        });
    }, [processedSubmissions, setSelectedCompanyId, closePanelsToTheRight, openPanel, localZoom]);

    const handleMarkerClick = useCallback((sub: ProcessedSubmission) => {
        setSelectedCompanyId(sub.id);
        closePanelsToTheRight(-1);
        openPanel('detil-perusahaan', `Detail: ${sub.housingName}`, sub);
        const currentIs3D = useGisUIStore.getState().is3DMode;
        const targetPitch = currentIs3D ? 55 : 0;
        const targetBearing = currentIs3D ? -10 : 0;
        setLocalViewState((prev) => ({
            ...prev,
            longitude: sub.location.lng,
            latitude: sub.location.lat,
            zoom: 16,
            pitch: targetPitch,
            bearing: targetBearing,
        }));
        mapRef.current?.flyTo({
            center: [sub.location.lng, sub.location.lat],
            zoom: 16,
            pitch: targetPitch,
            bearing: targetBearing,
            duration: 1200,
        });
    }, [setSelectedCompanyId, closePanelsToTheRight, openPanel]);

    const handleClusterExpand = useCallback((
        clusterId: number, lng: number, lat: number, currentZoom: number,
    ) => {
        try {
            const z = supercluster.getClusterExpansionZoom(clusterId);
            mapRef.current?.flyTo({ center: [lng, lat], zoom: z, duration: 800 });
        } catch {
            mapRef.current?.flyTo({ center: [lng, lat], zoom: currentZoom + 2, duration: 800 });
        }
    }, [supercluster]);

    // ── Derived visibility — HANYA dari localViewState (tidak subscribe Zustand) ─
    const opacity       = mapOpacity / 100;
    const showSungai    = activeLayers.includes('layer-river')  && localZoom >= 10;
    const showKontur    = activeLayers.includes('layer-kontur') && localZoom >= 10;
    const showPemukiman = activeLayers.includes('layer-aqi')    && localZoom >= 10;
    const showDetail    = localZoom >= 14;
    const showClusters  = localZoom < 13;

    // ── Toleransi simplifikasi GeoJSON bangunan berdasarkan zoom ─────────────
    // Zoom jauh → toleransi besar (geometri kasar, cepat di GPU)
    // Zoom dekat → toleransi kecil (geometri detail, akurat)
    const bangunanTolerance = localZoom < 15 ? 1.0 : 0.5;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="absolute inset-0 z-0">
            {/*
             * [OPT-1] "Controlled" Map: viewState dikelola secara lokal via onMove.
             * Zustand TIDAK diperbarui selama gesture — hanya saat onMoveEnd.
             */}
            <Map
                ref={mapRef}
                mapLib={import('maplibre-gl')}
                mapStyle={getMapStyle(activeBaseMap)}
                {...localViewState}                 // Controlled view state
                style={{ width: '100%', height: '100%' }}
                maxZoom={22}
                pitchWithRotate={is3DMode}
                dragRotate={is3DMode}
                touchZoomRotate={is3DMode}
                interactiveLayerIds={['submissions-fill-flat', 'submissions-extrusion']}
                onMove={handleMove}                 // [OPT-1] Update local state saja
                onMoveStart={handleMoveStart}
                onMoveEnd={handleMoveEnd}           // [OPT-1] Zustand hanya di sini
                onClick={handleSubmissionClick}
                onLoad={handleMapLoad}              // [OPT-4] Setup event + cleanup hook
            >
                {/* ================================================================
                    LAYER 1: PEMUKIMAN RTRW
                    [OPT-2] Source stabil — tidak recreate saat peta bergerak
                ================================================================ */}
                {showPemukiman && pemukimanData && (
                    <Source id="pemukiman" type="geojson" data={pemukimanData}>
                        <Layer id="pemukiman-fill" type="fill"
                            layout={{ visibility: vis(showPemukiman) }}
                            paint={{ 'fill-color': '#2dd4bf', 'fill-opacity': 0.35 * opacity }}
                        />
                        <Layer id="pemukiman-outline" type="line"
                            layout={{ visibility: vis(showPemukiman) }}
                            paint={{ 'line-color': '#14b8a6', 'line-width': 1, 'line-opacity': 0.6 * opacity }}
                        />
                    </Source>
                )}

                {/* ================================================================
                    LAYER 2: KONTUR LERENG
                ================================================================ */}
                {showKontur && konturData && (
                    <Source id="kontur" type="geojson" data={konturData}>
                        <Layer id="kontur-line" type="line"
                            layout={{ visibility: vis(showKontur) }}
                            paint={{
                                'line-color': '#fcd34d', 'line-width': 1,
                                'line-opacity': 0.8 * opacity, 'line-dasharray': [4, 2],
                            }}
                        />
                    </Source>
                )}

                {/* ================================================================
                    LAYER 3: ALIRAN SUNGAI
                ================================================================ */}
                {showSungai && sungaiData && (
                    <Source id="sungai" type="geojson" data={sungaiData}>
                        <Layer id="sungai-casing" type="line"
                            layout={{ visibility: vis(showSungai) }}
                            paint={{ 'line-color': '#0e7490', 'line-width': 5, 'line-opacity': 0.5 * opacity }}
                        />
                        <Layer id="sungai-line" type="line"
                            layout={{ visibility: vis(showSungai) }}
                            paint={{ 'line-color': '#22d3ee', 'line-width': 3, 'line-opacity': 0.9 * opacity }}
                        />
                    </Source>
                )}

                {/* ================================================================
                    LAYER 4: BANGUNAN EKSISTING
                    [OPT-3] Hanya dimuat dan dirender saat zoom >= 14.
                    tolerance bervariasi berdasarkan zoom untuk efisiensi GPU.
                ================================================================ */}
                {bangunanData && localZoom >= 14 && (
                    <Source id="bangunan" type="geojson" data={bangunanData}
                        tolerance={bangunanTolerance}>
                        <Layer id="bangunan-fill-flat" type="fill" maxzoom={17}
                            paint={{ 'fill-color': '#94a3b8', 'fill-opacity': 0.4 * opacity }}
                        />
                        <Layer id="bangunan-extrusion" type="fill-extrusion" minzoom={17}
                            paint={{
                                'fill-extrusion-color': '#94a3b8', 'fill-extrusion-height': 8,
                                'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.6 * opacity,
                            }}
                        />
                    </Source>
                )}

                {/* ================================================================
                    LAYER 5: SUBMISSION POLYGON (Pengajuan Site Plan)
                    [OPT-2] Source ID stabil → tidak recreate GPU buffer
                ================================================================ */}
                <Source id="submissions" type="geojson" data={submissionsGeoJSON} generateId={true}>
                    <Layer id="submissions-fill-flat" type="fill" maxzoom={14}
                        paint={{
                            'fill-color': ['get', 'color'],
                            'fill-opacity': [
                                'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
                                0.6, 0.35 * opacity,
                            ],
                        }}
                    />
                    <Layer id="submissions-outline-flat" type="line" maxzoom={14}
                        paint={{
                            'line-color': ['get', 'color'],
                            'line-width': [
                                'case', ['==', ['get', 'id'], selectedCompanyId ?? ''], 3, 1.5,
                            ],
                            'line-opacity': opacity,
                        }}
                    />
                    <Layer id="submissions-extrusion" type="fill-extrusion" minzoom={14}
                        paint={{
                            'fill-extrusion-color': ['get', 'color'],
                            'fill-extrusion-height': [
                                'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
                                ['*', ['get', 'height'], 1.5], ['get', 'height'],
                            ],
                            'fill-extrusion-base': 0,
                            'fill-extrusion-opacity': 0.75 * opacity,
                        }}
                    />
                </Source>

                {/* ================================================================
                    LAYER 6: SUB-POLYGON CAD DETAIL (zoom >= 14)
                ================================================================ */}
                {showDetail && (
                    <Source id="sub-polygons" type="geojson" data={subPolygonsGeoJSON}>
                        <Layer id="sub-poly-fill" type="fill"
                            paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.5 * opacity }}
                        />
                        <Layer id="sub-poly-outline" type="line"
                            paint={{ 'line-color': ['get', 'color'], 'line-width': 1, 'line-opacity': 0.8 * opacity }}
                        />
                    </Source>
                )}

                {/* ================================================================
                    LAYER 7: CLASH POLYGON (Pelanggaran Sempadan Sungai)
                ================================================================ */}
                {clashGeoJSON && (
                    <Source id="clash" type="geojson" data={clashGeoJSON}>
                        <Layer id="clash-fill" type="fill"
                            paint={{ 'fill-color': '#ef4444', 'fill-opacity': 0.5 }}
                        />
                        <Layer id="clash-outline" type="line"
                            paint={{
                                'line-color': '#ff0000', 'line-width': 3,
                                'line-opacity': 1, 'line-dasharray': [4, 3],
                            }}
                        />
                    </Source>
                )}

                {/* ================================================================
                    LAYER 8: MARKERS
                    [OPT-2] Cluster/PinMarker di-memo → tidak re-render jika
                    prop yang tidak relevan berubah (misal popupInfo dari state lain).
                ================================================================ */}
                {showClusters
                    ? clusters.map((cluster) => {
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

                          const sub = processedSubmissions.find(
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
                                  onShowPopup={setPopupInfo}
                              />
                          );
                      })
                    : processedSubmissions.map((sub) => (
                          <PinMarker
                              key={`marker-hi-${sub.id}`}
                              sub={sub}
                              isSelected={selectedCompanyId === sub.id}
                              sizeBase={24}
                              onClickPin={handleMarkerClick}
                              onShowPopup={setPopupInfo}
                          />
                      ))}

                {/* ── Popup Info Cepat ────────────────────────────────────────── */}
                {popupInfo && (
                    <Popup
                        longitude={popupInfo.location.lng}
                        latitude={popupInfo.location.lat}
                        anchor="bottom"
                        offset={[0, -36] as [number, number]}
                        onClose={() => setPopupInfo(null)}
                        closeButton={false}
                        className="!rounded-none !border-0 !p-0 !shadow-2xl"
                    >
                        <div className="px-3 py-2.5 min-w-[180px] bg-white border border-slate-200 text-left select-none">
                            <div className="font-black text-[13px] text-slate-900 leading-tight mb-1">
                                {popupInfo.housingName}
                            </div>
                            <div className="text-[11px] text-slate-500 mb-2">
                                {popupInfo.developerName}
                            </div>
                            <span
                                className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5"
                                style={{
                                    color: popupInfo.color,
                                    background: `${popupInfo.color}20`,
                                    border: `1px solid ${popupInfo.color}40`,
                                }}
                            >
                                {popupInfo.status}
                            </span>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}