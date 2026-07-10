import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import {
  ClipboardList, Plus, Search, Eye, Pencil,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';

const PAGE_SIZE = 10;

const STATUS_TABS = [
  'Semua',
  'Draft',
  'Menunggu Verifikasi',
  'Verifikasi Administrasi',
  'Verifikasi Teknis',
  'Disetujui',
  'Ditolak',
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'PERUMAHAN', label: 'Perumahan' },
  { value: 'KOMERSIAL', label: 'Komersial' },
  { value: 'INDUSTRI', label: 'Industri' },
  { value: 'FASILITAS_UMUM', label: 'Fasilitas Umum' },
];

/** Simple debounce hook */
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SubmissionListPage() {
  const { activeRole: uiActiveRole } = useUIStore();
  const { user } = useAuthStore();
  const effectiveRole = user ? (normalizeRole(user.role) as string) : uiActiveRole;
  const activeRole = effectiveRole;
  const isPemohon = activeRole === 'Pemohon';

  // ── Filter & pagination state ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

  // Reset to page 1 whenever filters change
  const handleStatusChange = useCallback((tab: string) => {
    setSelectedStatus(tab);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((val: string) => {
    setSelectedCategory(val);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    setPage(1);
  }, []);

  // ── Server-side query ──────────────────────────────────────────────────────
  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ['submissions', debouncedSearch, selectedStatus, selectedCategory, page],
    queryFn: () => SubmissionService.getAll({
      search: debouncedSearch || undefined,
      status: selectedStatus !== 'Semua' ? selectedStatus : undefined,
      category: selectedCategory || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    placeholderData: (prev) => prev,
  });

  const submissions = response?.data ?? [];
  const totalCount = response?.total ?? 0;
  const totalPages = response?.total_pages ?? 1;

  // ── Status badge styling ───────────────────────────────────────────────────
  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'Draft':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'Disetujui':
        return 'bg-accent/35 text-[#415D43] border border-accent/70';
      case 'Ditolak':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      default:
        return 'bg-amber-50 text-amber-800 border border-amber-100';
    }
  };

  // ── Pagination helpers ─────────────────────────────────────────────────────
  const startEntry = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry   = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-6 font-sans">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-[#111D13] leading-none">Daftar Pengajuan</h1>
          <p className="text-xs text-slate-500 mt-2">
            Pantau dan kelola berkas pengajuan Site Plan melalui sistem penelusuran terpadu.
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

      {/* ─── SEARCH + CATEGORY FILTER ROW ───────────────────────────────── */}
      <div className="space-y-0">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">

          {/* Search input */}
          <div className="relative flex-1 md:max-w-sm text-left">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#709775]" />
            <input
              type="text"
              placeholder="Cari nama perumahan, developer, nomor berkas..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-border rounded-none bg-white text-[#111D13] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Category dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2 border border-border rounded-none bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary md:w-52"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Result count */}
          <div className="md:ml-auto flex items-center gap-2 shrink-0">
            {isFetching && !isLoading && (
              <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-none animate-spin" />
            )}
            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
              {totalCount > 0
                ? `${startEntry}–${endEntry} dari ${totalCount} berkas`
                : 'Tidak ada hasil'}
            </span>
          </div>
        </div>

        {/* ─── STATUS TABS ────────────────────────────────────────────────── */}
        <div className="flex items-center space-x-1 border-b border-border overflow-x-auto pb-px mt-4">
          {STATUS_TABS.map((tab) => {
            return (
              <button
                key={tab}
                onClick={() => handleStatusChange(tab)}
                className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 -mb-px rounded-none ${
                  selectedStatus === tab
                    ? 'border-primary text-primary font-bold bg-[#e8f2ea]/40'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TABLE ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block animate-spin rounded-none h-8 w-8 border-4 border-primary border-t-transparent" />
            <p className="text-xs text-slate-500">Menghubungkan data basis spasial...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center select-none bg-white border border-border">
            <div className="p-4 bg-slate-50 border border-border rounded-none mb-3">
              <ClipboardList className="h-8 w-8 text-[#709775]" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Dokumen Pengajuan</h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-normal">
              {debouncedSearch || selectedStatus !== 'Semua' || selectedCategory
                ? 'Coba ubah kata kunci pencarian atau sesuaikan filter yang aktif.'
                : 'Belum ada berkas pengajuan yang terdaftar dalam sistem.'}
            </p>
            {(debouncedSearch || selectedStatus !== 'Semua' || selectedCategory) && (
              <button
                onClick={() => { setSearchInput(''); setSelectedStatus('Semua'); setSelectedCategory(''); setPage(1); }}
                className="mt-4 px-4 py-1.5 border border-border text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
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
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-[#111D13]">{sub.submissionNo}</span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="font-bold text-slate-800 text-xs leading-tight mb-1">{sub.housingName}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{sub.developerName}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {sub.landArea ? `${sub.landArea.toLocaleString('id-ID')} m²` : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{sub.submissionDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold border leading-none ${getStatusBadgeClass(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.status === 'Draft' && isPemohon ? (
                        <div className="relative group inline-block">
                          <Link
                            to={`/pengajuan/edit/${sub.id}`}
                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-[#e8f2ea]/50 transition-colors rounded-none outline-none"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:block bg-[#111D13] text-white text-[10px] font-medium px-2.5 py-1 pointer-events-none z-50 whitespace-nowrap shadow-md">
                            Lanjutkan Pengisian Draf
                            <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-[#111D13]" />
                          </div>
                        </div>
                      ) : sub.status === 'Ditolak' && isPemohon ? (
                        <div className="flex items-center justify-end space-x-1">
                          <div className="relative group inline-block">
                            <Link
                              to={`/pengajuan/edit/${sub.id}`}
                              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-none outline-none"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:block bg-[#111D13] text-white text-[10px] font-medium px-2.5 py-1 pointer-events-none z-50 whitespace-nowrap shadow-md">
                              Revisi Pengajuan
                              <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-[#111D13]" />
                            </div>
                          </div>
                          <div className="relative group inline-block">
                            <Link
                              to={`/pengajuan/detail/${sub.id}`}
                              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-[#e8f2ea]/50 transition-colors rounded-none outline-none"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:block bg-[#111D13] text-white text-[10px] font-medium px-2.5 py-1 pointer-events-none z-50 whitespace-nowrap shadow-md">
                              Tinjau Berkas Detail
                              <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-[#111D13]" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group inline-block">
                          <Link
                            to={`/pengajuan/detail/${sub.id}`}
                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-[#e8f2ea]/50 transition-colors rounded-none outline-none"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:block bg-[#111D13] text-white text-[10px] font-medium px-2.5 py-1 pointer-events-none z-50 whitespace-nowrap shadow-md">
                            Tinjau Berkas Detail
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

      {/* ─── PAGINATION CONTROLS ────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-400">
            Halaman <span className="font-bold text-slate-600">{page}</span> dari{' '}
            <span className="font-bold text-slate-600">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            {/* First */}
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1.5 border border-border rounded-none text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Halaman pertama"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-border rounded-none text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Halaman sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Page number pills */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-[11px] text-slate-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[28px] h-7 px-2 text-[11px] font-semibold border rounded-none transition-colors ${
                      page === p
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-border rounded-none text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Halaman berikutnya"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {/* Last */}
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 border border-border rounded-none text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Halaman terakhir"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}