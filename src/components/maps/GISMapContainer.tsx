/**
 * ============================================================================
 * GIS MAP CONTAINER — Leaflet Wrapper (Upgrade Premium Fullscreen & GIS Layout)
 * ============================================================================
 * Komponen pembungkus peta generik berbasis Leaflet.
 * Digunakan oleh form pengajuan dan komponen lain yang membutuhkan
 * peta embedding ringan (bukan GISPage utama).
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Polygon, GeoJSON } from 'react-leaflet';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Layers, Check, Globe, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as turf from '@turf/turf';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GISMapContainerProps {
    /** Pusat awal peta dalam format [latitude, longitude] */
    center?: [number, number];
    zoom?: number;
    children?: React.ReactNode;
    className?: string;
}

// Batas wilayah administrasi Kabupaten Bogor (Simplified)
const BOGOR_KAB_BOUNDARY: [number, number][] = [
    [-6.3470, 106.5298], // Barat Laut (Tenjo)
    [-6.3270, 106.7298], // Utara (Parung)
    [-6.3470, 106.9298], // Timur Laut (Gunung Putri)
    [-6.3870, 107.0298], // Timur Laut Jauh (Cileungsi)
    [-6.4270, 107.1298], // Timur (Jonggol)
    [-6.5670, 107.2598], // Tenggara (Cariu)
    [-6.6870, 107.1598], // Selatan (Puncak/Cisarua)
    [-6.7870, 106.9298], // Selatan-Barat (Halimun)
    [-6.7270, 106.6298], // Barat Daya (Jasinga)
    [-6.4870, 106.3598], // Barat Jauh (Cigudeg)
    [-6.3770, 106.4298], // Cigudeg / Tenjo kembali
    [-6.3470, 106.5298]  // Tutup
];



const BASEMAPS = {
    osm: {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
        maxNativeZoom: 19,
    },
    'google-hybrid': {
        name: 'Google Hybrid',
        url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        attribution: '&copy; Google Maps',
        maxNativeZoom: 20,
    },
    'google-sat': {
        name: 'Google Satellite',
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attribution: '&copy; Google Maps',
        maxNativeZoom: 20,
    },
    esri: {
        name: 'Esri Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri World Imagery',
        maxNativeZoom: 18,
    },
};

/**
 * Listener internal untuk menjembatani event eksternal (dari sidebar)
 * ke fungsi Leaflet (zoomIn, zoomOut, invalidateSize) serta kalkulasi real-time.
 */
interface MapSyncListenerProps {
    zoomInTrigger: number;
    zoomOutTrigger: number;
    onZoomChange: (zoom: number) => void;
    isFullscreen: boolean;
    onMouseMove: (coords: { lat: number; lng: number } | null) => void;
    onAreaChange: (area: number) => void;
    onCenterChange: (centerStr: string) => void;
}

function MapSyncListener({
    zoomInTrigger,
    zoomOutTrigger,
    onZoomChange,
    isFullscreen,
    onMouseMove,
    onAreaChange,
    onCenterChange,
}: MapSyncListenerProps) {
    const map = useMap();

    // Sinkronisasi status zoom ke state luar
    useEffect(() => {
        const onZoom = () => {
            onZoomChange(map.getZoom());
        };
        map.on('zoomend', onZoom);
        return () => {
            map.off('zoomend', onZoom);
        };
    }, [map, onZoomChange]);

    // Handle trigger zoom in
    useEffect(() => {
        if (zoomInTrigger > 0) {
            map.zoomIn();
        }
    }, [zoomInTrigger, map]);

    // Handle trigger zoom out
    useEffect(() => {
        if (zoomOutTrigger > 0) {
            map.zoomOut();
        }
    }, [zoomOutTrigger, map]);

    // Paksa Leaflet menghitung ulang ukuran kontainer saat status fullscreen berubah
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);
        return () => clearTimeout(timer);
    }, [map, isFullscreen]);

    // Handle Live Cursor Tracker
    useEffect(() => {
        const handleMouseMove = (e: any) => {
            onMouseMove({ lat: e.latlng.lat, lng: e.latlng.lng });
        };
        const handleMouseOut = () => {
            onMouseMove(null);
        };
        map.on('mousemove', handleMouseMove);
        map.on('mouseout', handleMouseOut);
        return () => {
            map.off('mousemove', handleMouseMove);
            map.off('mouseout', handleMouseOut);
        };
    }, [map, onMouseMove]);

    // Kalkulasi Luas Lahan & Centroid secara Dinamis berbasis Turf.js
    useEffect(() => {
        const calculateStats = () => {
            let totalArea = 0;
            let centerStr = '-';

            map.eachLayer((layer) => {
                // Cari polygon layer yang valid
                if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) {
                    try {
                        const geojson = layer.toGeoJSON();
                        totalArea += turf.area(geojson);

                        const bounds = layer.getBounds();
                        const center = bounds.getCenter();
                        centerStr = `Lat: ${center.lat.toFixed(6)}, Lng: ${center.lng.toFixed(6)}`;
                    } catch (e) {
                        console.error('[GISMapContainer] Gagal kalkulasi bidang:', e);
                    }
                }
            });

            onAreaChange(totalArea);
            onCenterChange(centerStr);
        };

        // Pasang event listener pada setiap perubahan objek geoman maupun upload eksternal
        map.on('pm:create', calculateStats);
        map.on('pm:edit', calculateStats);
        map.on('pm:remove', calculateStats);
        map.on('layeradd', calculateStats);
        map.on('layerremove', calculateStats);

        // Jalankan sekali di awal
        const timer = setTimeout(calculateStats, 500);

        return () => {
            map.off('pm:create', calculateStats);
            map.off('pm:edit', calculateStats);
            map.off('pm:remove', calculateStats);
            map.off('layeradd', calculateStats);
            map.off('layerremove', calculateStats);
            clearTimeout(timer);
        };
    }, [map, onAreaChange, onCenterChange]);

    return null;
}

/**
 * Controls default overlay untuk tampilan normal/embedded
 */
interface MapControlsProps {
    isFullscreen: boolean;
    setIsFullscreen: (v: boolean) => void;
    activeBaseMap: keyof typeof BASEMAPS;
    setActiveBaseMap: (v: keyof typeof BASEMAPS) => void;
    isMaskActive: boolean;
    setIsMaskActive: (v: boolean) => void;
    maskOpacity: number;
    setMaskOpacity: (v: number) => void;
    showDesaBorders: boolean;
    setShowDesaBorders: (v: boolean) => void;
}

function MapControls({
    isFullscreen,
    setIsFullscreen,
    activeBaseMap,
    setActiveBaseMap,
    isMaskActive,
    setIsMaskActive,
    maskOpacity,
    setMaskOpacity,
    showDesaBorders,
    setShowDesaBorders,
}: MapControlsProps) {
    const map = useMap();
    const [currentZoom, setCurrentZoom] = useState(map.getZoom());
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

    useEffect(() => {
        const onZoom = () => {
            setCurrentZoom(map.getZoom());
        };
        map.on('zoomend', onZoom);
        return () => {
            map.off('zoomend', onZoom);
        };
    }, [map]);

    const handleZoomIn = () => {
        if (currentZoom < 20) {
            map.zoomIn();
        }
    };

    const handleZoomOut = () => {
        if (currentZoom > map.getMinZoom()) {
            map.zoomOut();
        }
    };

    return (
        <div className="leaflet-top leaflet-right" style={{ zIndex: 1000, pointerEvents: 'auto' }}>
            <div className="leaflet-control flex flex-col gap-2 m-3 select-none">
                {/* Tombol Fullscreen */}
                <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="w-9 h-9 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-md flex items-center justify-center hover:bg-slate-50 transition-all focus:outline-none cursor-pointer"
                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                >
                    {isFullscreen ? <Minimize2 className="w-4.5 h-4.5 text-slate-600" /> : <Maximize2 className="w-4.5 h-4.5 text-slate-600" />}
                </button>

                {/* Tombol Mask / Fokus Wilayah */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsMaskActive(!isMaskActive)}
                        className={cn(
                            "w-9 h-9 border rounded-lg shadow-md flex items-center justify-center transition-all focus:outline-none cursor-pointer w-full",
                            isMaskActive ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        )}
                        title={isMaskActive ? 'Hilangkan Redup Wilayah' : 'Redupkan Luar Wilayah'}
                    >
                        <Globe className="w-4.5 h-4.5" />
                    </button>
                    {isMaskActive && (
                        <div className="absolute right-11 top-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 w-44 flex flex-col gap-1 z-[1010] text-left">
                            <div className="flex justify-between items-center text-[10px] select-none">
                                <span className="font-bold text-slate-500 uppercase">Keredupan:</span>
                                <span className="font-mono font-bold text-teal-600">{maskOpacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="90"
                                value={maskOpacity}
                                onChange={(e) => setMaskOpacity(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Tombol Batas Desa */}
                <button
                    type="button"
                    onClick={() => setShowDesaBorders(!showDesaBorders)}
                    className={cn(
                        "w-9 h-9 border rounded-lg shadow-md flex items-center justify-center transition-all focus:outline-none cursor-pointer",
                        showDesaBorders ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                    title={showDesaBorders ? 'Sembunyikan Batas Desa' : 'Tampilkan Batas Desa'}
                >
                    <Map className="w-4.5 h-4.5" />
                </button>

                {/* Tombol Zoom */}
                <div className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">
                    <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={currentZoom >= 20}
                        className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all border-b border-slate-100 focus:outline-none cursor-pointer"
                        title="Perbesar (Zoom In)"
                    >
                        <ZoomIn className="w-4.5 h-4.5 text-slate-600" />
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={currentZoom <= map.getMinZoom()}
                        className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all focus:outline-none cursor-pointer"
                        title="Perkecil (Zoom Out)"
                    >
                        <ZoomOut className="w-4.5 h-4.5 text-slate-600" />
                    </button>
                </div>

                {/* Menu Pemilih Layer */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
                        className="w-9 h-9 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-md flex items-center justify-center hover:bg-slate-50 transition-all focus:outline-none cursor-pointer"
                        title="Pilih Citra Satelit / Base Map"
                    >
                        <Layers className="w-4.5 h-4.5 text-slate-600" />
                    </button>

                    {isLayerMenuOpen && (
                        <div className="absolute right-11 top-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 w-44 flex flex-col text-left">
                            {(Object.keys(BASEMAPS) as Array<keyof typeof BASEMAPS>).map((key) => {
                                const selected = activeBaseMap === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            setActiveBaseMap(key);
                                            setIsLayerMenuOpen(false);
                                        }}
                                        className={cn(
                                            "px-3 py-2 text-xs flex items-center justify-between transition-colors focus:outline-none w-full text-left cursor-pointer",
                                            selected
                                                ? 'bg-emerald-50 text-emerald-700 font-bold'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                        )}
                                    >
                                        <span>{BASEMAPS[key].name}</span>
                                        {selected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function GISMapContainer({
    center = [-6.4816, 106.8560], // Centroid Kabupaten Bogor (PEMDA Cibinong)
    zoom = 14,
    children,
    className = 'w-full h-full rounded-xl shadow-inner border border-slate-200',
}: GISMapContainerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeBaseMap, setActiveBaseMap] = useState<keyof typeof BASEMAPS>('osm');
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
    const [isMaskActive, setIsMaskActive] = useState(true);
    const [maskOpacity, setMaskOpacity] = useState(45); // Keredupan default 45%
    const [showDesaBorders, setShowDesaBorders] = useState(false);
    const [bogorGeoJson, setBogorGeoJson] = useState<any>(null);

    // Fetch batas administrasi desa resmi Kabupaten Bogor (simplified) saat mount
    useEffect(() => {
        let active = true;
        fetch('/geojson/kab%20bogor/KAB_BOGOR_KECAMATAN.json')
            .then((res) => {
                if (!res.ok) throw new Error('File outline not found');
                return res.json();
            })
            .then((data) => {
                if (active) setBogorGeoJson(data);
            })
            .catch((err) => {
                console.error('[GISMapContainer] Gagal memuat batas wilayah administrasi:', err);
            });
        return () => {
            active = false;
        };
    }, []);

    // Ekstraksi ring poligon dinamis dari GeoJSON untuk di-cutout sebagai lubang di mask redup
    const maskRings = React.useMemo(() => {
        if (!bogorGeoJson) return [];
        const rings: [number, number][][] = [
            // Ring luar menutupi seluruh bola dunia
            [
                [-90, -180],
                [-90, 180],
                [90, 180],
                [90, -180],
                [-90, -180]
            ]
        ];

        bogorGeoJson.features.forEach((feature: any) => {
            const geom = feature.geometry;
            if (!geom) return;

            if (geom.type === 'Polygon') {
                geom.coordinates.forEach((ring: any[]) => {
                    rings.push(ring.map((p) => [p[1], p[0]])); // Konversi Leaflet format [lat, lng]
                });
            } else if (geom.type === 'MultiPolygon') {
                geom.coordinates.forEach((poly: any[][]) => {
                    poly.forEach((ring: any[]) => {
                        rings.push(ring.map((p) => [p[1], p[0]]));
                    });
                });
            }
        });

        return rings;
    }, [bogorGeoJson]);

    // Zoom state untuk sidebar eksternal (saat fullscreen)
    const [zoomInTrigger, setZoomInTrigger] = useState(0);
    const [zoomOutTrigger, setZoomOutTrigger] = useState(0);
    const [currentZoom, setCurrentZoom] = useState(zoom);

    // HUD Stats Dinamis
    const [calculatedArea, setCalculatedArea] = useState<number>(0);
    const [centerPoint, setCenterPoint] = useState<string>('-');
    const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Mode Fullscreen dengan struktur navbar & sidebar terintegrasi
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-50 w-screen h-screen flex flex-col font-sans select-none antialiased text-slate-800">
                {/* 1. NAVBAR ATAS TEMA GIS VIEWERS */}
                <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm shrink-0">
                    <div className="flex items-center gap-3 text-left">
                        <Globe size={22} className="text-teal-600 shrink-0" strokeWidth={2} />
                        <div className="flex flex-col leading-none">
                            <span className="font-sans font-semibold text-lg tracking-tight text-slate-800">
                                Geo <span className="text-teal-600">SIPAS</span>
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5">
                                Visualisasi Spasial Lahan
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsFullscreen(false)}
                        className="group flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-all rounded-none outline-none border-none bg-transparent cursor-pointer"
                    >
                        <Minimize2 size={18} className="text-slate-500 group-hover:text-rose-600 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            Keluar
                        </span>
                    </button>
                </header>

                {/* 2. AREA WORKSPACE UTAMA DENGAN SIDEBAR KIRI */}
                <div className="flex flex-1 relative overflow-hidden">
                    {/* SIDEBAR KIRI (Lebar 64px) TEMA BRIGHT COHESIVE */}
                    <aside className="w-16 h-full flex flex-col items-center bg-white border-r border-slate-200 shrink-0 z-[1000] py-0">
                        {/* Selector Basemap */}
                        <div className="relative group w-full flex justify-center h-16">
                            <button
                                type="button"
                                onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
                                className={cn(
                                    "w-full h-full flex flex-col items-center justify-center gap-1 transition-colors relative active:bg-slate-100 rounded-none outline-none border-l-[3px] cursor-pointer",
                                    isLayerMenuOpen
                                        ? 'bg-teal-50 text-teal-600 border-teal-500 font-bold'
                                        : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                                )}
                                title="Pilih Base Map / Satelit"
                            >
                                <Layers size={18} />
                                <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                    Base Map
                                </span>
                            </button>

                            {isLayerMenuOpen && (
                                <div className="absolute left-16 top-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 w-44 flex flex-col text-left z-[1010]">
                                    {(Object.keys(BASEMAPS) as Array<keyof typeof BASEMAPS>).map((key) => {
                                        const selected = activeBaseMap === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => {
                                                    setActiveBaseMap(key);
                                                    setIsLayerMenuOpen(false);
                                                }}
                                                className={cn(
                                                    "px-3 py-2 text-xs flex items-center justify-between transition-colors focus:outline-none w-full text-left cursor-pointer",
                                                    selected
                                                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                                )}
                                            >
                                                <span>{BASEMAPS[key].name}</span>
                                                {selected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="w-full h-px bg-slate-150" />

                        {/* Toggle Mask Wilayah */}
                        <div className="relative w-full flex justify-center h-16">
                            <button
                                type="button"
                                onClick={() => setIsMaskActive(!isMaskActive)}
                                className={cn(
                                    "w-full h-full flex flex-col items-center justify-center gap-1 transition-colors relative active:bg-slate-100 rounded-none outline-none border-l-[3px] cursor-pointer",
                                    isMaskActive
                                        ? 'bg-teal-50 text-teal-600 border-teal-500 font-bold'
                                        : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                                )}
                                title="Redupkan Wilayah Luar Kabupaten Bogor"
                            >
                                <Globe size={18} />
                                <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                    Fokus
                                </span>
                            </button>

                            {isMaskActive && (
                                <div className="absolute left-16 top-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 w-44 flex flex-col gap-1 z-[1010] text-left">
                                    <div className="flex justify-between items-center text-[10px] select-none">
                                        <span className="font-bold text-slate-500 uppercase">Keredupan:</span>
                                        <span className="font-mono font-bold text-teal-600">{maskOpacity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="90"
                                        value={maskOpacity}
                                        onChange={(e) => setMaskOpacity(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="w-full h-px bg-slate-150" />

                        {/* Toggle Batas Desa */}
                        <button
                            type="button"
                            onClick={() => setShowDesaBorders(!showDesaBorders)}
                            className={cn(
                                "w-full h-16 flex flex-col items-center justify-center gap-1 transition-colors relative active:bg-slate-100 rounded-none outline-none border-l-[3px] cursor-pointer",
                                showDesaBorders
                                    ? 'bg-teal-50 text-teal-600 border-teal-500 font-bold'
                                    : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            )}
                            title="Tampilkan Batas Desa Resmi Kabupaten Bogor"
                        >
                            <Map size={18} />
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                Batas Desa
                            </span>
                        </button>

                        <div className="w-full h-px bg-slate-150" />

                        {/* Zoom In Button di Sidebar */}
                        <button
                            type="button"
                            onClick={() => setZoomInTrigger((t) => t + 1)}
                            disabled={currentZoom >= 20}
                            className="w-full h-16 flex flex-col items-center justify-center gap-1 transition-colors relative active:bg-slate-100 rounded-none outline-none border-l-[3px] border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                            title="Perbesar (Zoom In)"
                        >
                            <ZoomIn size={18} />
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                Zoom In
                            </span>
                        </button>

                        {/* Zoom Out Button di Sidebar */}
                        <button
                            type="button"
                            onClick={() => setZoomOutTrigger((t) => t + 1)}
                            disabled={currentZoom <= 4}
                            className="w-full h-16 flex flex-col items-center justify-center gap-1 transition-colors relative active:bg-slate-100 rounded-none outline-none border-l-[3px] border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                            title="Perkecil (Zoom Out)"
                        >
                            <ZoomOut size={18} />
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                Zoom Out
                            </span>
                        </button>
                    </aside>

                    {/* KANVAS PETA UTAMA */}
                    <div className="flex-1 h-full relative">
                        <MapContainer
                            center={center}
                            zoom={zoom}
                            minZoom={4}
                            maxZoom={20}
                            zoomControl={false}
                            style={{ width: '100%', height: '100%' }}
                            maxBounds={[[-15, 90], [15, 150]]}
                            maxBoundsViscosity={1.0}
                        >
                            <TileLayer
                                key={activeBaseMap}
                                url={BASEMAPS[activeBaseMap].url}
                                attribution={BASEMAPS[activeBaseMap].attribution}
                                maxZoom={20}
                                maxNativeZoom={BASEMAPS[activeBaseMap].maxNativeZoom}
                            />
                            {/* Batas Administrasi Wilayah Kabupaten Bogor (dengan Mask Redup / Fokus Wilayah) */}
                            {isMaskActive && maskRings.length > 0 && (
                                <Polygon
                                    positions={maskRings}
                                    pathOptions={{
                                        color: 'transparent',
                                        weight: 0,
                                        fillColor: '#090d16',
                                        fillOpacity: maskOpacity / 100,
                                        interactive: false
                                    }}
                                />
                            )}
                            {/* Garis Batas Administrasi Terluar */}
                            <Polygon
                                positions={BOGOR_KAB_BOUNDARY}
                                pathOptions={{
                                    color: '#0f766e',
                                    weight: 2,
                                    dashArray: '8, 8',
                                    fill: false,
                                    interactive: false
                                }}
                            />
                            {/* Render Batas Kecamatan/Desa Resmi Kabupaten Bogor dari GeoJSON */}
                            {showDesaBorders && bogorGeoJson && (
                                <GeoJSON
                                    data={bogorGeoJson}
                                    style={{
                                        color: '#0d9488',
                                        weight: 1.0,
                                        dashArray: '3, 3',
                                        fillColor: '#14b8a6',
                                        fillOpacity: 0.05,
                                        interactive: false
                                    }}
                                />
                            )}
                            <MapSyncListener
                                zoomInTrigger={zoomInTrigger}
                                zoomOutTrigger={zoomOutTrigger}
                                onZoomChange={setCurrentZoom}
                                isFullscreen={isFullscreen}
                                onMouseMove={setCursorCoords}
                                onAreaChange={setCalculatedArea}
                                onCenterChange={setCenterPoint}
                            />
                            {children}
                        </MapContainer>

                        {/* FLOATING MAP HUD / CARD INFORMASI SPASIAL DI KANAN BAWAH */}
                        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg p-4 w-72 text-left text-xs z-[1000] flex flex-col gap-3 rounded-none">
                            <div className="border-b border-slate-100 pb-2">
                                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Informasi Spasial Lahan</span>
                                </h4>
                            </div>
                            <div className="space-y-1.5 text-slate-600">
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-400">Luas Lahan:</span>
                                    <span className="font-bold text-slate-800">
                                        {calculatedArea > 0 
                                            ? `${calculatedArea.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m²` 
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-400">Luas Hektar:</span>
                                    <span className="font-bold text-slate-800">
                                        {calculatedArea > 0 
                                            ? `${(calculatedArea / 10000).toLocaleString('id-ID', { maximumFractionDigits: 4 })} Ha` 
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-400">Pusat Bidang:</span>
                                    <span className="font-mono text-[10px] text-slate-800">{centerPoint}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                                    <span className="font-medium text-slate-400">Kursor (GPS Live):</span>
                                    <span className="font-mono text-[10px] text-slate-800">
                                        {cursorCoords 
                                            ? `Lat: ${cursorCoords.lat.toFixed(6)}, Lng: ${cursorCoords.lng.toFixed(6)}` 
                                            : '-'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="border-t border-slate-100 pt-2 text-[9.5px] leading-relaxed text-slate-400">
                                <span className="font-bold text-slate-500 uppercase block mb-1">Bantuan Menggambar:</span>
                                <ul className="list-disc pl-3.5 space-y-0.5">
                                    <li>Pilih alat gambar poligon di sudut kiri atas peta.</li>
                                    <li>Klik peta untuk membuat batas bidang tanah baru.</li>
                                    <li>Gunakan tombol **Base Map** di sidebar untuk mengganti visualisasi satelit.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Tampilan default inline map
    return (
        <div className={cn(className, 'relative')} style={{ width: '100%', height: '100%' }}>
            <MapContainer
                center={center}
                zoom={zoom}
                minZoom={4}
                maxZoom={20}
                zoomControl={false}
                style={{ width: '100%', height: '100%' }}
                maxBounds={[[-15, 90], [15, 150]]}
                maxBoundsViscosity={1.0}
            >
                <TileLayer
                    key={activeBaseMap}
                    url={BASEMAPS[activeBaseMap].url}
                    attribution={BASEMAPS[activeBaseMap].attribution}
                    maxZoom={20}
                    maxNativeZoom={BASEMAPS[activeBaseMap].maxNativeZoom}
                />
                {/* Batas Administrasi Wilayah Kabupaten Bogor (dengan Mask Redup / Fokus Wilayah) */}
                {isMaskActive && maskRings.length > 0 && (
                    <Polygon
                        positions={maskRings}
                        pathOptions={{
                            color: 'transparent',
                            weight: 0,
                            fillColor: '#090d16',
                            fillOpacity: maskOpacity / 100,
                            interactive: false
                        }}
                    />
                )}
                {/* Garis Batas Administrasi Terluar */}
                <Polygon
                    positions={BOGOR_KAB_BOUNDARY}
                    pathOptions={{
                        color: '#0f766e',
                        weight: 2,
                        dashArray: '8, 8',
                        fill: false,
                        interactive: false
                    }}
                />
                {/* Render Batas Kecamatan/Desa Resmi Kabupaten Bogor dari GeoJSON */}
                {showDesaBorders && bogorGeoJson && (
                    <GeoJSON
                        data={bogorGeoJson}
                        style={{
                            color: '#0d9488',
                            weight: 1.0,
                            dashArray: '3, 3',
                            fillColor: '#14b8a6',
                            fillOpacity: 0.05,
                            interactive: false
                        }}
                    />
                )}
                <MapSyncListener
                    zoomInTrigger={zoomInTrigger}
                    zoomOutTrigger={zoomOutTrigger}
                    onZoomChange={setCurrentZoom}
                    isFullscreen={isFullscreen}
                    onMouseMove={setCursorCoords}
                    onAreaChange={setCalculatedArea}
                    onCenterChange={setCenterPoint}
                />
                <MapControls
                    isFullscreen={isFullscreen}
                    setIsFullscreen={setIsFullscreen}
                    activeBaseMap={activeBaseMap}
                    setActiveBaseMap={setActiveBaseMap}
                    isMaskActive={isMaskActive}
                    setIsMaskActive={setIsMaskActive}
                    maskOpacity={maskOpacity}
                    setMaskOpacity={setMaskOpacity}
                    showDesaBorders={showDesaBorders}
                    setShowDesaBorders={setShowDesaBorders}
                />
                {children}
            </MapContainer>
        </div>
    );
}
