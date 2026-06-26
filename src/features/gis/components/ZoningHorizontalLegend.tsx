import { useState, useEffect } from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";
import { useGisUIStore } from "@/app/store/useGisUIStore";
import { cn } from "@/lib/utils";

export default function ZoningHorizontalLegend() {
    const { activeLayers, activePanels, mapZoom } = useGisUIStore();
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isZoningActive = activeLayers.includes("layer-aqi") || activeLayers.includes("layer-river");
    if (!isZoningActive) return null;

    const zoningSpectrum = [
        { label: "Kawasan Hunian", range: "Permukiman", color: "#0d9488", text: "text-white" },
        { label: "Kawasan Lindung", range: "Hutan & RTH", color: "#16a34a", text: "text-white" },
        { label: "Sempadan Sungai", range: "Buffer 25m", color: "#2563eb", text: "text-white" },
        { label: "Sempadan SUTET", range: "Buffer Rel", color: "#eab308", text: "text-slate-900" },
        { label: "Zona Industri", range: "Komersial", color: "#ca1d45", text: "text-white" }
    ];

    const leftSidebarWidth = 64;
    const activePanelsWidth = activePanels.reduce((sum, panel) => {
        if (panel.type === "ai-copilot" || panel.type === "detil-perusahaan") return sum + 360;
        if (panel.type === "telemetri-lingkungan" || panel.type === "detail-tugas") return sum + 320;
        return sum + 280;
    }, 0);

    const totalLeftBlockedWidth = leftSidebarWidth + activePanelsWidth;
    const remainingWidth = windowWidth - totalLeftBlockedWidth;
    const calculatedLeftPosition = totalLeftBlockedWidth + (remainingWidth / 2);

    const colorStops = zoningSpectrum.map((item, index) => {
        const centerPercent = ((index * 2 + 1) / (zoningSpectrum.length * 2)) * 100;
        return `${item.color} ${centerPercent}%`;
    }).join(", ");

    const smoothGradientBackground = `linear-gradient(to right, ${colorStops})`;

    const triggerZoomIn = () => window.dispatchEvent(new Event("map-zoom-in"));
    const triggerZoomOut = () => window.dispatchEvent(new Event("map-zoom-out"));
    const triggerResetView = () => window.dispatchEvent(new Event("map-reset-view"));

    return (
        <div
            className="absolute z-[999] pointer-events-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl transition-all ease-in-out bottom-8"
            style={{ left: `${calculatedLeftPosition}px`, transform: "translateX(-50%)" }}
        >
            <div className="bg-white/95 backdrop-blur border border-slate-200 border-b-0 px-3 py-1.5 flex items-center justify-between gap-4 shadow-sm w-full md:w-auto rounded-none">
                <div className="flex items-center gap-2 text-left w-full justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                        PETA ZONASI REGULASI TATA RUANG (RTRW/RDTR) | ZOOM LEVEL: {mapZoom}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row bg-white border border-slate-200 shadow-2xl rounded-none overflow-hidden w-full md:w-auto">
                <div className="flex flex-col md:flex-row w-full md:w-auto" style={{ background: smoothGradientBackground }}>
                    {zoningSpectrum.map((item, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex flex-col items-center justify-center px-4 py-2 md:px-5 md:py-1.5 min-w-[65px] md:min-w-[95px] border-b md:border-b-0 md:border-r border-black/10 last:border-b-0 md:last:border-r-0 transition-all hover:backdrop-brightness-115 bg-transparent",
                                item.text
                            )}
                        >
                            <span className="text-[9px] font-black tracking-tight whitespace-nowrap leading-none uppercase drop-shadow-sm">{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="hidden md:flex bg-slate-900 text-slate-300 select-none divide-x divide-white/10 shrink-0 border-l border-slate-700">
                    <button onClick={triggerZoomIn} className="w-10 h-full flex items-center justify-center hover:bg-teal-600 hover:text-white transition-colors duration-150 outline-none cursor-pointer rounded-none">
                        <Plus size={13} strokeWidth={3} />
                    </button>
                    <button onClick={triggerResetView} className="w-11 h-full flex items-center justify-center hover:bg-teal-600 hover:text-white transition-colors duration-150 outline-none cursor-pointer rounded-none">
                        <Maximize2 size={11} strokeWidth={3} />
                    </button>
                    <button onClick={triggerZoomOut} className="w-10 h-full flex items-center justify-center hover:bg-teal-600 hover:text-white transition-colors duration-150 outline-none cursor-pointer rounded-none">
                        <Minus size={13} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
}