import { useState, useEffect, useMemo } from "react";
import { Plus, Minus, Maximize2, Map as MapIcon, Mountain } from "lucide-react";
import { useGisUIStore } from "@/app/store/useGisUIStore";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * MAP HUD (HEADS-UP DISPLAY) & CATEGORY LEGEND PANEL
 * ============================================================================
 * Berkas Baru: Menyajikan kontrol navigasi mengambang di pojok kanan bawah.
 * Dilengkapi dengan panel Legenda Kategori Risiko Dokumen Lingkungan (AMDAL, UKL-UPL, SPPL)
 * yang otomatis menyesuaikan tampilannya jika layer-layer tersebut aktif.
 */
export default function MapHUD() {
    const { activeLayers, mapZoom, mapPitch, is3DMode, toggle3DMode, isTerrainActive, toggleTerrain } = useGisUIStore();
    const [isLegendExpanded, setIsLegendExpanded] = useState(true);

    useEffect(() => {
        const handleResize = () => setIsLegendExpanded(window.innerWidth >= 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    type LegendItem = {
        label: string;
        color: string;
        shape: "square" | "circle" | "pulsing";
        layerId?: string;       // Pencocokan relasi layer spasial aktif
        isGlobalWarning?: boolean; // Pemicu lampu radar berdenyut (EWS)
    };

    // Katalog Penanda Spasial Kategori Dokumen (Slide 4, Slide 5)
    const legendItems = useMemo<LegendItem[]>(() => {
        return [
            {
                label: "Master Plan (>10 Ha)",
                color: "bg-red-500",
                shape: "circle",
                layerId: "layer-masterplan"
            },
            {
                label: "Site Plan (1-10 Ha)",
                color: "bg-amber-500",
                shape: "circle",
                layerId: "layer-siteplan"
            },
            {
                label: "Gambar Situasi (<1 Ha)",
                color: "bg-emerald-500",
                shape: "circle",
                layerId: "layer-gs"
            },
            {
                label: "Pelanggaran Batas Sempadan",
                color: "bg-rose-600",
                shape: "pulsing",
                isGlobalWarning: true
            },
            {
                label: "Koridor SUTET / Rel Kereta",
                color: "bg-yellow-500",
                shape: "pulsing",
                isGlobalWarning: true
            }
        ];
    }, []);

    // Sembunyikan HUD ini jika layer visualisasi makro tata ruang sedang diaktifkan
    // (Karena diatur terpusat oleh ZoningHorizontalLegend)
    const isZoningActive = activeLayers.includes("layer-aqi") || activeLayers.includes("layer-river");
    if (isZoningActive) return null;

    const triggerZoomIn = () => window.dispatchEvent(new Event("map-zoom-in"));
    const triggerZoomOut = () => window.dispatchEvent(new Event("map-zoom-out"));
    const triggerResetView = () => window.dispatchEvent(new Event("map-reset-view"));

    return (
        <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 z-40 pointer-events-auto flex flex-row items-end gap-3 select-none">

            {/* Kolom Kiri: Legenda + Zoom Scale HUD */}
            <div className="flex flex-col items-end gap-2 text-left">
                {/* 1. SEGMEN COLLAPSIBLE LEGEND (LACI LEGENDA KEPATUHAN) */}
                {isLegendExpanded ? (
                    <div className="bg-white/95 backdrop-blur border border-slate-200 shadow-2xl rounded-none w-60 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[70vh] overflow-y-auto custom-scrollbar">

                        {/* Header Legenda */}
                        <div
                            className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 sticky top-0 z-10 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => setIsLegendExpanded(false)}
                        >
                            <div className="flex items-center gap-2">
                                <MapIcon size={12} className="text-teal-700" />
                                <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none">
                                    Legenda Kepatuhan Ruang
                                </h4>
                            </div>
                            <Minus size={12} className="text-slate-400" />
                        </div>

                        {/* List Item Legenda */}
                        <div className="flex flex-col">
                            {legendItems.map((item, idx) => {
                                let isLayerActive = false;

                                if (item.isGlobalWarning) {
                                    // Alarm radar EWS menyala jika ada minimal salah satu dari layer perizinan diaktifkan
                                    isLayerActive = activeLayers.includes("layer-masterplan") ||
                                        activeLayers.includes("layer-siteplan") ||
                                        activeLayers.includes("layer-gs");
                                } else {
                                    isLayerActive = !item.layerId || activeLayers.includes(item.layerId);
                                }

                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex items-center gap-3 px-3.5 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-all duration-300",
                                            isLayerActive ? "opacity-100" : "opacity-40"
                                        )}
                                    >
                                        <div className="relative w-3 h-3 shrink-0 flex items-center justify-center">
                                            {/* Riak Berdenyut Gelombang Sonar Radar (EWS) */}
                                            {item.shape === "pulsing" && (
                                                <span className={cn(
                                                    "absolute inline-flex h-full w-full rounded-full opacity-75",
                                                    isLayerActive && "animate-ping",
                                                    item.color.replace("600", "400").replace("500", "400")
                                                )} />
                                            )}

                                            {/* Indikator Solid */}
                                            <div className={cn(
                                                "relative w-2.5 h-2.5 shadow-sm border border-white rounded-full",
                                                item.color
                                            )} />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black tracking-tight leading-none transition-colors",
                                            isLayerActive ? "text-slate-700" : "text-slate-400"
                                        )}>
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                ) : (
                    <button
                        onClick={() => setIsLegendExpanded(true)}
                        className="bg-white/95 backdrop-blur border border-slate-300 shadow-xl w-10 h-10 flex items-center justify-center text-slate-600 hover:text-teal-700 hover:bg-slate-50 transition-colors active:bg-slate-200 rounded-none outline-none animate-in zoom-in-95"
                        title="Buka Legenda"
                    >
                        <MapIcon size={18} strokeWidth={2.5} />
                    </button>
                )}

                {/* 3. ZOOM SCALE HUD */}
                <div className="bg-white/95 backdrop-blur border border-slate-300 px-4 py-1.5 flex items-center justify-between shadow-xl rounded-none text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none h-10 select-none w-60">
                    <span>Zoom: {Math.round(mapZoom)}</span>
                    <span className="text-slate-300">|</span>
                    <span>Pitch: {Math.round(mapPitch)}°</span>
                    <span className="text-slate-300">|</span>
                    <span>
                        {mapZoom < 10 ? 'KAB.' : mapZoom < 14 ? 'KEC.' : 'DETAIL'}
                    </span>
                </div>
            </div>

            {/* 2. SEGMEN TOMBOL KONTROL MAP (VERTIKAL TACTICAL HUD) */}
            <div className="hidden md:flex flex-col bg-white/95 backdrop-blur border border-slate-300 shadow-xl rounded-none overflow-hidden divide-y divide-slate-200 shrink-0">
                <button
                    onClick={triggerZoomIn}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-teal-700 transition-colors active:bg-slate-200 rounded-none outline-none"
                    title="Perbesar (Zoom In)"
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>
                <button
                    onClick={triggerResetView}
                    className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-teal-700 transition-colors active:bg-slate-200 group rounded-none outline-none"
                    title="Reset Fokus Peta"
                >
                    <Maximize2 size={14} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                </button>
                <button
                    onClick={triggerZoomOut}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-teal-700 transition-colors active:bg-slate-200 rounded-none outline-none"
                    title="Perkecil (Zoom Out)"
                >
                    <Minus size={18} strokeWidth={2.5} />
                </button>
                {/* Tombol Toggle 3D/Flat */}
                <button
                    onClick={toggle3DMode}
                    className={`w-10 h-10 flex items-center justify-center transition-colors active:bg-slate-200 rounded-none outline-none ${
                        is3DMode
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-teal-700'
                    }`}
                    title={is3DMode ? 'Beralih ke Tampilan Flat 2D' : 'Beralih ke Tampilan 3D Imersif'}
                >
                    <span className="text-[11px] font-black tracking-wider leading-none">3D</span>
                </button>
                {/* Tombol Toggle Terrain */}
                <button
                    onClick={toggleTerrain}
                    className={`w-10 h-10 flex items-center justify-center transition-colors active:bg-slate-200 rounded-none outline-none ${
                        isTerrainActive
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-teal-700'
                    }`}
                    title={isTerrainActive ? 'Nonaktifkan 3D Terrain' : 'Aktifkan 3D Terrain'}
                >
                    <Mountain size={18} strokeWidth={2.5} />
                </button>
            </div>

        </div>
    );
}