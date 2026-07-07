import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { LabelWithInfo } from './LabelWithInfo';
import { FormattedInput } from './FormattedInput';
import { ContextualUploadBox } from './ContextualUploadBox';
import { cn } from '@/lib/utils';
import { inputClass } from './styles';

export const SpatialSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  const landArea = watch('location.landArea') || 0;
  const greenAreaVal = watch('spatial.greenArea');
  const [greenAreaPercent, setGreenAreaPercent] = useState<string>('');

  const handleLuasChangeVal = (val: number | undefined) => {
    if (landArea > 0 && val !== undefined && !isNaN(val)) {
      setGreenAreaPercent(((val / landArea) * 100).toFixed(1));
    } else {
      setGreenAreaPercent('');
    }
  };

  const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Math.max(0, Number(e.target.value));
    setGreenAreaPercent(e.target.value === '' ? '' : String(percent));
    if (landArea > 0 && !isNaN(percent)) {
      setValue('spatial.greenArea', Math.round((percent / 100) * landArea));
    }
  };

  useEffect(() => {
    if (landArea > 0 && greenAreaVal) {
      setGreenAreaPercent(((greenAreaVal / landArea) * 100).toFixed(1));
    }
  }, [landArea, greenAreaVal]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Bagian - Bersih & Tanpa Label Nomor Langkah */}
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          Kesesuaian Tata Ruang
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Data validasi KKPR (Kesesuaian Kegiatan Pemanfaatan Ruang) dan alokasi ruang terbuka hijau daerah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <div>
          <LabelWithInfo label="Nomor SK KKPR / IPPT" helpText="Nomor Surat Keputusan Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) atau Izin Peruntukan Penggunaan Tanah (IPPT)." />
          <input {...register('spatial.kkprNumber')} type="text" className={inputClass} placeholder="No. SK KKPR Dinas..." />
          {errors.spatial?.kkprNumber && <p className="text-xs text-rose-500 mt-1">{errors.spatial.kkprNumber.message}</p>}
        </div>

        <div>
          <LabelWithInfo label="Kriteria Peruntukan Lahan (Zonasi Perda)" helpText="Kriteria rencana peruntukan zonasi perumahan atau komersial sesuai Perda Rencana Tata Ruang Wilayah (RTRW)." />
          <input {...register('spatial.landUse')} type="text" className={inputClass} placeholder="Contoh: Kawasan Hunian Kepadatan Sedang" />
          {errors.spatial?.landUse && <p className="text-xs text-rose-500 mt-1">{errors.spatial.landUse.message}</p>}
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border border-[#DAE4DB] bg-[#f4f7f4]/20 p-4">
          <div>
            <LabelWithInfo label="Luas Rencana Fasum / RTH Lahan (m²)" helpText={`Luas area untuk Fasilitas Umum (Fasum) dan Ruang Terbuka Hijau (RTH) minimal 20% dari total luas lahan (${landArea > 0 ? (landArea * 0.2).toLocaleString('id-ID') : '0'} m²).`} />
            <FormattedInput name="spatial.greenArea" placeholder="Minimal 20% dari total luas" unit="m²" onChangeCustom={handleLuasChangeVal} />
            {errors.spatial?.greenArea && <p className="text-xs text-rose-500 mt-1">{errors.spatial.greenArea.message}</p>}
          </div>

          <div>
            <LabelWithInfo label="Kalkulator Persentase RTH (%)" helpText={`Masukkan target persentase atau hitung otomatis. Luas Lahan Aktif: ${landArea.toLocaleString('id-ID')} m².`} />
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={greenAreaPercent}
                onChange={handlePercentChange}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className={inputClass}
                placeholder="Contoh: 20"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">%</span>
            </div>
            {greenAreaPercent && !isNaN(Number(greenAreaPercent)) && (
              <span className={cn(
                "text-[10px] font-bold mt-1 block",
                Number(greenAreaPercent) >= 20 ? "text-primary" : "text-rose-600"
              )}>
                {Number(greenAreaPercent) >= 20 ? "✓ Memenuhi standar minimal 20%" : "⚠ Kurang dari standar minimal 20%"}
              </span>
            )}
          </div>
        </div>

        {/* ─── DYNAMIC UPLOAD: SK KKPR / IPPT Awal ─── */}
        <div className="md:col-span-2 pt-2 border-t border-slate-100">
          <ContextualUploadBox
            label="Unggah Dokumen SK KKPR / IPPT Awal"
            fieldKey="document.supportDoc"
            helpText="Unggah dokumen keputusan KKPR atau izin prinsip yang didapatkan dari BKPRD/DPMPTSP."
          />
        </div>
      </div>
    </div>
  );
};