import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { SubmissionService } from '@/features/submission/services/submission.service';
import {
  ArrowLeft, Clock, CheckCircle2,
  MapPin, File, Loader2,
  XCircle, CheckCircle
} from 'lucide-react';

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: sub, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-slate-500">Menghubungkan data basis spasial...</p>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="flex flex-col justify-center items-center py-16 text-center max-w-md mx-auto select-none bg-white border border-border p-8">
        <XCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Berkas Tidak Ditemukan</h3>
        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
          Nomor registrasi berkas pengajuan tidak terdaftar di dalam sistem administrasi GEOSIPAS.
        </p>
        <Link to="/pengajuan/daftar" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors rounded-none">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // Pengkondisian gaya visual lencana status sesuai standardisasi palet organik baru (WCAG AA Compliant)
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

  return (
    <div className="space-y-6 font-sans">

      {/* ─── SEKSI 1: HEADER SUMMARY BLOCK ─── */}
      <div className="flex items-center gap-4 select-none">
        <Link to="/pengajuan/daftar" className="p-2 bg-white hover:bg-slate-50 border border-border text-slate-500 hover:text-slate-800 transition-colors rounded-none">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-[#111D13] leading-none">
            Rincian Berkas Pengajuan
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Informasi administrasi, penelusuran riwayat evaluasi, dan lampiran berkas teknis {sub.submissionNo}.
          </p>
        </div>
      </div>

      {/* ─── SEKSI 2: CORE WORKSPACE GRID (SPLIT 2/3 DAN 1/3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Informasi Proyek & Berkas Lampiran */}
        <div className="lg:col-span-2 space-y-6">

          {/* Kartu 1: Informasi Umum Proyek */}
          <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-5 rounded-none text-left">
            <h3 className="text-xs font-bold text-slate-800 border-b border-border/60 pb-2 uppercase tracking-wide">
              Informasi Umum Proyek
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Perumahan</span>
                <span className="text-sm font-bold text-[#111D13] leading-tight block">{sub.housingName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Developer Pengaju</span>
                <span className="text-sm font-bold text-[#111D13] leading-tight block">{sub.developerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Lahan</span>
                <span className="text-xs font-bold text-slate-700 block">{sub.landArea.toLocaleString('id-ID')} m²</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tanggal Diajukan</span>
                <span className="text-xs font-bold text-slate-700 block">{sub.submissionDate}</span>
              </div>
              <div className="md:col-span-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Lokasi Administratif</span>
                <span className="text-xs font-semibold text-slate-600 flex items-start gap-1.5 leading-normal">
                  <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                  {sub.location.address}
                </span>
              </div>
            </div>
          </div>

          {/* Kartu 2: Berkas Lampiran Pengajuan */}
          <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-4 rounded-none text-left">
            <h3 className="text-xs font-bold text-slate-800 border-b border-border/60 pb-2 uppercase tracking-wide">
              Berkas Lampiran Pengajuan
            </h3>

            <div className="space-y-3">
              {sub.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-100/50 border border-border/40 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-white border border-border text-primary shrink-0">
                      <File className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      {/* Kontras nama file dijamin terbaca tajam menggunakan #111D13 */}
                      <h5 className="font-bold text-xs text-[#111D13] truncate">{doc.name}</h5>
                      <span className="text-[10px] text-slate-400 block mt-1">Format: {doc.type.toUpperCase()} • Diunggah: {doc.uploadedAt}</span>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    onClick={(e) => e.preventDefault()}
                    className="text-xs font-bold text-primary hover:underline shrink-0 pl-3"
                  >
                    Unduh Berkas
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan (1/3): Status & Riwayat Pelacakan */}
        <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-6 rounded-none text-left">

          {/* Status Terkini */}
          <div className="border-b border-border pb-5 select-none">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status Berkas Saat Ini</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold mt-2.5 border ${getStatusBadgeClass(sub.status)}`}>
              {sub.status === 'Disetujui' ? <CheckCircle className="h-3.5 w-3.5 text-[#415D43]" /> :
                sub.status === 'Ditolak' ? <XCircle className="h-3.5 w-3.5 text-rose-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
              {sub.status}
            </span>
          </div>

          {/* Riwayat Alur Proses (Timeline) */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">Riwayat Proses Pelacakan</h4>

            <div className="relative border-l border-border/80 ml-3 pl-6 space-y-6 py-1">
              {sub.history.map((hist, i) => {
                const isApproved = hist.status === 'Disetujui';
                const isRejected = hist.status === 'Ditolak';

                return (
                  <div key={i} className="relative">
                    {/* Circle timeline nodes (bulat sempurna terlindung di index.css) */}
                    <div className={`absolute -left-9 mt-0.5 rounded-full p-1 border-4 border-white text-white ${isApproved ? 'bg-emerald-600' : isRejected ? 'bg-rose-600' : 'bg-amber-500'
                      }`}>
                      {isApproved ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> :
                        isRejected ? <XCircle className="h-3.5 w-3.5 text-white" /> : <Clock className="h-3.5 w-3.5 text-white" />}
                    </div>

                    <h5 className="font-bold text-slate-800 text-xs leading-none">{hist.status}</h5>
                    <div className="text-[10px] text-slate-400 mt-1.5 flex items-center space-x-2">
                      <span>{hist.date}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-500">{hist.actor}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{hist.notes}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}