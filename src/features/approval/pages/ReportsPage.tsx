import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileBarChart2,
  TrendingUp,
  MapPin,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/config';

// Helper to format large numbers for land area
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

// List of months for the dropdown filter
const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

// List of years for the dropdown filter
const YEARS = [2025, 2026, 2027];

export default function ReportsPage() {
  // Default to June 2026 as that is where our seeded database permohonan resides
  const [selectedStartMonth, setSelectedStartMonth] = useState<number>(6);
  const [selectedStartYear, setSelectedStartYear] = useState<number>(2026);
  const [selectedEndMonth, setSelectedEndMonth] = useState<number>(6);
  const [selectedEndYear, setSelectedEndYear] = useState<number>(2026);

  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const getPeriodLabel = () => {
    if (selectedStartMonth === selectedEndMonth && selectedStartYear === selectedEndYear) {
      return `${MONTHS[selectedStartMonth - 1]?.label} ${selectedStartYear}`;
    }
    return `${MONTHS[selectedStartMonth - 1]?.label} ${selectedStartYear} - ${MONTHS[selectedEndMonth - 1]?.label} ${selectedEndYear}`;
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/submissions/reports/export/csv?start_month=${selectedStartMonth}&start_year=${selectedStartYear}&end_month=${selectedEndMonth}&end_year=${selectedEndYear}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error('Gagal mengekspor CSV dari server');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_geosipas_${selectedStartMonth}_${selectedStartYear}_${selectedEndMonth}_${selectedEndYear}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengekspor spreadsheet: ' + err.message);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/submissions/reports/export/pdf?start_month=${selectedStartMonth}&start_year=${selectedStartYear}&end_month=${selectedEndMonth}&end_year=${selectedEndYear}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error('Gagal mengekspor PDF dari server');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      console.error(err);
      alert('Gagal mencetak PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Fetch report stats from backend using useQuery
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['reportStats', selectedStartMonth, selectedStartYear, selectedEndMonth, selectedEndYear],
    queryFn: () => SubmissionService.getReportStats(selectedStartMonth, selectedStartYear, selectedEndMonth, selectedEndYear),
    placeholderData: (previousData) => previousData, // keep showing previous data while refetching
  });

  // Calculate local client-side variables
  const landAreaSum = stats?.land_statistics?.total_land_area_ytd || 0;
  const landAreaInHa = (landAreaSum / 10000).toFixed(2);
  const totalPengajuan = stats?.accumulation?.total_pengajuan_ytd || 0;
  const totalDisetujui = stats?.accumulation?.total_disetujui_ytd || 0;

  const sesuaiCount = stats?.decision_analysis?.SESUAI || 0;
  const bersyaratCount = stats?.decision_analysis?.SESUAI_BERSYARAT || 0;
  const tidakSesuaiCount = stats?.decision_analysis?.TIDAK_SESUAI || 0;
  const totalDecisions = sesuaiCount + bersyaratCount + tidakSesuaiCount;

  const successRate = totalDecisions > 0 
    ? ((sesuaiCount + bersyaratCount) / totalDecisions * 100).toFixed(1) 
    : '0';

  const skRecap = stats?.sk_recap || [];
  const pipeline = stats?.pipeline_snapshot || {
    pemohon: 0,
    admin: 0,
    teknis: 0,
    kabid: 0,
    kadis: 0,
    selesai: 0
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── HEADER & FILTER SECTION ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
            <FileBarChart2 className="h-6 w-6 text-primary animate-pulse" />
            Laporan Realisasi & Statistik
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Konsolider data real-time berkas permohonan siteplan, verifikasi tata ruang, dan TTE Kepala Dinas Kabupaten Bogor.
          </p>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Dari Section */}
          <div className="flex items-center gap-1.5 border border-border/80 px-2 py-1 bg-slate-50/50">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-normal pr-1 border-r border-border/80">Dari:</span>
            
            <div className="flex flex-col text-left">
              <select
                value={selectedStartMonth}
                onChange={(e) => {
                  const startM = Number(e.target.value);
                  setSelectedStartMonth(startM);
                  
                  // Proteksi: jika tanggal awal > tanggal akhir, geser tanggal akhir
                  if (selectedStartYear > selectedEndYear || (selectedStartYear === selectedEndYear && startM > selectedEndMonth)) {
                    setSelectedEndMonth(startM);
                    setSelectedEndYear(selectedStartYear);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer focus:text-primary transition-colors py-1"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col text-left border-l border-border/60 pl-1.5">
              <select
                value={selectedStartYear}
                onChange={(e) => {
                  const startY = Number(e.target.value);
                  setSelectedStartYear(startY);
                  
                  // Proteksi
                  if (startY > selectedEndYear) {
                    setSelectedEndYear(startY);
                    setSelectedEndMonth(selectedStartMonth);
                  } else if (startY === selectedEndYear && selectedStartMonth > selectedEndMonth) {
                    setSelectedEndMonth(selectedStartMonth);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer focus:text-primary transition-colors py-1"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sampai Section */}
          <div className="flex items-center gap-1.5 border border-border/80 px-2 py-1 bg-slate-50/50">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-normal pr-1 border-r border-border/80">Sampai:</span>
            
            <div className="flex flex-col text-left">
              <select
                value={selectedEndMonth}
                onChange={(e) => {
                  const endM = Number(e.target.value);
                  setSelectedEndMonth(endM);
                  
                  // Proteksi
                  if (selectedStartYear > selectedEndYear || (selectedStartYear === selectedEndYear && selectedStartMonth > endM)) {
                    setSelectedStartMonth(endM);
                    setSelectedStartYear(selectedEndYear);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer focus:text-primary transition-colors py-1"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col text-left border-l border-border/60 pl-1.5">
              <select
                value={selectedEndYear}
                onChange={(e) => {
                  const endY = Number(e.target.value);
                  setSelectedEndYear(endY);
                  
                  // Proteksi
                  if (selectedStartYear > endY) {
                    setSelectedStartYear(endY);
                    setSelectedStartMonth(selectedEndMonth);
                  } else if (selectedStartYear === endY && selectedStartMonth > selectedEndMonth) {
                    setSelectedStartMonth(selectedEndMonth);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer focus:text-primary transition-colors py-1"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading / Error Indicators */}
      {isLoading && !stats && (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2 bg-white border border-border">
          <Activity className="h-4 w-4 animate-spin text-primary" />
          Memuat data laporan dinas...
        </div>
      )}

      {isError && (
        <div className="p-5 border border-rose-100 bg-rose-50 text-rose-800 text-xs text-left flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Gagal memuat statistik laporan:</p>
            <p className="mt-1 text-slate-500 font-mono">{(error as any)?.message || 'Internal API Error'}</p>
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* ─── KARTU METRIK EKSEKUTIF (SUMMARY CARDS) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Total Lahan Tahun Ini */}
            <div className="bg-white border border-border p-4 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] text-left rounded-none flex items-start space-x-3.5">
              <div className="p-2.5 bg-slate-50 border border-slate-100 text-slate-600 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total Lahan (YTD)</p>
                <h3 className="text-xl font-bold text-slate-800 mt-2 leading-none font-mono">
                  {formatNumber(landAreaSum)} <span className="text-[10px] font-normal text-slate-500">m²</span>
                </h3>
                <p className="text-[9px] text-[#415D43] font-semibold mt-1.5">
                  Setara dengan ~{landAreaInHa} Hektar
                </p>
              </div>
            </div>

            {/* Card 2: Pengajuan s/d Bulan X */}
            <div className="bg-white border border-border p-4 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] text-left rounded-none flex items-start space-x-3.5">
              <div className="p-2.5 bg-accent/40 text-primary border border-accent/65 shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Pengajuan YTD</p>
                <h3 className="text-xl font-bold text-slate-800 mt-2 leading-none font-mono">
                  {totalPengajuan} <span className="text-[10px] font-normal text-slate-500">Berkas</span>
                </h3>
                <p className="text-[9px] text-slate-500 font-medium mt-1.5">
                  Baru di bulan ini: {stats.monthly.pengajuan_bulan_ini} berkas
                </p>
              </div>
            </div>

            {/* Card 3: Penyelesaian s/d Bulan X */}
            <div className="bg-white border border-border p-4 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] text-left rounded-none flex items-start space-x-3.5">
              <div className="p-2.5 bg-[#e8f2ea] text-primary border border-[#d9ecdcfc] shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Penyelesaian YTD</p>
                <h3 className="text-xl font-bold text-slate-800 mt-2 leading-none font-mono">
                  {totalDisetujui} <span className="text-[10px] font-normal text-slate-500">SK Terbit</span>
                </h3>
                <p className="text-[9px] text-[#415D43] font-semibold mt-1.5">
                  Bulan ini disahkan: {stats.monthly.penyelesaian_bulan_ini} SK
                </p>
              </div>
            </div>

            {/* Card 4: Rasio SK Diterima vs Ditolak */}
            <div className="bg-white border border-border p-4 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] text-left rounded-none flex items-start space-x-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Rasio Penerimaan</p>
                <h3 className="text-xl font-bold text-slate-800 mt-2 leading-none font-mono">
                  {successRate}%
                </h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-1.5">
                  Diterima: {sesuaiCount + bersyaratCount} | Ditolak: {tidakSesuaiCount}
                </p>
              </div>
            </div>

          </div>

          {/* ─── PIPELINE TAHAPAN (Horizontal snapshot flow) ─── */}
          <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] text-left rounded-none space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-[#709775]" />
                Snapshot Alur Proses Berkas Aktif
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Visualisasi distribusi penumpukan berkas yang sedang berproses pada masing-masing tahapan instansi saat ini.
              </p>
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              
              {/* Step 1: Pemohon */}
              <div className="bg-slate-50 border border-slate-100 p-3 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">1. Pemohon</span>
                <span className="text-2xl font-bold font-mono text-slate-700 mt-2">{pipeline.pemohon}</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-medium">Draft & Verifikasi Awal</span>
              </div>

              {/* Step 2: Admin */}
              <div className="bg-slate-50 border border-slate-100 p-3 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">2. Admin</span>
                <span className="text-2xl font-bold font-mono text-slate-700 mt-2">{pipeline.admin}</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-medium">Verifikasi Dokumen</span>
              </div>

              {/* Step 3: Teknis */}
              <div className="bg-slate-50 border border-slate-100 p-3 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">3. Tim Teknis</span>
                <span className="text-2xl font-bold font-mono text-slate-700 mt-2">{pipeline.teknis}</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-medium">Uji GIS & Sempadan</span>
              </div>

              {/* Step 4: Kabid */}
              <div className="bg-slate-50 border border-slate-100 p-3 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">4. Kabid/Draf SK</span>
                <span className="text-2xl font-bold font-mono text-slate-700 mt-2">{pipeline.kabid}</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-medium">Veto Rekomendasi</span>
              </div>

              {/* Step 5: Kadis */}
              <div className="bg-slate-50 border border-slate-100 p-3 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">5. Kadis</span>
                <span className="text-2xl font-bold font-mono text-slate-700 mt-2">{pipeline.kadis}</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-medium">Sertifikasi TTE</span>
              </div>

              {/* Step 6: Selesai */}
              <div className="bg-emerald-50 border border-emerald-100 p-3 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">6. Selesai</span>
                <span className="text-2xl font-bold font-mono text-emerald-800 mt-2">{pipeline.selesai}</span>
                <span className="text-[9px] text-emerald-600 mt-1 leading-tight font-medium">SK Resmi Terbit</span>
              </div>

            </div>
          </div>

          {/* ─── BOTTOM TWO-COLUMN PANEL ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Kolom Kiri (2/3): Daftar SK Terbit */}
            <div className="lg:col-span-2 bg-white border border-border p-5 space-y-4 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] text-left rounded-none">
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Daftar Surat Keputusan (SK) Terbit</h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Arsip permohonan yang telah berhasil diterbitkan dan ditandatangani secara digital oleh Kadis pada periode ini.
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] px-2 py-0.5">
                  Periode: {getPeriodLabel()}
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                      <th className="px-4 py-3">No. Pengajuan</th>
                      <th className="px-4 py-3">Nama Perumahan / Kegiatan</th>
                      <th className="px-4 py-3 text-right">Nomor Surat Keputusan (SK)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {skRecap.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-medium">
                          Tidak ada berkas SK terbit pada periode terpilih ({getPeriodLabel()}).
                        </td>
                      </tr>
                    ) : (
                      skRecap.map((sk: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-600 font-mono">{sk.submission_no}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{sk.housing_name}</td>
                          <td className="px-4 py-3 text-right font-bold text-primary font-mono">{sk.sk_number}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kolom Kanan (1/3): Analisis Keputusan & Ekspor */}
            <div className="space-y-6">
              
              {/* Box 1: Distribusi Keputusan Tata Ruang (YTD) */}
              <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] text-left rounded-none space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="h-4.5 w-4.5 text-[#709775]" />
                    Analisis Keputusan (YTD)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Klasifikasi hasil verifikasi kesesuaian spasial dari awal tahun hingga bulan terpilih.
                  </p>
                </div>

                <div className="space-y-3.5">
                  
                  {/* Sesuai (Emerald) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Sesuai
                      </span>
                      <span className="font-mono">{sesuaiCount} Berkas ({totalDecisions > 0 ? (sesuaiCount / totalDecisions * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-none overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500" 
                        style={{ width: `${totalDecisions > 0 ? (sesuaiCount / totalDecisions * 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Sesuai Bersyarat (Amber) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Sesuai Bersyarat
                      </span>
                      <span className="font-mono">{bersyaratCount} Berkas ({totalDecisions > 0 ? (bersyaratCount / totalDecisions * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-none overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-500" 
                        style={{ width: `${totalDecisions > 0 ? (bersyaratCount / totalDecisions * 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Ditolak (Rose) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Tidak Sesuai / Ditolak
                      </span>
                      <span className="font-mono">{tidakSesuaiCount} Berkas ({totalDecisions > 0 ? (tidakSesuaiCount / totalDecisions * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-none overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 transition-all duration-500" 
                        style={{ width: `${totalDecisions > 0 ? (tidakSesuaiCount / totalDecisions * 100) : 0}%` }}
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Box 2: Cetak / Ekspor Laporan */}
              <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] text-left rounded-none space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Ekspor Bundel Laporan</h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ekspor arsip rekapitulasi data permohonan dinas ke berkas fisik untuk keperluan pelaporan eksekutif pimpinan.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  
                  {/* Tombol Ekspor Excel */}
                  <button
                    onClick={handleExportCsv}
                    disabled={isExportingCsv}
                    className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 border border-border text-slate-700 hover:text-[#111D13] transition-colors rounded-none outline-none cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-3">
                      <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold">{isExportingCsv ? 'Mengekspor...' : 'Unduh Format Spreadsheet'}</span>
                    </div>
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {/* Tombol Ekspor PDF */}
                  <button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="w-full flex items-center justify-between p-3.5 bg-[#415D43] hover:bg-[#415D43]/95 text-white transition-colors rounded-none outline-none cursor-pointer border border-[#415D43] disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-3">
                      <FileBarChart2 className="h-4.5 w-4.5 text-[#A1CCA5] shrink-0" />
                      <span className="text-xs font-semibold">{isExportingPdf ? 'Mengekspor...' : 'Cetak PDF Eksekutif'}</span>
                    </div>
                    <Download className="h-3.5 w-3.5 text-[#A1CCA5]" />
                  </button>

                </div>

                <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                  * Laporan dinas bersifat seketika (real-time) mengikuti perubahan status approval berkas yang sah di database Kabupaten Bogor.
                </p>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}