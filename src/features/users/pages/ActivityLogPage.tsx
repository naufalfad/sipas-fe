import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  User,
  Shield,
  KeyRound
} from 'lucide-react';
import { SubmissionService } from '@/features/submission/services/submission.service';

interface AuditLogItem {
  id: number;
  submission_id: string;
  actor_name: string;
  role: string;
  action: string;
  status_before: string;
  status_after: string;
  notes: string | null;
  digital_signature_hash: string | null;
  created_at: string;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Debounced search query
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(search);
      setPage(1); // Reset page to 1 when search changes
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await SubmissionService.getAuditLogs(page, limit, searchQuery);
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat log aktivitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, searchQuery]);

  const totalPages = Math.ceil(total / limit);

  // Helper to color action badges
  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('SUBMIT') || act.includes('CREATE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (act.includes('APPROVED') || act.includes('ACCEPT') || act.includes('TTE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('REJECT') || act.includes('DANGER') || act.includes('DECLINE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('VERIFY') || act.includes('REVIEW') || act.includes('ENDORSE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 text-left select-none">
      {/* ─── HEADER SECTION ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
            <ClipboardList className="h-6 w-6 text-primary" />
            Log Aktivitas Sistem
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Pusat pemantauan audit trail. Menampilkan seluruh riwayat modifikasi berkas, persetujuan teknis, dan otentikasi TTE.
          </p>
        </div>
      </div>

      {/* ─── CONTROLS & FILTER SECTION ─── */}
      <div className="bg-white border border-border p-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar */}
        <div className="relative text-left w-full md:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari permohonan, aktor, catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-border rounded-none bg-slate-50/50 text-[#111D13] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs transition-all"
          />
        </div>

        {/* Limit Selector & Summary Info */}
        <div className="flex items-center space-x-4 self-end md:self-auto text-xs">
          <span className="text-slate-400">Total Log: <strong className="text-slate-700 font-bold">{total}</strong></span>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Baris per halaman:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-border bg-white rounded-none py-1 px-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
            >
              {[10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── DATA TABLE SECTION ─── */}
      <div className="bg-white border border-border shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                <th className="px-4 py-3">Waktu Kejadian</th>
                <th className="px-4 py-3">ID Berkas</th>
                <th className="px-4 py-3">Aktor / Peran</th>
                <th className="px-4 py-3">Tindakan</th>
                <th className="px-4 py-3">Transisi Status</th>
                <th className="px-4 py-3">Catatan / Ulasan</th>
                <th className="px-4 py-3">Tanda Tangan Hash (TTE)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="inline-flex items-center space-x-2">
                      <div className="h-4.5 w-4.5 border-2 border-primary border-t-transparent animate-spin rounded-none" />
                      <span className="text-slate-400">Memuat data log aktivitas...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ditemukan log aktivitas yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Waktu Kejadian */}
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.created_at}
                    </td>

                    {/* ID Berkas Link */}
                    <td className="px-4 py-3.5 font-bold">
                      <Link
                        to={`/siteplan/detail/${log.submission_id}`}
                        className="text-primary hover:underline"
                      >
                        {log.submission_id}
                      </Link>
                    </td>

                    {/* Aktor / Peran */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-400" />
                        {log.actor_name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Shield className="h-2.5 w-2.5 text-slate-400" />
                        {log.role}
                      </div>
                    </td>

                    {/* Tindakan */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold border rounded-none leading-none ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Transisi Status */}
                    <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                      <span className="text-slate-400">{log.status_before}</span>
                      <span className="mx-1.5 text-slate-300">→</span>
                      <span className="text-slate-700 font-semibold">{log.status_after}</span>
                    </td>

                    {/* Catatan / Ulasan */}
                    <td className="px-4 py-3.5 text-slate-600 leading-normal max-w-xs whitespace-normal break-words" title={log.notes || undefined}>
                      {log.notes || <span className="text-slate-300 italic">-</span>}
                    </td>

                    {/* Tanda Tangan Hash (TTE) */}
                    <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">
                      {log.digital_signature_hash ? (
                        <div className="flex items-center gap-1" title={log.digital_signature_hash}>
                          <KeyRound className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[120px] text-emerald-600 font-bold">{log.digital_signature_hash.split(':')[1] || log.digital_signature_hash}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── PAGINATION SECTION ─── */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-slate-50/50">
            <span className="text-[11px] text-slate-400 self-center">
              Menampilkan Halaman <strong className="text-slate-700 font-semibold">{page}</strong> dari <strong className="text-slate-700 font-semibold">{totalPages}</strong> ({total} data)
            </span>

            <div className="flex items-center space-x-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="p-1 border border-border bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer rounded-none"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 border border-border bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer rounded-none mr-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Number navigation */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                // Only show current page, 1 page before/after, first and last page
                if (
                  pNum === 1 ||
                  pNum === totalPages ||
                  Math.abs(pNum - page) <= 1
                ) {
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`px-2.5 py-1 border text-xs font-bold rounded-none cursor-pointer ${
                        page === pNum
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                }
                // Ellipsis indicators
                if (pNum === 2 || pNum === totalPages - 1) {
                  return <span key={pNum} className="px-1 text-slate-400 text-xs">...</span>;
                }
                return null;
              })}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 border border-border bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer rounded-none ml-2"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="p-1 border border-border bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer rounded-none"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
