/**
 * ============================================================================
 * GEOSIPAS PORTAL — Kabid Review & SK Generator Page [SubmissionKabidReviewPage.tsx] (REVISED v2)
 * ============================================================================
 * Peran  : Halaman khusus Kepala Bidang (KABID_PUPR) untuk meninjau berkas PDF
 *          Telaah Staf teknis, membubuhkan paraf visual, merakit dictums, serta
 *          mengompilasi draf Surat Keputusan (SkDraft) ke database.
 * 
 * Desain : Split-screen layout (60% Preview Dokumen, 40% Panel Otoritas).
 *          Menjunjung tinggi prinsip High Cohesion & Segregation of Duties.
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { API_BASE_URL } from '@/config';
import {
    ArrowLeft, Loader2, FileText, Info,
    Reply, XCircle, FileSignature, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SignatureCanvasPad } from '@/features/submission/components/SignatureCanvasPad';

// ─── STYLING CONSTANTS (SAGE THEME SHARP STYLE) ────────────────────────────────
const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide text-left";

export default function SubmissionKabidReviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { user: userProfile } = useAuthStore();
    const activeRole = userProfile?.role || '';
    const effectiveRole = normalizeRole(activeRole);

    // Form states
    const [notes, setNotes] = useState<string>('');
    const [signature, setSignature] = useState<string>('');
    const [kabidAgreed, setKabidAgreed] = useState<boolean>(false);

    // Veto Override Form States (Fase 3 Diskresi Hukum Kabid)
    const [isVetoModeActive, setIsVetoModeActive] = useState<boolean>(false);
    const [vetoVerdict, setVetoVerdict] = useState<string>('Sesuai');

    // 1. Fetch data detail permohonan menggunakan react-query
    const { data: sub, isLoading } = useQuery({
        queryKey: ['submission', id],
        queryFn: () => SubmissionService.getById(id || ''),
        enabled: !!id,
    });

    // Guard: Hanya peran Kepala Bidang atau Super Admin yang diizinkan memproses draf SK
    const isAuthorized = effectiveRole === 'Kepala Bidang' || effectiveRole === 'Super Admin';

    // 2. Mutation untuk mutasi status dan penyuntingan draf SK secara asinkron di BE
    const mutation = useMutation({
        mutationFn: async ({
            status,
            actionType,
            kkprVerdictOverride
        }: {
            status: 'Menunggu Persetujuan' | 'Verifikasi Teknis' | 'Ditolak';
            actionType: 'APPROVE' | 'REJECT' | 'REVERT_TO_TECHNICAL' | 'OVERRIDE_VERDICT';
            kkprVerdictOverride?: string;
        }) => {
            if (!id) throw new Error('ID Permohonan ilegal.');

            return SubmissionService.updateStatus(
                id,
                status,
                `${userProfile?.full_name || userProfile?.username || 'Pimpinan Kabid'} (${activeRole})`,
                notes.trim() || (actionType === 'APPROVE' ? 'Dokumen Telaah Staf disetujui Kabid.' : 'Catatan audit direkam.'),
                undefined,
                signature || undefined, // Base64 coretan tangan pimpinan
                actionType,
                kkprVerdictOverride
            );
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true }),
                queryClient.invalidateQueries({ queryKey: ['submissions'] })
            ]);
            toast.success('Mutasi keputusan dinas berhasil disahkan!', {
                description: 'Draf SK berhasil diterbitkan dan diteruskan ke Kepala Dinas.',
            });
            navigate(`/pengajuan/detail/${id}`);
        },
        onError: (error: Error) => {
            toast.error(`Gagal menyimpan keputusan: ${error.message}`);
        }
    });

    // ─── ACTION HANDLERS ─────────────────────────────────────────────────────

    // REVISI COMPILATION: handleStandardEndorse tidak membutuhkan parameter biner approved
    const handleStandardEndorse = () => {
        if (!kabidAgreed) {
            toast.warning('Pernyataan konfirmasi peninjauan wajib dicentang.');
            return;
        }
        if (!signature) {
            toast.warning('Paraf pimpinan wajib dibubuhkan pada canvas drawer.');
            return;
        }

        mutation.mutate({
            status: 'Menunggu Persetujuan',
            actionType: 'APPROVE'
        });
    };

    const handleVetoOverride = () => {
        if (!notes.trim()) {
            toast.warning('Justifikasi dan alasan diskresi wajib diisi sebagai dasar legalitas penyesuaian.');
            return;
        }
        if (!signature) {
            toast.warning('Paraf pimpinan wajib dibubuhkan untuk mengesahkan penyesuaian keputusan.');
            return;
        }

        mutation.mutate({
            status: 'Menunggu Persetujuan',
            actionType: 'OVERRIDE_VERDICT',
            kkprVerdictOverride: vetoVerdict
        });
    };

    const handleRevertToTechnical = () => {
        if (!notes.trim()) {
            toast.warning('Catatan perbaikan teknis wajib dilampirkan sebelum dikembalikan.');
            return;
        }

        mutation.mutate({
            status: 'Verifikasi Teknis',
            actionType: 'REVERT_TO_TECHNICAL'
        });
    };

    const handleReject = () => {
        if (!notes.trim()) {
            toast.warning('Alasan penolakan berkas wajib diisi.');
            return;
        }

        mutation.mutate({
            status: 'Ditolak',
            actionType: 'REJECT'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
                <span className="text-slate-500 font-semibold text-xs tracking-wider uppercase">Mempersiapkan Portal Peninjauan Kabid...</span>
            </div>
        );
    }

    if (!sub || !isAuthorized) {
        return (
            <div className="p-8 text-left bg-white border border-slate-350 max-w-md mx-auto mt-12 rounded-none space-y-4 font-sans text-slate-700">
                <AlertTriangle className="h-8 w-8 text-rose-600" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Akses Ditolak</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Anda tidak memiliki kredensial otorisasi Kepala Bidang PUPR yang sah untuk mengakses dokumen draf keputusan ini.</p>
                <button onClick={() => navigate(`/pengajuan/detail/${id}`)} className="text-xs font-bold text-slate-900 underline hover:text-slate-700 bg-transparent border-none cursor-pointer p-0">
                    Kembali ke Detail Permohonan
                </button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col font-sans text-slate-800 text-left select-none max-w-[1600px] mx-auto space-y-4">

            {/* TOP ACTIONS BAR */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate(`/pengajuan/detail/${sub.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer uppercase tracking-wider p-0 decoration-none"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Detail
                    </button>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mt-1">
                        <FileText size={16} className="text-primary" />
                        PENINJAUAN TELAAH STAF & PENERBITAN DRAF SK
                    </h2>
                </div>
                <div className="border border-amber-300 px-2.5 py-1 text-[9px] font-black bg-amber-50 text-amber-800 tracking-wider uppercase rounded-none">
                    STATUS: {sub.status.toUpperCase()}
                </div>
            </div>

            {/* SPLIT LAYOUT WORKSPACE */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 items-stretch">

                {/* SISI KIRI (60%): PENINJAU PDF DOKUMEN TELAAH STAF */}
                <div className="lg:w-3/5 flex flex-col border border-slate-300 bg-slate-100 min-h-[400px]">
                    <div className="px-4 py-2.5 bg-slate-200 border-b border-slate-300 flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                            File Rekomendasi Teknis (Telaah_Staf_{sub.id}.pdf)
                        </span>
                        <a
                            href={`${API_BASE_URL}/docs/Telaah_Staf_{sub.id}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] font-black text-teal-700 hover:underline uppercase"
                        >
                            Buka di Tab Baru ↗
                        </a>
                    </div>
                    <iframe
                        src={`${API_BASE_URL}/docs/Telaah_Staf_${sub.id}.pdf#toolbar=1`}
                        className="w-full flex-1 border-none bg-slate-100"
                        title="Pratinjau Telaah Staf PDF"
                    />
                </div>

                {/* SISI KANAN (40%): PANEL OTORITAS VERIFIKATOR KABID */}
                <div className="lg:w-2/5 flex flex-col bg-white border border-slate-300 p-5 overflow-y-auto custom-scrollbar shadow-inner justify-between space-y-6">
                    <div className="space-y-5">

                        {/* Title Section */}
                        <div className="border-b border-slate-200 pb-3">
                            <span className="text-[8px] font-black text-[#709775] uppercase tracking-widest block mb-0.5">Kabid Otoritas &amp; Diskresi</span>
                            <h3 className="text-sm font-bold text-slate-900 uppercase">Otorisasi &amp; Penyesuaian Rekomendasi</h3>
                        </div>

                        {/* SOP Info Alert */}
                        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 flex items-start gap-2.5 text-xs">
                            <Info size={16} className="text-teal-700 shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-relaxed text-justify">
                                Sesuai Perbup Bogor No. 4 Tahun 2025, Kepala Bidang memegang hak otorisasi peninjauan teknis. Anda dapat langsung mengesahkan Telaah Staf untuk men-generate draf Surat Keputusan (SK) bagi Kepala Dinas, atau menggunakan wewenang **Diskresi Penyesuaian Rekomendasi** jika diperlukan.
                            </p>
                        </div>

                        {/* Hak Veto Toggle Switch */}
                        <div className="flex justify-between items-center py-2 border-y border-slate-100 bg-slate-50/50 px-3">
                            <div className="text-left">
                                <span className="text-xs font-bold text-slate-800 block">Gunakan Wewenang Diskresi</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">Sesuaikan rekomendasi Tim Teknis berdasarkan pertimbangan khusus</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsVetoModeActive(!isVetoModeActive);
                                    setSignature('');
                                }}
                                className={cn(
                                    "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-slate-500",
                                    isVetoModeActive ? "bg-amber-500" : "bg-slate-200"
                                )}
                            >
                                <span className={cn(
                                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
                                    isVetoModeActive ? "translate-x-5" : "translate-x-0"
                                )} />
                            </button>
                        </div>

                        {/* VETO/OVERRIDE INTERFACE */}
                        {isVetoModeActive ? (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="space-y-1.5">
                                    <label className={labelClass}>Penyesuaian Keputusan Akhir</label>
                                    <select
                                        value={vetoVerdict}
                                        onChange={(e) => setVetoVerdict(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-350 text-xs font-bold text-slate-800 rounded-none outline-none focus:border-slate-800"
                                    >
                                        <option value="Sesuai">Sesuai (Dapat Disetujui)</option>
                                        <option value="Sesuai Bersyarat">Sesuai Bersyarat (Ketentuan Khusus)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5 text-left">
                                    <label className={labelClass}>Justifikasi &amp; Alasan Diskresi</label>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Tuliskan pertimbangan atau alasan khusus mengapa rekomendasi disesuaikan..."
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <SignatureCanvasPad
                                    value={signature}
                                    onChange={setSignature}
                                    onClear={() => setSignature('')}
                                    placeholder="Goreskan paraf otorisasi pimpinan"
                                />

                                <button
                                    type="button"
                                    disabled={mutation.isPending || !notes.trim() || !signature}
                                    onClick={handleVetoOverride}
                                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-widest rounded-none border-none transition-colors cursor-pointer disabled:opacity-50 shadow-md"
                                >
                                    Terapkan Penyesuaian Kabid
                                </button>
                            </div>
                        ) : (
                            /* STANDARD ENDORSEMENT INTERFACE */
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="space-y-1.5 text-left">
                                    <label className={labelClass}>Catatan Tambahan / Memo Kabid</label>
                                    <textarea
                                        rows={2}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Tulis pesan arahan draf SK untuk pimpinan dinas/Kadis..."
                                        className={inputClass}
                                    />
                                </div>

                                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={kabidAgreed}
                                        onChange={(e) => setKabidAgreed(e.target.checked)}
                                        className="mt-0.5 h-4.5 w-4.5 border-slate-300 rounded-none text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-500 leading-normal text-justify">
                                        Saya mengonfirmasi bahwa seluruh rincian metrik sandingan pada dokumen Telaah Staf telah diperiksa and layak diteruskan ke tahap draf Surat Keputusan (SK).
                                    </span>
                                </label>

                                <SignatureCanvasPad
                                    value={signature}
                                    onChange={setSignature}
                                    onClear={() => setSignature('')}
                                    placeholder="Goreskan paraf ulasan pimpinan"
                                />

                                {/* Primary Confirm Action */}
                                <button
                                    type="button"
                                    disabled={mutation.isPending || !kabidAgreed || !signature}
                                    onClick={handleStandardEndorse} // PERBAIKAN TS2554: Memanggil handler standard endorse murni tanpa argumen
                                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-colors cursor-pointer disabled:opacity-50 shadow-md"
                                >
                                    {mutation.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <FileSignature className="h-3.5 w-3.5 text-teal-400" />
                                    )}
                                    <span>Setujui &amp; Terbitkan Draf SK</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* INTERN REVERT & REJECT BOTTOM ROW (Only visible if veto isn't forced or for normal routing) */}
                    <div className="border-t border-slate-100 pt-4 space-y-2.5 shrink-0 select-none">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                disabled={mutation.isPending}
                                onClick={handleRevertToTechnical}
                                className="py-1.5 border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center gap-1 transition-all cursor-pointer outline-none"
                                title="Kembalikan Berkas ke Tim Teknis secara Internal"
                            >
                                <Reply size={12} /> Revert ke Teknis
                            </button>
                            <button
                                type="button"
                                disabled={mutation.isPending}
                                onClick={handleReject}
                                className="py-1.5 border border-rose-300 bg-rose-50/50 hover:bg-rose-100 text-rose-700 font-bold text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center gap-1 transition-all cursor-pointer outline-none"
                                title="Tolak Berkas Pengajuan secara Mutlak (Kembalikan ke Developer)"
                            >
                                <XCircle size={12} /> Tolak Berkas
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}