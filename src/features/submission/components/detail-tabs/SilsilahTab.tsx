/**
 * ============================================================================
 * GEOSIPAS COMPONENT — SilsilahTab [SilsilahTab.tsx] (NEW)
 * ============================================================================
 * Peran: Komponen tab khusus Admin untuk melakukan ulasan silsilah revisi,
 *        inspeksi tumpang tindih spasial (PostGIS ST_Intersection),
 *        dan pengaitan berkas induk secara manual (Link Parent).
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  AlertTriangle, Layers, Loader2, CheckCircle2, 
  FileText, Link2, GitCommit, FileCheck, UploadCloud
} from 'lucide-react';
import { SubmissionService } from '../../services/submission.service';
import { uploadFileToBackend } from '../../utils/upload';

const resolveDocUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
};

// ─── STYLING CONSTANTS (PROTECTED VARIATIONS) ──────────────────────────────────
const inputClass = "w-full px-3.5 py-2.5 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide";

interface SilsilahTabProps {
  sub: any;
}

export const SilsilahTab = ({ sub }: SilsilahTabProps) => {
  const queryClient = useQueryClient();
  const [baselineSource, setBaselineSource] = useState<'DIGITAL' | 'LEGACY'>('DIGITAL');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  
  // Legacy metadata states
  const [legacySkNumber, setLegacySkNumber] = useState<string>('');
  const [legacySkDate, setLegacySkDate] = useState<string>('');
  const [legacySkDocUrl, setLegacySkDocUrl] = useState<string>('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // --- QUERY 1: FETCH SPATIAL OVERLAPS ---
  const { data: overlaps = [], isLoading: isLoadingOverlaps } = useQuery({
    queryKey: ['spatial-overlaps', sub.id],
    queryFn: () => SubmissionService.getSpatialOverlaps(sub.id),
    enabled: !!sub.id,
  });

  // --- QUERY 2: FETCH DIGITAL APPROVED SUBMISSIONS FOR LINKING ---
  const { data: approvedSubs = [], isLoading: isLoadingApproved } = useQuery({
    queryKey: ['submissions-approved-only'],
    queryFn: () => SubmissionService.getAllList(),
    enabled: baselineSource === 'DIGITAL',
  });

  const listApproved = Array.isArray(approvedSubs) 
    ? approvedSubs.filter((s: any) => s.status === 'Disetujui' && s.id !== sub.id) 
    : [];

  // --- MUTATION: LINK PARENT LINEAGE ---
  const linkParentMutation = useMutation({
    mutationFn: async (payload: any) => {
      return SubmissionService.linkParent(sub.id, payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['submission', sub.id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['submissions'] })
      ]);
      toast.success('Silsilah permohonan berhasil dikaitkan!');
      // Reset form fields
      setSelectedParentId('');
      setLegacySkNumber('');
      setLegacySkDate('');
      setLegacySkDocUrl('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menautkan silsilah permohonan');
    }
  });

  const handleLinkParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (baselineSource === 'DIGITAL') {
      if (!selectedParentId) {
        toast.error('Harap pilih SK lama terdaftar digital.');
        return;
      }
      linkParentMutation.mutate({
        baseline_source: 'DIGITAL',
        parent_id_permohonan: selectedParentId
      });
    } else {
      if (!legacySkNumber || !legacySkDate || !legacySkDocUrl) {
        toast.error('Harap lengkapi semua bidang metadata SK fisik.');
        return;
      }
      linkParentMutation.mutate({
        baseline_source: 'LEGACY',
        replaced_sk_number: legacySkNumber,
        replaced_sk_date: legacySkDate,
        replaced_sk_doc_url: legacySkDocUrl
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('Berkas terlalu besar! Batas maksimal ukuran berkas adalah 10MB.');
      return;
    }

    try {
      setUploadingDoc(true);
      const res = await uploadFileToBackend(file);
      const finalUrl = `${res.file_url}?name=${encodeURIComponent(file.name)}`;
      setLegacySkDocUrl(finalUrl);
      toast.success(`Sukses mengunggah SK fisik: ${file.name}`);
    } catch (err) {
      toast.error('Gagal mengunggah berkas SK fisik ke server.');
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      
      {/* SECTION 1: SPATIAL OVERLAPS ANALYSIS */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2 flex items-center gap-2 select-none">
          <Layers className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Analisis Tumpang Tindih Spasial (PostGIS Detector)</h3>
        </div>

        {isLoadingOverlaps ? (
          <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 text-slate-400 text-xs font-semibold">
            <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
            <span>MENGHITUNG IRISAN POLIGON DI DATABASE POSTGIS...</span>
          </div>
        ) : overlaps.length === 0 ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-none flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Clean Land. Tidak terdeteksi tumpang tindih spasial (overlap &lt; 5%) dengan bidang tanah ber-SK aktif lainnya.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-normal">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5">Potensi Klaim Ganda Terdeteksi</span>
                <p className="text-[10px] leading-relaxed text-slate-500">
                  Poligon batas luar berkas ini bertumpukan secara spasial dengan lokasi SK terbit di bawah ini. Admin disarankan menautkan berkas baru ini sebagai **Revisi** jika memang menggantikan site plan lama.
                </p>
              </div>
            </div>

            <div className="border border-border overflow-hidden">
              <table className="w-full text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left select-none">
                    <th className="p-3">No. Permohonan / SK</th>
                    <th className="p-3">Nama Perumahan</th>
                    <th className="p-3">Persentase Overlap</th>
                    <th className="p-3">Status Berkas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {overlaps.map((item: any) => (
                    <tr key={item.id_permohonan} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-700">{item.submission_no}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.housing_name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 font-bold rounded-none text-[10px]">
                          {item.overlap_percent.toFixed(2)}% Overlap
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-accent/30 text-[#415D43] border border-accent/60 font-bold rounded-none text-[10px]">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: CURRENT ANCESTRY STATUS */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2 flex items-center gap-2 select-none">
          <GitCommit className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Status Silsilah Hubungan Berkas</h3>
        </div>

        {sub.parent_id_permohonan ? (
          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-none space-y-3 font-sans text-xs">
            <div className="flex items-center gap-2 text-teal-900 font-bold">
              <FileCheck className="h-5 w-5 text-teal-600" />
              <span>TERKONEKSI DENGAN BERKAS DIGITAL INTERNAL</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5 border-t border-teal-200/50">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">ID Berkas Induk</span>
                <Link to={`/pengajuan/detail/${sub.parent_id_permohonan}`} className="text-teal-700 font-bold hover:underline">
                  {sub.parent_id_permohonan}
                </Link>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Nomor SK Direvisi</span>
                <span className="font-bold text-slate-700">{sub.replaced_sk_number || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Tanggal Penerbitan SK</span>
                <span className="font-bold text-slate-700">{sub.replaced_sk_date || '-'}</span>
              </div>
            </div>
          </div>
        ) : sub.replaced_sk_number ? (
          <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-none space-y-3 font-sans text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <FileCheck className="h-5 w-5 text-amber-600" />
              <span>TERKONEKSI DENGAN SK FISIK LEGACY (OFFLINE)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5 border-t border-amber-200/50">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Nomor SK Fisik Lama</span>
                <span className="font-bold text-slate-700">{sub.replaced_sk_number}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Tanggal Terbit</span>
                <span className="font-bold text-slate-700">{sub.replaced_sk_date}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Scan Salinan Dokumen SK</span>
                {sub.replaced_sk_doc_url ? (
                  <a href={resolveDocUrl(sub.replaced_sk_doc_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-700 font-bold hover:underline">
                    <FileText className="h-4.5 w-4.5" /> Buka PDF Scan SK Fisik
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Dokumen belum diunggah</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold rounded-none">
            Belum Dikaitkan. Berkas ini saat ini terdaftar sebagai **Site Plan Baru** dan belum ditautkan dengan Surat Keputusan (SK) lama mana pun.
          </div>
        )}
      </div>

      {/* SECTION 3: ADMINISTRATIVE LINKING ACTION PANEL */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2 flex items-center gap-2 select-none">
          <Link2 className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Tautkan Silsilah Rujukan Manual</h3>
        </div>

        <form onSubmit={handleLinkParentSubmit} className="bg-white border border-border p-5 md:p-6 space-y-5 rounded-none">
          <div>
            <span className={labelClass}>Sumber Rujukan Dokumen Lama</span>
            <div className="flex items-center space-x-6 mt-2 select-none">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="radio"
                  value="DIGITAL"
                  checked={baselineSource === 'DIGITAL'}
                  onChange={() => setBaselineSource('DIGITAL')}
                  className="h-4.5 w-4.5 text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">Opsi A: SK Terdaftar Digital</span>
              </label>
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="radio"
                  value="LEGACY"
                  checked={baselineSource === 'LEGACY'}
                  onChange={() => setBaselineSource('LEGACY')}
                  className="h-4.5 w-4.5 text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">Opsi B: SK Fisik / Offline (Scan PDF)</span>
              </label>
            </div>
          </div>

          {/* OPSI A: DIGITAL SELECT DROPDOWN */}
          {baselineSource === 'DIGITAL' && (
            <div className="space-y-1.5 animate-in fade-in duration-300">
              <label className={labelClass}>Pilih SK Lama Terbitan Digital</label>
              {isLoadingApproved ? (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 text-slate-400 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  <span className="font-bold uppercase tracking-wider">Menghubungkan basis data digital...</span>
                </div>
              ) : listApproved.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-none">
                  Tidak ada berkas ber-SK disetujui lainnya di database untuk ditautkan.
                </div>
              ) : (
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Pilih Surat Keputusan (SK) Induk --</option>
                  {listApproved.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.skNumber || s.submissionNo} - {s.housingName} ({s.developerName})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* OPSI B: LEGACY MANUAL METADATA INPUTS */}
          {baselineSource === 'LEGACY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <label className={labelClass}>Nomor SK Fisik Lama</label>
                <input
                  type="text"
                  value={legacySkNumber}
                  onChange={(e) => setLegacySkNumber(e.target.value)}
                  placeholder="Contoh: 600/120/415.19/2020"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Tanggal Penerbitan SK Fisik</label>
                <input
                  type="date"
                  value={legacySkDate}
                  onChange={(e) => setLegacySkDate(e.target.value)}
                  className={inputClass}
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className={labelClass}>Unggah Scan Dokumen SK Lama (PDF)</label>
                
                {uploadingDoc ? (
                  <div className="border border-dashed border-slate-300 p-6 text-center text-xs flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="font-bold text-primary">Mengunggah file ke disk...</span>
                  </div>
                ) : legacySkDocUrl ? (
                  <div className="border border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-teal-600" />
                      <span className="text-xs font-mono truncate max-w-[280px]" title={legacySkDocUrl}>
                        {legacySkDocUrl.split('/').pop()?.split('?')[0]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLegacySkDocUrl('')}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors border-none bg-transparent cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 hover:bg-slate-50/50 p-6 text-center cursor-pointer relative flex flex-col items-center justify-center min-h-[100px] select-none">
                    <input
                      type="file"
                      accept=".pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <UploadCloud className="h-6 w-6 text-slate-400 mb-1" />
                    <p className="text-xs font-bold text-slate-700">Pilih berkas PDF Surat Keputusan</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Maks. ukuran file 10MB</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={linkParentMutation.isPending}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:opacity-90 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-primary text-white font-bold uppercase tracking-wider text-xs rounded-none transition-all gap-2 cursor-pointer outline-none"
            >
              {linkParentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Tautkan Silsilah SK</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
