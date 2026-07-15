import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import {
  FileText, Clock, CheckCircle2, XCircle, Plus,
  MapPin, Calendar, ArrowUpRight, TrendingUp, Layers,
  Activity, FileCheck, ArrowRight, Hourglass, Compass
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import DashboardBanner from '../components/DashboardBanner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Submission } from '@/features/submission/types';

export default function DashboardPage() {
  const { activeRole } = useUIStore();
  const navigate = useNavigate();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions-all'],
    queryFn: SubmissionService.getAllList,
  });

  // Jika role adalah Kepala Bidang atau Kadis, tampilkan Dashboard Eksekutif
  if (activeRole === 'Kepala Bidang' || activeRole === 'Kadis') {
    return <ExecutiveDashboardView submissions={submissions} isLoading={isLoading} activeRole={activeRole} navigate={navigate} />;
  }

  // --- STANDARD DASHBOARD VIEW (PEMOHON, ADMIN, TIM TEKNIS, SUPER ADMIN) ---
  const total = submissions.length;
  const diproses = submissions.filter(s =>
    ['Pengajuan Dokumen', 'Verifikasi Administrasi', 'Verifikasi Teknis', 'Menunggu Persetujuan'].includes(s.status)
  ).length;
  const disetujui = submissions.filter(s => s.status === 'Disetujui').length;
  const ditolak = submissions.filter(s => s.status === 'Ditolak').length;
  const recentSubmissions = submissions.slice(0, 5);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-accent/35 text-[#415D43] border border-accent/70';
      case 'Ditolak':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      default:
        return 'bg-amber-50 text-amber-800 border border-amber-100';
    }
  };

  return (
    <div className="space-y-6 font-sans">
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

      <DashboardBanner />

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1 text-[#709775]" /> {sub.location?.address?.split(',')[0] ?? '—'}</span>
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

        <div className="space-y-6 text-left">
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

// ─── COMPONENT: EXECUTIVE DASHBOARD VIEW ───
interface ExecutiveDashboardProps {
  submissions: Submission[];
  isLoading: boolean;
  activeRole: string;
  navigate: (path: string) => void;
}

// Helper to calculate SVG donut slices stroke offsets
const calculateDonutSlices = (data: { val: number; color: string; label: string }[]) => {
  const totalVal = data.reduce((sum, item) => sum + item.val, 0);
  let accumulatedPercent = 0;
  return data.map(item => {
    const percent = totalVal > 0 ? (item.val / totalVal) * 100 : 0;
    const strokeOffset = 314.16 - ((accumulatedPercent / 100) * 314.16);
    accumulatedPercent += percent;
    return {
      ...item,
      percent,
      strokeOffset
    };
  });
};

function ExecutiveDashboardView({ submissions, isLoading, activeRole, navigate }: ExecutiveDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tindakan' | 'semua'>('tindakan');
  const [searchQuery, setSearchQuery] = useState('');

  // Target status yang membutuhkan tindakan eksekutif
  const targetStatus = activeRole === 'Kadis' ? 'Menunggu Persetujuan' : 'Menunggu Rekomendasi';

  // Hitung metrik eksekutif
  const pendingActions = submissions.filter(s => s.status === targetStatus);
  const approvedTotal = submissions.filter(s => s.status === 'Disetujui').length;
  const rejectedTotal = submissions.filter(s => s.status === 'Ditolak').length;

  const totalDevelopers = Array.from(new Set(submissions.map(s => s.developerName))).length;

  // Luas Lahan Terkumulasi
  const totalLandArea = submissions.reduce((sum, s) => sum + (s.landArea || 0), 0);

  // Perkiraan RTH terverifikasi
  const totalRthArea = submissions.reduce((sum, s) => {
    return sum + (s.verifiedRthArea || s.rthArea || (s.landArea ? s.landArea * 0.2 : 0));
  }, 0);

  // Menentukan list berkas yang ditampilkan
  const displayedSubmissions = (activeTab === 'tindakan' ? pendingActions : submissions).filter(s => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      s.housingName.toLowerCase().includes(query) ||
      s.developerName.toLowerCase().includes(query) ||
      s.submissionNo.toLowerCase().includes(query)
    );
  });

  // --- 1. DONUT CHART (Status Berkas) ---
  const donutData = [
    { val: approvedTotal, color: '#415D43', label: 'Disetujui' },
    { val: rejectedTotal, color: '#be123c', label: 'Ditolak' },
    { val: pendingActions.length, color: '#d97706', label: 'Butuh Tindakan' },
    { val: Math.max(0, submissions.length - approvedTotal - rejectedTotal - pendingActions.length), color: '#64748b', label: 'Proses Verifikator' }
  ];
  const totalVal = donutData.reduce((sum, item) => sum + item.val, 0);
  const slices = calculateDonutSlices(donutData);

  // --- 2. BAR CHART TREN BULANAN (6 Bulan Terakhir) ---
  const monthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const currentMonthIdx = new Date().getMonth();

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const idx = (currentMonthIdx - 5 + i + 12) % 12;
    return {
      monthIdx: idx,
      name: monthsList[idx],
      shortName: monthsList[idx].substring(0, 3),
      count: 0
    };
  });

  submissions.forEach(s => {
    if (!s.submissionDate) return;
    const date = new Date(s.submissionDate);
    const month = date.getMonth();
    const match = last6Months.find(m => m.monthIdx === month);
    if (match) {
      match.count++;
    }
  });

  const maxMonthCount = Math.max(...last6Months.map(m => m.count), 1);

  // Distribusi Berkas per Kategori Spasial
  const categoryCounts = submissions.reduce((acc, s) => {
    const cat = s.submissionDetails?.category || 'PERUMAHAN';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoriesList = [
    { key: 'PERUMAHAN', label: 'Perumahan / Tapak Hunian', color: 'bg-[#415D43]' },
    { key: 'NON_PERUMAHAN', label: 'Komersial / Non Perumahan', color: 'bg-amber-600' },
    { key: 'FASUM', label: 'Fasilitas Umum & Sosial', color: 'bg-teal-600' },
    { key: 'INDUSTRI', label: 'Kawasan Industri', color: 'bg-slate-700' },
  ];

  // Distribusi Wilayah Kecamatan Terbanyak
  const districtCounts = submissions.reduce((acc, s) => {
    const dist = s.locationDetails?.district || s.location?.address?.split(',')[1]?.trim() || 'Lainnya';
    const cleanDist = dist.replace(/kecamatan/gi, '').trim();
    acc[cleanDist] = (acc[cleanDist] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedDistricts = Object.entries(districtCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const getSlaBadgeClass = (days?: number) => {
    if (days === undefined) return 'bg-slate-100 text-slate-500 border-slate-200';
    if (days <= 3) return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
    if (days <= 7) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-accent/35 text-[#415D43] border border-accent/70';
      case 'Ditolak':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'Menunggu Persetujuan':
      case 'Menunggu Rekomendasi':
        return 'bg-amber-50 text-amber-800 border border-amber-200/80 font-bold';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6 font-sans text-left animate-in fade-in duration-300">
      {/* ─── HEADER DASHBOARD EKSEKUTIF ─── */}
      <div className="bg-gradient-to-br from-[#111D13] via-[#243727] to-[#415D43] text-white p-6 shadow-md relative overflow-hidden select-none">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-5 pointer-events-none">
          <Compass className="h-64 w-64 text-[#A1CCA5]" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 bg-[#A1CCA5] text-[#111D13] text-[9.5px] font-black uppercase tracking-wider rounded-none select-none">
              Portal Pemantauan Eksekutif
            </span>
            <h1 className="text-2xl font-bold mt-2 tracking-tight">
              Dashboard {activeRole === 'Kadis' ? 'Kepala Dinas' : 'Kepala Bidang Tata Ruang'}
            </h1>
            <p className="text-xs text-[#A1CCA5] mt-1 font-medium">
              Analisis utilitas lahan perumahan, monitoring kepatuhan tata ruang, dan validasi persetujuan digital.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 text-right">
              <span className="text-[9px] text-[#A1CCA5] font-bold uppercase tracking-wider block">Target Tindakan Anda</span>
              <span className="text-xl font-mono font-black text-amber-400">
                {isLoading ? '...' : pendingActions.length} <span className="text-xs text-white font-normal">Berkas</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── KARTU KPI METRIK UTAMA ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none relative overflow-hidden group hover:border-[#415D43] transition-all">
          <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <Hourglass className="h-5 w-5" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Menunggu Tindakan</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1.5 leading-none">
              {isLoading ? '...' : pendingActions.length}
            </h3>
            <p className="text-[9px] text-slate-400 mt-1.5 truncate">Berkas butuh tanda tangan/paraf Anda</p>
          </div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-amber-400" />
        </div>

        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none relative overflow-hidden group hover:border-[#415D43] transition-all">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Telah Disetujui</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1.5 leading-none">
              {isLoading ? '...' : approvedTotal}
            </h3>
            <p className="text-[9px] text-slate-400 mt-1.5 truncate">SK Site Plan berhasil diterbitkan resmi</p>
          </div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-emerald-500" />
        </div>

        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none relative overflow-hidden group hover:border-[#415D43] transition-all">
          <div className="p-2.5 bg-[#e8f2ea] text-[#415D43] border border-[#A1CCA5]/50 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Total Lahan Dikembangkan</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5 leading-none truncate">
              {isLoading ? '...' : `${(totalLandArea / 10000).toFixed(2)} Ha`}
            </h3>
            <p className="text-[9px] text-slate-400 mt-1.5 truncate">{totalLandArea.toLocaleString('id-ID')} m² lahan terdaftar</p>
          </div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-[#415D43]" />
        </div>

        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none relative overflow-hidden group hover:border-[#415D43] transition-all">
          <div className="p-2.5 bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Ruang Terbuka Hijau (RTH)</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5 leading-none truncate">
              {isLoading ? '...' : `${(totalRthArea / 10000).toFixed(2)} Ha`}
            </h3>
            <p className="text-[9px] text-slate-400 mt-1.5 truncate">Min. 20% dari luas lahan diselamatkan</p>
          </div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-teal-500" />
        </div>
      </div>

      {/* ─── DIAGRAM & ANALISIS EKSEKUTIF (PIE & TREND) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Donut Chart */}
        <div className="bg-white border border-border p-5 rounded-none shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="text-left w-full sm:w-1/2 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Status Berkas Real-Time</h3>
              <p className="text-[10px] text-slate-400 mt-1">Proporsi status kelayakan administratif &amp; teknis seluruh permohonan.</p>
            </div>
            
            <div className="space-y-2">
              {donutData.map((d, i) => {
                const pct = totalVal > 0 ? (d.val / totalVal) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-500 font-medium truncate flex-1">{d.label}</span>
                    <span className="font-bold text-slate-800">{d.val} ({pct.toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SVG Donut Chart */}
          <div className="relative shrink-0 flex items-center justify-center h-36 w-36 mx-auto sm:mx-0">
            <svg viewBox="0 0 130 130" className="h-full w-full">
              <circle cx="65" cy="65" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
              {totalVal > 0 ? (
                slices.map((slice, i) => {
                  if (slice.val === 0) return null;
                  const strokeLength = (slice.percent / 100) * 314.16;
                  return (
                    <circle
                      key={i}
                      cx="65"
                      cy="65"
                      r="50"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="12"
                      strokeDasharray={`${strokeLength} ${314.16 - strokeLength}`}
                      strokeDashoffset={slice.strokeOffset}
                      transform="rotate(-90 65 65)"
                      className="transition-all duration-300 hover:stroke-[15px] cursor-pointer"
                    />
                  );
                })
              ) : (
                <circle cx="65" cy="65" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center select-none text-center">
              <span className="text-2xl font-black text-slate-800 font-mono leading-none">{totalVal}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Berkas</span>
            </div>
          </div>
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="bg-white border border-border p-5 rounded-none shadow-sm space-y-4">
          <div className="text-left">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tren Penerimaan Berkas Bulanan</h3>
            <p className="text-[10px] text-slate-400 mt-1">Intake permohonan site plan masuk dalam 6 bulan terakhir.</p>
          </div>

          <div className="h-44 flex items-end justify-between pt-6 px-2 relative border-b border-l border-slate-100">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0 pt-6">
              <div className="w-full border-t border-dashed border-slate-100" />
              <div className="w-full border-t border-dashed border-slate-100" />
              <div className="w-full border-t border-dashed border-slate-100" />
            </div>

            {last6Months.map((m, i) => {
              const heightPercent = m.count > 0 ? (m.count / maxMonthCount) * 80 : 2;
              return (
                <div key={i} className="flex flex-col items-center flex-1 group z-10">
                  <div className="relative w-8 flex flex-col justify-end h-32">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {m.count} Berkas
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-primary to-[#709775] group-hover:to-[#A1CCA5] transition-all duration-300 shadow-sm"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-2">{m.shortName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── DATA ANALISIS SEKUNDER (SEKTOR & WILAYAH) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kategori Bidang & Jenis Penggunaan Lahan */}
        <div className="bg-white border border-border p-5 rounded-none shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Distribusi Sektor Pembangunan</h3>
            <p className="text-[10px] text-slate-400 mt-1">Klasifikasi kategori pemanfaatan lahan dari berkas site plan.</p>
          </div>

          <div className="space-y-4">
            {categoriesList.map((cat, i) => {
              const count = categoryCounts[cat.key] || 0;
              const percent = submissions.length ? Math.round((count / submissions.length) * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-600">{cat.label}</span>
                    <span className="text-slate-800 font-bold">{count} Berkas ({percent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-none overflow-hidden">
                    <div className={cn("h-full transition-all", cat.color)} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Sebaran Wilayah / Kecamatan */}
        <div className="bg-white border border-border p-5 rounded-none shadow-sm space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sebaran Wilayah Terpadat</h3>
            <p className="text-[10px] text-slate-400 mt-1">Kecamatan dengan usulan pengembangan tapak terpadat.</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-50 animate-pulse border border-slate-100" />)}
            </div>
          ) : sortedDistricts.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 italic">Tidak ada data sebaran wilayah.</div>
          ) : (
            <div className="space-y-3 font-sans text-xs">
              {sortedDistricts.map(([district, count], idx) => {
                const maxVal = sortedDistricts[0][1] || 1;
                const widthPercent = Math.round((count / maxVal) * 100);
                return (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <span className="w-24 font-bold text-slate-700 truncate text-[11px]">{district || 'Lainnya'}</span>
                    <div className="flex-1 h-3 bg-slate-50 border border-slate-100 rounded-none overflow-hidden relative">
                      <div className="h-full bg-[#415D43]/80 transition-all" style={{ width: `${widthPercent}%` }} />
                    </div>
                    <span className="w-12 text-right text-[10px] font-black text-[#415D43]">{count} Berkas</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Highlights / SLA Performance */}
        <div className="bg-white border border-border p-5 rounded-none shadow-sm space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Metrik Kepatuhan & Developer</h3>
            <p className="text-[10px] text-slate-400 mt-1">Evaluasi efektivitas dan statistik legalitas permohonan.</p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Developer Aktif Terdaftar</span>
              <span className="font-bold text-slate-800 text-[13px]">{totalDevelopers} Perusahaan</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Batas Waktu SLA Kritis (&lt; 5 Hari)</span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold border border-rose-200">
                {submissions.filter(s => s.remaining_sla_days !== undefined && s.remaining_sla_days <= 5 && s.status !== 'Disetujui' && s.status !== 'Ditolak').length} Berkas
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Permohonan Kategori Revisi SK</span>
              <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-bold border border-teal-200">
                {submissions.filter(s => s.submissionDetails?.submissionType === 'REVISI').length} Berkas
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Rasio Persetujuan Terhadap Penolakan</span>
              <span className="font-bold text-slate-800">
                {submissions.filter(s => s.status === 'Disetujui').length} : {submissions.filter(s => s.status === 'Ditolak').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TABEL MONITORING & PRIORITAS TINDAKAN ─── */}
      <div className="bg-white border border-border p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800">Antrean & Pemantauan Dokumen</h3>
            <p className="text-[10px] text-slate-400 mt-1">Pilih tab tindakan untuk langsung memproses berkas yang membutuhkan persetujuan Anda.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari perumahan / nomor berkas..."
              className="px-3 py-1.5 bg-white border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-none placeholder:text-slate-400 w-56 font-sans"
            />
            <div className="flex bg-slate-50 p-1 border border-border gap-1 select-none">
              <button
                onClick={() => setActiveTab('tindakan')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-none cursor-pointer border-none",
                  activeTab === 'tindakan' ? "bg-primary text-white" : "text-slate-500 hover:text-slate-800 bg-transparent"
                )}
              >
                Butuh Tindakan ({pendingActions.length})
              </button>
              <button
                onClick={() => setActiveTab('semua')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-none cursor-pointer border-none",
                  activeTab === 'semua' ? "bg-primary text-white" : "text-slate-500 hover:text-slate-800 bg-transparent"
                )}
              >
                Semua Berkas ({submissions.length})
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 animate-pulse border border-slate-100" />)}
          </div>
        ) : displayedSubmissions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200">
            <FileCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Tidak Ada Berkas Ditemukan</p>
            <p className="text-[10px] text-slate-400 mt-1">Seluruh antrean berkas terproses dengan baik secara administratif &amp; teknis.</p>
          </div>
        ) : (
          <div className="border border-border overflow-x-auto rounded-none">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-[9.5px] font-bold text-slate-500 uppercase tracking-wider text-left select-none">
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3">Nomor Berkas</th>
                  <th className="p-3">Nama Perumahan &amp; Developer</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Sisa SLA</th>
                  <th className="p-3">Status Tahapan</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white text-slate-700">
                {displayedSubmissions.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-[#111D13]">{sub.submissionNo}</td>
                    <td className="p-3 text-left">
                      <span className="font-bold text-slate-800 block text-xs">{sub.housingName}</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{sub.developerName}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-semibold uppercase rounded-none">
                        {sub.submissionDetails?.category || 'PERUMAHAN'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-none",
                        getSlaBadgeClass(sub.remaining_sla_days)
                      )}>
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        {sub.remaining_sla_days !== undefined ? `${sub.remaining_sla_days} Hari` : '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-none text-[9.5px] font-semibold border",
                        getStatusBadgeClass(sub.status)
                      )}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => navigate(`/pengajuan/detail/${sub.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold uppercase tracking-wider text-[9px] transition-colors border-none cursor-pointer rounded-none"
                      >
                        <span>Tinjau</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}