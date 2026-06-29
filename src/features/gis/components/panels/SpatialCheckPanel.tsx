/**
 * ============================================================================
 * SPATIAL CHECK PANEL [PERFORMANCE-OPTIMIZED v2]
 * ============================================================================
 *
 * OPTIMASI KRITIS yang diimplementasikan:
 *
 * [OPT-DEBOUNCE] Debounce 600ms untuk validateRiverBuffer
 *   Sebelumnya: useEffect memanggil validateRiverBuffer() langsung.
 *   Jika submissionData berubah cepat (polygon sedang diedit di peta),
 *   Turf.js akan berjalan setiap milidetik → browser macet total.
 *
 *   Sesudahnya: Kalkulasi ditunda 600ms setelah perubahan terakhir.
 *   Selama 600ms tersebut, kalkulasi sebelumnya dibatalkan via AbortController-
 *   style cleanup (isMounted flag + clearTimeout). Ini mengurangi beban CPU
 *   dari potensial ratusan kalkulasi → 1 kalkulasi per "selesai edit".
 *
 * [OPT-CANCEL] Cancellable async operation
 *   isMounted flag memastikan result yang datang terlambat (setelah komponen
 *   unmount atau setelah data berubah lagi) tidak memperbarui state.
 *   Mencegah race condition "stale closure" pada async Turf.js.
 *
 * [OPT-STABLE-DEP] Stable dependency pada useEffect
 *   Hanya memantau submissionData.id (string) dan hash koordinat,
 *   bukan reference object polygon (yang bisa berubah setiap render).
 *   Ini mencegah infinite re-computation loop.
 * ============================================================================
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { Loader2, Crosshair, XCircle, CheckCircle2, HelpCircle, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpatialValidator, type SpatialAuditResult } from '../../hooks/useSpatialValidator';
import { toast } from 'sonner';

// ─── Konstanta ─────────────────────────────────────────────────────────────────

/** Waktu tunggu debounce sebelum Turf.js dieksekusi (ms). */
const DEBOUNCE_DELAY_MS = 600;

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Membuat "fingerprint" string dari array koordinat poligon.
 * Digunakan sebagai dependency useEffect yang stabil.
 *
 * Tanpa ini, reference array koordinat baru setiap render (akibat object spread
 * di parent) akan menyebabkan useEffect berjalan terus-menerus walau data sama.
 */
function hashPolygon(polygon: [number, number][] | null | undefined): string {
    if (!polygon || polygon.length === 0) return '';
    // Ambil 3 titik pertama, terakhir, dan tengah sebagai fingerprint cepat
    const idx   = [0, Math.floor(polygon.length / 2), polygon.length - 1];
    return idx.map((i) => `${polygon[i]?.[0].toFixed(6)},${polygon[i]?.[1].toFixed(6)}`).join('|');
}

// ─── Komponen ──────────────────────────────────────────────────────────────────

interface SpatialCheckPanelProps {
    submissionData: any;
}

export default function SpatialCheckPanel({ submissionData }: SpatialCheckPanelProps) {
    const { validateRiverBuffer, isProcessing } = useSpatialValidator();
    const [auditResult, setAuditResult] = useState<SpatialAuditResult | null>(null);

    // Ref ke debounce timer — tetap stabil antar render tanpa menyebabkan re-render
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // [OPT-STABLE-DEP] Hitung fingerprint koordinat agar useEffect stabil
    const polygonHash = useMemo(
        () => hashPolygon(submissionData?.location?.polygon),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [submissionData?.id, submissionData?.location?.polygon]
    );

    useEffect(() => {
        // Guard: hapus timer sebelumnya jika ada (debounce cancel)
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (!submissionData || !submissionData.location?.polygon) {
            setAuditResult(null);
            window.dispatchEvent(new Event('map-clear-clash'));
            return;
        }

        // [OPT-CANCEL] Flag untuk membatalkan hasil stale setelah unmount / re-trigger
        let isMounted = true;

        // [OPT-DEBOUNCE] Tunda eksekusi 600ms — jika submissionData berubah lagi
        // dalam 600ms, timer ini dibatalkan dan tidak ada Turf.js yang berjalan.
        debounceTimer.current = setTimeout(async () => {
            if (!isMounted) return;

            const polygonCoords = submissionData.location.polygon as [number, number][];
            const category = submissionData?.submissionDetails?.category || 'PERUMAHAN';
            const result = await validateRiverBuffer(polygonCoords, category);

            if (!isMounted) return; // Guard lagi setelah await (bisa berlangsung 100-500ms)

            setAuditResult(result);

            if (result.isClashing && result.clashGeometry) {
                window.dispatchEvent(
                    new CustomEvent('map-render-clash', {
                        detail: {
                            clashGeometry: result.clashGeometry,
                            submissionId: submissionData.id,
                        },
                    })
                );
                toast.warning('Deteksi Spasial: Rencana site plan menabrak area lindung/zona terlarang!');
            } else {
                window.dispatchEvent(new Event('map-clear-clash'));
            }
        }, DEBOUNCE_DELAY_MS);

        // Cleanup: batalkan timer dan tandai komponen sebagai unmounted
        return () => {
            isMounted = false;
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
            window.dispatchEvent(new Event('map-clear-clash'));
        };
    // [OPT-STABLE-DEP] Gunakan polygonHash (string) bukan reference object
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submissionData?.id, polygonHash, validateRiverBuffer]);

    // ── Empty State ────────────────────────────────────────────────────────────
    if (!submissionData) {
        return (
            <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                Pilih berkas pengajuan pada peta untuk mengaktifkan audit spasial.
            </div>
        );
    }

    // ── Handler: Sorot area clash di peta ─────────────────────────────────────
    const handleHighlightClash = () => {
        if (!submissionData?.location) return;
        const { lat, lng } = submissionData.location;
        window.dispatchEvent(new CustomEvent('map-fly-to-coords', { detail: { lat, lng } }));
        toast.info('Kamera peta diarahkan ke area benturan spasial.');
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans text-slate-800 rounded-none border-slate-200">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0 text-left">

                {/* ── Verdict Banner ─────────────────────────────────────────── */}
                {isProcessing ? (
                    <div className="px-4 py-4 border-b border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center gap-2.5 select-none">
                        <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                        <span className="text-[11px] font-black uppercase tracking-widest animate-pulse">
                            Menganalisis Zonasi Spasial Multi-Layer...
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
                            <div className="flex-1">
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

                {/* ── Laporan Indikator ──────────────────────────────────────── */}
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
                                Menjalankan audit spasial multi-layer...
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
                                Jalankan analisis untuk memuat indikator spasial.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Keterangan Metode ──────────────────────────────────────── */}
                <div className="px-4 py-3.5 bg-slate-50 border-t border-slate-200 flex items-start gap-2.5 text-left select-none">
                    <HelpCircle className="text-slate-400 shrink-0 mt-0.5" size={14} />
                    <div className="space-y-1">
                        <h5 className="text-[9px] font-black uppercase tracking-widest leading-none text-slate-500">
                            Keterangan Metode Spasial
                        </h5>
                        <p className="text-[9px] font-semibold leading-normal text-slate-400 text-left">
                            Pemeriksaan spasial dijalankan otomatis via point-in-polygon overlay menggunakan
                            data acuan RTRW dan RDTR resmi Kabupaten Bogor tahun 2025 dengan Turf.js murni.
                            Hasil kalkulasi di-debounce 600ms untuk efisiensi CPU.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}