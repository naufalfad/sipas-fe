import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import bogorRegions from '../../data/bogorRegions.json';
import { LabelWithInfo } from './LabelWithInfo';
import { FormattedInput } from './FormattedInput';
import { ContextualUploadBox } from './ContextualUploadBox';
import { inputClass } from './styles';

export const LocationSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  const selectedDistrict = watch('location.district');

  // Cari desa/kelurahan yang sesuai dari kecamatan terpilih di bogorRegions.json
  const activeDistrictObj = bogorRegions.find((r) => r.nama_kecamatan === selectedDistrict);
  const villagesList = activeDistrictObj ? activeDistrictObj.desa_kelurahan.map((d) => d.nama) : [];

  // Saat Kecamatan berubah, kosongkan Desa/Kelurahan jika tidak berada di daftar yang sesuai
  useEffect(() => {
    if (selectedDistrict) {
      const currentVillage = watch('location.village');
      if (currentVillage && !villagesList.includes(currentVillage)) {
        setValue('location.village', '');
      }
    } else {
      setValue('location.village', '');
    }
  }, [selectedDistrict, setValue, villagesList, watch]);

  // Pastikan Provinsi dan Kabupaten/Kota selalu terisi default-nya (karena dibatasi readOnly)
  const province = watch('location.province');
  const city = watch('location.city');

  useEffect(() => {
    if (!province) {
      setValue('location.province', 'Jawa Barat');
    }
    if (!city) {
      setValue('location.city', 'Kabupaten Bogor');
    }
  }, [province, city, setValue]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Bagian - Bersih & Tanpa Label Nomor Langkah */}
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          Lokasi Administrasi Lahan
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Informasi letak geografis dan legalitas kepemilikan tanah tapak pembangunan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <div className="md:col-span-2">
          <LabelWithInfo label="Nama Lokasi Tapak" helpText="Identitas khusus lokasi tapak pembangunan (misalnya: Sektor 3, Blok C, dsb)." />
          <input {...register('location.locationName')} type="text" placeholder="Contoh: Blok A Sektor III" className={inputClass} />
          {errors.location?.locationName && <p className="text-xs text-rose-500 mt-1">{errors.location.locationName.message}</p>}
        </div>

        <div>
          <LabelWithInfo label="Provinsi" helpText="Provinsi wilayah proyek (Jawa Barat - Terkunci)." />
          <input
            {...register('location.province')}
            type="text"
            className="w-full px-3.5 py-2 bg-slate-50 border border-border text-slate-500 font-sans text-xs rounded-none cursor-not-allowed select-none bg-slate-50/50"
            readOnly
          />
          {errors.location?.province && <p className="text-xs text-rose-500 mt-1">{errors.location.province.message}</p>}
        </div>
        <div>
          <LabelWithInfo label="Kabupaten / Kota" helpText="Kabupaten atau Kota wilayah proyek (Kabupaten Bogor - Terkunci)." />
          <input
            {...register('location.city')}
            type="text"
            className="w-full px-3.5 py-2 bg-slate-50 border border-border text-slate-500 font-sans text-xs rounded-none cursor-not-allowed select-none bg-slate-50/50"
            readOnly
          />
          {errors.location?.city && <p className="text-xs text-rose-500 mt-1">{errors.location.city.message}</p>}
        </div>

        <div>
          <LabelWithInfo label="Kecamatan" helpText="Nama Kecamatan tempat lokasi proyek di Kabupaten Bogor." />
          <select {...register('location.district')} className={inputClass}>
            <option value="">-- Pilih Kecamatan --</option>
            {bogorRegions.map((region) => (
              <option key={region.id_kecamatan} value={region.nama_kecamatan}>
                {region.nama_kecamatan}
              </option>
            ))}
          </select>
          {errors.location?.district && <p className="text-xs text-rose-500 mt-1">{errors.location.district.message}</p>}
        </div>
        <div>
          <LabelWithInfo label="Desa / Kelurahan" helpText="Desa atau Kelurahan lokasi geografis lahan proyek berada." />
          <select {...register('location.village')} className={inputClass} disabled={!selectedDistrict}>
            <option value="">-- Pilih Desa / Kelurahan --</option>
            {villagesList.map((villageName) => (
              <option key={villageName} value={villageName}>
                {villageName}
              </option>
            ))}
          </select>
          {errors.location?.village && <p className="text-xs text-rose-500 mt-1">{errors.location.village.message}</p>}
        </div>

        <div className="md:col-span-2">
          <LabelWithInfo label="Alamat Lengkap Lokasi Proyek" helpText="Alamat fisik lengkap (Nama Jalan, RT/RW, Dusun) guna keperluan peninjauan lapangan (ground-truthing)." />
          <textarea {...register('location.fullAddress')} rows={2} className={inputClass} placeholder="Jl. Contoh Blok A No.00 RT00/00" />
          {errors.location?.fullAddress && <p className="text-xs text-rose-500 mt-1">{errors.location.fullAddress.message}</p>}
        </div>

        <div>
          <LabelWithInfo label="Luas Lahan Bersih (m²)" helpText="Total luas bersih kepemilikan lahan yang akan diproses perizinan site plan-nya." />
          <FormattedInput name="location.landArea" placeholder="Contoh: 15000" unit="m²" />
          {errors.location?.landArea && <p className="text-xs text-rose-500 mt-1">{errors.location.landArea.message}</p>}
        </div>

        <div>
          <LabelWithInfo label="Status Kepemilikan Hak Atas Tanah" helpText="Jenis hak atas tanah yang dimiliki secara sah menurut hukum." />
          <select {...register('location.ownershipStatus')} className={inputClass}>
            <option value="SHM">SHM (Sertifikat Hak Milik)</option>
            <option value="HGB">HGB (Hak Guna Bangunan)</option>
            <option value="HAK_PAKAI">HGU (Hak Guna Usaha)</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
          {errors.location?.ownershipStatus && <p className="text-xs text-rose-500 mt-1">{errors.location.ownershipStatus.message}</p>}
        </div>

        <div>
          <LabelWithInfo label="Nomor Sertifikat Tanah" helpText="Nomor sertifikat tanah resmi terdaftar dari Badan Pertanahan Nasional (BPN)." />
          <input {...register('location.certificateNumber')} type="text" className={inputClass} placeholder="No. Sertifikat Hak..." />
          {errors.location?.certificateNumber && <p className="text-xs text-rose-500 mt-1">{errors.location.certificateNumber.message}</p>}
        </div>
        <div>
          <LabelWithInfo label="Nama Pemilik Sertifikat Resmi" helpText="Nama lengkap pemegang hak atas tanah yang tercantum pada dokumen sertifikat BPN." />
          <input {...register('location.certificateOwner')} type="text" className={inputClass} placeholder="Nama pemegang hak..." />
          {errors.location?.certificateOwner && <p className="text-xs text-rose-500 mt-1">{errors.location.certificateOwner.message}</p>}
        </div>

        {/* ─── DYNAMIC UPLOAD: Sertifikat Hak Lahan (SHM/HGB) ─── */}
        <div className="md:col-span-2 pt-2 border-t border-slate-100">
          <ContextualUploadBox
            label="Unggah Dokumen Sertifikat Tanah (SHM/HGB)"
            fieldKey="document.legalDoc"
            accept=".pdf"
            helpText="Unggah scan dokumen sertifikat kepemilikan tanah asli BPN untuk validasi data administratif (Format PDF)."
          />
        </div>
      </div>
    </div>
  );
};