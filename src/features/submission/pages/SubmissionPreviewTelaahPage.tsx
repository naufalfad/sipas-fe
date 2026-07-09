import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { API_BASE_URL } from '@/config';
import {
    ArrowLeft, Loader2, Download, FileText,
    Send, ShieldCheck, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SignatureCanvasPad } from '@/features/submission/components/SignatureCanvasPad';

// ─── STYLING CONSTANTS (SAGE THEME SHARP STYLE) ────────────────────────────────
const labelClass = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide";

export default function SubmissionPreviewTelaahPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { user: userProfile } = useAuthStore();
    const activeRole = userProfile?.role || '';
    const effectiveRole = normalizeRole(activeRole);

    const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
    const [signature, setSignature] = useState<string>('');
    const [customRemarks, setCustomRemarks] = useState<string>('');

    // 1. Fetch data detail permohonan yang memuat data evaluasi & draf Telaah Staf
    const { data: sub, isLoading } = useQuery({
        queryKey: ['submission', id],
        queryFn: () => SubmissionService.getById(id || ''),
        enabled: !!id,
    });

    // Guard: Hanya peran verifikator dinas yang diizinkan mengakses halaman pratinjau ini
    const isAuthorized = effectiveRole === 'Tim Teknis' || effectiveRole === 'Super Admin';

    // Konstruksi URL draf berkas PDF fisik yang tersimpan di server
    const pdfDownloadUrl = `${API_BASE_URL}/docs/Telaah_Staf_${id}.pdf`;

    // ─── HANDLER: ENFORCED DOWNLOAD VALIDATION ───────────────────────────────
    const handleDownloadPdf = async () => {
        if (!signature) {
            toast.error('Goreskan tanda tangan terlebih dahulu sebelum mengunduh dokumen.');
            return;
        }
        setIsGeneratingPdf(true);
        try {
            // Simpan draf tanda tangan ke backend terlebih dahulu agar ter-burn ke PDF
            await SubmissionService.updateStatus(
                sub?.id || '',
                'Verifikasi Teknis',
                `${userProfile?.full_name || userProfile?.username || 'Verifikator'} (${activeRole})`,
                customRemarks.trim() || 'Tim Teknis menyimpan draf tanda tangan.',
                undefined,
                signature, // Base64 coretan tanda tangan
                'SAVE_TECHNICAL_MATRIX' // Simpan draf tanpa mengubah status
            );
            setIsDownloaded(true);
            toast.success('Draf PDF bertanda tangan berhasil dibuat! Mengunduh...');
            // Buka file PDF asli secara stateless di tab baru
            window.open(pdfDownloadUrl, '_blank');
        } catch (error: any) {
            toast.error(`Gagal membuat draf bertanda tangan: ${error.message}`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // ─── MUTATION: ADVANCE TO KABID WITH SIGNATURE EMBEDDING ──────────────────
    const mutation = useMutation({
        mutationFn: async () => {
            if (!signature) {
                throw new Error('Tanda tangan coret wajib dibubuhkan.');
            }

            // Memajukan status permohonan ke 'Menunggu Rekomendasi' (Meja Kabid)
            // dan menyertakan Base64 tanda tangan coret Tim Teknis ke backend
            return SubmissionService.updateStatus(
                sub?.id || '',
                'Menunggu Rekomendasi',
                `${userProfile?.full_name || userProfile?.username || 'Verifikator'} (${activeRole})`,
                customRemarks.trim() || 'Tim Teknis telah menyelesaikan lembar Telaah Staf dan mengirimkannya ke Kabid.',
                undefined,
                signature, // Base64 coretan tanda tangan
                'APPROVE'  // Kirim ke level birokrasi di atasnya
            );
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true }),
                queryClient.invalidateQueries({ queryKey: ['submissions'] })
            ]);
            toast.success('Persetujuan Berhasil!', {
                description: 'Tanda tangan telah di-burn ke PDF dan berkas resmi diteruskan ke KABID.',
            });
            navigate(`/pengajuan/detail/${id}`);
        },
        onError: (error: Error) => {
            toast.error(`Gagal mengirim persetujuan: ${error.message}`);
        }
    });

    const handleSendToKabid = () => {
        if (!isDownloaded) {
            toast.warning('Peringatan: Anda wajib mengunduh dan meneliti dokumen PDF terlebih dahulu.');
            return;
        }
        if (!signature) {
            toast.warning('Peringatan: Harap goreskan tanda tangan Anda pada pad yang disediakan.');
            return;
        }
        mutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
                <span className="text-slate-500 font-medium text-xs tracking-wider uppercase">Mempersiapkan Pratinjau Dokumen...</span>
            </div>
        );
    }

    if (!sub || !isAuthorized) {
        return (
            <div className="p-8 text-left bg-white border border-slate-300 max-w-md mx-auto mt-12 rounded-none space-y-4">
                <ShieldCheck className="h-8 w-8 text-rose-600" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Akses Terbuka Ditolak</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Halaman penandatanganan ini bersifat rahasia dan hanya diizinkan untuk peran Tim Teknis yang bersangkutan.</p>
                <button onClick={() => navigate(`/pengajuan/detail/${id}`)} className="text-xs font-bold text-slate-900 underline hover:text-slate-700 bg-transparent border-none cursor-pointer p-0">
                    Kembali ke Detail Permohonan
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans text-left max-w-6xl mx-auto px-4 py-6">

            {/* HEADER PAGE */}
            <div className="border-b border-slate-300 pb-6 space-y-4">
                <Link
                    to={`/pengajuan/verifikasi/${sub.id}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer uppercase tracking-wider p-0 decoration-none"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali ke Lembar Matriks Evaluasi
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3 rounded-none">
                            <FileText className="h-6 w-6 text-slate-800 shrink-0" />
                            PENGESAHAN DRAF TELAAH STAF
                        </h1>
                        <p className="text-xs text-slate-500">
                            Lakukan finalisasi dokumen draf evaluasi untuk permohonan <span className="font-mono font-bold text-slate-800">{sub.submissionNo}</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* WORKSPACE GRID SPLIT 2 COLUMN (Siku Kaku, No Overlap) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                {/* KOLOM KIRI (7 col): PRATINJAU DOKUMEN & ACTION UNDUH */}
                <div className="lg:col-span-7 bg-white border border-slate-300 p-6 flex flex-col justify-between space-y-6 rounded-none">
                    <div className="space-y-4">
                        <div className="border-b border-slate-200 pb-3 select-none">
                            <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest leading-none block mb-1">Generated Output File</span>
                            <h3 className="text-sm font-bold text-slate-900 uppercase">File Hasil Kompilasi Sistem</h3>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed text-justify">
                            Sistem GEOSIPAS secara otomatis telah merender seluruh input 13 matriks, rona foto lapangan, dan data legalitas pemohon ke dalam format dokumen cetak resmi **BAPL / Telaah Staf**.
                        </p>

                        {/* Resume Metadata Box */}
                        <div className="border border-slate-200 p-4 bg-slate-50 divide-y divide-slate-200 space-y-3">
                            <div className="flex justify-between items-center text-xs pb-2">
                                <span className="text-slate-400 font-semibold uppercase text-[10px]">Rekomendasi Kesimpulan</span>
                                <span className="font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 uppercase text-[9px]">
                                    {sub.kkprVerdict || 'Sesuai Bersyarat'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-2">
                                <span className="text-slate-400 font-semibold uppercase text-[10px]">Nama Berkas Output</span>
                                <span className="font-mono font-bold text-slate-800">
                                    Telaah_Staf_{sub.id}.pdf
                                </span>
                            </div>
                        </div>

                        {/* Informational Policy Banner */}
                        <div className="p-4 bg-amber-50/40 border border-amber-200 text-left flex items-start gap-2.5">
                            <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-wide leading-none">Kebijakan Kepatuhan Unduh (Enforced Download)</h5>
                                <p className="text-[9.5px] text-amber-700 leading-relaxed text-justify">
                                    Sesuai asas verifikasi legalitas, Anda diwajibkan untuk mengunduh dan memeriksa isi file PDF di atas secara saksama. Tombol pengiriman berkas ke pimpinan hanya akan terbuka setelah Anda melakukan klik unduh.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tombol Unduh Utama */}
                    {signature ? (
                        <button
                            type="button"
                            disabled={isGeneratingPdf}
                            onClick={handleDownloadPdf}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none cursor-pointer transition-colors shadow-sm"
                        >
                            {isGeneratingPdf ? (
                                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                            ) : (
                                <Download className="h-4.5 w-4.5" />
                            )}
                            <span>{isGeneratingPdf ? "Membakar TTD & Membuat PDF..." : "Unduh & Tinjau Dokumen Telaah Staf (PDF)"}</span>
                        </button>
                    ) : (
                        <div className="p-4 bg-slate-100 border border-slate-300 text-center select-none">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Silakan bubuhkan tanda tangan Anda pada pad di sebelah kanan terlebih dahulu untuk mengunduh dokumen</p>
                        </div>
                    )}
                </div>

                {/* KOLOM KANAN (5 col): PENANDATANGANAN & FINAL ACTION */}
                <div className="lg:col-span-5 bg-white border border-slate-300 p-6 flex flex-col justify-between space-y-6 rounded-none">
                    <div className="space-y-5">
                        <div className="border-b border-slate-200 pb-3 select-none">
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest leading-none block mb-1">Secure Integrity Portal</span>
                            <h3 className="text-sm font-bold text-slate-900 uppercase">Tanda Tangan & Kirim</h3>
                        </div>

                        {/* Input Catatan Pengiriman */}
                        <div className="space-y-1.5 text-left">
                            <label className={labelClass}>Catatan Tambahan untuk Atasan (Opsional)</label>
                            <textarea
                                rows={2}
                                value={customRemarks}
                                onChange={(e) => setCustomRemarks(e.target.value)}
                                placeholder="Tuliskan memo ringkas penunjang untuk KABID..."
                                className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-slate-800 text-xs rounded-none outline-none text-slate-800 font-sans"
                            />
                        </div>

                        {/* Signature Draw Pad */}
                        <SignatureCanvasPad
                            value={signature}
                            onChange={setSignature}
                            onClear={() => setSignature('')}
                            placeholder="Goreskan paraf verifikasi teknis Anda di sini"
                        />
                    </div>

                    {/* Box Action Enforcer */}
                    <div className="space-y-3.5">
                        {/* Status Checklist Warning */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                                "h-2 w-2 rounded-full",
                                isDownloaded ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
                            )} />
                            <span className={cn(
                                "font-bold text-[10px] uppercase tracking-wider",
                                isDownloaded ? "text-emerald-700" : "text-rose-600"
                            )}>
                                {isDownloaded ? "✓ File PDF Telah Ditinjau" : "⚠ Menunggu Download PDF"}
                            </span>
                        </div>

                        {/* Tombol Kirim Ke Kabid */}
                        <button
                            type="button"
                            disabled={!isDownloaded || !signature || mutation.isPending}
                            onClick={handleSendToKabid}
                            className="w-full py-3 bg-slate-900 disabled:bg-slate-200 hover:bg-slate-800 text-white disabled:text-slate-400 font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                                <Send className="h-4 w-4 text-teal-400" />
                            )}
                            <span>Kirim Dokumen ke Kabid</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}