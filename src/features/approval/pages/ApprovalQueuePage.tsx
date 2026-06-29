import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import {
  ShieldCheck,
  FileCheck2,
  Clock,
  XCircle,
  Eye,
  Search,
  Download,
  UserCheck
} from 'lucide-react';

export default function ApprovalQueuePage() {
  const [activeSubTab, setActiveSubTab] = useState<'antrean' | 'riwayat'>('antrean');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all submissions from service layer to get reactive mock updates
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: SubmissionService.getAll
  });

  // Filter lists based on status
  const queueSubmissions = submissions.filter(s => s.status === 'Menunggu Persetujuan');
  const historySubmissions = submissions.filter(s => s.status === 'Disetujui');
  const rejectedSubmissions = submissions.filter(s => s.status === 'Ditolak');

  const activeList = activeSubTab === 'antrean' ? queueSubmissions : historySubmissions;

  // Filter list based on search query
  const filteredList = activeList.filter(s =>
    s.submissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.housingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.developerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* ─── SEKSI 1: HEADER HALAMAN ─── */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Persetujuan & Tanda Tangan Elektronik (TTE)
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Halaman otoritas pimpinan untuk memeriksa berkas kelayakan teknis dan membubuhkan TTE Dinas resmi pada SK Site Plan.
        </p>
      </div>

      {/* ─── SEKSI 2: KARTU METRIK EKSEKUTIF (TTE KABID SUMMARY) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none">
        {/* Metrik 1: Menunggu TTE */}
        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] text-left rounded-none">
          <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Menunggu TTE Pimpinan</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5 leading-none">{queueSubmissions.length} Berkas</h3>
            <p className="text-[9px] text-amber-600 font-semibold mt-1">Memerlukan pengesahan segera</p>
          </div>
        </div>

        {/* Metrik 2: SK Disahkan */}
        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] text-left rounded-none">
          <div className="p-2.5 bg-accent/35 text-primary border border-accent/70 shrink-0">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">SK Telah Terbit (Disetujui)</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5 leading-none">{historySubmissions.length} Dokumen</h3>
            <p className="text-[9px] text-[#415D43] font-semibold mt-1">TTE Dinas tersemat legal</p>
          </div>
        </div>

        {/* Metrik 3: Total Penolakan */}
        <div className="bg-white border border-border p-4 flex items-center space-x-4 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] text-left rounded-none">
          <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Berkas Ditolak / Revisi</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5 leading-none">{rejectedSubmissions.length} Berkas</h3>
            <p className="text-[9px] text-rose-500 font-semibold mt-1">Dikembalikan ke Pemohon/Teknis</p>
          </div>
        </div>
      </div>

      {/* ─── SEKSI 3: KONTROL FILTER & TAB ─── */}
      <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none space-y-4">
        {/* Kontrol Atas: Tab & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-border/60">
          {/* Sub Tab */}
          <div className="flex border border-border p-0.5 bg-slate-50 select-none">
            <button
              onClick={() => { setActiveSubTab('antrean'); setSearchQuery(''); }}
              className={`px-4 py-1.5 font-bold text-xs transition-colors rounded-none cursor-pointer ${
                activeSubTab === 'antrean'
                  ? 'bg-white text-primary border border-border shadow-[0px_1px_2px_rgba(0,0,0,0.03)]'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Antrean TTE Aktif ({queueSubmissions.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('riwayat'); setSearchQuery(''); }}
              className={`px-4 py-1.5 font-bold text-xs transition-colors rounded-none cursor-pointer ${
                activeSubTab === 'riwayat'
                  ? 'bg-white text-primary border border-border shadow-[0px_1px_2px_rgba(0,0,0,0.03)]'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Riwayat Pengesahan ({historySubmissions.length})
            </button>
          </div>

          {/* Pencarian */}
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Cari berkas permohonan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none"
            />
          </div>
        </div>

        {/* Tabel Data Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col justify-center items-center gap-2">
            <span className="h-6 w-6 border-2 border-primary border-t-transparent animate-spin rounded-full block"></span>
            Loading antrean persetujuan dinas...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 select-none">
            Tidak ada berkas permohonan yang sesuai kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                  <th className="px-4 py-3">No. Berkas</th>
                  <th className="px-4 py-3">Rencana Tapak / Developer</th>
                  <th className="px-4 py-3">Luas Lahan</th>
                  <th className="px-4 py-3">Tanggal Diajukan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Nomor Berkas */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-[#111D13]">{sub.submissionNo}</span>
                    </td>

                    {/* Rencana Tapak / Developer */}
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="font-semibold text-slate-800">{sub.housingName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{sub.developerName}</div>
                      </div>
                    </td>

                    {/* Luas Lahan */}
                    <td className="px-4 py-3.5 text-slate-600 font-semibold font-mono">
                      {sub.landArea.toLocaleString('id-ID')} m²
                    </td>

                    {/* Tanggal Diajukan */}
                    <td className="px-4 py-3.5 text-slate-500">
                      {sub.submissionDate}
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3.5 text-right">
                      {activeSubTab === 'antrean' ? (
                        <Link
                          to={`/pengajuan/detail/${sub.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#415D43] hover:bg-[#415D43]/95 text-white font-bold text-[10px] transition-colors rounded-none"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Periksa & Sahkan
                        </Link>
                      ) : (
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => window.alert(`Mengunduh Salinan Digital SK Terbit (${sub.submissionNo}-SK.pdf)...`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-[#415D43] font-bold text-[10px] transition-all rounded-none cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            SK PDF
                          </button>
                          <Link
                            to={`/pengajuan/detail/${sub.id}`}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors border border-border"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
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

      {/* Informasi Tambahan Otoritas */}
      <div className="bg-[#e8f2ea]/30 border border-primary/10 p-4 text-left select-none">
        <h5 className="text-[10px] font-bold text-[#111D13] uppercase tracking-wide flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Kepatuhan Otoritas Hukum
        </h5>
        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
          Pengesahan dokumen tapak melalui halaman ini terintegrasi langsung dengan Balai Sertifikasi Elektronik (BSrE). Penandatanganan secara elektronik setara secara hukum dengan tanda tangan basah berdasarkan UU ITE Pasal 11.
        </p>
      </div>
    </div>
  );
}
