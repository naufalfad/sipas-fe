/**
 * ============================================================================
 * SIPAS MAP — Immersive 3D GIS Canvas  [PERFORMANCE-OPTIMIZED v2.2]
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
import { toast } from 'sonner';

import { useGisUIStore } from '@/app/store/useGisUIStore';
import type { Submission } from '@/features/submission/types';
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
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

// Batas wilayah Asia Tenggara — bebas navigasi seluruh kawasan
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

function vis(active: boolean): 'visible' | 'none' {
    return active ? 'visible' : 'none';
}

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

function disposeHierarchy(obj: any) {
    obj.traverse((child: any) => {
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            if (Array.isArray(child.material)) {
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
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Darker asphalt
    const markingMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White markings
    const houseMat = new THREE.MeshLambertMaterial({ color: 0x0f766e });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x9a3412 }); // Terracotta orange
    const facilityMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const facilityRoofMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // Lit window yellow
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x475569 }); // Slate pole
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfbef35 }); // Glowing light

    // 1. Lawn
    const lawnGeo = new THREE.BoxGeometry(80, 0.2, 80);
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.position.y = 0.1;
    mainGroup.add(lawn);

    // 2. Roads
    const road1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 80), roadMat);
    road1.position.set(0, 0.2, 0);
    mainGroup.add(road1);

    const road2 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.3, 6), roadMat);
    road2.position.set(0, 0.2, 0);
    mainGroup.add(road2);

    // 3. Road Markings (dashed center lines)
    for (let z = -38; z <= 38; z += 6) {
        if (Math.abs(z) < 5) continue;
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 3), markingMat);
        mark.position.set(0, 0.201, z);
        mainGroup.add(mark);
    }
    for (let x = -38; x <= 38; x += 6) {
        if (Math.abs(x) < 5) continue;
        const mark = new THREE.Mesh(new THREE.BoxGeometry(3, 0.32, 0.2), markingMat);
        mark.position.set(x, 0.201, 0);
        mainGroup.add(mark);
    }

    // 4. Streetlights
    const addStreetlight = (lx: number, lz: number) => {
        const lightGroup = new THREE.Group();
        lightGroup.position.set(lx, 0.2, lz);

        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6, 0.2), poleMat);
        pole.position.y = 3;
        lightGroup.add(pole);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.5), poleMat);
        head.position.set(lx > 0 ? -0.3 : 0.3, 6, 0);
        lightGroup.add(head);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lightMat);
        bulb.position.set(lx > 0 ? -0.3 : 0.3, 5.8, 0);
        lightGroup.add(bulb);

        mainGroup.add(lightGroup);
    };

    addStreetlight(4, 4);
    addStreetlight(-4, 4);
    addStreetlight(4, -4);
    addStreetlight(-4, -4);
    addStreetlight(4, 30);
    addStreetlight(-4, -30);

    // 5. Buildings Builder
    const placeBuilding = (
        x: number, z: number, w: number, d: number, h: number,
        bodyMat: THREE.Material, roofMaterial: THREE.Material
    ) => {
        const buildingGroup = new THREE.Group();
        buildingGroup.position.set(x, 0.2, z);

        const bodyGeom = new THREE.BoxGeometry(w, h, d);
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = h / 2;
        buildingGroup.add(body);

        const roofH = h * 0.4;
        const roofGeom = new THREE.ConeGeometry(Math.max(w, d) * 0.85, roofH, 4);
        const roof = new THREE.Mesh(roofGeom, roofMaterial);
        roof.position.y = h + (roofH / 2);
        roof.rotation.y = Math.PI / 4;
        buildingGroup.add(roof);

        const windowW = 0.5;
        const windowH = 0.8;
        const windowThick = 0.05;
        const floors = Math.floor(h / 3.5);

        for (let f = 0; f < floors; f++) {
            const winY = 1.5 + f * 3.5;
            for (let side = -1; side <= 1; side += 2) {
                const winX = side * (w * 0.25);
                const win = new THREE.Mesh(new THREE.BoxGeometry(windowW, windowH, windowThick), windowMat);
                win.position.set(winX, winY, d / 2 + 0.02);
                buildingGroup.add(win);

                const winBack = new THREE.Mesh(new THREE.BoxGeometry(windowW, windowH, windowThick), windowMat);
                winBack.position.set(winX, winY, -d / 2 - 0.02);
                buildingGroup.add(winBack);
            }
        }

        mainGroup.add(buildingGroup);
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
            const bw = 5 + (row % 2) * 1.5 + (col % 2) * 0.5;
            const bd = 6 + (col % 2) * 1.5 + (row % 2) * 0.5;
            const bh = isFacility ? 24 : 10 + (row % 3) * 3; // Much taller!

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

    // Pembaruan Spasial State [Bogor 3, Bogor 8, Purworejo 8]
    const isDroneLayerActive = useGisUIStore((s) => s.isDroneLayerActive);
    const droneLayerOpacity = useGisUIStore((s) => s.droneLayerOpacity);
    const spatialConflicts = useGisUIStore((s) => s.spatialConflicts);
    const activeKompensasi = useGisUIStore((s) => s.activeKompensasi);

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

    const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
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

    // [OPT-TERRAIN-STABLE] Konfigurasi terrain di-memoize dengan referensi konstan

    const [sungaiData, setSungaiData] = useState<any>(null);
    const [konturData, setKonturData] = useState<any>(null);
    const [pemukimanData, setPemukimanData] = useState<any>(null);
    const [bangunanData, setBangunanData] = useState<any>(null);
    const [sawahData, setSawahData] = useState<any>(null);
    const [pasirData, setPasirData] = useState<any>(null);
    const [kebunData, setKebunData] = useState<any>(null);
    const [ladangData, setLadangData] = useState<any>(null);
    // ── Layer Kab Bogor Baru ─────────────────────────────────────────────────
    const [administrasiData, setAdministrasiData] = useState<any>(null);
    const [desaData, setDesaData] = useState<any>(null);
    const [danauData, setDanauData] = useState<any>(null);
    const [jalanData, setJalanData] = useState<any>(null);
    const [tanamCampurData, setTanamCampurData] = useState<any>(null);
    const [hutanKeringData, setHutanKeringData] = useState<any>(null);
    const [alangData, setAlangData] = useState<any>(null);
    const [semakData, setSemakData] = useState<any>(null);
    const [punggungBukitData, setPunggungBukitData] = useState<any>(null);
    const [relkaData, setRelkaData] = useState<any>(null);

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

    useEffect(() => {
        if (activeLayers.includes('layer-sawah') && localZoom >= 10 && !sawahData) {
            import('@/assets/geojson/bogor/AGRISAWAH_AR_25K.json')
                .then((m) => setSawahData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, sawahData]);

    useEffect(() => {
        if (activeLayers.includes('layer-pasir') && localZoom >= 10 && !pasirData) {
            import('@/assets/geojson/kab bogor/PASIR_AR_25K.json')
                .then((m) => setPasirData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, pasirData]);

    useEffect(() => {
        if (activeLayers.includes('layer-kebun') && localZoom >= 10 && !kebunData) {
            import('@/assets/geojson/bogor/AGRIKEBUN_AR_25K.json')
                .then((m) => setKebunData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, kebunData]);

    useEffect(() => {
        if (activeLayers.includes('layer-ladang') && localZoom >= 10 && !ladangData) {
            import('@/assets/geojson/bogor/AGRILADANG_AR_25K.json')
                .then((m) => setLadangData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, ladangData]);

    useEffect(() => {
        if (activeLayers.includes('layer-administrasi') && localZoom >= 8 && !administrasiData) {
            import('@/assets/geojson/kab bogor/ADMINISTRASI_LN_25K.json')
                .then((m) => setAdministrasiData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, administrasiData]);

    useEffect(() => {
        if (activeLayers.includes('layer-desa') && localZoom >= 10 && !desaData) {
            import('@/assets/geojson/kab bogor/ADMINISTRASIDESA_AR_25K.json')
                .then((m) => setDesaData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, desaData]);

    useEffect(() => {
        if (activeLayers.includes('layer-danau') && localZoom >= 8 && !danauData) {
            import('@/assets/geojson/kab bogor/DANAU_AR_25K.json')
                .then((m) => setDanauData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, danauData]);

    useEffect(() => {
        if (activeLayers.includes('layer-jalan') && localZoom >= 10 && !jalanData) {
            import('@/assets/geojson/kab bogor/JALAN_LN_25K.json')
                .then((m) => setJalanData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, jalanData]);

    useEffect(() => {
        if (activeLayers.includes('layer-tanamcampur') && localZoom >= 10 && !tanamCampurData) {
            import('@/assets/geojson/kab bogor/AGRITANAMCAMPUR_AR_25K.json')
                .then((m) => setTanamCampurData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, tanamCampurData]);

    useEffect(() => {
        if (activeLayers.includes('layer-hutankering') && localZoom >= 10 && !hutanKeringData) {
            import('@/assets/geojson/kab bogor/NONAGRIHUTANKERING_AR_25K.json')
                .then((m) => setHutanKeringData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, hutanKeringData]);

    useEffect(() => {
        if (activeLayers.includes('layer-alang') && localZoom >= 10 && !alangData) {
            import('@/assets/geojson/kab bogor/NONAGRIALANG_AR_25K.json')
                .then((m) => setAlangData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, alangData]);

    useEffect(() => {
        if (activeLayers.includes('layer-semak') && localZoom >= 10 && !semakData) {
            import('@/assets/geojson/kab bogor/NONAGRISEMAKBELUKAR_AR_25K.json')
                .then((m) => setSemakData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, semakData]);

    useEffect(() => {
        if (activeLayers.includes('layer-punggungbukit') && localZoom >= 10 && !punggungBukitData) {
            import('@/assets/geojson/kab bogor/PUNGGUNGBUKIT_LN_25K.json')
                .then((m) => setPunggungBukitData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, punggungBukitData]);

    useEffect(() => {
        if (activeLayers.includes('layer-relka') && localZoom >= 8 && !relkaData) {
            import('@/assets/geojson/kab bogor/RELKA_LN_25K.json')
                .then((m) => setRelkaData(m.default)).catch(console.error);
        }
    }, [activeLayers, localZoom, relkaData]);

    const [activeGeometries, setActiveGeometries] = useState<{
        roadPolygons?: number[][][];
        rthPolygons?: number[][][];
        psuPolygons?: number[][][];
    } | null>(null);

    const { data: submissions = [] } = useQuery<Submission[]>({
        queryKey: ['submissions'],
        queryFn: SubmissionService.getAll,
    });

    useEffect(() => {
        if (!selectedCompanyId) {
            setActiveGeometries(null);
            return;
        }
        let active = true;
        SubmissionService.getGeometries(selectedCompanyId).then((data) => {
            if (active && data) {
                setActiveGeometries(data);
            }
        });
        return () => {
            active = false;
        };
    }, [selectedCompanyId]);

    const processedSubmissions = useMemo<ProcessedSubmission[]>(() =>
        submissions
            .map((sub: Submission) => ({
                ...sub,
                color: resolveStatusColor(sub.status),
                categoryLayer: resolveLayerCategory(sub.landArea),
                extrusionHeight: calcExtrusionHeight(sub),
            }))
            .filter((sub) => activeLayers.includes(sub.categoryLayer)),
        [submissions, activeLayers]
    );

    // ─── MEMO: LAHAN KOMPENSASI SPASIAL [Purworejo 8] ───────────────────────────
    const compensationGeoJSON = useMemo(() => {
        if (!activeKompensasi || !activeKompensasi.polygon || activeKompensasi.polygon.length < 3) return null;
        try {
            const ring = leafletRingToGeoJSON(activeKompensasi.polygon);
            return {
                type: 'FeatureCollection' as const,
                features: [{
                    type: 'Feature' as const,
                    geometry: { type: 'Polygon' as const, coordinates: [ring] },
                    properties: {
                        id: activeKompensasi.idKompensasi,
                        type: activeKompensasi.tipeKompensasi,
                        status: activeKompensasi.statusPemenuhan,
                    },
                }],
            };
        } catch (e) {
            console.warn('[SipasMap] Gagal mengolah GeoJSON kompensasi:', e);
            return null;
        }
    }, [activeKompensasi]);

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

    // [OPT-TERRAIN-STABLE] Kontrol terrain menggunakan API native Maplibre secara eksplisit
    // Ini menyelesaikan bug react-map-gl di mana menyetel terrain ke `undefined` tidak membersihkan terrain dari WebGL.
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

        const getCentroid = (ring: [number, number][]): [number, number] => {
            let totalLng = 0;
            let totalLat = 0;
            ring.forEach(([lng, lat]) => {
                totalLng += lng;
                totalLat += lat;
            });
            return [totalLng / ring.length, totalLat / ring.length];
        };

        const shrinkRing = (ring: [number, number][], factor: number, centroid: [number, number]): [number, number][] => {
            return ring.map(([lng, lat]) => {
                const dx = lng - centroid[0];
                const dy = lat - centroid[1];
                return [centroid[0] + dx * factor, centroid[1] + dy * factor];
            });
        };

        // 1. Jika ada geometri spasial detail yang di-fetch secara dinamis untuk permohonan aktif
        if (activeGeometries && selectedCompanyId) {
            const parentSub = processedSubmissions.find((s) => s.id === selectedCompanyId);
            const parentHeight = parentSub ? parentSub.extrusionHeight : 10;
            const addPoly = (rings: number[][][], color: string, type: string) => {
                rings.forEach((ring) => {
                    try {
                        const geoJSONRing = leafletRingToGeoJSON(ring as [number, number][]);

                        features.push({
                            type: 'Feature',
                            geometry: { type: 'Polygon', coordinates: [geoJSONRing] },
                            properties: {
                                id: selectedCompanyId,
                                color,
                                type,
                                submissionId: selectedCompanyId,
                                height: parentHeight,
                                base: 0,
                            },
                        });

                        if (type === 'kavling' || type === 'psu') {
                            const centroid = getCentroid(geoJSONRing);
                            const roofColor = '#c2410c'; // Terracotta roof color

                            const tiers = [
                                { factor: 0.85, baseOffset: 0, heightOffset: 0.8 },
                                { factor: 0.6, baseOffset: 0.8, heightOffset: 1.6 },
                                { factor: 0.35, baseOffset: 1.6, heightOffset: 2.3 },
                                { factor: 0.1, baseOffset: 2.3, heightOffset: 2.8 },
                            ];

                            tiers.forEach((tier) => {
                                const shrunk = shrinkRing(geoJSONRing, tier.factor, centroid);
                                features.push({
                                    type: 'Feature',
                                    geometry: { type: 'Polygon', coordinates: [shrunk] },
                                    properties: {
                                        id: selectedCompanyId,
                                        color: roofColor,
                                        type: 'roof-tier',
                                        submissionId: selectedCompanyId,
                                        base: parentHeight + tier.baseOffset,
                                        height: parentHeight + tier.heightOffset,
                                    },
                                });
                            });
                        }
                    } catch { /* skip */ }
                });
            };
            if (activeGeometries.roadPolygons) addPoly(activeGeometries.roadPolygons, '#cbd5e1', 'road');
            if (activeGeometries.rthPolygons) addPoly(activeGeometries.rthPolygons, '#10b981', 'rth');
            if (activeGeometries.psuPolygons) addPoly(activeGeometries.psuPolygons, '#14b8a6', 'psu');
        } else {
            // 2. Fallback menggunakan data mock statis jika tidak terhubung ke API backend
            processedSubmissions.forEach((sub) => {
                const loc = sub.location;
                const addPoly = (rings: [number, number][][], color: string, type: string) => {
                    rings.forEach((ring) => {
                        try {
                            const geoJSONRing = leafletRingToGeoJSON(ring);

                            features.push({
                                type: 'Feature',
                                geometry: { type: 'Polygon', coordinates: [geoJSONRing] },
                                properties: {
                                    id: sub.id,
                                    color,
                                    type,
                                    submissionId: sub.id,
                                    height: sub.extrusionHeight,
                                    base: 0,
                                },
                            });

                            if (type === 'kavling' || type === 'psu') {
                                const centroid = getCentroid(geoJSONRing);
                                const roofColor = '#c2410c';

                                const tiers = [
                                    { factor: 0.85, baseOffset: 0, heightOffset: 0.8 },
                                    { factor: 0.6, baseOffset: 0.8, heightOffset: 1.6 },
                                    { factor: 0.35, baseOffset: 1.6, heightOffset: 2.3 },
                                    { factor: 0.1, baseOffset: 2.3, heightOffset: 2.8 },
                                ];

                                tiers.forEach((tier) => {
                                    const shrunk = shrinkRing(geoJSONRing, tier.factor, centroid);
                                    features.push({
                                        type: 'Feature',
                                        geometry: { type: 'Polygon', coordinates: [shrunk] },
                                        properties: {
                                            id: sub.id,
                                            color: roofColor,
                                            type: 'roof-tier',
                                            submissionId: sub.id,
                                            base: sub.extrusionHeight + tier.baseOffset,
                                            height: sub.extrusionHeight + tier.heightOffset,
                                        },
                                    });
                                });
                            }
                        } catch { /* skip */ }
                    });
                };
                if (loc.roadPolygons) addPoly(loc.roadPolygons, '#cbd5e1', 'road');
                if (loc.rthPolygons) addPoly(loc.rthPolygons, '#10b981', 'rth');
                if (loc.psuPolygons) addPoly(loc.psuPolygons, '#14b8a6', 'psu');
                if (loc.kavlingPolygons) addPoly(loc.kavlingPolygons, '#64748b', 'kavling');
            });
        }
        return { type: 'FeatureCollection' as const, features };
    }, [processedSubmissions, activeGeometries, selectedCompanyId]);

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
        const targetBearing = is3DMode ? -10 : 0; // 3D: sedikit miring estetis | 2D: top-down sempurna
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

    // [OPT-CAMERA-SYNC] Sinkronisasi dua arah untuk pitch dan bearing dari store (HUD buttons) ke viewport peta
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
    }, [mapPitch, mapBearing]);

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
            const store = useGisUIStore.getState();
            const currentIs3D = store.is3DMode;
            const targetPitch = currentIs3D ? 45 : 0;
            const targetBearing = currentIs3D ? -10 : 0;

            // [FIX-RESET-2D] Update store pitch/bearing secara eksplisit.
            // Jangan pakai setLocalViewState dulu — onMove selama flyTo akan
            // override localViewState dengan nilai intermediate dan fight balik.
            // Biarkan effect [mapPitch, mapBearing] yang handle camera via easeTo.
            store.setMapPitch(targetPitch);
            store.setMapBearing(targetBearing);

            // Terbang ke posisi default Bogor
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
            // [FIX-TERRAIN-BLANK] Batasi zoom ke 15 saat terrain aktif — tile DEM AWS tidak tersedia di zoom >15
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
                // map mungkin sudah hancur
            }
        };
    }, []);

    const handleMoveStart = useCallback(() => {
        window.dispatchEvent(new Event('map-move-start'));
    }, []);

    const handleMove = useCallback((e: ViewStateChangeEvent) => {
        // [FIX-2D-LOCK] Kalau mode 2D, paksa pitch=0 dan bearing=0 di setiap frame.
        // Ini memblokir nilai pitch lama yang leak dari animasi easeTo/flyTo
        // masuk ke localViewState (yang langsung dipakai sebagai controlled props peta).
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

        // [FIX-2D-PITCH] Kalau mode 2D, paksa pitch=0 dan bearing=0.
        // Ini mencegah nilai pitch lama (dari drag di mode 3D) masuk ke store
        // via onMoveEnd yang terpicu saat easeTo() toggle3DMode belum selesai.
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
        const currentIsTerrainActive = useGisUIStore.getState().isTerrainActive;
        const targetPitch = currentIs3D ? 60 : 0;
        const targetBearing = currentIs3D ? -10 : 0;
        // [FIX-TERRAIN-BLANK] Tile DEM AWS terrarium tidak tersedia di zoom >15.
        // Zoom ke 15 cukup untuk lihat detail lokasi tanpa menyebabkan blank screen.
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
    }, [processedSubmissions, setSelectedCompanyId, closePanelsToTheRight, openPanel, localZoom]);

    const handleMarkerClick = useCallback((sub: ProcessedSubmission) => {
        setSelectedCompanyId(sub.id);
        closePanelsToTheRight(-1);
        openPanel('detil-perusahaan', `Detail: ${sub.housingName}`, sub);
        const currentIs3D = useGisUIStore.getState().is3DMode;
        const currentIsTerrainActive = useGisUIStore.getState().isTerrainActive;
        const targetPitch = currentIs3D ? 55 : 0;
        const targetBearing = currentIs3D ? -10 : 0;
        // [FIX-TERRAIN-BLANK] Tile DEM AWS terrarium tidak tersedia di zoom >15.
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
    const showSawah = activeLayers.includes('layer-sawah') && localZoom >= 10;
    const showPasir = activeLayers.includes('layer-pasir') && localZoom >= 10;
    const showKebun = activeLayers.includes('layer-kebun') && localZoom >= 10;
    const showLadang = activeLayers.includes('layer-ladang') && localZoom >= 10;
    // ── Show flags layer Kab Bogor baru ────────────────────────────────────────
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

                {/* ─── LAYER DRONE ORTHOPHOTO OVERLAY [Bogor 3] ─── */}
                {isDroneLayerActive && (
                    <Source
                        id="drone-orthophoto-source"
                        type="raster"
                        tiles={['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']}
                        tileSize={256}
                    >
                        <Layer
                            id="drone-orthophoto-layer"
                            type="raster"
                            paint={{ 'raster-opacity': droneLayerOpacity / 100 }}
                            beforeId="submissions-fill-flat"
                        />
                    </Source>
                )}

                {showPemukiman && pemukimanData && (
                    <Source key="pemukiman-source" id="pemukiman" type="geojson" data={pemukimanData}>
                        <Layer id="pemukiman-fill" type="fill"
                            layout={{ visibility: vis(showPemukiman) }}
                            paint={{ 'fill-color': '#06b6d4', 'fill-opacity': 0.35 * opacity }}
                        />
                        <Layer id="pemukiman-outline" type="line"
                            layout={{ visibility: vis(showPemukiman) }}
                            paint={{ 'line-color': '#0891b2', 'line-width': 1, 'line-opacity': 0.6 * opacity }}
                        />
                    </Source>
                )}

                {showKontur && konturData && (
                    <Source key="kontur-source" id="kontur" type="geojson" data={konturData}>
                        <Layer id="kontur-line" type="line"
                            layout={{ visibility: vis(showKontur) }}
                            paint={{
                                'line-color': '#fbbf24', 'line-width': 1,
                                'line-opacity': 0.8 * opacity, 'line-dasharray': [4, 2],
                            }}
                        />
                    </Source>
                )}

                {showSungai && sungaiData && (
                    <Source key="sungai-source" id="sungai" type="geojson" data={sungaiData}>
                        <Layer id="sungai-casing" type="line"
                            layout={{ visibility: vis(showSungai) }}
                            paint={{ 'line-color': '#1d4ed8', 'line-width': 5, 'line-opacity': 0.5 * opacity }}
                        />
                        <Layer id="sungai-line" type="line"
                            layout={{ visibility: vis(showSungai) }}
                            paint={{ 'line-color': '#3b82f6', 'line-width': 3, 'line-opacity': 0.9 * opacity }}
                        />
                    </Source>
                )}

                {showSawah && sawahData && (
                    <Source key="sawah-source" id="sawah" type="geojson" data={sawahData}>
                        <Layer id="sawah-fill" type="fill"
                            layout={{ visibility: vis(showSawah) }}
                            paint={{ 'fill-color': '#34d399', 'fill-opacity': 0.3 * opacity }}
                        />
                        <Layer id="sawah-outline" type="line"
                            layout={{ visibility: vis(showSawah) }}
                            paint={{ 'line-color': '#059669', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
                        />
                    </Source>
                )}

                {showPasir && pasirData && (
                    <Source key="pasir-source" id="pasir" type="geojson" data={pasirData}>
                        <Layer id="pasir-fill" type="fill"
                            layout={{ visibility: vis(showPasir) }}
                            paint={{ 'fill-color': '#fed7aa', 'fill-opacity': 0.3 * opacity }}
                        />
                        <Layer id="pasir-outline" type="line"
                            layout={{ visibility: vis(showPasir) }}
                            paint={{ 'line-color': '#ea580c', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
                        />
                    </Source>
                )}

                {showKebun && kebunData && (
                    <Source key="kebun-source" id="kebun" type="geojson" data={kebunData}>
                        <Layer id="kebun-fill" type="fill"
                            layout={{ visibility: vis(showKebun) }}
                            paint={{ 'fill-color': '#15803d', 'fill-opacity': 0.3 * opacity }}
                        />
                        <Layer id="kebun-outline" type="line"
                            layout={{ visibility: vis(showKebun) }}
                            paint={{ 'line-color': '#166534', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
                        />
                    </Source>
                )}

                {showLadang && ladangData && (
                    <Source key="ladang-source" id="ladang" type="geojson" data={ladangData}>
                        <Layer id="ladang-fill" type="fill"
                            layout={{ visibility: vis(showLadang) }}
                            paint={{ 'fill-color': '#84cc16', 'fill-opacity': 0.3 * opacity }}
                        />
                        <Layer id="ladang-outline" type="line"
                            layout={{ visibility: vis(showLadang) }}
                            paint={{ 'line-color': '#65a30d', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
                        />
                    </Source>
                )}

                {/* ─── LAYER BATAS ADMINISTRASI KABUPATEN ─── */}
                {showAdministrasi && administrasiData && (
                    <Source key="administrasi-source" id="administrasi" type="geojson" data={administrasiData}>
                        <Layer id="administrasi-line" type="line"
                            layout={{ visibility: vis(showAdministrasi) }}
                            paint={{ 'line-color': '#ef4444', 'line-width': 2, 'line-opacity': 0.8 * opacity, 'line-dasharray': [6, 3] }}
                        />
                    </Source>
                )}

                {/* ─── LAYER BATAS DESA/KELURAHAN ─── */}
                {showDesa && desaData && (
                    <Source key="desa-source" id="desa" type="geojson" data={desaData}>
                        <Layer id="desa-fill" type="fill"
                            layout={{ visibility: vis(showDesa) }}
                            paint={{ 'fill-color': '#fb923c', 'fill-opacity': 0.08 * opacity }}
                        />
                        <Layer id="desa-outline" type="line"
                            layout={{ visibility: vis(showDesa) }}
                            paint={{ 'line-color': '#ea580c', 'line-width': 1, 'line-opacity': 0.7 * opacity, 'line-dasharray': [3, 2] }}
                        />
                    </Source>
                )}

                {/* ─── LAYER DANAU / BADAN AIR ─── */}
                {showDanau && danauData && (
                    <Source key="danau-source" id="danau" type="geojson" data={danauData}>
                        <Layer id="danau-fill" type="fill"
                            layout={{ visibility: vis(showDanau) }}
                            paint={{ 'fill-color': '#38bdf8', 'fill-opacity': 0.5 * opacity }}
                        />
                        <Layer id="danau-outline" type="line"
                            layout={{ visibility: vis(showDanau) }}
                            paint={{ 'line-color': '#0ea5e9', 'line-width': 1.5, 'line-opacity': 0.9 * opacity }}
                        />
                    </Source>
                )}

                {/* ─── LAYER JARINGAN JALAN ─── */}
                {showJalan && jalanData && (
                    <Source key="jalan-source" id="jalan" type="geojson" data={jalanData}>
                        <Layer id="jalan-casing" type="line"
                            layout={{ visibility: vis(showJalan) }}
                            paint={{ 'line-color': '#94a3b8', 'line-width': 4, 'line-opacity': 0.4 * opacity }}
                        />
                        <Layer id="jalan-line" type="line"
                            layout={{ visibility: vis(showJalan) }}
                            paint={{ 'line-color': '#f5f5f4', 'line-width': 2, 'line-opacity': 0.85 * opacity }}
                        />
                    </Source>
                )}

                {/* ─── LAYER TANAM CAMPUR ─── */}
                {showTanamCampur && tanamCampurData && (
                    <Source key="tanamcampur-source" id="tanamcampur" type="geojson" data={tanamCampurData}>
                        <Layer id="tanamcampur-fill" type="fill"
                            layout={{ visibility: vis(showTanamCampur) }}
                            paint={{ 'fill-color': '#2dd4bf', 'fill-opacity': 0.25 * opacity }}
                        />
                        <Layer id="tanamcampur-outline" type="line"
                            layout={{ visibility: vis(showTanamCampur) }}
                            paint={{ 'line-color': '#0d9488', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
                        />
                    </Source>
                )}

                {/* ─── LAYER HUTAN KERING ─── */}
                {showHutanKering && hutanKeringData && (
                    <Source key="hutankering-source" id="hutankering" type="geojson" data={hutanKeringData}>
                        <Layer id="hutankering-fill" type="fill"
                            layout={{ visibility: vis(showHutanKering) }}
                            paint={{ 'fill-color': '#14532d', 'fill-opacity': 0.35 * opacity }}
                        />
                        <Layer id="hutankering-outline" type="line"
                            layout={{ visibility: vis(showHutanKering) }}
                            paint={{ 'line-color': '#052e16', 'line-width': 1, 'line-opacity': 0.6 * opacity }}
                        />
                    </Source>
                )}

                {/* ─── LAYER ALANG-ALANG ─── */}
                {showAlang && alangData && (
                    <Source key="alang-source" id="alang" type="geojson" data={alangData}>
                        <Layer id="alang-fill" type="fill"
                            layout={{ visibility: vis(showAlang) }}
                            paint={{ 'fill-color': '#fcd34d', 'fill-opacity': 0.25 * opacity }}
                        />
                        <Layer id="alang-outline" type="line"
                            layout={{ visibility: vis(showAlang) }}
                            paint={{ 'line-color': '#f59e0b', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
                        />
                    </Source>
                )}

                {/* ─── LAYER SEMAK BELUKAR ─── */}
                {showSemak && semakData && (
                    <Source key="semak-source" id="semak" type="geojson" data={semakData}>
                        <Layer id="semak-fill" type="fill"
                            layout={{ visibility: vis(showSemak) }}
                            paint={{ 'fill-color': '#d97706', 'fill-opacity': 0.25 * opacity }}
                        />
                        <Layer id="semak-outline" type="line"
                            layout={{ visibility: vis(showSemak) }}
                            paint={{ 'line-color': '#b45309', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
                        />
                    </Source>
                )}

                {/* ─── LAYER PUNGGUNG BUKIT (RIDGE LINE) ─── */}
                {showPunggungBukit && punggungBukitData && (
                    <Source key="punggungbukit-source" id="punggungbukit" type="geojson" data={punggungBukitData}>
                        <Layer id="punggungbukit-line" type="line"
                            layout={{ visibility: vis(showPunggungBukit) }}
                            paint={{ 'line-color': '#a855f7', 'line-width': 1.5, 'line-opacity': 0.7 * opacity, 'line-dasharray': [2, 3] }}
                        />
                    </Source>
                )}

                {/* ─── LAYER REL KERETA API ─── */}
                {showRelka && relkaData && (
                    <Source key="relka-source" id="relka" type="geojson" data={relkaData}>
                        <Layer id="relka-casing" type="line"
                            layout={{ visibility: vis(showRelka) }}
                            paint={{ 'line-color': '#1e293b', 'line-width': 5, 'line-opacity': 0.5 * opacity }}
                        />
                        <Layer id="relka-line" type="line"
                            layout={{ visibility: vis(showRelka) }}
                            paint={{ 'line-color': '#e2e8f0', 'line-width': 2, 'line-opacity': 0.9 * opacity, 'line-dasharray': [8, 4] }}
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
                    <Layer id="submissions-fill-flat" type="fill"
                        paint={{
                            'fill-color': ['get', 'color'],
                            'fill-opacity': [
                                'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
                                0.6, 0.35 * opacity,
                            ],
                        }}
                    />
                    <Layer id="submissions-outline-flat" type="line"
                        paint={{
                            'line-color': ['get', 'color'],
                            'line-width': [
                                'case', ['==', ['get', 'id'], selectedCompanyId ?? ''], 3, 1.5,
                            ],
                            'line-opacity': opacity,
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
                        <Layer id="sub-poly-extrusion" type="fill-extrusion"
                            filter={['any', ['==', ['get', 'type'], 'kavling'], ['==', ['get', 'type'], 'psu']]}
                            paint={{
                                'fill-extrusion-color': ['get', 'color'],
                                'fill-extrusion-height': [
                                    'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
                                    ['*', ['get', 'height'], 1.5], ['get', 'height']
                                ],
                                'fill-extrusion-base': 0,
                                'fill-extrusion-opacity': 0.75 * opacity,
                            }}
                        />
                        <Layer id="sub-poly-roof-tiers" type="fill-extrusion"
                            filter={['==', ['get', 'type'], 'roof-tier']}
                            paint={{
                                'fill-extrusion-color': ['get', 'color'],
                                'fill-extrusion-base': [
                                    'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
                                    ['*', ['get', 'base'], 1.5], ['get', 'base']
                                ],
                                'fill-extrusion-height': [
                                    'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
                                    ['*', ['get', 'height'], 1.5], ['get', 'height']
                                ],
                                'fill-extrusion-opacity': 0.95 * opacity,
                            }}
                        />
                    </Source>
                )}

                {/* ─── LAYER RENDERING POLIGON LAHAN KOMPENSASI [Purworejo 8] ─── */}
                {compensationGeoJSON && (
                    <Source key="compensation-source" id="compensation-source" type="geojson" data={compensationGeoJSON}>
                        <Layer
                            id="compensation-fill"
                            type="fill"
                            paint={{
                                'fill-color': '#10b981', // emerald-500
                                'fill-opacity': 0.45 * opacity
                            }}
                        />
                        <Layer
                            id="compensation-outline"
                            type="line"
                            paint={{
                                'line-color': '#047857', // emerald-700
                                'line-width': 2.5,
                                'line-dasharray': [3, 2]
                            }}
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

                {/* ─── TITIK PIN KONFLIK SPASIAL INTERAKTIF (SONAR RIPPLE ROSE) [Bogor 8] ─── */}
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