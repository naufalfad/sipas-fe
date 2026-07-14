import { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { ContextualUploadBox } from './ContextualUploadBox';
import { FormattedInput } from './FormattedInput';

export const StatementSection = () => {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'compensations',
  });

  const [hasDeviations, setHasDeviations] = useState<boolean>(false);
  const compensationsVal = watch('compensations');

  useEffect(() => {
    if (compensationsVal && compensationsVal.length > 0) {
      setHasDeviations(true);
    }
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Bagian - Bersih & Tanpa Label Nomor Langkah */}
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          Pernyataan Tanggung Jawab & Deklarasi Mandiri
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Pernyataan komitmen keabsahan data dan kesediaan pemenuhan kompensasi alih fungsi lahan.
        </p>
      </div>

      {/* ─── MODUL DEKLARASI KOMPENSASI MANDIRI (SELF-DECLARATION) ─── */}
      <div className="border border-border p-5 bg-white space-y-4 text-left">
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Pernyataan Deviasi Tata Ruang & Kompensasi Lahan
          </label>
          <span className="text-[10px] text-slate-500 block leading-normal">
            Apakah rencana tapak perumahan Anda menabrak batas tata ruang lindung, mengambil lahan pertanian pangan (LP2B), gumuk pasir, atau ruang terbuka hijau (RTH) yang mewajibkan penyediaan lahan kompensasi pengganti sesuai dengan RDTR?
          </span>
          
          <div className="flex items-center space-x-6 mt-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                name="has_deviations" 
                checked={!hasDeviations}
                onChange={() => {
                  setHasDeviations(false);
                  setValue('compensations', []);
                }}
                className="h-4 w-4 text-primary border-slate-300 focus:ring-primary cursor-pointer" 
              />
              <span className="text-xs font-bold text-slate-700">Tidak Ada Deviasi Lahan</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                name="has_deviations" 
                checked={hasDeviations}
                onChange={() => {
                  setHasDeviations(true);
                  if (!compensationsVal || compensationsVal.length === 0) {
                    append({
                      type: 'LAHAN_SAWAH',
                      requiredAreaM2: 0,
                      fulfillmentMethod: 'PENYEDIAAN_FISIK_OFFSITE',
                      locationAddress: '',
                      nominalAmount: 0,
                    });
                  }
                }}
                className="h-4 w-4 text-primary border-slate-300 focus:ring-primary cursor-pointer" 
              />
              <span className="text-xs font-bold text-slate-700">Ya, Memerlukan Lahan Kompensasi Pengganti</span>
            </label>
          </div>
        </div>

        {hasDeviations && (
          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Daftar Deklarasi Lahan Kompensasi Pengganti</span>
              <button
                type="button"
                onClick={() => append({
                  type: 'LAHAN_SAWAH',
                  requiredAreaM2: 0,
                  fulfillmentMethod: 'PENYEDIAAN_FISIK_OFFSITE',
                  locationAddress: '',
                  nominalAmount: 0,
                })}
                className="px-2.5 py-1 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Lahan
              </button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-[#DAE4DB] bg-slate-50/40 relative space-y-3">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Tipe Lahan Kompensasi</label>
                    <select
                      {...register(`compensations.${index}.type` as const)}
                      className="w-full text-xs border border-border p-2 bg-white outline-none focus:border-primary"
                    >
                      <option value="LAHAN_SAWAH">Lahan Pertanian / Sawah Pengganti (LP2B)</option>
                      <option value="LAHAN_MAKAM_FISIK">Lahan Makam Fisik Tambahan (Off-Site)</option>
                      <option value="LAHAN_MAKAM_UANG">Kompensasi Uang Makam</option>
                      <option value="PSU_FISIK_TAMBAHAN">PSU Fisik Tambahan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Metode Pemenuhan</label>
                    <select
                      {...register(`compensations.${index}.fulfillmentMethod` as const)}
                      className="w-full text-xs border border-border p-2 bg-white outline-none focus:border-primary"
                    >
                      <option value="PENYEDIAAN_FISIK_OFFSITE">Penyediaan Lahan Fisik Pengganti (Off-site)</option>
                      <option value="KOMPENSASI_UANG">Kompensasi Berupa Uang Kas Daerah</option>
                      <option value="KERJASAMA_PIHAK_KETIGA">Kerja Sama Lahan Pihak Ketiga</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Luas Kompensasi Wajib (m²)</label>
                    <FormattedInput
                      name={`compensations.${index}.requiredAreaM2`}
                      placeholder="Contoh: 1.000"
                      unit="m²"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Nilai Kompensasi Lahan (Rp) - Opsional</label>
                    <FormattedInput
                      name={`compensations.${index}.nominalAmount`}
                      placeholder="Contoh: 50.000.000"
                      prefix="Rp "
                    />
                  </div>

                  <div className="md:col-span-2 text-left">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Alamat Lengkap / Keterangan Lokasi</label>
                    <input
                      type="text"
                      {...register(`compensations.${index}.locationAddress` as const)}
                      placeholder="Contoh: Blok C, Kampung Sawah, Desa Bojonggede, Bogor"
                      className="w-full text-xs border border-border p-2 bg-white outline-none focus:border-primary"
                    />
                  </div>
                  <div className="md:col-span-2 text-left">
                    <ContextualUploadBox
                      label="Unggah Bukti Legalitas Lahan Kompensasi (AJB/SHM/Kuitansi)"
                      fieldKey={`compensations.${index}.documentUrl` as const}
                      helpText="Unggah dokumen sertifikat tanah kompensasi pengganti, AJB, atau slip bukti retribusi pembayaran kas daerah."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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