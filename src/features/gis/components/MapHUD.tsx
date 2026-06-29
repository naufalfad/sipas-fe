import { useState, useEffect, useMemo } from "react";
import {
    Plus, Minus, Maximize2, Map as MapIcon, Mountain,
    ChevronDown, ChevronUp, Crosshair, Navigation
} from "lucide-react";
import { useGisUIStore } from "@/app/store/useGisUIStore";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * MAP HUD (HEADS-UP DISPLAY) & CATEGORY LEGEND PANEL
 * ============================================================================
 * Panel kontrol navigasi mengambang di pojok kanan bawah.
 * Semua segmen bisa dikollaps/dibuka secara independen.
 * Termasuk: Legenda, Koordinat Kursor + Elevasi, Zoom/Pitch/Bearing, tombol kontrol.
 */
export default function MapHUD() {
    const {
        activeLayers, mapZoom, mapPitch, mapBearing,
        is3DMode, toggle3DMode, isTerrainActive, toggleTerrain,
        cursorCoords, setMapPitch
    } = useGisUIStore();

    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [isCoordsOpen, setIsCoordsOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsLegendOpen(false);
                setIsCoordsOpen(false);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    type LegendItem = {
        label: string;
        color: string;
        shape: "square" | "circle" | "pulsing";
        layerId?: string;
        isGlobalWarning?: boolean;
    };

    const legendItems = useMemo<LegendItem[]>(() => [
        { label: "Master Plan (>10 Ha)", color: "bg-red-500", shape: "circle", layerId: "layer-masterplan" },
        { label: "Site Plan (1-10 Ha)", color: "bg-amber-500", shape: "circle", layerId: "layer-siteplan" },
        { label: "Gambar Situasi (<1 Ha)", color: "bg-emerald-500", shape: "circle", layerId: "layer-gs" },
        { label: "Pelanggaran Batas Sempadan", color: "bg-rose-600", shape: "pulsing", isGlobalWarning: true },
        { label: "Koridor SUTET / Rel Kereta", color: "bg-yellow-500", shape: "pulsing", isGlobalWarning: true },
    ], []);

    // Sembunyikan HUD ini jika salah satu layer zoning tata ruang aktif (dihandle oleh ZoningHorizontalLegend)
    const isZoningActive =
        activeLayers.includes("layer-aqi") ||
        activeLayers.includes("layer-river") ||
        activeLayers.includes("layer-sawah") ||
        activeLayers.includes("layer-pasir") ||
        activeLayers.includes("layer-kebun") ||
        activeLayers.includes("layer-ladang");
    if (isZoningActive) return null;

    const triggerZoomIn = () => window.dispatchEvent(new Event("map-zoom-in"));
    const triggerZoomOut = () => window.dispatchEvent(new Event("map-zoom-out"));
    const triggerResetView = () => window.dispatchEvent(new Event("map-reset-view"));

    // Konversi bearing ke arah kompas
    const bearingToCompass = (b: number) => {
        const dirs = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"];
        const norm = ((b % 360) + 360) % 360;
        return dirs[Math.round(norm / 45) % 8];
    };

    const zoomLabel = mapZoom < 10 ? "KAB." : mapZoom < 14 ? "KEC." : "DETAIL";

    // ── PANEL WRAPPER ─────────────────────────────────────────────────────────
    const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div className={cn(
            "bg-white/95 backdrop-blur border border-slate-200 shadow-xl rounded-none overflow-hidden",
            className
        )}>
            {children}
        </div>
    );

    const PanelHeader = ({
        icon, label, isOpen, onToggle
    }: { icon: React.ReactNode; label: string; isOpen: boolean; onToggle: () => void }) => (
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer outline-none group"
        >
            <div className="flex items-center gap-1.5">
                {icon}
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">{label}</span>
            </div>
            <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                {isOpen ? <ChevronDown size={11} strokeWidth={2.5} /> : <ChevronUp size={11} strokeWidth={2.5} />}
            </div>
        </button>
    );

    return (
        <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 z-40 pointer-events-auto flex flex-row items-end gap-2.5 select-none">

            {/* ── KOLOM KIRI: Semua panel informatif ── */}
            <div className="flex flex-col items-end gap-2 text-left w-60">

                {/* 1. PANEL LEGENDA KEPATUHAN (collapsible) */}
                <Panel className="w-full">
                    <PanelHeader
                        icon={<MapIcon size={11} className="text-teal-700" />}
                        label="Legenda Kepatuhan"
                        isOpen={isLegendOpen}
                        onToggle={() => setIsLegendOpen(v => !v)}
                    />
                    {isLegendOpen && (
                        <div className="flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
                            {legendItems.map((item, idx) => {
                                const hasAnyPerizinanLayer =
                                    activeLayers.includes("layer-masterplan") ||
                                    activeLayers.includes("layer-siteplan") ||
                                    activeLayers.includes("layer-gs");

                                const isLayerActive = item.isGlobalWarning
                                    ? hasAnyPerizinanLayer
                                    : !item.layerId || activeLayers.includes(item.layerId);

                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex items-center gap-3 px-3.5 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-all duration-300",
                                            isLayerActive ? "opacity-100" : "opacity-35"
                                        )}
                                    >
                                        <div className="relative w-3 h-3 shrink-0 flex items-center justify-center">
                                            {item.shape === "pulsing" && (
                                                <span className={cn(
                                                    "absolute inline-flex h-full w-full rounded-full opacity-75",
                                                    isLayerActive && "animate-ping",
                                                    item.color.replace("600", "400").replace("500", "400")
                                                )} />
                                            )}
                                            <div className={cn("relative w-2.5 h-2.5 shadow-sm border border-white rounded-full", item.color)} />
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
                    )}
                </Panel>

                {/* 2. PANEL KOORDINAT KURSOR + ELEVASI (collapsible) */}
                <Panel className="w-full">
                    <PanelHeader
                        icon={<Crosshair size={11} className="text-indigo-600" />}
                        label="Koordinat & Elevasi"
                        isOpen={isCoordsOpen}
                        onToggle={() => setIsCoordsOpen(v => !v)}
                    />
                    {isCoordsOpen && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200 divide-y divide-slate-100">
                            <div className="grid grid-cols-2 divide-x divide-slate-100">
                                <div className="px-3 py-2 flex flex-col gap-0.5">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">LAT</span>
                                    <span className="text-[11px] font-mono font-bold text-slate-800 tabular-nums">
                                        {cursorCoords ? cursorCoords.lat.toFixed(5) : "—"}
                                    </span>
                                </div>
                                <div className="px-3 py-2 flex flex-col gap-0.5">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">LNG</span>
                                    <span className="text-[11px] font-mono font-bold text-slate-800 tabular-nums">
                                        {cursorCoords ? cursorCoords.lng.toFixed(5) : "—"}
                                    </span>
                                </div>
                            </div>
                            <div className="px-3 py-2 flex items-center gap-2">
                                <Mountain size={11} className="text-teal-600 shrink-0" />
                                <div className="flex flex-col gap-0.5 flex-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Elevasi / Ketinggian</span>
                                    <span className={cn(
                                        "text-[12px] font-mono font-black tabular-nums leading-none",
                                        cursorCoords?.elevation !== null && cursorCoords?.elevation !== undefined
                                            ? "text-teal-700"
                                            : "text-slate-400"
                                    )}>
                                        {cursorCoords?.elevation !== null && cursorCoords?.elevation !== undefined
                                            ? `${Math.round(cursorCoords.elevation)} mdpl`
                                            : "Arahkan kursor ke peta"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </Panel>

                {/* 3. PANEL STATUS KAMERA PETA (collapsible) */}
                <Panel className="w-full">
                    <PanelHeader
                        icon={<Navigation size={11} className="text-slate-500" />}
                        label="Status Kamera Peta"
                        isOpen={isStatusOpen}
                        onToggle={() => setIsStatusOpen(v => !v)}
                    />
                    {isStatusOpen && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                                <div className="px-2.5 py-2 flex flex-col gap-0.5 items-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Zoom</span>
                                    <span className="text-[12px] font-black text-slate-800 tabular-nums">{Math.round(mapZoom)}</span>
                                </div>
                                <div className="px-2.5 py-2 flex flex-col gap-0.5 items-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Pitch</span>
                                    <span className="text-[12px] font-black text-slate-800 tabular-nums">{Math.round(mapPitch)}°</span>
                                </div>
                                <div className="px-2.5 py-2 flex flex-col gap-0.5 items-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Arah</span>
                                    <span className="text-[12px] font-black text-slate-800 tabular-nums">{bearingToCompass(mapBearing)}</span>
                                </div>
                            </div>
                            <div className="px-3 py-1.5 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{zoomLabel}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    {Math.round(((mapBearing % 360) + 360) % 360)}° KOMPAS
                                </span>
                            </div>
                        </div>
                    )}
                </Panel>

            </div>

            {/* ── KOLOM KANAN: Tombol Kontrol Vertikal ── */}
            <div className="hidden md:flex flex-col bg-white/95 backdrop-blur border border-slate-200 shadow-xl rounded-none overflow-hidden divide-y divide-slate-100 shrink-0">
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
                <button
                    onClick={toggle3DMode}
                    className={`w-10 h-10 flex items-center justify-center transition-colors active:bg-slate-200 rounded-none outline-none ${is3DMode
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-teal-700'
                        }`}
                    title={is3DMode ? 'Beralih ke Tampilan Flat 2D' : 'Beralih ke Tampilan 3D Imersif'}
                >
                    <span className="text-[11px] font-black tracking-wider leading-none">3D</span>
                </button>
                <button
                    onClick={toggleTerrain}
                    className={`w-10 h-10 flex items-center justify-center transition-colors active:bg-slate-200 rounded-none outline-none ${isTerrainActive
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