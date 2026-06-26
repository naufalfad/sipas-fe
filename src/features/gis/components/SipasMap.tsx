/**
 * ============================================================================
 * SIPAS MAP — Immersive 3D GIS Canvas  [PERFORMANCE-OPTIMIZED v2.1]
 * ============================================================================
 * Engine  : MapLibre GL JS (WebGL, open-source)
 * Wrapper : react-map-gl v7
 * Cluster : supercluster (client-side, zero-dependency)
 *
 * OPTIMASI TERRAIN 3D (Anti-Crash & Anti-Jittering):
 * [OPT-TERRAIN-STABLE] Source raster-dem dipasang permanen untuk mencegah 
 * crash siklus unmount WebGL. Toggle dikendalikan murni lewat properti `terrain`.
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
                // Tambahkan ": any" secara eksplisit pada parameter m
                child.material.forEach((m: any) => m.dispose());
            } else {
                child.material.dispose();
            }
        }
    });
}

function createMockSitePlanModel() {
    const mainGroup = new THREE.Group();

    const lawnMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20 });
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
    const houseMat = new THREE.MeshLambertMaterial({ color: 0x0f766e });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x134e4a });
    const facilityMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const facilityRoofMat = new THREE.MeshLambertMaterial({ color: 0x92400e });

    const lawnGeo = new THREE.BoxGeometry(80, 0.2, 80);
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.position.y = 0.1;
    mainGroup.add(lawn);

    const road1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 80), roadMat);
    road1.position.set(0, 0.2, 0);
    mainGroup.add(road1);

    const road2 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.3, 6), roadMat);
    road2.position.set(0, 0.2, 0);
    mainGroup.add(road2);

    const placeBuilding = (
        x: number, z: number, w: number, d: number, h: number,
        bodyMat: THREE.Material, roofMaterial: THREE.Material
    ) => {
        const bodyGeom = new THREE.BoxGeometry(w, h, d);
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(x, h / 2 + 0.2, z);
        mainGroup.add(body);

        const roofGeom = new THREE.ConeGeometry(Math.max(w, d) * 0.75, h * 0.3, 4);
        const roof = new THREE.Mesh(roofGeom, roofMaterial);
        roof.position.set(x, h + (h * 0.15) + 0.2, z);
        roof.rotation.y = Math.PI / 4;
        mainGroup.add(roof);
    };

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
    const activeLayers = useGisUIStore((s) => s.activeLayers);
    const activeBaseMap = useGisUIStore((s) => s.activeBaseMap);
    const mapOpacity = useGisUIStore((s) => s.mapOpacity);
    const selectedCompanyId = useGisUIStore((s) => s.selectedCompanyId);
    const is3DMode = useGisUIStore((s) => s.is3DMode);
    const isTerrainActive = useGisUIStore((s) => s.isTerrainActive);
    const flyToTarget = useGisUIStore((s) => s.flyToTarget);

    const setSelectedCompanyId = useGisUIStore((s) => s.setSelectedCompanyId);
    const setMapZoom = useGisUIStore((s) => s.setMapZoom);
    const setMapCenter = useGisUIStore((s) => s.setMapCenter);
    const setMapPitch = useGisUIStore((s) => s.setMapPitch);
    const setMapBearing = useGisUIStore((s) => s.setMapBearing);
    const openPanel = useGisUIStore((s) => s.openPanel);
    const closePanelsToTheRight = useGisUIStore((s) => s.closePanelsToTheRight);
    const clearFlyTo = useGisUIStore((s) => s.clearFlyTo);

    const mapRef = useRef<MapRef>(null);

    const [localViewState, setLocalViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

    // [OPT-TERRAIN-STABLE] Konfigurasi terrain di-memoize dengan referensi konstan
    const terrainConfig = useMemo(() => {
        return { source: 'aws-terrain-source', exaggeration: 1.5 };
    }, []);

    const [sungaiData, setSungaiData] = useState<any>(null);
    const [konturData, setKonturData] = useState<any>(null);
    const [pemukimanData, setPemukimanData] = useState<any>(null);
    const [bangunanData, setBangunanData] = useState<any>(null);

    const [clusters, setClusters] = useState<any[]>([]);
    const [popupInfo, setPopupInfo] = useState<ProcessedSubmission | null>(null);
    const [viewBBox, setViewBBox] = useState<BBox>([-180, -85, 180, 85]);

    const [clashGeoJSON, setClashGeoJSON] = useState<any>(null);

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
        if (localZoom >= 14 && !bangunanData) {
            import('@/assets/geojson/bogor/BANGUNAN_AR_25K.json')
                .then((m) => setBangunanData(m.default)).catch(console.error);
        }
    }, [localZoom, bangunanData]);

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
                this.renderer = new THREE.WebGLRenderer({
                    canvas: map.getCanvas(),
                    context: gl,
                    antialias: true,
                });
                this.renderer.autoClear = false;

                this.scene = new THREE.Scene();
                this.camera = new THREE.PerspectiveCamera();

                const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
                this.scene.add(ambientLight);

                const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
                dirLight.position.set(0, -70, 100).normalize();
                this.scene.add(dirLight);

                const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
                dirLight2.position.set(0, 70, 100).normalize();
                this.scene.add(dirLight2);

                if (this.currentModelId && this.pendingCentroid) {
                    const id = this.currentModelId;
                    const centroid = this.pendingCentroid;
                    const url = this.pendingModelUrl;
                    this.currentModelId = null;
                    this.loadModel(id, centroid, url);
                }
            },

            loadModel(id: string, centroid: [number, number], modelUrl: string) {
                if (this.currentModelId === id && this.scene) return;

                this.clearModel();
                this.currentModelId = id;
                this.pendingCentroid = centroid;
                this.pendingModelUrl = modelUrl;

                if (!this.scene) return;

                const center = MercatorCoordinate.fromLngLat(centroid, 0);
                const scale = center.meterInMercatorCoordinateUnits();

                this.modelTransform = {
                    translateX: center.x,
                    translateY: center.y,
                    translateZ: center.z,
                    scale: scale,
                    rx: Math.PI / 2,
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
                                model.scale.set(10, 10, 10);

                                this.modelMesh = model;
                                this.scene.add(model);
                                if (this.map) this.map.triggerRepaint();
                            },
                            undefined,
                            (err) => {
                                console.warn('[THREE-BIM] Fallback triggered:', err);
                                useFallback();
                            }
                        );
                    }).catch((err) => {
                        console.warn('[THREE-BIM] Fallback triggered:', err);
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
                if (!this.renderer || !this.scene || !this.camera || !this.modelMesh || !this.modelTransform || !this.pendingCentroid) return;

                const { rx, ry, rz } = this.modelTransform;

                let elevation = 0;
                if (this.map) {
                    try {
                        elevation = this.map.queryTerrainElevation(this.pendingCentroid) || 0;
                    } catch (e) {
                        // mengabaikan kegagalan baca elevasi saat transisi tile
                    }
                }

                const center = MercatorCoordinate.fromLngLat(this.pendingCentroid, elevation);
                const scale = center.meterInMercatorCoordinateUnits();

                const rotationX = new THREE.Matrix4().makeRotationX(rx);
                const rotationY = new THREE.Matrix4().makeRotationY(ry);
                const rotationZ = new THREE.Matrix4().makeRotationZ(rz);

                const m = new THREE.Matrix4().fromArray(matrix);
                const l = new THREE.Matrix4()
                    .makeTranslation(center.x, center.y, center.z)
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

    useEffect(() => {
        return () => {
            customUser3DLayerRef.current?.onRemove();
        };
    }, []);

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
            // Ganti ".filter(Boolean)" dengan Type Guard di bawah ini
            .filter((f): f is Exclude<typeof f, null> => f !== null);

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
                    } catch { /* skip */ }
                });
            };
            if (loc.roadPolygons) addPoly(loc.roadPolygons, '#cbd5e1', 'road');
            if (loc.rthPolygons) addPoly(loc.rthPolygons, '#10b981', 'rth');
            if (loc.psuPolygons) addPoly(loc.psuPolygons, '#14b8a6', 'psu');
            if (loc.kavlingPolygons) addPoly(loc.kavlingPolygons, '#64748b', 'kavling');
        });
        return { type: 'FeatureCollection' as const, features };
    }, [processedSubmissions]);

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

    const intZoom = Math.floor(localZoom);
    useEffect(() => {
        try {
            setClusters(supercluster.getClusters(viewBBox, intZoom));
        } catch {
            setClusters([]);
        }
    }, [supercluster, viewBBox, intZoom]);

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
        window.addEventListener('map-clear-clash', handleClearClash);
        return () => {
            window.removeEventListener('map-render-clash', handleRenderClash);
            window.removeEventListener('map-clear-clash', handleClearClash);
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;

        const nativeMap = mapRef.current.getMap();
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
        mapRef.current.easeTo({
            pitch: targetPitch,
            bearing: targetBearing,
            duration: 600,
        });
    }, [is3DMode]);

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

    const handleMapLoad = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleZoomIn = () => map.zoomIn({ duration: 300 });
        const handleZoomOut = () => map.zoomOut({ duration: 300 });
        const handleReset = () => {
            const currentIs3D = useGisUIStore.getState().is3DMode;
            const targetPitch = currentIs3D ? 45 : 0;
            const targetBearing = currentIs3D ? -10 : 0;
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
        const handleFlyTo = (e: Event) => {
            const ev = e as CustomEvent<{ lat: number; lng: number }>;
            if (ev.detail) map.flyTo({ center: [ev.detail.lng, ev.detail.lat], zoom: 18, pitch: 60, duration: 1800 });
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
                // map mungkin sudah hancur
            }
        };
    }, []);

    const handleMoveStart = useCallback(() => {
        window.dispatchEvent(new Event('map-move-start'));
    }, []);

    const handleMove = useCallback((e: ViewStateChangeEvent) => {
        setLocalViewState(e.viewState as MapViewState);
    }, []);

    const handleMoveEnd = useCallback((e: ViewStateChangeEvent) => {
        const { longitude, latitude, zoom, pitch, bearing } = e.viewState;

        setMapCenter([latitude, longitude]);
        setMapZoom(zoom);
        setMapPitch(pitch);
        setMapBearing(bearing);

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

    const opacity = mapOpacity / 100;
    const showSungai = activeLayers.includes('layer-river') && localZoom >= 10;
    const showKontur = activeLayers.includes('layer-kontur') && localZoom >= 10;
    const showPemukiman = activeLayers.includes('layer-aqi') && localZoom >= 10;
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
                style={{ width: '100%', height: '100%' }}
                maxZoom={22}
                pitchWithRotate={is3DMode}
                dragRotate={is3DMode}
                touchZoomRotate={is3DMode}
                // [OPT-TERRAIN-STABLE] Toggling 3D Terrain dilakukan di sini tanpa unmount <Source>
                terrain={(isTerrainActive && is3DMode) ? terrainConfig : undefined}
                maxPitch={85}
                interactiveLayerIds={['submissions-fill-flat', 'submissions-extrusion']}
                onMoveStart={handleMoveStart}
                onMoveEnd={handleMoveEnd}
                onClick={handleSubmissionClick}
                onLoad={handleMapLoad}
            >
                {/* 
                  * [OPT-TERRAIN-STABLE] Source elevasi dipasang permanen.
                  * MapLibre tidak akan meminta/mengunduh tile dem jika terrain di atas bernilai `undefined`.
                  * Ini mencegah WebGL crash dan lag thread saat unmount source.
                  */}
                <Source
                    id="aws-terrain-source"
                    type="raster-dem"
                    tiles={['https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png']}
                    encoding="terrarium"
                    tileSize={256}
                    maxzoom={18}
                />

                {showPemukiman && pemukimanData && (
                    <Source key="pemukiman-source" id="pemukiman" type="geojson" data={pemukimanData}>
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

                {showKontur && konturData && (
                    <Source key="kontur-source" id="kontur" type="geojson" data={konturData}>
                        <Layer id="kontur-line" type="line"
                            layout={{ visibility: vis(showKontur) }}
                            paint={{
                                'line-color': '#fcd34d', 'line-width': 1,
                                'line-opacity': 0.8 * opacity, 'line-dasharray': [4, 2],
                            }}
                        />
                    </Source>
                )}

                {showSungai && sungaiData && (
                    <Source key="sungai-source" id="sungai" type="geojson" data={sungaiData}>
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

                {bangunanData && localZoom >= 14 && (
                    <Source key="bangunan-source" id="bangunan" type="geojson" data={bangunanData}
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

                <Source key="submissions-source" id="submissions" type="geojson" data={submissionsGeoJSON} generateId={true}>
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

                {showDetail && (
                    <Source key="sub-polygons-source" id="sub-polygons" type="geojson" data={subPolygonsGeoJSON}>
                        <Layer id="sub-poly-fill" type="fill"
                            paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.5 * opacity }}
                        />
                        <Layer id="sub-poly-outline" type="line"
                            paint={{ 'line-color': ['get', 'color'], 'line-width': 1, 'line-opacity': 0.8 * opacity }}
                        />
                    </Source>
                )}

                {clashGeoJSON && (
                    <Source key="clash-source" id="clash" type="geojson" data={clashGeoJSON}>
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
                        <div className="px-3.5 py-3 min-w-[180px] bg-white text-left select-none">
                            <div className="font-black text-[13px] text-slate-900 leading-tight mb-1">
                                {popupInfo.housingName}
                            </div>
                            <div className="text-[11px] text-slate-500 mb-2.5">
                                {popupInfo.developerName}
                            </div>
                            <span
                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
                                style={{
                                    color: popupInfo.color,
                                    background: `${popupInfo.color}18`,
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