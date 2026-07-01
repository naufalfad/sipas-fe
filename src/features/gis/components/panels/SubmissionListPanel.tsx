import { useState, useMemo } from "react";
import { Search, ClipboardList, ChevronRight, MapPin } from "lucide-react";
import { useGisUIStore } from "@/app/store/useGisUIStore";
import { mockSubmissions } from "@/mock/submission/submissions";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * SUBMISSION LIST PANEL (TACTICAL DENSITY LIST SHELL)
 * ============================================================================
 * Berkas Baru: Menyajikan laci samping katalog daftar pengajuan developer.
 * Dilengkapi dengan filter pencarian dan filter status berkas [Slide 4].
 * Mengambil data secara asinkron dari data mock terdaftar [sipas-fe.txt].
 */
export default function SubmissionListPanel() {
    const {
        openPanel,
        closePanelsToTheRight,
        selectedCompanyId,
        setSelectedCompanyId
    } = useGisUIStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // Unik status list untuk filter dropdown (Sesuai database SIPAS) [sipas-fe.txt]
    const statusOptions = [
        { value: "ALL", label: "Semua Berkas" },
        { value: "Menunggu Verifikasi", label: "Menunggu Verifikasi" },
        { value: "Verifikasi Administrasi", label: "Verifikasi Admin" },
        { value: "Verifikasi Teknis", label: "Verifikasi Teknis" },
        { value: "Disetujui", label: "Disetujui" },
        { value: "Ditolak", label: "Ditolak" }
    ];

    // Penapisan Gabungan (Pencarian Teks & Status Pengajuan) [sipas-fe.txt]
    const filteredSubmissions = useMemo(() => {
        return mockSubmissions.filter((sub) => {
            const matchesSearch =
                sub.housingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.developerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.submissionNo.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === "ALL" || sub.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter]);

    // Handler interaksi baris pengajuan (Satu Sentuhan Spasial) [limbah-fe-gis-only.txt]
    const handleItemClick = (sub: any) => {
        // 1. Sinkronisasi ID terpilih ke store global
        setSelectedCompanyId(sub.id);

        // 2. Bersihkan laci-laci melayang sebelah kanan
        closePanelsToTheRight(-1);

        // 3. Buka laci detail administrasi proyek
        openPanel("detil-perusahaan", "Detail Industri", sub);

        // [CONTEXT-AWARE DRAWER]:
        // Jika verifikasi teknis atau status bermasalah, otomatis luncurkan laci telemetri spasial (Auto Spatial Checking)
        const isTechnicalPhase = ["Verifikasi Teknis", "Ditolak"].includes(sub.status);
        if (isTechnicalPhase) {
            openPanel("telemetri-lingkungan", "Telemetri Spasial", sub);
        }

        // 4. Picu Event Spasial untuk menerbangkan kamera peta ke koordinat proyek [limbah-fe-gis-only.txt]
        if (sub.location && sub.location.lat && sub.location.lng) {
            window.dispatchEvent(
                new CustomEvent("map-fly-to-coords", {
                    detail: { lat: sub.location.lat, lng: sub.location.lng }
                })
            );
        }
    };

    const getStatusStyle = (status: string) => {
        const styles: Record<string, string> = {
            "Disetujui": "text-emerald-700 bg-emerald-50/50 border-emerald-100",
            "Ditolak": "text-rose-700 bg-rose-50/50 border-rose-100 animate-pulse",
            "Menunggu Verifikasi": "text-blue-700 bg-blue-50/50 border-blue-100",
            "Verifikasi Administrasi": "text-amber-700 bg-amber-50/50 border-amber-100",
            "Verifikasi Teknis": "text-indigo-700 bg-indigo-50/50 border-indigo-100"
        };
        return styles[status] || "text-slate-500 bg-slate-50 border-slate-200";
    };

    return (
        <div className="flex flex-col h-full bg-white pb-12 font-sans text-slate-800">

            {/* --- SEKSI 1: BILAH PENYARING DATA (HIGH DENSITY STICKY BAR) --- */}
            <div className="px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-2.5 select-none">

                {/* Kolom Pencarian Teks */}
                <div className="relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors"
                        size={13}
                    />
                    <input
                        type="text"
                        placeholder="Cari perumahan atau developer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 py-1.5 pl-8 pr-3 text-xs font-normal text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-350 focus:bg-white transition-all rounded-none"
                    />
                </div>

                {/* Dropdown Filter Status */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 w-full px-2.5 bg-slate-50/50 border border-slate-200 text-[11px] font-normal text-slate-600 focus:outline-none focus:bg-white transition-colors cursor-pointer rounded-none"
                >
                    {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* --- SEKSI 2: SEAMLESS DATA FLUSH LIST --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

                {/* Banner Informasional Spasial */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-start gap-2 bg-slate-50/50 select-none">
                    <ClipboardList size={13} className="text-teal-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-normal text-slate-500 leading-normal text-left">
                        Menampilkan {filteredSubmissions.length} berkas pengajuan aktif. Klik baris berkas untuk memfokuskan lokasi perizinan di peta [Slide 8].
                    </p>
                </div>

                {/* List Items */}
                {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((sub) => {
                        const isSelected = selectedCompanyId === sub.id;

                        return (
                            <button
                                key={sub.id}
                                onClick={() => handleItemClick(sub)}
                                className={cn(
                                    "w-full px-5 py-3 border-b border-slate-100 hover:bg-slate-50/60 transition-all text-left outline-none flex items-center justify-between gap-3 min-w-0 rounded-none",
                                    isSelected
                                        ? "bg-teal-50/20 border-l-[3px] border-l-teal-600"
                                        : "bg-white border-l-[3px] border-l-transparent"
                                )}
                            >
                                <div className="flex flex-col gap-0.5 min-w-0 flex-1 text-left">

                                    {/* Badge Status Tipis (Slide 4) */}
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[8.5px] font-bold text-slate-400 uppercase tracking-wide">
                                            {sub.submissionNo}
                                        </span>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-none text-[7.5px] font-black uppercase tracking-widest border leading-none shrink-0 shadow-none",
                                            getStatusStyle(sub.status)
                                        )}>
                                            {sub.status === "Verifikasi Administrasi" ? "Admin" :
                                                sub.status === "Verifikasi Teknis" ? "Teknis" : sub.status}
                                        </span>
                                    </div>

                                    {/* Nama Perumahan (Wrapped / No Clip) */}
                                    <h4 className={cn("text-xs leading-tight mt-1.5 whitespace-normal break-words", isSelected ? "font-bold text-teal-950" : "font-semibold text-slate-800")}>
                                        {sub.housingName}
                                    </h4>

                                    {/* Nama Developer & Ukuran Lahan */}
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">
                                        Oleh: {sub.developerName || '-'} • {sub.landArea ? `${sub.landArea.toLocaleString("id-ID")} m²` : '-'}
                                    </p>

                                    {/* Alamat Singkat Geografis */}
                                    <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 leading-none">
                                        <MapPin size={10} className="shrink-0 text-slate-300" />
                                        <span className="truncate max-w-[210px]">{sub.location?.address || '-'}</span>
                                    </span>

                                </div>

                                <ChevronRight
                                    size={15}
                                    className={cn("shrink-0 transition-transform text-slate-300", isSelected ? "text-teal-600 translate-x-0.5" : "group-hover:text-slate-500 group-hover:translate-x-0.5")}
                                />
                            </button>
                        );
                    })
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-2.5 px-5 select-none flex-1">
                        <div className="w-10 h-10 rounded-none bg-slate-50 flex items-center justify-center text-slate-350 border border-slate-150">
                            <Search size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-700">Berkas tidak ditemukan</p>
                            <p className="text-[10px] text-slate-400 font-medium leading-normal">
                                Ubah kueri pencarian atau pilih filter status berkas yang berbeda.
                            </p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}