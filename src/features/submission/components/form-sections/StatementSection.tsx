import { useFormContext } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';

export const StatementSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Bagian - Bersih & Tanpa Label Nomor Langkah */}
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          Pernyataan Tanggung Jawab Mutlak
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Pernyataan komitmen keabsahan data dan kepatuhan hukum terhadap rencana tata ruang daerah.
        </p>
      </div>

      <div className="bg-[#e8f2ea]/40 p-6 border border-border text-left">
        <p className="text-xs text-slate-700 mb-4 leading-relaxed font-medium">
          Dengan menandai persetujuan ini, saya sebagai kuasa/pemohon menyatakan secara sadar:
          <br /><span className="text-primary font-bold">1.</span> Seluruh berkas lampiran, koordinat geospasial, dan data arsitektural yang diunggah adalah sah, akurat, dan dapat dipertanggungjawabkan di mata hukum.
          <br /><span className="text-primary font-bold">2.</span> Lahan permohonan bersatus bersih (*clear & clean*), bebas sengketa batas, dan mematuhi koridor rencana ruang tata kota.
          <br /><span className="text-primary font-bold">3.</span> Saya bersedia mematuhi sanksi pembatalan pengesahan tapak jika di kemudian hari ditemukan ketidaksesuaian analisis lingkungan di lapangan.
        </p>
        <label className="flex items-start space-x-3 cursor-pointer mt-4 pt-4 border-t border-border/80">
          <input type="checkbox" {...register('statement.agreed')} className="mt-0.5 h-4 w-4 rounded-none border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer" />
          <span className="text-xs font-bold text-slate-800">
            Saya menyetujui seluruh ketentuan dan klausul surat pernyataan tanggung jawab mutlak di atas.
          </span>
        </label>
        {errors.statement?.agreed && <p className="text-xs text-rose-500 mt-2 font-bold">{errors.statement.agreed.message}</p>}
      </div>
    </div>
  );
};