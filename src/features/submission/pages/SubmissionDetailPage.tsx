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
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Memuat rincian pengajuan...</p>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm text-center max-w-md mx-auto">
        <XCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pengajuan Tidak Ditemukan</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
          ID pengajuan yang Anda akses salah atau tidak terdaftar di sistem.
        </p>
        <Link to="/pengajuan/daftar" className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-lg text-sm font-semibold transition-colors">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/pengajuan/daftar" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Detail Pengajuan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Informasi berkas, riwayat evaluasi, dan koordinat spasial {sub.submissionNo}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: General info & documents */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">
              Informasi Umum Proyek
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Nama Perumahan</span>
                <span className="text-slate-800 dark:text-slate-250 font-bold text-base mt-0.5 block">{sub.housingName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Developer Pengaju</span>
                <span className="text-slate-800 dark:text-slate-250 font-bold text-base mt-0.5 block">{sub.developerName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Luas Lahan</span>
                <span className="text-slate-800 dark:text-slate-250 font-bold mt-0.5 block">{sub.landArea.toLocaleString('id-ID')} m²</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Tanggal Pengajuan</span>
                <span className="text-slate-800 dark:text-slate-250 font-bold mt-0.5 block">{sub.submissionDate}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Lokasi Proyek</span>
                <span className="text-slate-800 dark:text-slate-250 font-medium mt-0.5 flex items-start gap-1.5">
                  <MapPin className="h-4.5 w-4.5 text-teal-600 shrink-0 mt-0.5" />
                  {sub.location.address}
                </span>
              </div>
            </div>
          </div>

          {/* Uploaded Documents Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">
              Berkas Lampiran Pengajuan
            </h3>
            <div className="space-y-3">
              {sub.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
                      <File className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-slate-800 dark:text-white">{doc.name}</h5>
                      <span className="text-xs text-slate-400">Format: {doc.type.toUpperCase()} • Diunggah: {doc.uploadedAt}</span>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    onClick={(e) => e.preventDefault()}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Unduh Berkas
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tracking timeline */}
        <div className="space-y-6">
          {/* Status Tracker */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="border-b dark:border-slate-700 pb-3 mb-4">
              <span className="text-xs text-slate-400 font-semibold uppercase block">Status Berkas Saat Ini</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1.5 ${
                sub.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                sub.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' :
                'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
              }`}>
                {sub.status === 'Disetujui' ? <CheckCircle className="h-3.5 w-3.5" /> : 
                 sub.status === 'Ditolak' ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                {sub.status}
              </span>
            </div>

            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-350 mb-4 uppercase tracking-wide">Riwayat Tracking</h4>
            <div className="relative border-l-2 border-slate-100 dark:border-slate-750 ml-3 pl-6 space-y-6 py-1">
              {sub.history.map((hist, i) => {
                const isApproved = hist.status === 'Disetujui';
                const isRejected = hist.status === 'Ditolak';

                return (
                  <div key={i} className="relative">
                    {/* Circle icon placement */}
                    <div className={`absolute -left-9 mt-0.5 rounded-full p-1 border-4 border-white dark:border-slate-800 text-white ${
                      isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500'
                    }`}>
                      {isApproved ? <CheckCircle2 className="h-3 w-3" /> :
                       isRejected ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    </div>
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{hist.status}</h5>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>{hist.date}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-500">{hist.actor}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{hist.notes}</p>
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
