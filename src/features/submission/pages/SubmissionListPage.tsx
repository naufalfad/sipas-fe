import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import {
  ClipboardList, Plus, Search, Filter, Eye, Pencil
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';

export default function SubmissionListPage() {
  const { activeRole } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: SubmissionService.getAll,
  });

  // Kategori tab filter pencarian dokumen
  const filterTabs = ['Semua', 'Draft', 'Menunggu Verifikasi', 'Verifikasi Administrasi', 'Verifikasi Teknis', 'Disetujui', 'Ditolak'];

  // Penapisan data berdasarkan input pencarian dan status dokumen
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.housingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.developerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.submissionNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'Semua' || sub.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Manajemen warna badge status dengan kontras pastel yang lembut (WCAG compliant)
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-600 border border-slate-200'; // Gray theme for Draft
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

      {/* ─── BARIS ATAS: JUDUL HALAMAN & TOMBOL AKSI UTAMA ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-[#111D13] leading-none">
            Daftar Pengajuan
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Pantau dan kelola berkas pengajuan Site Plan Anda melalui sistem penelusuran terpadu.
          </p>
        </div>
        {(activeRole === 'Pemohon' || activeRole === 'Super Admin') && (
          <Link
            to="/pengajuan/tambah"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-none transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Pengajuan</span>
          </Link>
        )}
      </div>

      {/* ─── BARIS TENGAH: FILTER & PENCARIAN (COMPACT HIGHDENSITY STYLE) ─── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Kolom Input Pencarian dengan ikon presisi */}
          <div className="relative w-full md:max-w-md text-left">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#709775]" />
            <input
              type="text"
              placeholder="Cari perumahan, developer, atau nomor pengajuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-none bg-white text-[#111D13] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs transition-all"
            />
          </div>

          {/* Tombol Filter Tambahan */}
          <div className="flex w-full md:w-auto items-center justify-end">
            <button className="flex items-center space-x-1.5 px-3.5 py-2 border border-border rounded-none bg-white text-slate-600 text-xs hover:bg-[#F4F7F4] hover:text-[#111D13] transition-colors">
              <Filter className="h-3.5 w-3.5 text-[#709775]" />
              <span className="font-semibold">Filter Lanjutan</span>
            </button>
          </div>
        </div>

        {/* Tab Navigasi Status (Tanpa outline kaku ganda, murni batas bawah linear) */}
        <div className="flex items-center space-x-2 border-b border-border overflow-x-auto pb-px">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedStatus(tab)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 -mb-px rounded-none ${selectedStatus === tab
                  ? 'border-primary text-primary font-bold bg-[#e8f2ea]/40'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-350'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ─── BARIS BAWAH: DATA TABEL FLUSH (KONTRASTING TANPA KOTAK NESTED) ─── */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block animate-spin rounded-none h-8 w-8 border-4 border-primary border-t-transparent" />
            <p className="text-xs text-slate-500">Menghubungkan data basis spasial...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          /* Tampilan Kosong (Empty State) */
          <div className="p-16 text-center flex flex-col items-center select-none bg-white border border-border">
            <div className="p-4 bg-slate-50 border border-border rounded-none mb-3">
              <ClipboardList className="h-8 w-8 text-[#709775]" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Dokumen Pengajuan</h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-normal">
              Ganti kueri filter status atau sesuaikan kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          /* Container Utama Tabel (Satu Garis Tepi Bersih - Flush Borderless Style) */
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">No. Berkas</th>
                  <th className="px-6 py-4 font-bold">Informasi Perumahan / Pengaju</th>
                  <th className="px-6 py-4 font-bold">Luas Lahan</th>
                  <th className="px-6 py-4 font-bold">Tgl Diajukan</th>
                  <th className="px-6 py-4 font-bold">Status Evaluasi</th>
                  <th className="px-6 py-4 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Kolom 1: Nomor Berkas */}
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-[#111D13]">{sub.submissionNo}</span>
                    </td>

                    {/* Kolom 2: Metadata Housing & Developer */}
                    <td className="px-6 py-4 text-left">
                      <div>
                        <div className="font-bold text-slate-800 text-xs leading-tight mb-1">{sub.housingName}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{sub.developerName}</div>
                      </div>
                    </td>

                    {/* Kolom 3: Luas Lahan */}
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {sub.landArea ? `${sub.landArea.toLocaleString('id-ID')} m²` : '-'}
                    </td>

                    {/* Kolom 4: Tanggal Pengajuan */}
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {sub.submissionDate}
                    </td>

                    {/* Kolom 5: Status Berkas */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold border leading-none ${getStatusBadgeClass(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>

                    {/* Kolom 6: Aksi (Ikon Mata Tunggal + CSS Group-Hover Tooltip) */}
                    <td className="px-6 py-4 text-right">
                      {sub.status === 'Draft' ? (
                        <div className="relative group inline-block">
                          <Link
                            to={`/pengajuan/edit/${sub.id}`}
                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-[#e8f2ea]/50 transition-colors rounded-none outline-none"
                          >
                            <Pencil className="h-4.5 w-4.5" />
                          </Link>

                          {/* ─── DYNAMIC CSS-ONLY HOVER TOOLTIP ─── */}
                          <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:block bg-[#111D13] text-white text-[10px] font-medium px-2.5 py-1 pointer-events-none z-50 whitespace-nowrap rounded-none shadow-md border border-[#709775]/25">
                            Lanjutkan Pengisian Draf
                            {/* Segitiga Penunjuk (Arrow) */}
                            <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-[#111D13]" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative group inline-block">
                          <Link
                            to={`/pengajuan/detail/${sub.id}`}
                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-[#e8f2ea]/50 transition-colors rounded-none outline-none"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </Link>

                          {/* ─── DYNAMIC CSS-ONLY HOVER TOOLTIP ─── */}
                          <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:block bg-[#111D13] text-white text-[10px] font-medium px-2.5 py-1 pointer-events-none z-50 whitespace-nowrap rounded-none shadow-md border border-[#709775]/25">
                            Tinjau Berkas Detail
                            {/* Segitiga Penunjuk (Arrow) */}
                            <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-[#111D13]" />
                          </div>
                        </div>
                      )}
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