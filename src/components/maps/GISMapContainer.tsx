/**
 * ============================================================================
 * GIS MAP CONTAINER — Leaflet Wrapper
 * ============================================================================
 * Komponen pembungkus peta generik berbasis Leaflet.
 * Digunakan oleh form pengajuan dan komponen lain yang membutuhkan
 * peta embedding ringan (bukan GISPage utama).
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Layers, Check } from 'lucide-react';
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

    // Sinkronisasi status zoom
    useEffect(() => {
        const onZoom = () => {
            setCurrentZoom(map.getZoom());
        };
        map.on('zoomend', onZoom);
        return () => {
            map.off('zoomend', onZoom);
        };
    }, [map]);

    // Paksa Leaflet menghitung ulang ukuran kontainer saat status fullscreen berubah
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);
        return () => clearTimeout(timer);
    }, [map, isFullscreen]);

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

                {/* Menu Pemilih Layer Citra Satelit */}
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

    return (
        <div 
            className={cn(
                isFullscreen 
                    ? 'fixed inset-0 z-[9999] bg-white w-screen h-screen' 
                    : className,
                'relative'
            )}
            style={isFullscreen ? { width: '100vw', height: '100vh' } : { width: '100%', height: '100%' }}
        >
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
