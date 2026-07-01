import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { Submission } from '@/features/submission/types';
import {
  ShieldCheck, FileText, Map, AlertTriangle, Eye
} from 'lucide-react';

export default function VerificationPage() {
  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: SubmissionService.getAll,
  });

  // Ambil data antrean pengajuan yang saat ini berada dalam tahapan evaluasi/verifikasi dinas
  const verificationQueue = useMemo(() =>
    submissions.filter((s) =>
      ['Menunggu Verifikasi', 'Verifikasi Administrasi', 'Verifikasi Teknis', 'Menunggu Persetujuan'].includes(s.status)
    ),
    [submissions]
  );

  // Resolusi warna status badge sesuai standardisasi sistem organik baru (Celadon & Amber Pastel)
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Verifikasi Teknis':
        return 'bg-[#e8f2ea] text-[#415D43] border border-[#A1CCA5]/60'; // Celadon theme
      case 'Verifikasi Administrasi':
        return 'bg-amber-50 text-amber-800 border border-amber-100'; // Amber theme
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200'; // Neutral theme
    }
  };

  return (
    <div className="space-y-6 font-sans">

      {/* ─── SEKSI 1: HEADER HALAMAN ─── */}
      <div className="text-left">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Evaluasi & Verifikasi Berkas
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Kelola pemeriksaan dokumen administratif (Admin SIPAS) dan audit kesesuaian spasial CAD/GIS (Tim Teknis).
        </p>
      </div>

      {/* ─── SEKSI 2: GRID SPLIT WORKSPACE (COMPACT HIGH-DENSITY) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Tabel Antrean Verifikasi Aktif */}
        <div className="lg:col-span-2 bg-white border border-border p-5 space-y-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Antrean Verifikasi Dokumen</h3>
              <p className="text-[10px] text-slate-400 mt-1">Daftar pengajuan rencana tapak yang memerlukan tinjauan keabsahan regulasi.</p>
            </div>
            <span className="text-[10px] font-bold text-primary bg-secondary px-2 py-0.5 border border-border">
              {verificationQueue.length} Berkas Menunggu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                  <th className="px-4 py-3">No. Berkas</th>
                  <th className="px-4 py-3">Rencana Tapak / Developer</th>
                  <th className="px-4 py-3">Tahap Evaluasi</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {verificationQueue.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Nomor Pengajuan */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-[#111D13]">{sub.submissionNo}</span>
                    </td>

                    {/* Nama Rencana Tapak */}
                    <td className="px-4 py-3.5 text-left">
                      <div>
                        <div className="font-semibold text-slate-800">{sub.housingName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{sub.developerName}</div>
                      </div>
                    </td>

                    {/* Status Tahapan Verifikasi */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-semibold border ${getStatusBadgeClass(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>

                    {/* Tombol Aksi */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="relative group inline-block">
                        <Link
                          to={`/pengajuan/detail/${sub.id}`}
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors rounded-none"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Link>
                        {/* CSS Tooltip */}
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-medium px-2 py-1 pointer-events-none z-50 whitespace-nowrap rounded-none shadow-md">
                          Buka Ruang Evaluasi
                          <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-slate-900" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan (1/3): Panduan & Pembagian Tugas Verifikasi */}
        <div className="space-y-6 text-left">

          {/* Pembagian Tugas Otoritas Card */}
          <div className="bg-white border border-border p-5 rounded-none shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Prosedur Evaluasi Berkas</h3>
              <p className="text-[10px] text-slate-400 mt-1">Panduan langkah pembagian wewenang evaluasi dinas.</p>
            </div>

            <div className="space-y-3.5 pt-1">
              <div className="border-l-2 border-[#709775] pl-3 py-0.5 space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Verifikasi Administrasi
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Dijalankan oleh **Admin SIPAS**. Memeriksa kelengkapan KTP pemohon, sertifikat tanah BPN, NPWP, serta keselarasan KKPR [Slide 3].
                </p>
              </div>

              <div className="border-l-2 border-[#415D43] pl-3 py-0.5 space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                  <Map className="h-3.5 w-3.5 text-primary" />
                  Verifikasi Teknis
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Dijalankan oleh **Tim Teknis**. Melakukan audit koordinat CAD bidang tanah, serta uji spasial otomatis sempadan sungai & RTH [Slide 6].
                </p>
              </div>
            </div>
          </div>

          {/* Catatan Keselamatan Regulasi (Alert Banner) */}
          <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-none flex items-start gap-2.5">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Pemberitahuan Sistem</h5>
              <p className="text-[10px] text-amber-700 leading-relaxed">
                Seluruh aktivitas penolakan berkas atau rekomendasi revisi teknis wajib menyertakan alasan yang logis sesuai klausul Perbup Bogor No. 4 Tahun 2025.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}