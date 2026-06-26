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

  // Kalkulasi statistik data
  const total = submissions.length;
  const diproses = submissions.filter(s =>
    ['Menunggu Verifikasi', 'Verifikasi Administrasi', 'Verifikasi Teknis', 'Menunggu Persetujuan'].includes(s.status)
  ).length;
  const disetujui = submissions.filter(s => s.status === 'Disetujui').length;
  const ditolak = submissions.filter(s => s.status === 'Ditolak').length;

  const recentSubmissions = submissions.slice(0, 4);

  // Penyelarasan warna badge status sesuai dengan standardisasi palet organik baru (WCAG AA Compliant)
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-accent/35 text-[#415D43] border border-accent/70'; // Celadon soft theme
      case 'Ditolak':
        return 'bg-rose-50 text-rose-700 border border-rose-100'; // Rose pastel theme
      default:
        return 'bg-amber-50 text-amber-800 border border-amber-100'; // Amber pastel theme
    }
  };

  return (
    <div className="space-y-6 font-sans">

      {/* ─── SEKSI 1: HEADER DASHBOARD ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-[#111D13] leading-none">
            Dashboard Utama
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Sistem Informasi Pelayanan Pengesahan Site Plan Digital (GEOSIPAS) Kabupaten Bogor terintegrasi GIS.
          </p>
        </div>
        {(activeRole === 'Pemohon' || activeRole === 'Super Admin') && (
          <Link
            to="/pengajuan/tambah"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-none transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Pengajuan Baru</span>
          </Link>
        )}
      </div>

      {/* ─── SEKSI 2: KARTU INDIKATOR UTAMA (STATS WIDGETS) ─── */}
      {/* Diubah menjadi container putih dengan outline dae4db tipis di atas latar sage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Pengajuan', val: total, icon: FileText, color: 'text-primary bg-accent/40 border border-primary/20' },
          { label: 'Pengajuan Diproses', val: diproses, icon: Clock, color: 'text-amber-700 bg-amber-50 border border-amber-200/50' },
          { label: 'Pengajuan Disetujui', val: disetujui, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border border-emerald-200/50' },
          { label: 'Pengajuan Ditolak', val: ditolak, icon: XCircle, color: 'text-rose-700 bg-rose-50 border border-rose-200/50' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
            <div className={`p-2.5 rounded-none shrink-0 ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">{c.label}</p>
              {isLoading ? (
                <div className="h-6 w-12 bg-slate-100 animate-pulse rounded-none mt-1.5" />
              ) : (
                <h3 className="text-xl font-bold text-slate-800 mt-1.5 leading-none">{c.val}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── SEKSI 3: SPLIT LAYOUT (DAFTAR AKTIVITAS & GRAFIK SPASIAL) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Pengajuan Terbaru dalam Container Putih Bersih */}
        <div className="lg:col-span-2 bg-white border border-border p-5 space-y-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Pengajuan Terbaru</h3>
              <p className="text-[10px] text-slate-400 mt-1">Daftar berkas site plan terbaru yang diajukan oleh developer.</p>
            </div>
            <Link to="/pengajuan/daftar" className="text-xs font-semibold text-primary flex items-center hover:underline">
              Semua Berkas
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-none border border-slate-100" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="p-2 bg-accent/40 text-primary rounded-none mt-0.5 shrink-0">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate">{sub.housingName}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub.developerName}</p>
                      <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-slate-400">
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1 text-[#709775]" /> {sub.location.address.split(',')[0]}</span>
                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {sub.submissionDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-semibold border ${getStatusBadgeClass(sub.status)}`}>
                      {sub.status}
                    </span>
                    <Link
                      to={`/pengajuan/detail/${sub.id}`}
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-xs font-semibold rounded-none border border-slate-200 transition-colors"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Statistik Spasial & Panduan Pengajuan */}
        <div className="space-y-6 text-left">

          {/* Statistik Realisasi Spasial Card */}
          <div className="bg-white border border-border p-5 rounded-none shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Statistik Realisasi Spasial</h3>
              <p className="text-[10px] text-slate-400 mt-1">Status ketaatan pengajuan terhadap instrumen tata ruang wilayah.</p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Kesesuaian Tata Ruang (RTRW/RDTR)', percent: 95 },
                { label: 'Penyediaan RTH (Min 20% Lahan)', percent: 88 },
                { label: 'Jaringan Utilitas & Lebar Jalan', percent: 76 },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-primary">{item.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-none overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span className="flex items-center"><TrendingUp className="h-3.5 w-3.5 mr-1 text-primary" /> +12% dibanding bulan lalu</span>
            </div>
          </div>

          {/* Quick Guide Card (Tema Hunter Green Solid) */}
          <div className="bg-gradient-to-br from-[#415D43] to-[#111D13] text-white rounded-none p-5 relative overflow-hidden shadow-md">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
              <Layers className="h-24 w-24" />
            </div>
            <h4 className="font-bold text-sm mb-1.5">Panduan Penyusunan Tapak</h4>
            <p className="text-[11px] text-[#A1CCA5] leading-relaxed mb-4">
              Seluruh proses pengesahan dilakukan secara digital. Pastikan berkas rancangan Anda berkoordinat geografis terdaftar resmi BPN.
            </p>
            <Link to="/gis" className="inline-flex items-center text-xs font-bold text-white hover:text-[#A1CCA5] transition-colors">
              Buka GIS Viewer
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}