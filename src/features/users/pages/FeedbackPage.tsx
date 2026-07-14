import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { SubmissionService } from '@/features/submission/services/submission.service';

interface FeedbackItem {
  id: number;
  actor_name: string;
  actor_email: string;
  category: string;
  title: string;
  description: string;
  created_at: string;
}

export default function FeedbackPage() {
  const { user } = useAuthStore();
  const activeRole = user ? normalizeRole(user.role, user.username) : '';
  const isSuperAdmin = activeRole === 'Super Admin';

  // --- SUBMITTER STATE ---
  const [category, setCategory] = useState('Fitur Baru');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // --- ADMIN STATE ---
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Debounced search for Admin
  useEffect(() => {
    if (!isSuperAdmin) return;
    const handler = setTimeout(() => {
      setSearchQuery(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search, isSuperAdmin]);

  // Fetch feedbacks for Admin
  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await SubmissionService.getFeedbacks(page, limit, searchQuery);
      setFeedbacks(data.items || []);
      setTotal(data.total || 0);
      if (data.items && data.items.length > 0) {
        // Keep selection or set default
        const found = selectedItem ? data.items.find((i: any) => i.id === selectedItem.id) : null;
        setSelectedItem(found || data.items[0]);
      } else {
        setSelectedItem(null);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat daftar usulan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchFeedbacks();
    }
  }, [page, searchQuery, isSuperAdmin]);

  // Handle feedback submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Harap lengkapi judul dan deskripsi usulan.');
      return;
    }

    setSubmitting(true);
    try {
      await SubmissionService.submitFeedback({
        category,
        title,
        description
      });
      toast.success('Usulan pengembangan berhasil disimpan.');
      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengirimkan usulan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper colors for categories
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Fitur Baru':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Perbaikan Bug':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Peningkatan UI/UX':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const totalPages = Math.ceil(total / limit);

  // --- RENDER ADMIN VIEW ---
  if (isSuperAdmin) {
    return (
      <div className="space-y-6 text-left select-none animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
              <MessageSquare className="h-6 w-6 text-primary animate-pulse" />
              Usulan & Kebutuhan Pengembangan
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              Daftar umpan balik, aspirasi fitur, dan kebutuhan dari user pengguna aplikasi SIPAS.
            </p>
          </div>
        </div>

        {/* Dual Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
          {/* Left Panel: List */}
          <div className="lg:col-span-5 flex flex-col bg-white border border-border p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pengusul, judul, usulan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 font-semibold text-slate-800 text-xs placeholder-slate-400 bg-slate-50 focus:bg-white transition-colors focus:border-primary focus:outline-none"
              />
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[480px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Memuat data...</span>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                  Tidak ada usulan pengembangan yang ditemukan.
                </div>
              ) : (
                feedbacks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 border transition-all cursor-pointer text-left ${
                      selectedItem?.id === item.id
                        ? 'border-primary bg-secondary/30 shadow-[1px_1px_3px_rgba(0,0,0,0.02)]'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wide shrink-0 ${getCategoryBadge(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">
                        {item.created_at.split(' ')[0]}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[9px] text-slate-400 font-medium">
                      <User className="h-3 w-3 text-slate-300" />
                      <span className="truncate">{item.actor_name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 select-none">
                <span className="text-[10px] text-slate-500 font-bold">
                  Hal {page} dari {totalPages} ({total} usulan)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Detail View */}
          <div className="lg:col-span-7 bg-white border border-border p-5 flex flex-col justify-between">
            {selectedItem ? (
              <div className="space-y-6">
                {/* Detail Header */}
                <div className="border-b border-border/80 pb-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wide ${getCategoryBadge(selectedItem.category)}`}>
                      {selectedItem.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-300" />
                      {selectedItem.created_at}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-800 leading-snug">
                    {selectedItem.title}
                  </h2>
                </div>

                {/* Sender Card */}
                <div className="bg-slate-50 border border-slate-100 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                      {selectedItem.actor_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block leading-tight">{selectedItem.actor_name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Pengusul Fitur</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px] sm:text-right">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedItem.actor_email}</span>
                  </div>
                </div>

                {/* Proposal Text */}
                <div className="space-y-2 text-left">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Usulan / Deskripsi Kebutuhan</h3>
                  <div className="bg-slate-50/20 border border-slate-100/80 p-4 min-h-[180px] overflow-y-auto max-h-[300px]">
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedItem.description}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 text-xs">
                <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                Pilih usulan dari daftar sebelah kiri untuk meninjau rincian lengkapnya.
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 mt-6 text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-50/55 p-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Usulan tersimpan di database lokal sistem dan dapat diproses oleh tim teknis / developer pada pemeliharaan berkala.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER SUBMITTER VIEW (ALL OTHER ROLES) ---
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left select-none animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <MessageSquare className="h-6 w-6 text-primary animate-pulse" />
          Usulan & Kebutuhan Pengembangan
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Punya aspirasi fitur baru, menemukan bug, atau butuh kustomisasi modul tambahan? Sampaikan usulan Anda langsung melalui formulir di bawah ini.
        </p>
      </div>

      {submitSuccess ? (
        <div className="bg-white border border-border p-8 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Usulan Berhasil Dikirim!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Catatan usulan pengembangan Anda telah tersimpan secara permanen di database sistem dan akan ditinjau oleh Administrator / Super Admin.
            </p>
          </div>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="inline-flex items-center justify-center bg-primary hover:bg-[#344E38] text-white font-bold text-xs py-2 px-4 shadow-sm transition-colors cursor-pointer outline-none border-none"
          >
            Kirim Usulan Lain
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <form onSubmit={handleSubmit} className="bg-white border border-border p-6 space-y-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-border pb-2.5">
              Formulir Masukan User
            </h3>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Kategori Kebutuhan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 p-2.5 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:border-primary focus:outline-none transition-colors font-semibold"
              >
                <option value="Fitur Baru">Fitur Baru / Ekstensi Modul</option>
                <option value="Perbaikan Bug">Perbaikan Bug / Error Teknis</option>
                <option value="Peningkatan UI/UX">Peningkatan Desain UI/UX</option>
                <option value="Lainnya">Lainnya / Umum</option>
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Judul Usulan / Kebutuhan
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kustomisasi Warna Peta GIS & Buffer Sungai"
                className="w-full border border-slate-200 p-2.5 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:border-primary focus:outline-none transition-colors placeholder-slate-400 font-semibold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Deskripsi Detail Usulan
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Jelaskan kebutuhan secara detail. Tuliskan fungsionalitas yang diharapkan, skenario penggunaan, atau letak bug yang ditemui..."
                className="w-full border border-slate-200 p-2.5 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:border-primary focus:outline-none transition-colors placeholder-slate-400 resize-y leading-relaxed"
              />
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center space-x-2 bg-primary hover:bg-[#344E38] text-white font-bold text-xs py-2.5 px-5 shadow-sm transition-all cursor-pointer outline-none border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengirimkan Usulan...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Kirim Usulan Pengembangan</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick FAQ / Information box */}
          <div className="bg-slate-50 border border-slate-200/60 p-4 text-xs space-y-2.5">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-slate-400" />
              Mengapa memberikan usulan pengembangan?
            </h4>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Aplikasi SIPAS dikembangkan secara berkesinambungan untuk mengakomodasi alur verifikasi berkas permohonan site plan di lingkungan daerah. Masukan Anda sangat berharga bagi kami untuk menyempurnakan kegunaan sistem, performa audit spasial GIS, dan kemudahan pelaporan eksekutif dinas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
