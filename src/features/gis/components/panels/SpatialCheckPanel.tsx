/**
 * ============================================================================
 * SPATIAL CHECK PANEL [REACT QUERY INTEGRATED v3]
 * ============================================================================
 * Peran: Menampilkan indikator, visualisasi, dan laporan kepatuhan spasial
 *        multi-layer secara real-time yang ditarik dari PostGIS server [Buku 2 21].
 * 
 * Desain: 1. Menggunakan @tanstack/react-query untuk manajemen status caching,
 *            pemuatan (isLoading), dan pembatalan transaksi spasial stale [sipas-fe.txt].
 *         2. Memetakan response model fisik database (snake_case) ke objek 
 *            logis UI (camelCase) secara lokal (Adapter Pattern) [sipas-fe.txt].
 * ============================================================================
 */

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Crosshair, HelpCircle, ShieldAlert, ShieldCheck, ShieldX, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { SpatialAuditResult } from '../../hooks/useSpatialValidator';
import { toast } from 'sonner';

interface SpatialCheckPanelProps {
    submissionData: any;
}

export default function SpatialCheckPanel({ submissionData }: SpatialCheckPanelProps) {

    // ─── TAHAP 1: DEFINISI STATE REACT QUERY (PostGIS Server-Side Fetcher) ───
    const {
        data: auditData,
        isLoading: isProcessing,
        isError,
        refetch
    } = useQuery({
        // QueryKey diikat ke ID permohonan agar cache terisolasi per berkas [sipas-fe.txt]
        queryKey: ['spatial-audit', submissionData?.id],
        queryFn: () => SubmissionService.getSpatialAudit(submissionData.id),
        enabled: !!submissionData?.id,
        staleTime: 5 * 60 * 1000, // Caching otomatis hasil audit selama 5 menit
        retry: false,
    });

    // ─── TAHAP 2: INTEGRASI ADAPTER PATTERN (snake_case -> camelCase) ───
    const auditResult = useMemo<SpatialAuditResult | null>(() => {
        if (!auditData) return null;

        try {
            return {
                isClashing: auditData.is_clashing,
                clashGeometry: auditData.clash_geometry || null,
                clashAreaSqm: auditData.clash_area_sqm,
                zoningScore: auditData.zoning_score,
                verdict: auditData.verdict as SpatialAuditResult['verdict'],
                details: (auditData.details || []).map((detail: any) => ({
                    layerId: detail.layer_id,
                    layerName: detail.layer_name,
                    clashAreaSqm: detail.clash_area_sqm,
                    description: detail.description,
                    severity: detail.severity as any,
                    zoningNote: detail.zoning_note || undefined
                }))
            };
        } catch (e) {
            console.error("[SpatialCheckPanel] Gagal memetakan model spasial server-side:", e);
            return null;
        }
    }, [auditData]);

    // ─── TAHAP 3: SINKRONISASI VISUALISASI CLASH DI PETA (Event-Driven Map) ───
    useEffect(() => {
        if (!submissionData?.id) return;

        if (auditResult?.isClashing && auditResult?.clashGeometry) {
            // Kirim custom event ke SipasMap untuk menggambar poligon merah transparan [sipas-fe.txt]
            window.dispatchEvent(
                new CustomEvent('map-render-clash', {
                    detail: {
                        clashGeometry: auditResult.clashGeometry,
                        submissionId: submissionData.id,
                    },
                })
            );
            toast.warning('Deteksi Spasial: Rencana site plan menabrak area lindung/zona terlarang!');
        } else {
            window.dispatchEvent(new Event('map-clear-clash'));
        }

        // Cleanup: Bersihkan gambar benturan di peta jika tab panel ditutup
        return () => {
            window.dispatchEvent(new Event('map-clear-clash'));
        };
    }, [auditResult, submissionData?.id]);

    // ── Empty State ──
    if (!submissionData) {
        return (
            <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest leading-normal select-none">
                Pilih berkas pengajuan pada peta untuk mengaktifkan audit spasial.
            </div>
        );
    }

    // ── Handler: Sorot area clash di peta ──
    const handleHighlightClash = () => {
        if (!submissionData?.location) return;
        const { lat, lng } = submissionData.location;
        window.dispatchEvent(new CustomEvent('map-fly-to-coords', { detail: { lat, lng } }));
        toast.info('Kamera peta diarahkan ke area benturan spasial.');
    };

    // ── Handler: Memicu ulang kueri PostGIS secara manual ──
    const handleRunLiveAudit = async () => {
        try {
            await refetch();
            toast.success('Audit spasial server-side berhasil diperbarui!');
        } catch {
            toast.error('Gagal memperbarui kalkulasi spasial.');
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans text-slate-800 rounded-none border-slate-200">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0 text-left">

                {/* ── Tombol Pemicu Audit Manual Terintegrasi ── */}
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleRunLiveAudit}
                        className="w-full h-10 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-black uppercase tracking-widest rounded-none flex items-center justify-center gap-2 transition-all cursor-pointer outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
                    >
                        {isProcessing ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin text-teal-600" />
                        ) : (
                            <RefreshCw className="h-4 w-4 text-teal-600" />
                        )}
                        <span>{isProcessing ? 'MEMPROSES DI POSTGIS...' : 'JALANKAN ULANG AUDIT SPASIAL'}</span>
                    </button>
                </div>

                {/* ── Verdict Banner ── */}
                {isProcessing ? (
                    <div className="px-4 py-4 border-b border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center gap-2.5 select-none">
                        <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                        <span className="text-[11px] font-black uppercase tracking-widest animate-pulse">
                            Menganalisis Zonasi Spasial Multi-Layer...
                        </span>
                    </div>
                ) : isError ? (
                    <div className="px-4 py-4 border-b border-rose-200 bg-rose-50 text-rose-700 flex items-center gap-2 select-none">
                        <ShieldX className="shrink-0 text-rose-600" size={15} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                            Gagal menghubungi PostGIS server.
                        </span>
                    </div>
                ) : auditResult ? (
                    <div className={cn(
                        'border-b px-4 py-3.5 select-none animate-in fade-in duration-300',
                        auditResult.verdict === 'TIDAK_LAYAK' ? 'bg-rose-50 border-rose-200' :
                            auditResult.verdict === 'PERLU_REVISI' ? 'bg-amber-50 border-amber-200' :
                                'bg-teal-50 border-teal-200'
                    )}>
                        <div className="flex items-start gap-2.5 mb-2">
                            {auditResult.verdict === 'TIDAK_LAYAK'
                                ? <ShieldX className="shrink-0 text-rose-600 mt-0.5" size={15} />
                                : auditResult.verdict === 'PERLU_REVISI'
                                    ? <ShieldAlert className="shrink-0 text-amber-600 mt-0.5" size={15} />
                                    : <ShieldCheck className="shrink-0 text-teal-600 mt-0.5" size={15} />}
                            <div className="flex-1 text-left">
                                <p className={cn(
                                    'text-[11px] font-black leading-none mb-1',
                                    auditResult.verdict === 'TIDAK_LAYAK' ? 'text-rose-700' :
                                        auditResult.verdict === 'PERLU_REVISI' ? 'text-amber-700' :
                                            'text-teal-700'
                                )}>
                                    {auditResult.verdict === 'TIDAK_LAYAK'
                                        ? 'TIDAK LAYAK — Pelanggaran Kritis Terdeteksi'
                                        : auditResult.verdict === 'PERLU_REVISI'
                                            ? 'PERLU REVISI — Ada Ketidaksesuaian Zonasi'
                                            : 'LAYAK — Zonasi Mematuhi RTRW/RDTR'}
                                </p>
                                <p className={cn(
                                    'text-[10px] font-medium leading-snug',
                                    auditResult.verdict === 'TIDAK_LAYAK' ? 'text-rose-600' :
                                        auditResult.verdict === 'PERLU_REVISI' ? 'text-amber-600' :
                                            'text-teal-600'
                                )}>
                                    {auditResult.verdict === 'TIDAK_LAYAK'
                                        ? `Benturan spasial ${auditResult.clashAreaSqm.toLocaleString('id-ID')} m² pada zona dilindungi. Berkas wajib direvisi.`
                                        : auditResult.verdict === 'PERLU_REVISI'
                                            ? 'Terdapat ketidaksesuaian peruntukan. Diperlukan kajian dan izin tambahan.'
                                            : 'Seluruh indikator spasial terpenuhi. Lahan sesuai peruntukan tata ruang.'}
                                </p>
                            </div>
                            {/* Skor Kepatuhan */}
                            <div className="flex flex-col items-center gap-0.5 shrink-0">
                                <span className={cn(
                                    'text-[18px] font-black tabular-nums leading-none',
                                    auditResult.zoningScore >= 80 ? 'text-teal-700' :
                                        auditResult.zoningScore >= 50 ? 'text-amber-600' : 'text-rose-700'
                                )}>{auditResult.zoningScore}</span>
                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">SKOR</span>
                            </div>
                        </div>
                        {/* Progress bar skor */}
                        <div className="h-1 w-full bg-white/60 rounded-none overflow-hidden">
                            <div
                                className={cn(
                                    'h-full transition-all duration-700 rounded-none',
                                    auditResult.zoningScore >= 80 ? 'bg-teal-500' :
                                        auditResult.zoningScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                )}
                                style={{ width: `${auditResult.zoningScore}%` }}
                            />
                        </div>
                    </div>
                ) : null}

                {/* ── Laporan Indikator ── */}
                <div className="">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 select-none">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">
                            Laporan Indikator Spasial (Multi-Layer)
                        </h4>
                    </div>
                    <div className="flex flex-col bg-white divide-y divide-slate-100">
                        {isProcessing ? (
                            <div className="px-4 py-6 text-center text-xs text-slate-400">
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2 text-teal-600" />
                                Menghubungi PostGIS server...
                            </div>
                        ) : auditResult?.details && auditResult.details.length > 0 ? (
                            auditResult.details.map((detail) => {
                                const hasClash = detail.clashAreaSqm > 0 && detail.severity !== 'info';
                                const isClean = detail.clashAreaSqm === 0;
                                return (
                                    <div key={detail.layerId} className={cn(
                                        'px-4 py-3 transition-colors flex items-start justify-between gap-3',
                                        hasClash
                                            ? detail.severity === 'danger'
                                                ? 'bg-rose-50/30 border-l-4 border-rose-600'
                                                : 'bg-amber-50/30 border-l-4 border-amber-500'
                                            : isClean
                                                ? 'border-l-4 border-teal-400 hover:bg-teal-50/10'
                                                : 'hover:bg-slate-50/40 border-l-4 border-slate-200'
                                    )}>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <h5 className={cn(
                                                'text-[11px] font-black leading-none',
                                                hasClash
                                                    ? detail.severity === 'danger' ? 'text-rose-700' : 'text-amber-700'
                                                    : isClean ? 'text-teal-700' : 'text-slate-800'
                                            )}>
                                                {detail.layerName}
                                            </h5>
                                            <p className={cn(
                                                'text-[9.5px] leading-snug font-medium text-left',
                                                hasClash
                                                    ? detail.severity === 'danger' ? 'text-rose-600' : 'text-amber-600'
                                                    : isClean ? 'text-teal-600' : 'text-slate-500'
                                            )}>
                                                {detail.description}
                                            </p>
                                            {detail.zoningNote && (
                                                <p className="text-[8.5px] text-slate-400 font-semibold italic leading-tight">
                                                    ⚖ {detail.zoningNote}
                                                </p>
                                            )}
                                            {hasClash && (
                                                <button
                                                    type="button"
                                                    onClick={handleHighlightClash}
                                                    className={cn(
                                                        "inline-flex items-center gap-1 mt-1.5 px-2 py-1 bg-white hover:bg-slate-50 font-black text-[9px] uppercase tracking-widest rounded-none border transition-colors cursor-pointer outline-none",
                                                        detail.severity === 'danger'
                                                            ? 'text-rose-700 border-rose-300'
                                                            : 'text-amber-700 border-amber-300'
                                                    )}
                                                >
                                                    <Crosshair size={10} /> Sorot Area
                                                </button>
                                            )}
                                        </div>
                                        <span className={cn(
                                            'px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider leading-none rounded-none border whitespace-nowrap shrink-0 shadow-none mt-0.5',
                                            hasClash
                                                ? detail.severity === 'danger'
                                                    ? 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse'
                                                    : 'text-amber-700 bg-amber-50 border-amber-300'
                                                : isClean
                                                    ? 'text-teal-700 bg-teal-50 border-teal-300'
                                                    : 'text-slate-500 bg-slate-50 border-slate-200'
                                        )}>
                                            {hasClash
                                                ? detail.severity === 'danger' ? 'MELANGGAR' : 'PERLU IZIN'
                                                : isClean ? 'BERSIH' : 'SESUAI'
                                            }
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-6 text-center text-xs text-slate-400">
                                Pilih pengajuan untuk melihat indikator spasial.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Keterangan Metode ── */}
                <div className="px-4 py-3.5 bg-slate-50 border-t border-slate-200 flex items-start gap-2.5 text-left select-none">
                    <HelpCircle className="text-slate-400 shrink-0 mt-0.5" size={14} />
                    <div className="space-y-1">
                        <h5 className="text-[9px] font-black uppercase tracking-widest leading-none text-slate-500">
                            Keterangan Metode Spasial
                        </h5>
                        <p className="text-[9px] font-semibold leading-normal text-slate-400 text-left">
                            Pemeriksaan spasial dijalankan otomatis via point-in-polygon overlay menggunakan
                            data acuan RTRW dan RDTR resmi Kabupaten Bogor tahun 2025 di database PostGIS tingkat server.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}