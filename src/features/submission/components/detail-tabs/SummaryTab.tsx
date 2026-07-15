/**
 * ============================================================================
 * GEOSIPAS COMPONENT — SummaryTab [SummaryTab.tsx] (REVISED v5.1)
 * ============================================================================
 * Peran: Komponen tab ringkasan untuk menampilkan rangkuman berkas pengajuan.
 *        Diperbarui penuh untuk merender seksi "Rujukan Dokumen Terdahulu" (Silsilah)
 *        secara elegan di antara info umum dan lampiran dokumen utama.
 * ============================================================================
 */

import { File, MapPin, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useState } from 'react';

const getDocCategoryLabel = (key?: string) => {
  if (key === 'ktpDoc') return 'Scan KTP Pemohon / Penanggung Jawab';
  if (key === 'nibDoc') return 'Scan NIB Perusahaan';
  if (key === 'legalDoc') return 'Sertifikat Kepemilikan Lahan / Hak Atas Tanah';
  if (key === 'technicalDoc') return 'Gambar Rencana Teknis CAD / AMDAL';
  if (key === 'supportDoc') return 'SK KKPR Awal / IPPT';
  if (key === 'supportDoc2') return 'Andalalin / Persetujuan Teknis Lingkungan';
  if (key === 'skaDoc') return 'Scan Sertifikat Keahlian (SKA) Arsitek';
  if (key === 'cadDoc') return 'File Peta Koordinat CAD (.dwg/.dxf)';
  return 'Dokumen Lampiran Pendukung';
};

const getDocFormatLabel = (type?: string) => {
  if (!type) return 'Tidak diketahui';
  return type.toUpperCase();
};

interface SummaryTabProps {
  sub: any;
}

export const SummaryTab = ({ sub }: SummaryTabProps) => {
  const [openInfo, setOpenInfo] = useState(true);
  const [openSilsilah, setOpenSilsilah] = useState(true); // State baru untuk collapsible silsilah
  const [openDocs, setOpenDocs] = useState(true);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* ─── SEKSI 1: INFORMASI UMUM PROYEK ─── */}
      <div>
        <div className="flex items-center justify-between border-b border-border pb-2 mb-4 select-none">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Informasi Umum Proyek</h3>
          <button type="button" onClick={() => setOpenInfo((v) => !v)} className="text-slate-500 cursor-pointer outline-none border-none bg-transparent">
            {openInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        {openInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs text-left">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Proyek/Kegiatan</span>
              <span className="text-sm font-bold text-[#111D13] leading-tight block">{sub.housingName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Developer Pengaju</span>
              <span className="text-sm font-bold text-[#111D13] leading-tight block">{sub.developerName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Lahan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.landArea ? `${sub.landArea.toLocaleString('id-ID')} m²` : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tanggal Diajukan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.submissionDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kategori Pengajuan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.submissionDetails?.category || 'PERUMAHAN'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jenis Permohonan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.submissionDetails?.submissionType || 'BARU'}</span>
            </div>
            <div className="md:col-span-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Lokasi Administratif</span>
              <span className="text-xs font-semibold text-slate-600 flex items-start gap-1.5 leading-normal">
                <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                {sub.location.address}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── BARU: SEKSI 1.5: RUJUKAN DOKUMEN TERDAHULU (SILSILAH) ─── */}
      {sub.submissionDetails?.submissionType === 'REVISI' && (
        <div>
          <div className="flex items-center justify-between border-b border-border pb-2 mb-4 select-none">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Rujukan Dokumen Terdahulu (Silsilah)</h3>
            <button type="button" onClick={() => setOpenSilsilah((v) => !v)} className="text-slate-500 cursor-pointer outline-none border-none bg-transparent">
              {openSilsilah ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          {openSilsilah && (
            <div className="p-4 border-l-2 border-amber-500 bg-[#fdfbf7] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-left animate-in fade-in duration-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor SK Terdahulu</span>
                <span className="text-xs font-mono font-bold text-slate-800 block">
                  {sub.replaced_sk_number || '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tanggal Terbit</span>
                <span className="text-xs font-bold text-slate-800 block">
                  {sub.replaced_sk_date || '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Salinan SK Lama</span>
                {sub.replaced_sk_doc_url ? (
                  <a
                    href={sub.replaced_sk_doc_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline mt-1 leading-none decoration-none"
                  >
                    <Download className="h-3.5 w-3.5" /> Buka Salinan SK Lama
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 block mt-1 font-semibold">Tidak ada lampiran berkas</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SEKSI 2: BERKAS LAMPIRAN PENGAJUAN ─── */}
      <div>
        <div className="flex items-center justify-between border-b border-border pb-2 mb-3 select-none">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Berkas Lampiran Pengajuan</h3>
          <button type="button" onClick={() => setOpenDocs((v) => !v)} className="text-slate-500 cursor-pointer outline-none border-none bg-transparent">
            {openDocs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {openDocs && (
          <div className="space-y-3">
            <div className="max-h-56 overflow-y-auto pr-2">
              {(sub.documents ?? []).map((doc: any) => (
                <div key={doc?.id ?? doc?.name ?? Math.random()} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-100/50 border border-border/40 transition-colors text-left">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-white border border-border text-primary shrink-0">
                      <File className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase tracking-wider text-teal-600 block mb-0.5">
                        {getDocCategoryLabel(doc?.key)}
                      </span>
                      <h5 className="font-bold text-xs text-[#111D13] truncate" title={doc?.name}>{doc?.name || 'Berkas tanpa nama'}</h5>
                      <span className="text-[10px] text-slate-400 block mt-1">Format: {getDocFormatLabel(doc?.type)} • Diunggah: {doc?.uploadedAt || '-'}</span>
                    </div>
                  </div>
                  <a
                    href={doc?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-primary hover:underline shrink-0 pl-3 decoration-none"
                  >
                    Unduh Berkas
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};