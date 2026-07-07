import { useFormContext } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { LabelWithInfo } from './LabelWithInfo';
import { inputClass } from './styles';

export const SubmissionSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          2. Data Pengajuan
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Klasifikasi administrasi jenis dokumen site plan yang diajukan ke dinas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <div>
          <LabelWithInfo label="Jenis Permohonan Site Plan" helpText="Jenis permohonan yang diajukan: pengesahan baru, revisi site plan terbit terdahulu, atau perpanjangan SK." />
          <select {...register('submission.submissionType')} className={inputClass}>
            <option value="BARU">Site Plan Baru (Lahan Bersih)</option>
            <option value="REVISI">Revisi Pengesahan Site Plan</option>
            <option value="PERPANJANGAN">Perpanjangan Masa Berlaku</option>
          </select>
        </div>

        <div>
          <LabelWithInfo label="Kategori Rencana Tapak" helpText="Kategori pemanfaatan lahan (misal: perumahan subsidi/komersil, gedung komersil, fasilitas umum/TPU, atau kawasan industri)." />
          <select {...register('submission.category')} className={inputClass}>
            <option value="PERUMAHAN">Perumahan</option>
            <option value="NON_PERUMAHAN">Non-Perumahan / Komersil</option>
            <option value="FASUM">Fasilitas Umum (Fasum)</option>
            <option value="INDUSTRI">Kawasan Industri</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <LabelWithInfo label="Nama Kegiatan / Pembangunan" helpText="Nama komersial pembangunan yang direncanakan untuk dicantumkan dalam SK resmi pengesahan rencana tapak." />
          <input {...register('submission.activityName')} type="text" placeholder="Contoh: Perumahan Pakuan Green Regency" className={inputClass} />
          {errors.submission?.activityName && <p className="text-xs text-rose-500 mt-1">{errors.submission.activityName.message}</p>}
        </div>
      </div>
    </div>
  );
};
