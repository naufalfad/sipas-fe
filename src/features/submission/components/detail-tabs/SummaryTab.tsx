import { File, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

// ─── PURE FABRICATION: RESOLVER LABEL DOKUMEN BERSIH (Decoupled from Steps) ───
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

interface SummaryTabProps {
  sub: any;
}

export const SummaryTab = ({ sub }: SummaryTabProps) => {
  const [openInfo, setOpenInfo] = useState(true);
  const [openDocs, setOpenDocs] = useState(true);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Informasi Umum Proyek</h3>
          <button type="button" onClick={() => setOpenInfo((v) => !v)} className="text-slate-500">
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

      <div>
        <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Berkas Lampiran Pengajuan</h3>
          <button type="button" onClick={() => setOpenDocs((v) => !v)} className="text-slate-500">
            {openDocs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {openDocs && (
          <div className="space-y-3">
            <div className="max-h-56 overflow-y-auto pr-2">
              {sub.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-100/50 border border-border/40 transition-colors text-left">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-white border border-border text-primary shrink-0">
                      <File className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase tracking-wider text-teal-600 block mb-0.5">
                        {getDocCategoryLabel(doc.key)}
                      </span>
                      <h5 className="font-bold text-xs text-[#111D13] truncate" title={doc.name}>{doc.name}</h5>
                      <span className="text-[10px] text-slate-400 block mt-1">Format: {doc.type.toUpperCase()} • Diunggah: {doc.uploadedAt}</span>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-primary hover:underline shrink-0 pl-3"
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