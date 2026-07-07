import { useFormContext } from 'react-hook-form';
import { CheckCircle2, Info } from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { cn } from '@/lib/utils';

export const DocumentSection = () => {
  const { watch } = useFormContext<FullSubmissionFormValues>();

  // Membaca state seluruh file yang diunggah secara asinkron di sepanjang langkah 1-7
  const legalDoc = watch('document.legalDoc');
  const technicalDoc = watch('document.technicalDoc');
  const supportDoc = watch('document.supportDoc');
  const supportDoc2 = watch('document.supportDoc2');
  const skaDoc = watch('document.skaDoc');
  const cadDoc = watch('document.cadDoc');

  const docSummary = [
    { name: 'Sertifikat Tanah & KTP (Langkah 3)', value: legalDoc, mandatory: true },
    { name: 'File Peta Koordinat CAD (Langkah 4)', value: cadDoc, mandatory: true },
    { name: 'Gambar Rencana Teknis CAD (Langkah 6)', value: technicalDoc, mandatory: true },
    { name: 'SK KKPR Awal / IPPT (Langkah 5)', value: supportDoc, mandatory: true },
    { name: 'Andalalin / Persetujuan Teknis Limbah B3 (Langkah 6)', value: supportDoc2, mandatory: false },
    { name: 'Scan Sertifikat Keahlian (SKA) Arsitek (Langkah 7)', value: skaDoc, mandatory: true },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          8. Rekapitulasi Berkas Dokumen Terunggah
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Guna mematuhi asas transparansi, pastikan seluruh dokumen administratif dan spasial di bawah ini telah terisi secara sah.</p>
      </div>

      <div className="bg-[#e8f2ea]/30 border border-primary/10 p-4 text-left select-none mb-4">
        <h5 className="text-[10px] font-bold text-[#111D13] uppercase tracking-wide flex items-center gap-1.5 mb-1">
          <Info size={14} className="text-primary" />
          Status Berkas Pendaftaran Terdistribusi
        </h5>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Sistem GEOSIPAS v3.0 mendistribusikan penempatan tombol unggah berkas secara langsung di langkah (*step*) pengisian data yang relevan agar meminimalkan beban ingatan Anda (*low cognitive load*).
        </p>
      </div>

      {/* Grid Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {docSummary.map((doc, idx) => {
          const isUploaded = !!doc.value;
          return (
            <div
              key={idx}
              className={cn(
                "p-4 border transition-all duration-300 flex items-center justify-between rounded-none shadow-none",
                isUploaded
                  ? "bg-[#e8f2ea]/20 border-primary/40 text-primary"
                  : doc.mandatory
                    ? "bg-amber-50/20 border-amber-200 text-amber-800 animate-pulse"
                    : "bg-slate-50/50 border-slate-200 text-slate-400"
              )}
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs truncate">{doc.name}</h4>
                <p className="text-[10px] opacity-75 mt-1 leading-none font-medium">
                  {isUploaded
                    ? `✓ Berkas Siap: ${typeof doc.value === 'string' ? doc.value.split('/').pop() : 'OK'}`
                    : doc.mandatory
                      ? '⚠ Wajib Diisi (Kembali ke langkah bersangkutan)'
                      : 'Pilihan (Opsional)'}
                </p>
              </div>

              {isUploaded ? (
                <span className="h-6 w-6 bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 rounded-full border border-white">
                  ✓
                </span>
              ) : doc.mandatory ? (
                <span className="h-6 w-6 bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 rounded-full border border-white">
                  !
                </span>
              ) : (
                <span className="h-6 w-6 bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0 rounded-full border-none">
                  -
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
