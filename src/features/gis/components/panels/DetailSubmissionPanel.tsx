import { useMemo } from 'react';
import {
    MapPin, CheckCircle2,
    AlertTriangle, Calculator, Percent, Ruler, RotateCw
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

interface DetailSubmissionPanelProps {
    submissionData: any; // Menerima payload data pengajuan aktif dari orchestrator
}

interface ValidationRow {
    parameter: string;
    hasilSistem: string;
    standarPerda: string;
    status: 'LOLOS' | 'REVISI';
}

export default function DetailSubmissionPanel({ submissionData }: DetailSubmissionPanelProps) {
    const navigate = useNavigate();

    // --- MATRIKS VALIDASI STANDAR DAERAH (KABUPATEN BOGOR) ---
    // Memetakan hasil kalkulasi sistem vs standar perda (Slide 6)
    const validationMatrix = useMemo<ValidationRow[]>(() => {
        if (!submissionData) return [];
        const kdbPercent = submissionData.kdbPercent || 60.5; // Dummy fallback jika data db kosong
        const klbValue = submissionData.klbValue || 3.2;
        const kdhPercent = submissionData.kdhPercent || 12.1;
        const rthArea = submissionData.rthArea || 1500;
        const psuArea = submissionData.psuArea || 500;
        const roadArea = submissionData.roadArea || 250;

        return [
            { parameter: "KDB (Koefisien Dasar Bangunan)", hasilSistem: `${kdbPercent}%`, standarPerda: "Maks 60%", status: kdbPercent <= 60 ? "LOLOS" : "REVISI" },
            { parameter: "KLB (Koefisien Lantai Bangunan)", hasilSistem: String(klbValue), standarPerda: "Maks 3.5", status: klbValue <= 3.5 ? "LOLOS" : "REVISI" },
            { parameter: "KDH (Koefisien Dasar Hijau)", hasilSistem: `${kdhPercent}%`, standarPerda: "Min 10%", status: kdhPercent >= 10 ? "LOLOS" : "REVISI" },
            { parameter: "RTH (Ruang Terbuka Hijau)", hasilSistem: `${rthArea.toLocaleString('id-ID')} m²`, standarPerda: "Min 1.400 m²", status: rthArea >= 1400 ? "LOLOS" : "REVISI" },
            { parameter: "Luas PSU (Fasilitas Umum)", hasilSistem: `${psuArea.toLocaleString('id-ID')} m²`, standarPerda: "Min 400 m²", status: psuArea >= 400 ? "LOLOS" : "REVISI" },
            { parameter: "Luas Jalan & Saluran", hasilSistem: `${roadArea.toLocaleString('id-ID')} m²`, standarPerda: "Min 200 m²", status: roadArea >= 200 ? "LOLOS" : "REVISI" },
        ];
    }, [submissionData]);

    if (!submissionData) {
        return (
            <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                Pilih berkas pengajuan pada peta untuk melihat detail teknis.
            </div>
        );
    }

    // Cek apakah ada parameter yang bertentangan dengan perda (Status Revisi)
    const isRevisionRequired = validationMatrix.some(row => row.status === "REVISI");

    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans text-slate-800">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0 text-left">

                {/* SECTION 1: HEADER SUMMARY BLOCK */}
                <div className="px-4 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-start gap-3 select-none shrink-0">
                    <div className="space-y-1.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Nomor Berkas</span>
                        <span className="font-mono font-bold text-xs text-slate-700 block leading-none">{submissionData.submissionNo}</span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight uppercase mt-2">{submissionData.housingName}</h4>
                    </div>
                    <span className={cn(
                        "rounded-none text-[8px] font-black tracking-widest px-2.5 py-1 uppercase leading-none shrink-0",
                        submissionData.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700' :
                            submissionData.status === 'Ditolak' ? 'bg-rose-50 text-rose-700' :
                                'bg-amber-50 text-amber-700'
                    )}>
                        {submissionData.status}
                    </span>
                </div>

                {/* SECTION 2: ADAPTIVE PERDA COMPLIANCE BANNER */}
                <div className={cn(
                    "px-4 py-3.5 border-b text-[11px] font-semibold leading-relaxed text-left flex items-start gap-2.5",
                    isRevisionRequired
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-teal-700 bg-teal-50 border-teal-200"
                )}>
                    {isRevisionRequired ? (
                        <AlertTriangle className="shrink-0 text-amber-500 mt-0.5" size={14} />
                    ) : (
                        <CheckCircle2 className="shrink-0 text-teal-600 mt-0.5" size={14} />
                    )}
                    <p className="leading-snug">
                        {isRevisionRequired
                            ? "Revisi Diperlukan: Beberapa parameter spasial melebihi ambang batas toleransi Perda Kabupaten Bogor. Developer wajib melakukan penyesuaian tata letak."
                            : "Lolos Kepatuhan: Seluruh parameter koefisien site plan memenuhi batas baku standar Perda Kabupaten Bogor."}
                    </p>
                </div>

                {/* SECTION 3: CORE PARAMETERS CARD GRID */}
                <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 text-left">
                    <div className="bg-white p-4">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none mb-1.5">
                            <Ruler size={10} className="text-slate-400" /> Luas Lahan Pengajuan
                        </span>
                        <span className="text-sm font-black text-slate-800 font-mono leading-none">{submissionData.landArea.toLocaleString('id-ID')} m²</span>
                    </div>
                    <div className="bg-white p-4">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none mb-1.5">
                            <Percent size={10} className="text-slate-400" /> Estimasi Kepadatan
                        </span>
                        <span className="text-sm font-black text-slate-800 font-mono leading-none">60.5% KDB</span>
                    </div>
                </div>

                {/* --- TOMBOL KONSOL 3D CAD/BIM INTERAKTIF (GFW LIGHT NEOMORPHIC STYLE) --- */}
                <div className="px-4 py-3 border-b border-slate-100">
                <button
                    type="button"
                    onClick={() => navigate(`/gis/bim/${submissionData.id}`)}
                    className="w-full h-10 bg-slate-900 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 transition-all cursor-pointer outline-none"
                >
                    <RotateCw size={13} className="animate-spin-slow text-teal-400" />
                    <span>[ KONSOL 3D ] TINJAU SITE PLAN</span>
                </button>
                </div>

                {/* SECTION 4: HIGH-DENSITY PERDA VALIDATION MATRIX (Slide 6) */}
                <div className="text-left">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 leading-none">
                            <Calculator size={12} className="text-slate-500" /> Matriks Validasi Standar Daerah
                        </h4>
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex bg-slate-50 border-b text-[8px] font-black uppercase tracking-wider text-slate-400 py-2 px-4">
                            <div className="flex-1 text-left">Parameter Teknis</div>
                            <div className="w-16 text-right">Sistem</div>
                            <div className="w-16 text-right">Perda</div>
                            <div className="w-16 text-center">Status</div>
                        </div>
                        <div className="divide-y divide-slate-100 bg-white">
                            {validationMatrix.map((row, idx) => (
                                <div key={idx} className="flex items-center text-xs py-2.5 px-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex-1 text-left font-semibold text-slate-700 truncate pr-2" title={row.parameter}>{row.parameter}</div>
                                    <div className="w-16 text-right font-mono font-bold text-slate-800">{row.hasilSistem}</div>
                                    <div className="w-16 text-right font-mono text-slate-400">{row.standarPerda}</div>
                                    <div className="w-16 flex justify-center">
                                        <span className={cn(
                                            "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider leading-none rounded-none",
                                            row.status === "LOLOS"
                                                ? "text-teal-700 bg-teal-50"
                                                : "text-amber-700 bg-amber-50 animate-pulse"
                                        )}>
                                            {row.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


                {/* SECTION 5: FOOTER DATA METADATA */}
                <div className="px-4 py-3.5 space-y-1.5 border-t border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Alamat / Lokasi Administratif</span>
                    <p className="text-xs font-semibold text-slate-500 leading-normal flex items-start gap-1">
                        <MapPin size={11} className="text-slate-400 mt-0.5 shrink-0" />
                        {submissionData.location.address}
                    </p>
                </div>

            </div>
        </div>
    );
}