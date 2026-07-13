import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import {
  Layers, Search, Eye, Map, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'PERUMAHAN', label: 'Perumahan' },
  { value: 'KOMERSIAL', label: 'Komersial' },
  { value: 'INDUSTRI', label: 'Industri' },
  { value: 'FASILITAS_UMUM', label: 'Fasilitas Umum' },
];

const STATUS_TABS = [
  'Semua',
  'Draft',
  'Menunggu Verifikasi',
  'Verifikasi Administrasi',
  'Verifikasi Teknis',
  'Disetujui',
  'Ditolak',
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

export default function SitePlanListPage() {
  // ── Filter & pagination state ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

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
    queryKey: ['siteplans-list', debouncedSearch, selectedStatus, selectedCategory, page],
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
        return 'bg-[#e8f2ea] text-[#415D43] border border-[#a3c9a8]';
      case 'Ditolak':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-amber-50 text-amber-800 border border-amber-200';
    }
  };

  // Helper to format numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const startEntry = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry   = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── HEADER HALAMAN ─── */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          Daftar Site Plan Resmi
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Daftar seluruh dokumen dan rencana tapak (site plan) Kabupaten Bogor yang telah disetujui, direvisi, maupun sedang dalam proses verifikasi spasial.
        </p>
      </div>

      {/* ─── FILTERS ─── */}
      <div className="space-y-4 bg-white border border-border p-4">
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
            className="px-3 py-2 border border-border rounded-none bg-white text-xs text-[#111D13] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary md:w-52"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Reset Indicator */}
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

        {/* ─── STATUS TABS ─── */}
        <div className="flex items-center space-x-1 border-b border-border overflow-x-auto pb-px">
          {STATUS_TABS.map((tab) => (
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
          ))}
        </div>
      </div>

      {/* ─── DATA TABLE ─── */}
      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                <th className="px-4 py-3">No. Pengajuan</th>
                <th className="px-4 py-3">Perumahan / Kegiatan</th>
                <th className="px-4 py-3">Pengembang (Developer)</th>
                <th className="px-4 py-3 text-right">Luas Lahan</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi Spasial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Memuat data site plan...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada berkas site plan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-600">
                      {sub.submissionNo}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {sub.housingName || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {sub.developerName || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {sub.landArea ? `${formatNumber(sub.landArea)} m²` : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {sub.submissionDetails?.category || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`rounded-none px-2 py-0.5 text-[9px] shadow-none ${getStatusBadgeClass(sub.status)}`}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/siteplan/detail/${sub.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-none hover:bg-primary/95 transition-all shadow-[2px_2px_0px_0px_rgba(65,93,67,0.1)] border border-primary animate-pulse"
                      >
                        <Map className="h-3 w-3" />
                        Detail Spasial
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── PAGINATION BAR ─── */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-border flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400 uppercase select-none">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1 select-none">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1 border border-border bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white rounded-none transition-colors cursor-pointer"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 border border-border bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white rounded-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 border border-border bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white rounded-none transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1 border border-border bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white rounded-none transition-colors cursor-pointer"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}