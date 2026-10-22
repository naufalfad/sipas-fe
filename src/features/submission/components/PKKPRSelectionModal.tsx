import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Building2,
  MapPin,
  Sparkles,
  Search,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { pkkprApi } from '@/features/pkkpr/api/pkkprApi';
import type { PKKPRListItem } from '@/features/pkkpr/types/pkkpr.types';
import { cn } from '@/lib/utils';

interface PKKPRSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPKKPR: (item: PKKPRListItem) => Promise<void>;
  currentSelectedPkkprId?: string;
  isSelecting?: boolean;
}

export const PKKPRSelectionModal = ({
  isOpen,
  onClose,
  onSelectPKKPR,
  currentSelectedPkkprId,
  isSelecting = false,
}: PKKPRSelectionModalProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIdInProgress, setSelectedIdInProgress] = useState<string | null>(null);

  // Ambil daftar SK PKKPR milik pemohon
  const { data: rawItems = [], isLoading, isError, error } = useQuery({
    queryKey: ['my-approved-sk-for-modal'],
    queryFn: () => pkkprApi.getMyApprovedSK(),
    enabled: isOpen,
    staleTime: 30000,
  });

  // FILTER KETAT PERSYARATAN: Hanya PKKPR yang statusnya DISETUJUI dan SUDAH MEMILIKI NOMOR SK RESMI (TTE Kadis sah)
  const approvedSKs = useMemo(() => {
    return (rawItems || []).filter((item) => {
      const isApproved = String(item.status).toUpperCase() === 'DISETUJUI';
      const hasOfficialSK = Boolean(item.sk_number && item.sk_number.trim().length > 0);
      return isApproved && hasOfficialSK;
    });
  }, [rawItems]);

  // Filter pencarian teks
  const filteredSKs = useMemo(() => {
    if (!searchQuery.trim()) return approvedSKs;
    const q = searchQuery.toLowerCase();
    return approvedSKs.filter((item) => {
      const sk = (item.sk_number || '').toLowerCase();
      const no = (item.submission_no || '').toLowerCase();
      const name = (item.applicant_name || '').toLowerCase();
      const village = (item.location_village || '').toLowerCase();
      const district = (item.location_district || '').toLowerCase();
      return sk.includes(q) || no.includes(q) || name.includes(q) || village.includes(q) || district.includes(q);
    });
  }, [approvedSKs, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = async (item: PKKPRListItem) => {
    try {
      setSelectedIdInProgress(item.id);
      await onSelectPKKPR(item);
      onClose();
    } finally {
      setSelectedIdInProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left">
        
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-border bg-slate-50 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-[#e8f2ea] border border-[#A1CCA5] px-2 py-0.5">
                  Langkah Awal (Step 0)
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  Regulasi Perbup Bogor No. 4/2025
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Pilih SK PKKPR yang Telah Disahkan
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pilih berkas PKKPR resmi yang telah disetujui dinas. Seluruh data pemohon, lokasi, intensitas ruang, dan koordinat poligon tapak akan otomatis terisi dan <strong>tetap dapat disesuaikan (editable)</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer border-none bg-transparent"
            title="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-border bg-white flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan No. SK, No. Berkas, Desa, Kecamatan, atau Nama..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 focus:outline-none focus:border-primary font-sans placeholder:text-slate-400"
            />
          </div>
          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
            {filteredSKs.length} SK Sah Ditemukan
          </span>
        </div>

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3.5 bg-slate-50/40">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Memeriksa daftar SK PKKPR resmi...</p>
            </div>
          ) : isError ? (
            <div className="p-6 border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal memuat daftar SK PKKPR</p>
                <p className="mt-1 text-rose-700">{(error as any)?.message || 'Terjadi kesalahan pada server saat menghubungi modul PKKPR.'}</p>
              </div>
            </div>
          ) : filteredSKs.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-300 bg-white text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-amber-50 rounded-full border border-amber-200 text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-slate-800">
                  {searchQuery ? 'Tidak Ada SK yang Cocok dengan Pencarian' : 'Belum Ada SK PKKPR yang Telah Disahkan'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {searchQuery
                    ? `Tidak ditemukan SK PKKPR dengan kata kunci "${searchQuery}". Coba gunakan kata kunci nomor SK atau lokasi lain.`
                    : 'Permohonan site plan menghendaki dokumen PKKPR yang telah tuntas diverifikasi teknis, disidangkan di FPR, dan diterbitkan SK resminya oleh Kepala Dinas.'}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/pkkpr')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-primary bg-[#e8f2ea] border border-[#A1CCA5] hover:bg-[#d6e9da] transition-all cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka Modul PKKPR
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer border border-slate-300"
                >
                  Lanjutkan Pengajuan Mandiri
                </button>
              </div>
            </div>
          ) : (
            filteredSKs.map((item) => {
              const isSelected = item.id === currentSelectedPkkprId;
              const isThisProcessing = selectedIdInProgress === item.id || isSelecting;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 bg-white border transition-all text-left relative",
                    isSelected
                      ? "border-primary bg-primary/[0.02] shadow-sm ring-1 ring-primary/20"
                      : "border-slate-200 hover:border-primary/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      
                      {/* Badge No SK & Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-300">
                          {item.sk_number}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-[#e8f2ea] text-primary border border-[#A1CCA5]">
                          <CheckCircle2 className="h-3 w-3" />
                          SK Sah & Berlaku
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          No. Berkas: {item.submission_no}
                        </span>
                      </div>

                      {/* Nama Pemohon & Proyek */}
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 truncate">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.applicant_name}</span>
                        <span className="text-[10px] font-normal text-slate-500 uppercase px-1.5 py-0.2 bg-slate-100 border border-slate-200">
                          {item.category?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Lokasi Administrasi & Luas Disetujui */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          Desa {item.location_village || '-'}, Kec. {item.location_district || '-'}
                        </span>
                        <span className="font-semibold text-slate-700">
                          Luas Disetujui: <strong className="font-mono text-slate-900">{(item.proposed_land_area_m2 || 0).toLocaleString('id-ID')} m²</strong>
                        </span>
                        {item.created_at && (
                          <span className="text-slate-400 text-[10px]">
                            Terdaftar: {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Tombol Pilih & Muat Data */}
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelect(item)}
                        disabled={isThisProcessing}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer",
                          isSelected
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600"
                            : "bg-primary hover:opacity-90 text-white border border-primary"
                        )}
                      >
                        {isThisProcessing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Memuat Data...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{isSelected ? 'Gunakan Ulang SK Ini' : 'Pilih & Muat Data'}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Modal: Opsi Non-Internal / Manual */}
        <div className="px-6 py-4 border-t border-border bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
          <div className="text-slate-500 text-[11px]">
            * Dokumen yang dipilih akan mengisi data formulir site plan secara cerdas (smart autofill). Anda dapat mengubah seluruh isian data kapan saja.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-300 rounded-none cursor-pointer whitespace-nowrap bg-white"
          >
            Lewati / Lanjutkan Manual (KKPR OSS)
          </button>
        </div>

      </div>
    </div>
  );
};
