import { useGisUIStore } from "@/app/store/useGisUIStore";
import { Layers, Settings2, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * LAYER PANEL (TACTICAL DYNAMIC MAP LAYER CONTROLLER)
 * ============================================================================
 * Berkas Baru: Menyajikan panel pengontrol visibilitas lapisan data tata ruang.
 * Menyediakan saklar (toggle switch) klasik untuk kategori pengajuan risiko,
 * regulasi tata ruang wilayah (RTRW/RDTR), batas administrasi, dan kontrol opacity.
 */
export default function LayerPanel() {
    const { activeLayers, toggleLayer, mapOpacity, setMapOpacity, mapZoom } = useGisUIStore();

    // Klasifikasi site plan resmi Kabupaten Bogor berdasarkan luas lahan pembangunan (Slide 4)
    const riskLayers = [
        { id: "layer-masterplan", label: "Master Plan (>10 Ha)", desc: "Kawasan perumahan skala makro", color: "bg-red-500" },
        { id: "layer-siteplan", label: "Site Plan (1-10 Ha)", desc: "Kawasan perumahan skala menengah", color: "bg-amber-500" },
        { id: "layer-gs", label: "Gambar Situasi (<1 Ha)", desc: "Rencana pembangunan kavling mikro", color: "bg-emerald-500" }
    ];

    // Peta regulasi tata ruang & batas pengaman sempadan (Slide 5)
    const zoningLayers = [
        { id: "layer-aqi", label: "Pemukiman", desc: "Pemukiman wilayah Kabupaten Bogor", color: "bg-teal-600", minZoom: 10 },
        { id: "layer-river", label: "Garis Sempadan Sungai", desc: "Area lindung sungai", color: "bg-blue-600", minZoom: 10 },
        { id: "layer-kontur", label: "Peta Kontur Lereng", desc: "Informasi garis ketinggian topografi bukit", color: "bg-amber-300", minZoom: 10 }
    ];

    return (
        <div className="flex flex-col h-full bg-white pb-12 font-sans text-slate-800 rounded-none border-slate-200">

            {/* KATEGORI 1: SKALA PENGAJUAN (MUNICIPAL TERMS) */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-700 select-none">
                <ShieldCheck size={13} className="text-teal-700" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Skala Pengajuan Perizinan</h4>
            </div>
            <div className="flex flex-col border-b border-slate-200">
                {riskLayers.map((layer) => {
                    const isActive = activeLayers.includes(layer.id);
                    return (
                        <button
                            key={layer.id}
                            type="button"
                            onClick={() => toggleLayer(layer.id)}
                            className="group flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white hover:bg-slate-50/50 transition-colors text-left w-full outline-none cursor-pointer rounded-none border-none"
                        >
                            <div className="flex items-center gap-3">
                                {/* Toggle Switch Siku Kaku GFW Style dengan Perbaikan Kontras Nonaktif */}
                                <div className={cn(
                                    "relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-none transition-colors duration-200 ease-in-out border",
                                    isActive ? "bg-teal-600 border-teal-600" : "bg-slate-100 border-slate-300"
                                )}>
                                    <span className={cn("inline-block h-2.5 w-2.5 transform rounded-none bg-white shadow-sm transition duration-200 ease-in-out", isActive ? "translate-x-3.5" : "translate-x-0.5")} />
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className={cn("w-2 h-2 rounded-none shrink-0 border border-slate-200", layer.color)} />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-xs font-semibold text-slate-700">{layer.label}</span>
                                        <span className="text-[9px] font-medium text-slate-400 mt-1">{layer.desc}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* KATEGORI 2: REGULASI TATA RUANG & SEMPADAN */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-700 select-none">
                <Layers size={13} className="text-teal-700" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Regulasi Tata Ruang</h4>
            </div>
            <div className="flex flex-col border-b border-slate-200">
                {zoningLayers.map((layer) => {
                    const isActive = activeLayers.includes(layer.id);
                    const isZoomTooFar = isActive && mapZoom < layer.minZoom;

                    return (
                        <button
                            key={layer.id}
                            type="button"
                            onClick={() => toggleLayer(layer.id)}
                            className="group flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white hover:bg-slate-50/50 transition-colors text-left w-full outline-none cursor-pointer rounded-none border-none"
                        >
                            <div className="flex items-center gap-3 w-full">
                                {/* Toggle Switch Siku Kaku GFW Style dengan Perbaikan Kontras Nonaktif */}
                                <div className={cn(
                                    "relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-none transition-colors duration-200 ease-in-out border",
                                    isActive ? "bg-teal-600 border-teal-600" : "bg-slate-100 border-slate-300"
                                )}>
                                    <span className={cn("inline-block h-2.5 w-2.5 transform rounded-none bg-white shadow-sm transition duration-200 ease-in-out", isActive ? "translate-x-3.5" : "translate-x-0.5")} />
                                </div>
                                <div className="flex items-center justify-between gap-2.5 w-full">
                                    <div className="flex items-center gap-2.5">
                                        <span className={cn("w-2 h-2 rounded-none shrink-0 border border-slate-200", layer.color)} />
                                        <div className="flex flex-col leading-none">
                                            <span className="text-xs font-semibold text-slate-700">{layer.label}</span>
                                            <span className="text-[9px] font-medium text-slate-400 mt-1">{layer.desc}</span>
                                        </div>
                                    </div>

                                    {/* --- DYNAMIC WARNING BADGE: NOTIFIKASI TRANSPARANSI SKALA PETA (USABILITY STATUS) --- */}
                                    {isZoomTooFar && (
                                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-none leading-none animate-pulse shrink-0 ml-2 shadow-sm">
                                            <AlertCircle size={8} /> PERLU ZOOM (MIN. {layer.minZoom})
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* KATEGORI 3: KONTROL VISUAL */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-700 select-none">
                <Settings2 size={13} className="text-teal-700" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Kontrol Visual</h4>
            </div>
            <div className="flex flex-col divide-y divide-slate-100 border-b border-slate-200">
                <div className="px-5 py-3.5 bg-white space-y-2.5">
                    <div className="flex justify-between items-center select-none leading-none">
                        <span className="text-xs font-semibold text-slate-700">Transparansi Poligon</span>
                        <span className="text-[9px] font-black font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 border border-teal-100">{mapOpacity}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={mapOpacity} onChange={(e) => setMapOpacity(parseInt(e.target.value))} className="w-full h-1 bg-slate-200 rounded-none appearance-none cursor-pointer accent-teal-600 outline-none" />
                </div>
            </div>
        </div>
    );
}