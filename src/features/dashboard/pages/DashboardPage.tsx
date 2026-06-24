import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { 
  FileText, Clock, CheckCircle2, XCircle, Plus, 
  MapPin, Calendar, ArrowUpRight, TrendingUp, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';

export default function DashboardPage() {
  const { activeRole } = useUIStore();
  
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: SubmissionService.getAll,
  });

  // Calculate statistics
  const total = submissions.length;
  const diproses = submissions.filter(s => 
    ['Menunggu Verifikasi', 'Verifikasi Administrasi', 'Verifikasi Teknis', 'Menunggu Persetujuan'].includes(s.status)
  ).length;
  const disetujui = submissions.filter(s => s.status === 'Disetujui').length;
  const ditolak = submissions.filter(s => s.status === 'Ditolak').length;

  const recentSubmissions = submissions.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Sistem Informasi Pelayanan Pengesahan Site Plan Digital (GEOSIPAS) terintegrasi GIS.
          </p>
        </div>
        {activeRole === 'Pemohon' || activeRole === 'Super Admin' ? (
          <Link
            to="/pengajuan/tambah"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition-all gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Pengajuan Baru</span>
          </Link>
        ) : null}
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Pengajuan', val: total, icon: FileText, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-900/10' },
          { label: 'Pengajuan Diproses', val: diproses, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/10' },
          { label: 'Pengajuan Disetujui', val: disetujui, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/10' },
          { label: 'Pengajuan Ditolak', val: ditolak, icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/10' },
        ].map((c, i) => (
          <div key={i} className={`bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md`}>
            <div className={`p-3 rounded-lg ${c.color} border`}>
              <c.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{c.label}</p>
              {isLoading ? (
                <div className="h-8 w-12 bg-slate-100 dark:bg-slate-700 animate-pulse rounded mt-1" />
              ) : (
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-0.5">{c.val}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Recent Activity Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pengajuan Terbaru</h3>
              <p className="text-xs text-slate-400">Daftar pengajuan site plan terbaru yang diajukan developer.</p>
            </div>
            <Link to="/pengajuan/daftar" className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center hover:underline">
              Semua Pengajuan
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-lg border border-slate-100 dark:border-slate-800" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-lg mt-0.5">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{sub.housingName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{sub.developerName}</p>
                      <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {sub.location.address.split(',')[0]}</span>
                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {sub.submissionDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      sub.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                      sub.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}>
                      {sub.status}
                    </span>
                    <Link 
                      to={`/pengajuan/detail/${sub.id}`} 
                      className="px-3 py-1 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-semibold rounded border border-slate-200 dark:border-slate-600 transition-colors"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Realization & Info Cards */}
        <div className="space-y-6">
          {/* Progress Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Statistik Realisasi Spasial</h3>
            <div className="space-y-4">
              {[
                { label: 'Kesesuaian Tata Ruang', percent: 95 },
                { label: 'Penyediaan RTH (Min 20%)', percent: 88 },
                { label: 'Jaringan Utilitas & Jalan', percent: 76 },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                    <span className="text-teal-600 dark:text-teal-400">{item.percent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center"><TrendingUp className="h-4 w-4 mr-1 text-teal-500" /> +12% dibanding bulan lalu</span>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
              <Layers className="h-32 w-32" />
            </div>
            <h4 className="font-bold text-lg mb-2">Panduan Pengajuan</h4>
            <p className="text-xs text-teal-100 leading-relaxed mb-4">
              Seluruh proses pengesahan dilakukan secara digital. Pastikan file site plan Anda berformat CAD (.dwg) dan berkoordinat geografis terdaftar.
            </p>
            <Link to="/gis" className="inline-flex items-center text-xs font-bold text-teal-300 hover:text-teal-200">
              Buka GIS Viewer
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
