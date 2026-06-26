import {
  FileBarChart2,
  TrendingUp,
  MapPin,
  Download,
  Calendar,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function ReportsPage() {

  // Contoh rekapitulasi data pengesahan bulanan Kabupaten Bogor untuk monitoring pimpinan
  const monthlyReports = [
    { bulan: 'Mei 2026', masterplan: 2, siteplan: 8, gs: 14, total: 24, status: 'Final' },
    { bulan: 'April 2026', masterplan: 1, siteplan: 6, gs: 19, total: 26, status: 'Final' },
    { bulan: 'Maret 2026', masterplan: 3, siteplan: 11, gs: 12, total: 26, status: 'Final' },
    { bulan: 'Februari 2026', masterplan: 0, siteplan: 5, gs: 15, total: 20, status: 'Final' },
  ];

  return (
    <div className="space-y-6 font-sans">

      {/* ─── SEKSI 1: HEADER HALAMAN ─── */}
      <div className="text-left">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <FileBarChart2 className="h-6 w-6 text-primary" />
          Laporan Realisasi & Statistik
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Statistik ringkasan penerbitan pengesahan dokumen rencana tapak (site plan/master plan) berkala Kabupaten Bogor.
        </p>
      </div>

      {/* ─── SEKSI 2: KARTU METRIK EKSEKUTIF (HIGH-DENSITY KEY KPI) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* KPI 1: Kecepatan Layanan */}
        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] text-left rounded-none">
          <div className="p-2.5 bg-accent/40 text-primary shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Rata-Rata Layanan</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5 leading-none">9.2 Hari Kerja</h3>
            <p className="text-[9px] text-[#415D43] font-semibold mt-1">2.4 hari lebih cepat dari target perda</p>
          </div>
        </div>

        {/* KPI 2: Wilayah Teraktif */}
        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] text-left rounded-none">
          <div className="p-2.5 bg-[#e8f2ea] text-primary shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Kecamatan Teraktif</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5 leading-none">Babakan Madang</h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">Total 14 pengajuan disetujui tahun ini</p>
          </div>
        </div>

        {/* KPI 3: Kepatuhan PSU & RTH */}
        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] text-left rounded-none">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Rata-Rata Kepatuhan RTH</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5 leading-none">21.8% Luas Lahan</h3>
            <p className="text-[9px] text-emerald-700 font-semibold mt-1">Memenuhi ambang batas minimum perda 20%</p>
          </div>
        </div>

      </div>

      {/* ─── SEKSI 3: SPLIT LAYOUT (TABEL REKAP & EKSPOR DATA) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Rekap Bulanan */}
        <div className="lg:col-span-2 bg-white border border-border p-5 space-y-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Rekapitulasi Penerbitan SK</h3>
              <p className="text-[10px] text-slate-400 mt-1">Laporan berkas terbit Surat Keputusan (SK) per jenjang skala rencana tapak.</p>
            </div>
            <Calendar className="h-4 w-4 text-[#709775]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3 text-center">Master Plan</th>
                  <th className="px-4 py-3 text-center">Site Plan</th>
                  <th className="px-4 py-3 text-center">Gambar Situasi</th>
                  <th className="px-4 py-3 text-right">Total SK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {monthlyReports.map((report, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-700">{report.bulan}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-600">{report.masterplan}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-600">{report.siteplan}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-600">{report.gs}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-primary">{report.total} SK</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan (1/3): Opsi Ekspor Laporan Resmi Eksekutif */}
        <div className="bg-white border border-border p-5 rounded-none shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-5 text-left">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Ekspor Laporan Resmi</h3>
            <p className="text-[10px] text-slate-400 mt-1">Unduh bundel rekapitulasi data untuk keperluan rapat koordinasi dinas.</p>
          </div>

          <div className="space-y-3 pt-1">

            {/* Tombol Ekspor Excel */}
            <button
              onClick={() => window.alert('Mengunduh Laporan Realisasi (.xlsx)')}
              className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 border border-border text-slate-700 hover:text-[#111D13] transition-colors rounded-none outline-none cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold">Unduh Format Spreadsheet</span>
              </div>
              <Download className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Tombol Ekspor PDF */}
            <button
              onClick={() => window.alert('Mempersiapkan Dokumen Cetak Laporan Dinas (.pdf)')}
              className="w-full flex items-center justify-between p-3.5 bg-[#415D43] hover:bg-[#415D43]/95 text-white transition-colors rounded-none outline-none cursor-pointer border border-[#415D43]"
            >
              <div className="flex items-center space-x-3">
                <FileBarChart2 className="h-4.5 w-4.5 text-[#A1CCA5] shrink-0" />
                <span className="text-xs font-semibold">Cetak PDF Eksekutif</span>
              </div>
              <Download className="h-3.5 w-3.5 text-[#A1CCA5]" />
            </button>

          </div>

          <p className="text-[9px] text-slate-400 font-semibold leading-normal">
            * Seluruh laporan statistik ditarik secara seketika (*real-time*) berdasarkan data pendaftaran digital yang telah teresolusi secara spasial oleh tim teknis dinas.
          </p>
        </div>

      </div>
    </div>
  );
}