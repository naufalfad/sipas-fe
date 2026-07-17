/**
 * ============================================================================
 * GEOSIPAS PORTAL — Kabid Review & SK Generator Page [SubmissionKabidReviewPage.tsx] (REVISED v3)
 * ============================================================================
 * Peran  : Halaman khusus Kepala Bidang (KABID_PUPR) untuk meninjau berkas PDF
 *          Telaah Staf teknis, membubuhkan paraf visual, dan menerbitkan keputusan
 *          resmi berdasarkan 4 opsi keputusan yang masing-masing menghasilkan
 *          produk hukum berbeda sesuai UU No. 30 Tahun 2014 tentang Administrasi Pemerintahan.
 *
 * Desain : Split-screen layout (60% Preview Dokumen, 40% Panel Otoritas).
 *          4-option radio selector menggantikan toggle mode diskresi.
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
    ArrowLeft, Loader2, FileText,
    CheckCircle2, XCircle, AlertTriangle, Reply, FileSignature, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SignatureCanvasPad } from '@/features/submission/components/SignatureCanvasPad';

// ─── STYLING CONSTANTS (SAGE THEME SHARP STYLE) ────────────────────────────────
const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
const labelClass = "block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider text-left";

// ─── VERDICT OPTION CONFIG ────────────────────────────────────────────────────
type VerdictKey = 'APPROVE' | 'BERSYARAT' | 'REVISI' | 'TOLAK';

interface VerdictOption {
    key: VerdictKey;
    label: string;
    sublabel: string;
    produk: string;
    alur: string;
    colorClass: string;
    borderClass: string;
    bgClass: string;
    icon: React.ReactNode;
    requiresNotes: boolean;
    requiresSignature: boolean;
}

const VERDICT_OPTIONS: VerdictOption[] = [
    {
        key: 'APPROVE',
        label: 'Disetujui',
        sublabel: 'Rencana tapak memenuhi seluruh parameter tata ruang RDTR',
        produk: 'SK Pengesahan Site Plan',
        alur: '→ Diteruskan ke Kadis untuk TTE → Berkas selesai & Disetujui',
        colorClass: 'text-emerald-800',
        borderClass: 'border-emerald-400',
        bgClass: 'bg-emerald-50',
        icon: <CheckCircle2 size={18} className="text-emerald-600" />,
        requiresNotes: false,
        requiresSignature: true,
    },
    {
        key: 'BERSYARAT',
        label: 'Disetujui Bersyarat',
        sublabel: 'Memenuhi parameter utama, namun ada syarat teknis wajib dipenuhi pemohon',
        produk: 'SK Persetujuan Bersyarat + Lampiran Catatan',
        alur: '→ Diteruskan ke Kadis untuk TTE → Berkas selesai dengan kewajiban',
        colorClass: 'text-amber-800',
        borderClass: 'border-amber-400',
        bgClass: 'bg-amber-50',
        icon: <AlertTriangle size={18} className="text-amber-600" />,
        requiresNotes: true,
        requiresSignature: true,
    },
    {
        key: 'REVISI',
        label: 'Perlu Revisi',
        sublabel: 'Berkas dikembalikan ke pemohon untuk diperbaiki tanpa menutup permohonan',
        produk: 'Surat Pemberitahuan Revisi (bukan SK formal)',
        alur: '→ Langsung dikembalikan ke Pemohon untuk revisi, tanpa TTE Kadis',
        colorClass: 'text-orange-800',
        borderClass: 'border-orange-300',
        bgClass: 'bg-orange-50',
        icon: <RotateCcw size={18} className="text-orange-600" />,
        requiresNotes: true,
        requiresSignature: false,
    },
    {
        key: 'TOLAK',
        label: 'Ditolak',
        sublabel: 'Rencana tapak tidak memenuhi persyaratan. Berkas ditutup secara resmi',
        produk: 'SK Penolakan (wajib formal — dasar hukum gugatan PTUN)',
        alur: '→ Diteruskan ke Kadis untuk TTE → Berkas ditutup resmi',
        colorClass: 'text-rose-800',
        borderClass: 'border-rose-400',
        bgClass: 'bg-rose-50',
        icon: <XCircle size={18} className="text-rose-600" />,
        requiresNotes: true,
        requiresSignature: true,
    },
];

export default function SubmissionKabidReviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { user: userProfile } = useAuthStore();
    const activeRole = userProfile?.role || '';
    const effectiveRole = normalizeRole(activeRole);

    // Form states
    const [notes, setNotes] = useState<string>('');
    const [revertNotes, setRevertNotes] = useState<string>(''); // State terpisah untuk pengembalian ke Tim Teknis
    const [signature, setSignature] = useState<string>('');
    const [kabidAgreed, setKabidAgreed] = useState<boolean>(false);
    const [selectedVerdict, setSelectedVerdict] = useState<VerdictKey | null>(null);

    const selectedOption = VERDICT_OPTIONS.find((o) => o.key === selectedVerdict) ?? null;

    // 1. Fetch data permohonan
    const { data: sub, isLoading } = useQuery({
        queryKey: ['submission', id],
        queryFn: () => SubmissionService.getById(id || ''),
        enabled: !!id,
    });

    // Guard: Hanya Kepala Bidang atau Super Admin
    const isAuthorized = effectiveRole === 'Kepala Bidang' || effectiveRole === 'Super Admin';

    // 2. Mutation untuk mutasi status dan SK
    const mutation = useMutation({
        mutationFn: async ({
            actionType,
            kkprVerdictOverride,
        }: {
            actionType: 'APPROVE' | 'REJECT' | 'REVERT_TO_TECHNICAL' | 'OVERRIDE_VERDICT' | 'REVERT_TO_PEMOHON';
            kkprVerdictOverride?: string;
        }) => {
            if (!id) throw new Error('ID Permohonan ilegal.');

            const targetStatus =
                actionType === 'REVERT_TO_PEMOHON'
                    ? 'Ditolak'
                    : actionType === 'REVERT_TO_TECHNICAL'
                    ? 'Verifikasi Teknis'
                    : 'Menunggu Persetujuan';

            return SubmissionService.updateStatus(
                id,
                targetStatus as any,
                `${userProfile?.full_name || userProfile?.username || 'Pimpinan Kabid'} (${activeRole})`,
                notes.trim() || 'Keputusan diterbitkan oleh Kepala Bidang.',
                undefined,
                signature || undefined,
                actionType,
                kkprVerdictOverride
            );
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true }),
                queryClient.invalidateQueries({ queryKey: ['submissions'] })
            ]);
            toast.success('Keputusan Kabid berhasil diterbitkan!', {
                description:
                    selectedVerdict === 'REVISI'
                        ? 'Surat Pemberitahuan Revisi dikirim ke Pemohon.'
                        : 'Draf SK berhasil diteruskan ke meja Kepala Dinas.',
            });
            navigate(`/pengajuan/detail/${id}`);
        },
        onError: (error: Error) => {
            toast.error(`Gagal menyimpan keputusan: ${error.message}`);
        }
    });

    // ─── ACTION HANDLERS ─────────────────────────────────────────────────────

    const handlePublishDecision = () => {
        if (!selectedVerdict || !selectedOption) {
            toast.warning('Pilih jenis keputusan terlebih dahulu.');
            return;
        }
        if (selectedOption.requiresNotes && !notes.trim()) {
            toast.warning('Catatan/alasan keputusan wajib diisi.');
            return;
        }
        if (selectedOption.requiresSignature && !signature) {
            toast.warning('Paraf pimpinan wajib dibubuhkan pada kolom tanda paraf.');
            return;
        }
        if (!kabidAgreed) {
            toast.warning('Pernyataan konfirmasi peninjauan wajib dicentang.');
            return;
        }

        const actionMap: Record<VerdictKey, 'APPROVE' | 'REJECT' | 'OVERRIDE_VERDICT' | 'REVERT_TO_PEMOHON'> = {
            APPROVE: 'APPROVE',
            BERSYARAT: 'OVERRIDE_VERDICT',
            REVISI: 'REVERT_TO_PEMOHON',
            TOLAK: 'REJECT',
        };

        const kkprMap: Partial<Record<VerdictKey, string>> = {
            BERSYARAT: 'Sesuai Bersyarat',
        };

        mutation.mutate({
            actionType: actionMap[selectedVerdict],
            kkprVerdictOverride: kkprMap[selectedVerdict],
        });
    };

    const handleRevertToTechnical = () => {
        if (!revertNotes.trim()) {
            toast.warning('Catatan perbaikan teknis wajib dilampirkan sebelum dikembalikan.');
            return;
        }
        mutation.mutate({ actionType: 'REVERT_TO_TECHNICAL' });
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
        <div className="space-y-6 font-sans text-slate-800 text-left select-none max-w-[1600px] mx-auto">

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
                        PENINJAUAN TELAAH STAF & PENERBITAN KEPUTUSAN KABID
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        Berkas No. <span className="font-bold text-slate-600">{sub.submissionNo}</span> — {sub.developerName}
                    </p>
                </div>
                <div className="border border-amber-300 px-2.5 py-1 text-[9px] font-black bg-amber-50 text-amber-800 tracking-wider uppercase rounded-none">
                    STATUS: {sub.status.toUpperCase()}
                </div>
            </div>

            {/* SPLIT LAYOUT WORKSPACE */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* SISI KIRI (60%): PENINJAU PDF DOKUMEN TELAAH STAF */}
                <div className="lg:w-3/5 flex flex-col border border-slate-300 bg-slate-100">
                    <div className="px-4 py-2.5 bg-slate-200 border-b border-slate-300 flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                            Dokumen Rekomendasi Teknis (Telaah_Staf_{sub.id}.pdf)
                        </span>
                        <a
                            href={`${API_BASE_URL}/docs/Telaah_Staf_${sub.id}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] font-black text-teal-700 hover:underline uppercase"
                        >
                            Buka di Tab Baru ↗
                        </a>
                    </div>
                    <iframe
                        src={`${API_BASE_URL}/docs/Telaah_Staf_${sub.id}.pdf#toolbar=1`}
                        className="w-full border-none bg-slate-100"
                        style={{ height: '80vh', minHeight: '600px' }}
                        title="Pratinjau Telaah Staf PDF"
                    />
                </div>

                {/* SISI KANAN (40%): PANEL OTORITAS KEPUTUSAN KABID */}
                <div className="lg:w-2/5 flex flex-col bg-white border border-slate-300 sticky top-4 self-start">

                    {/* PANEL HEADER */}
                    <div className="px-5 py-4 border-b border-slate-100">
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest block mb-0.5">Kepala Bidang — Hak Keputusan Substantif</span>
                        <h3 className="text-sm font-bold text-slate-900">Pilih Keputusan & Produk Hukum</h3>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Tinjau Telaah Staf dan pilih keputusan yang sesuai. Setiap keputusan menghasilkan produk hukum berbeda.
                        </p>
                    </div>

                    <div className="p-5 space-y-5 flex-1">

                        {/* ─── STEP 1: VERDICT RADIO SELECTOR ─── */}
                        <div className="space-y-2">
                            <span className={labelClass}>Langkah 1 — Pilih Jenis Keputusan</span>
                            <div className="space-y-2">
                                {VERDICT_OPTIONS.map((opt) => {
                                    const isSelected = selectedVerdict === opt.key;
                                    return (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => {
                                                setSelectedVerdict(opt.key);
                                                setSignature('');
                                                setNotes('');
                                                setKabidAgreed(false);
                                            }}
                                            className={cn(
                                                'w-full text-left p-3 border-2 transition-all cursor-pointer rounded-none flex items-start gap-3',
                                                isSelected ? `${opt.borderClass} ${opt.bgClass}` : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                            )}
                                        >
                                            <div className="shrink-0 mt-0.5">{opt.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className={cn('text-xs font-black uppercase tracking-wide', isSelected ? opt.colorClass : 'text-slate-700')}>
                                                    {opt.label}
                                                </div>
                                                <div className="text-[9.5px] text-slate-500 mt-0.5 leading-normal">{opt.sublabel}</div>
                                                <div className={cn(
                                                    'text-[8.5px] font-black uppercase tracking-wider mt-1.5 truncate',
                                                    isSelected ? opt.colorClass : 'text-slate-400'
                                                )}>
                                                    {opt.produk}
                                                </div>
                                                {isSelected && (
                                                    <div className="text-[8.5px] text-slate-500 mt-0.5">{opt.alur}</div>
                                                )}
                                            </div>
                                            <div className={cn(
                                                'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center',
                                                isSelected ? `${opt.borderClass} bg-white` : 'border-slate-300'
                                            )}>
                                                {isSelected && <div className={cn('w-2 h-2 rounded-full', opt.bgClass.replace('bg-', 'bg-').replace('-50', '-500'))} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ─── STEP 2: NOTES & SIGNATURE (Dynamic based on selection) ─── */}
                        {selectedOption && (
                            <div className="space-y-4 border-t border-slate-100 pt-4">
                                <span className={labelClass}>Langkah 2 — Isi Detail Keputusan</span>

                                {/* NOTES FIELD */}
                                <div className="space-y-1">
                                    <label className={cn(labelClass, 'mb-0')}>
                                        {selectedOption.key === 'APPROVE'
                                            ? 'Catatan / Memo Kabid (Opsional)'
                                            : selectedOption.key === 'BERSYARAT'
                                            ? 'Syarat & Ketentuan Wajib (Wajib Diisi)'
                                            : selectedOption.key === 'REVISI'
                                            ? 'Alasan Revisi & Petunjuk Perbaikan (Wajib Diisi)'
                                            : 'Alasan Penolakan (Wajib Diisi — Dasar Hukum PTUN)'}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={
                                            selectedOption.key === 'APPROVE'
                                                ? 'Tulis pesan arahan untuk pimpinan dinas/Kadis (opsional)...'
                                                : selectedOption.key === 'BERSYARAT'
                                                ? 'Tuliskan secara detail kewajiban yang harus dipenuhi pemohon sebelum berkas dinyatakan selesai...'
                                                : selectedOption.key === 'REVISI'
                                                ? 'Tuliskan bagian mana yang harus direvisi pemohon dan apa yang kurang sesuai...'
                                                : 'Tuliskan alasan penolakan secara jelas dan komprehensif karena akan tercantum dalam SK resmi...'
                                        }
                                        className={inputClass}
                                        required={selectedOption.requiresNotes}
                                    />
                                </div>

                                {/* SIGNATURE PAD — hanya untuk keputusan yang butuh TTE */}
                                {selectedOption.requiresSignature && (
                                    <SignatureCanvasPad
                                        value={signature}
                                        onChange={setSignature}
                                        onClear={() => setSignature('')}
                                        placeholder="Goreskan paraf otorisasi pimpinan Kabid"
                                    />
                                )}

                                {/* KONFIRMASI CHECKBOX */}
                                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={kabidAgreed}
                                        onChange={(e) => setKabidAgreed(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 border-slate-300 rounded-none text-primary focus:ring-primary"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-500 leading-normal text-justify">
                                        Saya mengonfirmasi telah meninjau dokumen Telaah Staf teknis secara seksama dan keputusan ini diambil berdasarkan pertimbangan hukum dan teknis yang sah.
                                    </span>
                                </label>

                                {/* MAIN ACTION BUTTON */}
                                <button
                                    type="button"
                                    disabled={mutation.isPending}
                                    onClick={handlePublishDecision}
                                    className={cn(
                                        'w-full py-3 font-black text-xs uppercase tracking-widest rounded-none border-none flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-md text-white',
                                        selectedOption.key === 'APPROVE' ? 'bg-emerald-700 hover:bg-emerald-800' :
                                        selectedOption.key === 'BERSYARAT' ? 'bg-amber-600 hover:bg-amber-700' :
                                        selectedOption.key === 'REVISI' ? 'bg-orange-600 hover:bg-orange-700' :
                                        'bg-rose-700 hover:bg-rose-800'
                                    )}
                                >
                                    {mutation.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <FileSignature className="h-3.5 w-3.5" />
                                    )}
                                    <span>
                                        {selectedOption.key === 'APPROVE' ? 'Setujui & Terbitkan Draf SK' :
                                         selectedOption.key === 'BERSYARAT' ? 'Terbitkan SK Bersyarat' :
                                         selectedOption.key === 'REVISI' ? 'Kirim Surat Revisi ke Pemohon' :
                                         'Terbitkan Rekomendasi SK Penolakan'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ─── SEPARATOR: INTERNAL ACTIONS ─── */}
                    <div className="px-5 pb-5 pt-3 border-t border-slate-200 shrink-0">
                        <span className={cn(labelClass, 'mb-2 block')}>Tindakan Internal</span>
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <label className={cn(labelClass, 'mb-1 text-[9px]')}>Catatan untuk Tim Teknis (Wajib)</label>
                                <textarea
                                    rows={2}
                                    value={revertNotes}
                                    onChange={(e) => setRevertNotes(e.target.value)}
                                    placeholder="Tuliskan catatan spesifik perbaikan untuk Tim Teknis..."
                                    className={cn(inputClass, 'text-[10px]')}
                                />
                            </div>
                            <button
                                type="button"
                                disabled={mutation.isPending}
                                onClick={handleRevertToTechnical}
                                className="w-full py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-all cursor-pointer outline-none"
                            >
                                <Reply size={12} />
                                Kembalikan ke Tim Teknis (Internal)
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}