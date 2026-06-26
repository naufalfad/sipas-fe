import { useState } from 'react';
import { Database, Search, FileSpreadsheet, Layers, Info } from 'lucide-react';

export default function ReferencesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Contoh data master referensi pembagian zonasi & kecamatan Kabupaten Bogor
  const mockReferences = [
    { id: 'ref-1', kode: 'ZON-BOG-001', kategori: 'Zonasi', nama: 'Kawasan Hunian Kepadatan Tinggi (KDB Max 60%)', wilayah: 'Cibinong, Bojonggede' },
    { id: 'ref-2', border: 'Zonasi', kode: 'ZON-BOG-002', name: 'Kawasan Hunian Kepadatan Sedang', category: 'Zonasi', nama: 'Kawasan Hunian Kepadatan Sedang (KDB Max 50%)', wilayah: 'Babakan Madang, Sukaraja' },
    { id: 'ref-3', kode: 'ZON-BOG-003', nama: 'Kawasan Lindung Sempadan Sungai', category: 'Kawasan Lindung', parameter: 'Buffer 25 Meter', status: 'Aktif' },
    { id: 'usr-sub-1', kode: 'REG-BGR-01', kategori: 'Wilayah', nama: 'Kecamatan Babakan Madang', wilayah: 'Sentul, Cipambuan, Kadumangu' },
    { id: 'usr-sub-2', kode: 'REG-BGR-02', kategori: 'Wilayah', nama: 'Kecamatan Cibinong', wilayah: 'Cibinong, Nanggewer, Pakansari' },
  ];

  // Penapisan data berdasarkan pencarian teks
  const filteredReferences = mockReferences.filter(ref =>
  (ref.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.kode?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans">

      {/* ─── SEKSI 1: HEADER HALAMAN ─── */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <Database className="h-6 w-6 text-primary" />
          Data Master Referensi
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Kelola parameter pembagian wilayah kecamatan, kelurahan, aturan koefisien zonasi, dan kriteria kelaikan rencana tapak.
        </p>
      </div>

      {/* ─── SEKSI 2: WORKSPACE SPLIT (GRID DATA MATRIKS & FORM ACTIONS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Tabel Referensi Wilayah & Aturan Perda */}
        <div className="lg:col-span-2 bg-white border border-border p-5 space-y-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-3">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Daftar Referensi Valid</h3>
              <p className="text-[10px] text-slate-400 mt-1">Data acuan standardisasi tata ruang untuk mencocokkan validasi berkas developer.</p>
            </div>

            {/* Input Pencarian Tipis Terintegrasi */}
            <div className="relative text-left shrink-0">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari parameter master..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 pl-8 pr-3 py-1 border border-border rounded-none bg-slate-50/50 text-[#111D13] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[11px] transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                  <th className="px-4 py-3">Kode Ref</th>
                  <th className="px-4 py-3">Klasifikasi</th>
                  <th className="px-4 py-3">Parameter Aturan / Nama Wilayah</th>
                  <th className="px-4 py-3 text-right">Cakupan Wilayah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredReferences.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Kode Referensi */}
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                      {ref.kode}
                    </td>

                    {/* Kategori Klasifikasi */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold border leading-none bg-[#e8f2ea] text-[#415D43] border-[#A1CCA5]/60">
                        {ref.kategori || 'Zonasi'}
                      </span>
                    </td>

                    {/* Nama Parameter */}
                    <td className="px-4 py-3.5 text-left font-semibold text-slate-700 leading-normal max-w-xs whitespace-normal break-words">
                      {ref.nama}
                    </td>

                    {/* Cakupan Wilayah Fisik */}
                    <td className="px-4 py-3.5 text-right text-slate-500 font-medium leading-normal max-w-[180px] truncate" title={ref.wilayah}>
                      {ref.wilayah || 'Nasional/Dinas'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan (1/3): Sinkronisasi Sistem Informasi Daerah */}
        <div className="space-y-6 text-left select-none">

          {/* Sinkronisasi Simtaru Card */}
          <div className="bg-white border border-border p-5 rounded-none shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sinkronisasi Database</h3>
              <p className="text-[10px] text-slate-400 mt-1">Lakukan integrasi parameter data master terhadap portal satu pintu daerah.</p>
            </div>

            <div className="space-y-3 pt-1">
              {/* Tombol Sinkronisasi SIMTARU */}
              <button
                onClick={() => window.alert('Menghubungkan ke API SIMTARU Kabupaten Bogor…')}
                className="w-full flex items-center justify-center p-3.5 bg-primary hover:opacity-95 text-white font-bold rounded-none transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-primary cursor-pointer outline-none"
              >
                <Layers className="h-4.5 w-4.5 text-white" />
                <span>Sinkronisasi SIMTARU</span>
              </button>

              {/* Tombol Ekspor CSV */}
              <button
                onClick={() => window.alert('Mengekspor data master referensi (.csv)…')}
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 border border-border text-slate-700 hover:text-[#111D13] transition-colors rounded-none outline-none cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold">Ekspor CSV Referensi</span>
                </div>
              </button>
            </div>
          </div>

          {/* Tanya Jawab Teknis Box */}
          <div className="p-4 bg-slate-50 border border-border flex items-start gap-2.5">
            <Info className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kesesuaian Tata Ruang</h5>
              <p className="text-[10px] text-slate-400 leading-relaxed text-justify">
                Seluruh data zonasi di atas disesuaikan secara dinamis mengikuti Dokumen Rencana Tata Ruang Wilayah (RTRW) dan RDTR Kabupaten Bogor yang berlaku resmi tahun 2026.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}