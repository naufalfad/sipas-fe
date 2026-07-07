import { useFormContext } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { LabelWithInfo } from './LabelWithInfo';
import { ContextualUploadBox } from './ContextualUploadBox';
import { inputClass } from './styles';

export const ConsultantSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          7. Identitas Biro Konsultan Perencana
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Data profesional berlisensi penanggung jawab perhitungan teknis gambar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <div className="md:col-span-2">
          <LabelWithInfo label="Nama Biro / Perusahaan Konsultan Perencana" helpText="Nama resmi resmi badan hukum biro konsultan tata ruang/arsitektur yang ditunjuk pemohon." />
          <input {...register('consultant.companyName')} type="text" className={inputClass} placeholder="PT / CV Biro Rekayasa Geospasial..." />
          {errors.consultant?.companyName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.companyName.message}</p>}
        </div>
        <div>
          <LabelWithInfo label="Nama Arsitek / Praktisi (Sertifikasi SKEA)" helpText="Nama penanggung jawab gambar arsitek bersertifikat keahlian resmi (IAI/SKEA)." />
          <input {...register('consultant.consultantName')} type="text" className={inputClass} placeholder="Ar. Nama Lengkap, IAI" />
          {errors.consultant?.consultantName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.consultantName.message}</p>}
        </div>
        <div>
          <LabelWithInfo label="Nomor Kontak PIC Konsultan" helpText="Nomor HP/WhatsApp penanggung jawab lapangan dari pihak biro perencana." />
          <input
            type="text"
            className={inputClass}
            placeholder="Nomor telepon penanggung jawab..."
            {...register('consultant.picName', {
              onChange: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
            })}
          />
          {errors.consultant?.picName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.picName.message}</p>}
        </div>

        {/* ─── DYNAMIC UPLOAD: SKA / Sertifikat Keahlian ─── */}
        <div className="md:col-span-2 pt-2 border-t border-slate-100">
          <ContextualUploadBox
            label="Unggah Scan Sertifikat Keahlian (SKA / SKEA) Arsitek"
            fieldKey="document.skaDoc"
            helpText="Unggah bukti sertifikat lisensi arsitek aktif (IAI) guna jaminan tanggung jawab teknis gambar."
          />
        </div>
      </div>
    </div>
  );
};
