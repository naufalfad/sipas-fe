import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { 
  ClipboardList, Plus, Search, Filter, Eye
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

  // Unique status list for filter tabs
  const filterTabs = ['Semua', 'Menunggu Verifikasi', 'Verifikasi Administrasi', 'Verifikasi Teknis', 'Disetujui', 'Ditolak'];

  // Filter & Search data
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = 
      sub.housingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.developerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.submissionNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      selectedStatus === 'Semua' || sub.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Daftar Pengajuan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Pantau dan kelola berkas pengajuan Site Plan Anda.
          </p>
        </div>
        {activeRole === 'Pemohon' || activeRole === 'Super Admin' ? (
          <Link
            to="/pengajuan/tambah"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition-all gap-2"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Buat Pengajuan</span>
          </Link>
        ) : null}
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari perumahan, developer, atau nomor pengajuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Additional controls */}
          <div className="flex w-full md:w-auto items-center justify-end space-x-2">
            <button className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
              <Filter className="h-4 w-4" />
              <span>Filter Lanjutan</span>
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-2 border-b dark:border-slate-700 overflow-x-auto pb-px">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedStatus(tab)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                selectedStatus === tab
                  ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Sedang mengambil daftar pengajuan...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-3">
              <ClipboardList className="h-10 w-10 text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white">Tidak ada pengajuan ditemukan</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Coba ganti filter status atau masukkan kata kunci pencarian yang berbeda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">No. Pengajuan</th>
                  <th className="px-6 py-4">Perumahan / Developer</th>
                  <th className="px-6 py-4">Luas Lahan</th>
                  <th className="px-6 py-4">Tgl Pengajuan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{sub.submissionNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">{sub.housingName}</div>
                        <div className="text-xs text-slate-400">{sub.developerName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {sub.landArea.toLocaleString('id-ID')} m²
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {sub.submissionDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        sub.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        sub.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/pengajuan/detail/${sub.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-950/60 rounded-md font-semibold text-xs transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Lihat Detail</span>
                      </Link>
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
