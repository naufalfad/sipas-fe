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
import { Loader2, Crosshair, XCircle, CheckCircle2, HelpCircle } from 'lucide-react';
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
            const result = await validateRiverBuffer(polygonCoords);

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
                toast.warning('Deteksi Spasial: Rencana site plan menabrak sempadan sungai!');
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
        toast.info('Kamera peta diarahkan ke area pelanggaran sempadan.');
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans text-slate-800 rounded-none border-slate-200">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5 text-left">

                {/* ── Status Banner ──────────────────────────────────────────── */}
                {isProcessing ? (
                    <div className="p-4 border border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center gap-2.5 rounded-none shadow-none select-none">
                        <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                        <span className="text-[11px] font-black uppercase tracking-widest animate-pulse">
                            Menghitung Geometri Sungai...
                        </span>
                    </div>
                ) : auditResult?.isClashing ? (
                    <div className="p-4 border text-[11px] font-semibold leading-relaxed text-justify rounded-none flex items-start gap-2.5 shadow-none select-none animate-in fade-in duration-300 text-rose-700 bg-rose-50 border-rose-200">
                        <XCircle className="shrink-0 text-rose-600 mt-0.5" size={14} />
                        <p className="leading-snug">
                            Pelanggaran Spasial Terdeteksi! Ditemukan benturan kritis pada sempadan sungai seluas{' '}
                            <b>{auditResult.clashAreaSqm.toLocaleString('id-ID')} m²</b>. Berkas tidak dapat disetujui.
                        </p>
                    </div>
                ) : (
                    <div className="p-4 border text-[11px] font-semibold leading-relaxed text-justify rounded-none flex items-start gap-2.5 shadow-none select-none animate-in fade-in duration-300 text-teal-700 bg-teal-50 border-teal-200">
                        <CheckCircle2 className="shrink-0 text-teal-600 mt-0.5" size={14} />
                        <p className="leading-snug">
                            Hasil Verifikasi Spasial: Lahan bersih dari benturan spasial. Rencana mematuhi batas wilayah.
                        </p>
                    </div>
                )}

                {/* ── Laporan Indikator ──────────────────────────────────────── */}
                <div className="space-y-3">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 leading-none select-none">
                        Laporan Indikator Spasial
                    </h4>
                    <div className="flex flex-col border border-slate-200 rounded-none bg-white divide-y divide-slate-100 shadow-sm">
                        <div className={cn(
                            'p-3.5 transition-colors flex items-start justify-between gap-4',
                            !isProcessing && auditResult?.isClashing
                                ? 'bg-rose-50/30 border-rose-200 border-2 animate-pulse'
                                : 'hover:bg-slate-50/40'
                        )}>
                            <div className="space-y-1.5 min-w-0 flex-1">
                                <h5 className={cn(
                                    'text-[11px] font-black leading-none',
                                    !isProcessing && auditResult?.isClashing ? 'text-rose-700' : 'text-slate-800'
                                )}>
                                    Cek Sempadan Sungai 25m
                                </h5>
                                <p className={cn(
                                    'text-[10px] leading-snug font-medium text-justify',
                                    !isProcessing && auditResult?.isClashing ? 'text-rose-700' : 'text-slate-500'
                                )}>
                                    {isProcessing
                                        ? 'Menghitung validasi jarak 25 meter dari sungai terdekat...'
                                        : auditResult?.isClashing
                                            ? `Melanggar: Batas kavling memotong area sempadan sungai 25m seluas ${auditResult.clashAreaSqm.toLocaleString('id-ID')} m²!`
                                            : 'Lolos: Batas kavling bersih dari zona sempadan sungai 25 meter.'
                                    }
                                </p>
                                {!isProcessing && auditResult?.isClashing && (
                                    <button
                                        type="button"
                                        onClick={handleHighlightClash}
                                        className="inline-flex items-center gap-1 mt-2 px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-black text-[9px] uppercase tracking-widest rounded-none border border-rose-300 transition-colors cursor-pointer outline-none"
                                    >
                                        <Crosshair size={10} /> Sorot Area Pelanggaran
                                    </button>
                                )}
                            </div>
                            <span className={cn(
                                'px-2 py-0.5 text-[8px] font-black uppercase tracking-wider leading-none rounded-none border whitespace-nowrap shrink-0 shadow-none',
                                isProcessing
                                    ? 'text-slate-500 bg-slate-50 border-slate-200'
                                    : auditResult?.isClashing
                                        ? 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse font-black'
                                        : 'text-teal-700 bg-teal-50 border-teal-200'
                            )}>
                                {isProcessing ? 'Memuat...' : auditResult?.isClashing ? 'MELANGGAR' : 'Aman'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Keterangan Metode ──────────────────────────────────────── */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-none flex items-start gap-2.5 text-left select-none">
                    <HelpCircle className="text-slate-400 shrink-0 mt-0.5" size={14} />
                    <div className="space-y-1">
                        <h5 className="text-[9px] font-black uppercase tracking-widest leading-none text-slate-500">
                            Keterangan Metode Spasial
                        </h5>
                        <p className="text-[9px] font-semibold leading-normal text-slate-400 text-justify">
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