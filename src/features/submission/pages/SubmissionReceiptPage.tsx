import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Download, ClipboardList, Home, Loader2, AlertCircle } from 'lucide-react';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { API_BASE_URL } from '@/features/submission/services/submission.service';

export default function SubmissionReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: sub, isLoading, isError } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4 font-sans bg-white border border-border p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-slate-500 font-medium">Memuat rincian tanda terima...</p>
      </div>
    );
  }

  if (isError || !sub) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4 font-sans bg-white border border-border p-8 text-center max-w-xl mx-auto">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-lg font-bold text-slate-900">Gagal Memuat Rincian</h2>
        <p className="text-xs text-slate-500">
          Sistem gagal memuat rincian data permohonan. Silakan periksa koneksi jaringan Anda atau hubungi administrator.
        </p>
        <button
          onClick={() => navigate('/pengajuan/daftar')}
          className="inline-flex items-center px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer border-none outline-none"
        >
          KEMBALI KE DAFTAR PENGAJUAN
        </button>
      </div>
    );
  }

  const receiptDownloadUrl = `${API_BASE_URL}/${sub.id}/receipt`;

  // Format tanggal pengajuan
  const formattedDate = sub.submissionDate 
    ? new Date(sub.submissionDate).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans text-slate-700">
      {/* ─── BANNER SUKSES ATAS ─── */}
      <div className="bg-emerald-50 border border-emerald-200 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
        <div className="p-3 bg-emerald-500 text-white rounded-full">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>
        <div className="text-center md:text-left space-y-1.5 flex-1">
          <h1 className="text-xl md:text-2xl font-black text-emerald-950 uppercase tracking-wide">
            Permohonan Berhasil Dikirim!
          </h1>
          <p className="text-xs md:text-sm text-emerald-800 leading-relaxed">
            Berkas permohonan Anda dengan nama perumahan/kegiatan <strong className="text-emerald-950">{sub.housingName}</strong> telah berhasil diterima dan diregistrasi ke dalam basis data dinas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* ─── PANEL KIRI: DETAIL TANDA TERIMA ─── */}
        <div className="md:col-span-3 bg-white border border-border p-6 flex flex-col justify-between shadow-[1px_1px_3px_rgba(0,0,0,0.015)]">
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                Bukti Tanda Terima Registrasi
              </h2>
              <h3 className="text-base font-extrabold text-[#111D13] leading-tight">
                Rincian Informasi Berkas
              </h3>
            </div>

            <div className="border-t border-b border-slate-100 py-4 space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nomor Permohonan</span>
                <span className="text-base font-extrabold text-emerald-600 block tracking-wide">{sub.submissionNo}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kategori</span>
                  <span className="text-xs font-bold text-slate-800 block">{sub.submissionDetails?.category || 'Site Plan'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Luas Lahan</span>
                  <span className="text-xs font-bold text-slate-800 block">{sub.landArea ? `${sub.landArea.toLocaleString('id-ID')} m²` : '-'}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nama Pemohon (Developer)</span>
                <span className="text-xs font-semibold text-slate-800 block">{sub.developerName || sub.applicant?.name || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tanggal Pengajuan</span>
                <span className="text-xs font-semibold text-slate-800 block">{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 space-y-3">
            <a
              href={receiptDownloadUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors rounded-none outline-none border border-emerald-600 cursor-pointer shadow-sm text-center"
            >
              <Download className="h-4 w-4" /> Unduh Tanda Terima (PDF)
            </a>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              * Tanda terima PDF resmi berisi data komparatif, stempel verifikasi sistem, serta panduan monitoring hukum yang valid.
            </p>
          </div>
        </div>

        {/* ─── PANEL KANAN: PANDUAN LANGKAH ─── */}
        <div className="md:col-span-2 bg-[#F8FAF9] border border-border p-6 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                Langkah Pemantauan
              </h2>
              <h3 className="text-base font-extrabold text-[#111D13] leading-tight">
                Panduan Monitoring Berkas
              </h3>
            </div>

            <div className="space-y-5">
              <div className="flex gap-3">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 leading-tight">Buka Daftar Pengajuan</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Masuk ke menu utama di sidebar sebelah kiri dan pilih menu <strong className="text-slate-700">Daftar Pengajuan</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 leading-tight">Cari Berkas Anda</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Gunakan nomor permohonan <strong className="text-slate-700">{sub.submissionNo}</strong> di pencarian untuk menemukan berkas Anda secara cepat.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 leading-tight">Detail Pemantauan</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Klik ikon mata/tombol detail untuk meninjau status alur birokrasi permohonan Anda (Pengecekan Admin, Tim Teknis, Kabid, hingga TTE Kadis).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row gap-3">
            <Link
              to="/pengajuan/daftar"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-extrabold uppercase tracking-wider rounded-none text-center cursor-pointer transition-colors"
            >
              <ClipboardList className="h-3.5 w-3.5" /> DAFTAR BERKAS
            </Link>
            <Link
              to="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-extrabold uppercase tracking-wider rounded-none text-center cursor-pointer transition-colors"
            >
              <Home className="h-3.5 w-3.5" /> DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
