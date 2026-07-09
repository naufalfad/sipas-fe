/**
 * ============================================================================
 * GEOSIPAS PORTAL — Kadis Secure TTE Portal [SubmissionKadisSignPage.tsx]
 * ============================================================================
 * Peran  : Halaman khusus Kepala Dinas (KADIS) untuk meninjau sandingan dual-PDF
 *          (Telaah Staf & Draf SK), verifikasi PIN Passphrase BSrE, membubuhkan
 *          visual signature, dan menerbitkan Surat Keputusan resmi secara hukum.
 * 
 * Desain : Split-screen layout (60% Dual-PDF Viewer Tabs, 40% TTE Action Panel).
 *          Menjaga agar resource Leaflet/WebGL di detail page ter-unload penuh.
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
    ArrowLeft, Loader2, ShieldCheck, Info,
    Reply, XCircle, FileSignature, AlertTriangle, Fingerprint, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SignatureCanvasPad } from '@/features/submission/components/SignatureCanvasPad';

// ─── STYLING CONSTANTS (SAGE THEME SHARP STYLE) ────────────────────────────────
const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide text-left";

export default function SubmissionKadisSignPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { user: userProfile } = useAuthStore();
    const activeRole = userProfile?.role || '';
    const effectiveRole = normalizeRole(activeRole);

    // Form states
    const [notes, setNotes] = useState<string>('');
    const [passphrase, setPassphrase] = useState<string>('');
    const [signature, setSignature] = useState<string>('');
    const [kadisAgreed, setKadisAgreed] = useState<boolean>(false);
    const [showPassphrase, setShowPassphrase] = useState<boolean>(false);

    // Peninjau dual-PDF tab state: 'telaah' | 'sk_draft' [sipas-fe.txt]
    const [activePdfTab, setPdfTab] = useState<'telaah' | 'sk_draft'>('sk_draft');

    // 1. Fetch data detail permohonan menggunakan react-query
    const { data: sub, isLoading } = useQuery({
        queryKey: ['submission', id],
        queryFn: () => SubmissionService.getById(id || ''),
        enabled: !!id,
    });

    // Guard: Hanya peran Kepala Dinas atau Super Admin yang diizinkan memproses TTE BSrE
    const isAuthorized = effectiveRole === 'Kadis' || effectiveRole === 'Super Admin';

    // 2. Mutation untuk mutasi status dan penyematan TTE Kriptografi BSrE asinkron di BE
    const mutation = useMutation({
        mutationFn: async ({
            status,
            actionType,
        }: {
            status: 'Disetujui' | 'Menunggu Rekomendasi' | 'Ditolak';
            actionType: 'APPROVE' | 'REJECT' | 'REVERT_TO_TECHNICAL';
        }) => {
            if (!id) throw new Error('ID Permohonan tidak valid.');

            return SubmissionService.updateStatus(
                id,
                status,
                `${userProfile?.full_name || userProfile?.username || 'Kepala Dinas'} (${activeRole})`,
                notes.trim() || (actionType === 'APPROVE' ? 'SK Pengesahan Site Plan disahkan dan ditandatangani secara elektronik.' : 'Catatan audit direkam.'),
                passphrase || undefined,
                signature || undefined, // Base64 visual signature
                actionType
            );
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true }),
                queryClient.invalidateQueries({ queryKey: ['submissions'] })
            ]);
            toast.success('Persetujuan Sukses & TTE Berhasil!', {
                description: 'Surat Keputusan (SK) resmi terbit dan dapat diunduh oleh Pemohon.',
            });
            navigate(`/pengajuan/detail/${id}`);
        },
        onError: (error: Error) => {
            toast.error(`Kegagalan Proses TTE: ${error.message}`);
        }
    });

    // ─── ACTION HANDLERS ─────────────────────────────────────────────────────

    const handleKadisTTEApprove = () => {
        if (!passphrase) {
            toast.warning('PIN Passphrase TTE BSrE wajib diisi.');
            return;
        }
        if (passphrase.length < 6) {
            toast.warning('Passphrase PIN minimal berjumlah 6 karakter.');
            return;
        }
        if (!signature) {
            toast.warning('Goresan tanda tangan visual wajib dibubuhkan pada canvas pad.');
            return;
        }
        if (!kadisAgreed) {
            toast.warning('Pernyataan tanggung jawab hukum wajib dicentang.');
            return;
        }

        mutation.mutate({
            status: 'Disetujui',
            actionType: 'APPROVE'
        });
    };

    const handleKadisRevertToKabid = () => {
        if (!notes.trim()) {
            toast.warning('Wajib mencantumkan alasan pengembalian draf SK ke Kepala Bidang.');
            return;
        }

        mutation.mutate({
            status: 'Menunggu Rekomendasi',
            actionType: 'REVERT_TO_TECHNICAL' // Sesuai mapping usecase backend untuk internal revert
        });
    };

    const handleKadisReject = () => {
        if (!notes.trim()) {
            toast.warning('Justifikasi hukum penolakan keras draf SK wajib dicantumkan.');
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
                <span className="text-slate-500 font-semibold text-xs tracking-wider uppercase">Mempersiapkan Portal TTE Kadis...</span>
            </div>
        );
    }

    if (!sub || !isAuthorized) {
        return (
            <div className="p-8 text-left bg-white border border-slate-350 max-w-md mx-auto mt-12 rounded-none space-y-4 font-sans text-slate-700">
                <AlertTriangle className="h-8 w-8 text-rose-600" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Akses Terbuka Ditolak</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Anda tidak memiliki kewenangan otorisasi Kepala Dinas yang sah untuk menandatangani Surat Keputusan ini.</p>
                <button onClick={() => navigate(`/pengajuan/detail/${id}`)} className="text-xs font-bold text-slate-900 underline hover:text-slate-700 bg-transparent border-none cursor-pointer p-0">
                    Kembali ke Detail Permohonan
                </button>
            </div>
        );
    }

    // Resolusi URL dokumen aseli di backend
    const telaahStafPdfUrl = `${API_BASE_URL}/docs/Telaah_Staf_${sub.id}.pdf`;
    const draftSkPdfUrl = `${API_BASE_URL}/docs/DRAFT_SK_Pengesahan_Site_Plan_${sub.id}.pdf`;
    const activeIframeSrc = activePdfTab === 'telaah' ? telaahStafPdfUrl : draftSkPdfUrl;

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col font-sans text-slate-800 text-left select-none max-w-[1600px] mx-auto space-y-4">

            {/* TOP PORTAL ACTIONS BAR */}
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
                        <Fingerprint size={18} className="text-primary animate-pulse" />
                        PORTAL PENGESAHAN TTE KRIPTOGRAFIS KEPALA DINAS
                    </h2>
                </div>
                <div className="border border-emerald-300 px-2.5 py-1 text-[9px] font-black bg-emerald-50 text-emerald-800 tracking-wider uppercase rounded-none animate-pulse">
                    FASE: TTE DIGITAL BSRE
                </div>
            </div>

            {/* SPLIT LAYOUT WORKSPACE */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 items-stretch">

                {/* SISI KIRI (60%): DEDICATED PENINJAU DUAL-PDF SANDINGAN */}
                <div className="lg:w-3/5 flex flex-col border border-slate-300 bg-slate-100 min-h-[400px]">

                    {/* DUAL PDF TAB SWITCHER MENU */}
                    <div className="px-4 pt-2.5 bg-slate-200 border-b border-slate-300 flex items-center justify-between shrink-0">
                        <div className="flex gap-1.5 -mb-px">
                            <button
                                type="button"
                                onClick={() => setPdfTab('sk_draft')}
                                className={cn(
                                    "px-4 py-2 text-[10px] font-bold uppercase border-t-2 transition-all rounded-none cursor-pointer outline-none border-b-none",
                                    activePdfTab === 'sk_draft'
                                        ? "bg-white text-slate-950 border-t-teal-600 shadow-sm"
                                        : "bg-slate-300/40 text-slate-500 hover:bg-slate-300/80 border-t-transparent"
                                )}
                            >
                                1. Draf Surat Keputusan (SK)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPdfTab('telaah')}
                                className={cn(
                                    "px-4 py-2 text-[10px] font-bold uppercase border-t-2 transition-all rounded-none cursor-pointer outline-none border-b-none",
                                    activePdfTab === 'telaah'
                                        ? "bg-white text-slate-950 border-t-teal-600 shadow-sm"
                                        : "bg-slate-300/40 text-slate-500 hover:bg-slate-300/80 border-t-transparent"
                                )}
                            >
                                2. Lembar Telaah Staf Teknis
                            </button>
                        </div>
                        <a
                            href={activeIframeSrc}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] font-black text-teal-700 hover:underline uppercase pb-2"
                        >
                            Unduh Dokumen ↗
                        </a>
                    </div>

                    {/* PDF iframe viewport */}
                    <iframe
                        src={`${activeIframeSrc}#toolbar=1`}
                        className="w-full flex-1 border-none bg-slate-100"
                        title="Peninjau Dokumen Spasial PDF"
                    />
                </div>

                {/* SISI KANAN (40%): SECURE FORM TTE BSRE & PAD PENANDATANGANAN */}
                <div className="lg:w-2/5 flex flex-col bg-white border border-slate-300 p-5 overflow-y-auto custom-scrollbar shadow-inner justify-between space-y-6">
                    <div className="space-y-5">

                        {/* Title Section */}
                        <div className="border-b border-slate-200 pb-3">
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">Kadis Cryptographic Engine</span>
                            <h3 className="text-sm font-bold text-slate-900 uppercase">Otorisasi &amp; Sertifikasi Digital</h3>
                        </div>

                        {/* Keamanan & Legalitas BSrE Notice */}
                        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
                            <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h5 className="font-bold uppercase tracking-wider text-[9px] text-emerald-900 leading-none">BSrE BSSN Kriptografi</h5>
                                <p className="text-[9.5px] leading-normal text-emerald-700 text-justify">
                                    Dokumen ini akan di-burn secara permanen dengan visual coretan tanda tangan dan dienkripsi asinkron menggunakan tanda tangan elektronik tersertifikasi resmi dari Balai Sertifikasi Elektronik (BSSN).
                                </p>
                            </div>
                        </div>

                        {/* Input Passphrase PIN Pejabat */}
                        <div className="space-y-1.5 text-left relative">
                            <LabelWithInfo
                                label="Passphrase / PIN TTE Dinas"
                                helpText="PIN TTE personal rahasia Anda yang terdaftar pada sistem BSrE BSSN guna melakukan dekripsi sertifikat tanda tangan."
                            />
                            <div className="relative">
                                <input
                                    type={showPassphrase ? "text" : "password"}
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                    placeholder="Masukkan PIN TTE Dinas Anda..."
                                    className={cn(inputClass, "pr-10 font-bold font-mono tracking-widest")}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassphrase(!showPassphrase)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 bg-transparent border-none outline-none cursor-pointer"
                                >
                                    {showPassphrase ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Input Memo Tambahan */}
                        <div className="space-y-1.5 text-left">
                            <label className={labelClass}>Catatan Opsional SK (Burn to Memo)</label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Catatan opsional yang akan disematkan ke dalam metadata sertifikat biner..."
                                className={inputClass}
                            />
                        </div>

                        {/* Signature Canvas Pad */}
                        <SignatureCanvasPad
                            value={signature}
                            onChange={setSignature}
                            onClear={() => setSignature('')}
                            placeholder="Goreskan coretan tanda tangan Kadis"
                        />

                        {/* Concurrence Checkbox */}
                        <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={kadisAgreed}
                                onChange={(e) => setKadisAgreed(e.target.checked)}
                                className="mt-0.5 h-4.5 w-4.5 border-slate-350 rounded-none text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-[10px] font-semibold text-slate-500 leading-normal text-justify">
                                Saya memvalidasi kebenaran spasial rencana tapak ini, telah meneliti draf Surat Keputusan yang dilampirkan, dan bersedia menyematkan tanda tangan kriptografis legal saya pada lembar persetujuan akhir.
                            </span>
                        </label>

                        {/* Primary Secure Action Approve Button */}
                        <button
                            type="button"
                            disabled={mutation.isPending || !kadisAgreed || !signature || !passphrase}
                            onClick={handleKadisTTEApprove}
                            className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    <span>Menghubungkan &amp; Mengenkripsi via BSrE...</span>
                                </>
                            ) : (
                                <>
                                    <FileSignature className="h-4 w-4 text-emerald-400" />
                                    <span>Sahkan SK &amp; Bubuhkan TTE BSrE</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* INTERN REVERT & REJECT BOTTOM ROW (Kadis) */}
                    <div className="border-t border-slate-100 pt-4 shrink-0 select-none">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                disabled={mutation.isPending}
                                onClick={handleKadisRevertToKabid}
                                className="py-1.5 border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center gap-1 transition-all cursor-pointer outline-none"
                                title="Kembalikan Draf SK ke Kepala Bidang"
                            >
                                <Reply size={12} /> Revert ke Kabid
                            </button>
                            <button
                                type="button"
                                disabled={mutation.isPending}
                                onClick={handleKadisReject}
                                className="py-1.5 border border-rose-300 bg-rose-50/50 hover:bg-rose-100 text-rose-700 font-bold text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center gap-1 transition-all cursor-pointer outline-none"
                                title="Tolak Draf SK secara Mutlak (Terminal Ditolak)"
                            >
                                <XCircle size={12} /> Tolak SK
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

// Helper Label component identical to submissions flow for consistency [sipas-fe.txt]
const LabelWithInfo = ({ label, helpText }: { label: string; helpText?: string }) => {
    return (
        <label className={labelClass}>
            {label}
            {helpText && (
                <span className="relative group inline-block ml-1.5 align-middle select-none normal-case tracking-normal">
                    <span className="cursor-pointer text-slate-400 hover:text-primary transition-colors">
                        <Info size={12} className="inline-block" />
                    </span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block w-[240px] bg-slate-900 text-white text-[9px] font-bold p-2.5 pointer-events-none z-50 rounded-none shadow-md border border-slate-700 leading-normal text-left">
                        {helpText}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                    </span>
                </span>
            )}
        </label>
    );
};