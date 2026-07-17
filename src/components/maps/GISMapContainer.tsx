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
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Layers, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface GISMapContainerProps {
    /** Pusat awal peta dalam format [latitude, longitude] */
    center?: [number, number];
    zoom?: number;
    children?: React.ReactNode;
    className?: string;
}

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
 * ke fungsi Leaflet (zoomIn, zoomOut, invalidateSize).
 */
interface ZoomListenerProps {
    zoomInTrigger: number;
    zoomOutTrigger: number;
    onZoomChange: (zoom: number) => void;
    isFullscreen: boolean;
}

function ZoomListener({
    zoomInTrigger,
    zoomOutTrigger,
    onZoomChange,
    isFullscreen,
}: ZoomListenerProps) {
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
}

function MapControls({
    isFullscreen,
    setIsFullscreen,
    activeBaseMap,
    setActiveBaseMap,
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
    center = [-6.595189, 106.816629],
    zoom = 13,
    children,
    className = 'w-full h-full rounded-xl shadow-inner border border-slate-200',
}: GISMapContainerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeBaseMap, setActiveBaseMap] = useState<keyof typeof BASEMAPS>('osm');
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

    // Zoom state untuk sidebar eksternal (saat fullscreen)
    const [zoomInTrigger, setZoomInTrigger] = useState(0);
    const [zoomOutTrigger, setZoomOutTrigger] = useState(0);
    const [currentZoom, setCurrentZoom] = useState(zoom);

    // Mode Fullscreen dengan struktur navbar & sidebar terintegrasi
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-50 w-screen h-screen flex flex-col font-sans select-none antialiased">
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
                            <ZoomListener
                                zoomInTrigger={zoomInTrigger}
                                zoomOutTrigger={zoomOutTrigger}
                                onZoomChange={setCurrentZoom}
                                isFullscreen={isFullscreen}
                            />
                            {children}
                        </MapContainer>
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
                <MapControls
                    isFullscreen={isFullscreen}
                    setIsFullscreen={setIsFullscreen}
                    activeBaseMap={activeBaseMap}
                    setActiveBaseMap={setActiveBaseMap}
                />
                {children}
            </MapContainer>
        </div>
    );
}
