/* STREAMING_CHUNK:Configuring imports and base validation schema interfaces */
import { useMemo, useState, useEffect } from 'react';
import {
    MapPin, CheckCircle2,
    AlertTriangle, Calculator, Percent, Ruler, RotateCw,
    Globe, Crosshair, Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { useSpatialValidator } from '../../hooks/useSpatialValidator';
import { toast } from 'sonner';

interface DetailSubmissionPanelProps {
    submissionData: any; // Menerima payload data pengajuan aktif dari orchestrator
}

interface ValidationRow {
    parameter: string;
    hasilSistem: string;
    standarPerda: string;
    status: 'LOLOS' | 'REVISI';
}

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'Disetujui':
            return 'bg-accent/35 text-[#415D43] border border-accent/70'; // Celadon theme
        case 'Ditolak':
            return 'bg-rose-50 text-rose-700 border border-rose-100'; // Rose theme
        default:
            return 'bg-amber-50 text-amber-800 border border-amber-100'; // Amber theme
    }
};

export default function DetailSubmissionPanel({ submissionData }: DetailSubmissionPanelProps) {
    /* STREAMING_CHUNK:Initializing hooks and clear clash triggers */
    const navigate = useNavigate();
    const { validateRiverBuffer, isProcessing: isChecking } = useSpatialValidator();
    const [auditResult, setAuditResult] = useState<any>(null);

    // Reset hasil audit saat pemohon memilih berkas industri berbeda di peta
    useEffect(() => {
        setAuditResult(null);
        window.dispatchEvent(new Event('map-clear-clash'));
    }, [submissionData?.id]);

    // Cleanup peta saat komponen ditutup
    useEffect(() => {
        return () => {
            window.dispatchEvent(new Event('map-clear-clash'));
        };
    }, []);

    /* STREAMING_CHUNK:Resolving proposed metrics and bylaws dynamically from API */
    const validationMatrix = useMemo<ValidationRow[]>(() => {
        if (!submissionData) return [];

        const tech = submissionData.technical || {};

        // Match proposed inputs with safe ratiometrics computed by the form
        const kdb = tech.kdb !== undefined ? tech.kdb : (submissionData.kdbPercent || 0);
        const klb = tech.klb !== undefined ? tech.klb : (submissionData.klbValue || 0);
        const kdh = tech.kdh !== undefined ? tech.kdh : (submissionData.kdhPercent || 0);
        const gsb = tech.applicantGsb !== undefined ? tech.applicantGsb : 0;
        const rth = tech.applicantRthArea !== undefined ? tech.applicantRthArea : (submissionData.rthArea || 0);

        // Dynamically resolve bylaws bounds with safe system level fallbacks
        const maxKdb = submissionData.bylawMaxKdb !== undefined ? submissionData.bylawMaxKdb : 60.0;
        const maxKlb = submissionData.bylawMaxKlb !== undefined ? submissionData.bylawMaxKlb : 3.5;
        const minKdh = submissionData.bylawMinKdh !== undefined ? submissionData.bylawMinKdh : 10.0;
        const minGsb = submissionData.bylawMinGsb !== undefined ? submissionData.bylawMinGsb : 5.0;
        const minRth = submissionData.bylawMinRthArea !== undefined ? submissionData.bylawMinRthArea : 1400.0;

        return [
            {
                parameter: "KDB (Koefisien Dasar Bangunan)",
                hasilSistem: kdb > 0 ? `${kdb.toFixed(1)}%` : "-",
                standarPerda: `Maks ${maxKdb}%`,
                status: kdb > 0 ? (kdb <= maxKdb ? "LOLOS" : "REVISI") : "REVISI"
            },
            {
                parameter: "KLB (Koefisien Lantai Bangunan)",
                hasilSistem: klb > 0 ? `${klb.toFixed(2)}x` : "-",
                standarPerda: `Maks ${maxKlb}`,
                status: klb > 0 ? (klb <= maxKlb ? "LOLOS" : "REVISI") : "REVISI"
            },
            {
                parameter: "KDH (Koefisien Dasar Hijau)",
                hasilSistem: kdh > 0 ? `${kdh.toFixed(1)}%` : "-",
                standarPerda: `Min ${minKdh}%`,
                status: kdh > 0 ? (kdh >= minKdh ? "LOLOS" : "REVISI") : "REVISI"
            },
            {
                parameter: "GSB (Garis Sempadan Bangunan)",
                hasilSistem: gsb > 0 ? `${gsb} m` : "-",
                standarPerda: `Min ${minGsb} m`,
                status: gsb > 0 ? (gsb >= minGsb ? "LOLOS" : "REVISI") : "REVISI"
            },
            {
                parameter: "RTH (Ruang Terbuka Hijau)",
                hasilSistem: rth > 0 ? `${rth.toLocaleString('id-ID')} m²` : "-",
                standarPerda: `Min ${minRth.toLocaleString('id-ID')} m²`,
                status: rth > 0 ? (rth >= minRth ? "LOLOS" : "REVISI") : "REVISI"
            },
        ];
    }, [submissionData]);

    if (!submissionData) {
        return (
            <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                Pilih berkas pengajuan pada peta untuk melihat detail teknis.
            </div>
        );
    }

    const isRevisionRequired = validationMatrix.some(row => row.status === "REVISI");

    /* STREAMING_CHUNK:Executing spatial validator via Turf.js multi-layer engine */
    const handleRunLiveAudit = async () => {
        if (!submissionData.location?.polygon || submissionData.location.polygon.length === 0) {
            toast.error('Geometri polygon batas lahan tidak ditemukan di berkas.');
            return;
        }

        try {
            const category = submissionData?.submissionDetails?.category || 'PERUMAHAN';
            const result = await validateRiverBuffer(submissionData.location.polygon, category);
            setAuditResult(result);

            if (result.isClashing && result.clashGeometry) {
                // Picu peta utama untuk merender garis clash poligon berwarna merah berkedip [sipas-fe.txt]
                window.dispatchEvent(
                    new CustomEvent('map-render-clash', {
                        detail: {
                            clashGeometry: result.clashGeometry,
                            submissionId: submissionData.id,
                        },
                    })
                );
                toast.error('Audit Spasial: Terdeteksi Pelanggaran!', {
                    description: `Terdeteksi tumpang tindih area non-kompatibel/lindung seluas ${result.clashAreaSqm.toLocaleString('id-ID')} m².`,
                });
            } else {
                window.dispatchEvent(new Event('map-clear-clash'));
                toast.success('Audit Spasial: Lolos Verifikasi!', {
                    description: 'Rencana tapak mematuhi peruntukan tata ruang Kabupaten Bogor.',
                });
            }
        } catch (err) {
            toast.error('Gagal menjalankan komputasi spasial.');
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans text-slate-800">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0 text-left">

                {/* STREAMING_CHUNK:Rendering header summary blocks */}
                <div className="px-4 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-start gap-3 select-none shrink-0">
                    <div className="space-y-1.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Nomor Berkas</span>
                        <span className="font-mono font-bold text-xs text-slate-700 block leading-none">{submissionData.submissionNo}</span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight uppercase mt-2">{submissionData.housingName}</h4>
                    </div>
                    <span className={cn(
                        "rounded-none text-[8px] font-black tracking-widest px-2.5 py-1 uppercase leading-none shrink-0 border",
                        getStatusBadgeClass(submissionData.status)
                    )}>
                        {submissionData.status}
                    </span>
                </div>

                {/* STREAMING_CHUNK:Rendering adaptive compliance warning banner */}
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

                {/* STREAMING_CHUNK:Rendering core parameters metadata card grid */}
                <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 text-left">
                    <div className="bg-white p-4">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none mb-1.5">
                            <Ruler size={10} className="text-slate-400" /> Luas Lahan Pengajuan
                        </span>
                        <span className="text-sm font-black text-slate-800 font-mono leading-none">{submissionData.landArea ? `${submissionData.landArea.toLocaleString('id-ID')} m²` : '-'}</span>
                    </div>
                    <div className="bg-white p-4">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none mb-1.5">
                            <Percent size={10} className="text-slate-400" /> Estimasi Kepadatan
                        </span>
                        <span className="text-sm font-black text-slate-800 font-mono leading-none">60.5% KDB</span>
                    </div>
                </div>

                {/* STREAMING_CHUNK:Rendering live audit checking action boxes */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none">
                            <Globe size={11} className="text-teal-600 shrink-0" /> Deteksi Zonasi Tata Ruang (Live Multi-Layer)
                        </span>
                        {isChecking && <span className="text-[9px] font-bold text-teal-600 animate-pulse">Menghitung...</span>}
                    </div>

                    <button
                        type="button"
                        disabled={isChecking || !submissionData.location?.polygon}
                        onClick={handleRunLiveAudit}
                        className="w-full h-10 bg-teal-50 hover:bg-teal-100 text-teal-700 font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border border-teal-200 transition-all cursor-pointer outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
                    >
                        {isChecking ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        ) : (
                            <Crosshair size={14} />
                        )}
                        <span>JALANKAN AUDIT SPASIAL TURF.JS</span>
                    </button>

                    {/* Skenario Kepatuhan Spasial */}
                    {auditResult && (
                        <div className="space-y-2.5 animate-in fade-in duration-300">
                            {/* Verdict Summary Card */}
                            <div className={cn(
                                "p-3 text-[11px] leading-relaxed border text-left flex items-start gap-2",
                                auditResult.verdict === 'TIDAK_LAYAK' ? "bg-rose-50 text-rose-700 border-rose-200" :
                                    auditResult.verdict === 'PERLU_REVISI' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                        "bg-teal-50 text-teal-700 border-teal-200"
                            )}>
                                <div className="flex-1">
                                    <div className="font-black text-xs uppercase tracking-tight flex items-center gap-1.5 mb-0.5">
                                        <span>ZONING: {auditResult.verdict.replace('_', ' ')}</span>
                                        <span className="text-slate-300">|</span>
                                        <span>SKOR {auditResult.zoningScore}/100</span>
                                    </div>
                                    <p className="text-[10px] font-medium leading-snug">
                                        {auditResult.verdict === 'TIDAK_LAYAK'
                                            ? `Ditemukan pelanggaran kritis pada zona lindung/pertanian seluas ${auditResult.clashAreaSqm.toLocaleString('id-ID')} m².`
                                            : auditResult.verdict === 'PERLU_REVISI'
                                                ? 'Terdapat ketidaksesuaian peruntukan yang membutuhkan perizinan tambahan.'
                                                : 'Lahan memenuhi peruntukan tata ruang Kabupaten Bogor.'}
                                    </p>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="border border-slate-100 divide-y divide-slate-100 bg-white">
                                {auditResult.details.map((detail: any) => {
                                    const hasClash = detail.clashAreaSqm > 0 && detail.severity !== 'info';
                                    const isClean = detail.clashAreaSqm === 0;
                                    return (
                                        <div key={detail.layerId} className="p-2.5 flex items-start justify-between gap-3 text-left">
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                                        hasClash
                                                            ? detail.severity === 'danger' ? "bg-rose-500" : "bg-amber-500"
                                                            : isClean ? "bg-teal-500" : "bg-slate-400"
                                                    )} />
                                                    <h5 className="text-[10px] font-bold text-slate-800 leading-none">{detail.layerName}</h5>
                                                </div>
                                                <p className="text-[9px] text-slate-500 leading-snug">
                                                    {detail.description}
                                                </p>
                                                {detail.zoningNote && (
                                                    <span className="text-[8px] text-slate-400 font-semibold block leading-none mt-0.5">
                                                        ⚖ {detail.zoningNote}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cn(
                                                "px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider rounded-none border leading-none shrink-0 mt-0.5",
                                                hasClash
                                                    ? detail.severity === 'danger' ? "text-rose-700 bg-rose-50 border-rose-200" : "text-amber-700 bg-amber-50 border-amber-200"
                                                    : isClean ? "text-teal-700 bg-teal-50 border-teal-200" : "text-slate-500 bg-slate-50 border-slate-200"
                                            )}>
                                                {hasClash
                                                    ? detail.severity === 'danger' ? 'Melanggar' : 'Perlu Izin'
                                                    : isClean ? 'Bersih' : 'Sesuai'
                                                }
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 border-b border-slate-100 bg-yellow-50 text-yellow-800 text-xs font-semibold uppercase tracking-wider">
                    3D BIM viewer dinonaktifkan sementara. Fitur 3D sedang dalam pengembangan.
                </div>

                {/* STREAMING_CHUNK:Rendering high-density loss parameters comparison ledger */}
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