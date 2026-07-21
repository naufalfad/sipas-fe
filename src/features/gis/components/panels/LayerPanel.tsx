import { useGisUIStore } from "@/app/store/useGisUIStore";
import { Layers, Settings2, ShieldCheck, CheckSquare, Square, Box, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * LAYER PANEL — Kabupaten Bogor Spatial Data Controller
 * ============================================================================
 * Kategori:
 *  1. Skala Pengajuan Perizinan (Master Plan, Site Plan, Gambar Situasi)
 *  2. Data Spasial Kab. Bogor — semua layer GIS (BIG 1:25.000)
 *  3. Kontrol Visual (opacity slider)
 */

type LayerDef = {
    id: string;
    label: string;
    desc: string;
    /** Warna dot indikator (Tailwind bg class) */
    dotColor: string;
    /** Warna border dot */
    dotBorder?: string;
    minZoom?: number;
};

// ─── SEMUA LAYER DATA SPASIAL KAB. BOGOR (kontras, mudah dibedakan) ───────────
const SPATIAL_LAYERS: LayerDef[] = [
    // ── Administrasi ──────────────────────────────────────────────────────────
    {
        id: "layer-administrasi",
        label: "Batas Administrasi Kec.",
        desc: "Garis batas antar kecamatan",
        dotColor: "bg-red-500",
        minZoom: 8,
    },
    {
        id: "layer-desa",
        label: "Batas Desa / Kelurahan",
        desc: "Area administrasi tingkat desa",
        dotColor: "bg-orange-400",
        minZoom: 10,
    },
    // ── Permukiman & Infrastruktur ────────────────────────────────────────────
    {
        id: "layer-aqi",
        label: "Permukiman",
        desc: "Kawasan permukiman Kab. Bogor",
        dotColor: "bg-cyan-500",
        minZoom: 10,
    },
    {
        id: "layer-jalan",
        label: "Jaringan Jalan",
        desc: "Infrastruktur jalan skala 1:25.000",
        dotColor: "bg-slate-400",
        minZoom: 10,
    },
    {
        id: "layer-relka",
        label: "Rel Kereta Api",
        desc: "Jaringan rel kereta api",
        dotColor: "bg-zinc-700",
        minZoom: 8,
    },
    // ── Hidrologi ─────────────────────────────────────────────────────────────
    {
        id: "layer-river",
        label: "Sungai",
        desc: "Garis sempadan & aliran sungai",
        dotColor: "bg-blue-500",
        minZoom: 10,
    },
    {
        id: "layer-danau",
        label: "Danau & Badan Air",
        desc: "Waduk, situ, dan perairan darat",
        dotColor: "bg-sky-300",
        minZoom: 8,
    },
    // ── Topografi ─────────────────────────────────────────────────────────────
    {
        id: "layer-kontur",
        label: "Kontur Topografi",
        desc: "Garis ketinggian / isohipsa",
        dotColor: "bg-yellow-400",
        minZoom: 10,
    },
    {
        id: "layer-punggungbukit",
        label: "Punggung Bukit",
        desc: "Garis ridge / puncak topografi",
        dotColor: "bg-purple-500",
        minZoom: 10,
    },
    // ── Pertanian ─────────────────────────────────────────────────────────────
    {
        id: "layer-sawah",
        label: "Lahan Sawah",
        desc: "Kawasan pertanian lahan basah",
        dotColor: "bg-emerald-400",
        minZoom: 10,
    },
    {
        id: "layer-kebun",
        label: "Perkebunan",
        desc: "Kawasan agrikultur perkebunan",
        dotColor: "bg-green-700",
        minZoom: 10,
    },
    {
        id: "layer-ladang",
        label: "Ladang / Tegalan",
        desc: "Kawasan agrikultur ladang kering",
        dotColor: "bg-lime-500",
        minZoom: 10,
    },
    {
        id: "layer-tanamcampur",
        label: "Tanaman Campuran",
        desc: "Kawasan agrikultur tanam campur",
        dotColor: "bg-teal-400",
        minZoom: 10,
    },
    // ── Vegetasi Non-Agri ─────────────────────────────────────────────────────
    {
        id: "layer-hutankering",
        label: "Hutan Lahan Kering",
        desc: "Hutan sekunder lahan kering",
        dotColor: "bg-green-900",
        minZoom: 10,
    },
    {
        id: "layer-semak",
        label: "Semak Belukar",
        desc: "Kawasan semak belukar / belukar",
        dotColor: "bg-yellow-600",
        minZoom: 10,
    },
    {
        id: "layer-alang",
        label: "Alang-alang / Savana",
        desc: "Padang rumput & alang-alang",
        dotColor: "bg-amber-300",
        minZoom: 10,
    },
    // ── Lainnya ───────────────────────────────────────────────────────────────
    {
        id: "layer-pasir",
        label: "Gumuk Pasir",
        desc: "Area gumuk pasir dan sejenisnya",
        dotColor: "bg-orange-200",
        minZoom: 10,
    },
];

const SPATIAL_LAYER_IDS = SPATIAL_LAYERS.map((l) => l.id);

export default function LayerPanel() {
    const navigate = useNavigate();
    const activeLayers = useGisUIStore((s) => s.activeLayers);
    const toggleLayer = useGisUIStore((s) => s.toggleLayer);
    const mapOpacity = useGisUIStore((s) => s.mapOpacity);
    const setMapOpacity = useGisUIStore((s) => s.setMapOpacity);
    const mapZoom = useGisUIStore((s) => s.mapZoom);

    const isBim3dActive = activeLayers.includes("layer-3d-bim");

    const allSpatialActive = SPATIAL_LAYER_IDS.every((id) =>
        activeLayers.includes(id)
    );
    const someSpatialActive = SPATIAL_LAYER_IDS.some((id) =>
        activeLayers.includes(id)
    );

    const handleToggleAll = () => {
        if (allSpatialActive) {
            // Nonaktifkan semua
            SPATIAL_LAYER_IDS.forEach((id) => {
                if (activeLayers.includes(id)) toggleLayer(id);
            });
        } else {
            // Aktifkan semua yang belum aktif
            SPATIAL_LAYER_IDS.forEach((id) => {
                if (!activeLayers.includes(id)) toggleLayer(id);
            });
        }
    };

    // ── Layer pengajuan (tetap terpisah) ──────────────────────────────────────
    const riskLayers: LayerDef[] = [
        {
            id: "layer-masterplan",
            label: "Master Plan (>10 Ha)",
            desc: "Kawasan perumahan skala makro",
            dotColor: "bg-red-500",
        },
        {
            id: "layer-siteplan",
            label: "Site Plan (1–10 Ha)",
            desc: "Kawasan perumahan skala menengah",
            dotColor: "bg-amber-500",
        },
        {
            id: "layer-gs",
            label: "Gambar Situasi (<1 Ha)",
            desc: "Rencana pembangunan kavling mikro",
            dotColor: "bg-emerald-500",
        },
    ];

    // ── Komponen toggle item ───────────────────────────────────────────────────
    const LayerItem = ({ layer }: { layer: LayerDef }) => {
        const isActive = activeLayers.includes(layer.id);
        const needsZoom =
            isActive && layer.minZoom !== undefined && mapZoom < layer.minZoom;

        return (
            <button
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={cn(
                    "group flex items-center gap-3 px-4 py-3 border-b border-slate-100 transition-colors text-left w-full outline-none cursor-pointer rounded-none",
                    isActive
                        ? "bg-teal-50/60 hover:bg-teal-50"
                        : "bg-white hover:bg-slate-50"
                )}
            >
                {/* Toggle pill */}
                <div
                    className={cn(
                        "relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-none transition-colors duration-200 border",
                        isActive
                            ? "bg-teal-600 border-teal-600"
                            : "bg-slate-100 border-slate-300"
                    )}
                >
                    <span
                        className={cn(
                            "inline-block h-2.5 w-2.5 transform rounded-none bg-white shadow-sm transition duration-200",
                            isActive ? "translate-x-3.5" : "translate-x-0.5"
                        )}
                    />
                </div>

                {/* Color dot */}
                <span
                    className={cn(
                        "w-2.5 h-2.5 shrink-0 border border-white/30 shadow-sm",
                        layer.dotColor
                    )}
                />

                {/* Label + desc */}
                <div className="flex flex-col leading-none flex-1 min-w-0">
                    <span
                        className={cn(
                            "text-[11px] font-semibold truncate",
                            isActive ? "text-slate-800" : "text-slate-600"
                        )}
                    >
                        {layer.label}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 mt-0.5 truncate">
                        {layer.desc}
                    </span>
                </div>

                {/* Zoom badge */}
                {needsZoom && (
                    <span className="shrink-0 text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 leading-none">
                        zoom≥{layer.minZoom}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white pb-12 font-sans text-slate-800 overflow-y-auto">

            {/* ── KAT. 0: FEATURED 3D BIM REVIEWER TOGGLE CARD ── */}
            <div className="p-3.5 bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 text-white border-b border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                            <Box size={14} className="text-teal-400" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-300">
                                Model Bangunan 3D BIM
                            </h4>
                            <p className="text-[9px] text-slate-400">RTC 3D Tiles Streaming Bogor</p>
                        </div>
                    </div>

                    {/* Toggle switch 3D */}
                    <button
                        type="button"
                        onClick={() => toggleLayer("layer-3d-bim")}
                        className={cn(
                            "relative inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors duration-200 border cursor-pointer",
                            isBim3dActive
                                ? "bg-teal-500 border-teal-400"
                                : "bg-slate-800 border-slate-700"
                        )}
                        title="Toggle Layer 3D BIM di Peta"
                    >
                        <span
                            className={cn(
                                "inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200",
                                isBim3dActive ? "translate-x-4" : "translate-x-0.5"
                            )}
                        />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/gis/bim-reviewer")}
                    className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded transition flex items-center justify-between shadow cursor-pointer border-none"
                >
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                        <Box size={13} />
                        Buka Viewport 3D BIM Reviewer
                    </span>
                    <ArrowRight size={13} />
                </button>
            </div>

            {/* ── KAT. 1: SKALA PENGAJUAN ── */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 select-none sticky top-0 z-10">
                <ShieldCheck size={12} className="text-teal-700 shrink-0" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-700">
                    Skala Pengajuan Perizinan
                </h4>
            </div>
            <div className="flex flex-col border-b border-slate-200">
                {riskLayers.map((l) => (
                    <LayerItem key={l.id} layer={l} />
                ))}
            </div>

            {/* ── KAT. 2: DATA SPASIAL KAB. BOGOR ── */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 select-none sticky top-0 z-10">
                <Layers size={12} className="text-teal-700 shrink-0" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-700 flex-1">
                    Data Spasial Kab. Bogor
                </h4>
                {/* ── BUTTON AKTIFKAN / NONAKTIFKAN SEMUA ── */}
                <button
                    type="button"
                    onClick={handleToggleAll}
                    className={cn(
                        "flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-1 border transition-colors shrink-0 outline-none cursor-pointer",
                        allSpatialActive
                            ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                            : someSpatialActive
                            ? "bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                    )}
                >
                    {allSpatialActive ? (
                        <>
                            <CheckSquare size={9} />
                            Nonaktifkan Semua
                        </>
                    ) : (
                        <>
                            <Square size={9} />
                            Aktifkan Semua
                        </>
                    )}
                </button>
            </div>
            <div className="flex flex-col border-b border-slate-200">
                {SPATIAL_LAYERS.map((l) => (
                    <LayerItem key={l.id} layer={l} />
                ))}
            </div>

            {/* ── KAT. 3: KONTROL VISUAL ── */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 select-none">
                <Settings2 size={12} className="text-teal-700 shrink-0" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-700">
                    Kontrol Visual
                </h4>
            </div>
            <div className="px-4 py-3.5 bg-white border-b border-slate-200 space-y-2">
                <div className="flex justify-between items-center select-none">
                    <span className="text-[11px] font-semibold text-slate-700">
                        Transparansi Layer
                    </span>
                    <span className="text-[9px] font-black font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 border border-teal-100">
                        {mapOpacity}%
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={mapOpacity}
                    onChange={(e) => setMapOpacity(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-none appearance-none cursor-pointer accent-teal-600 outline-none"
                />
            </div>
        </div>
    );
}