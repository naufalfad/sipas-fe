import { useFormContext } from 'react-hook-form';
import type { FullSubmissionFormValues } from '../schemas/submissionFormSchema';
import { UploadCloud, MapPin } from 'lucide-react';
import { TileLayer } from 'react-leaflet';
import GISMapContainer from '@/components/maps/GISMapContainer';
import GISDrawingMap from '@/components/maps/GISDrawingMap';

export const ApplicantSection = () => {
  const { register, watch, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  const applicantType = watch('applicant.type');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">1. Data Pemohon</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Jenis Pemohon</label>
          <select {...register('applicant.type')} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <option value="PERORANGAN">Perorangan</option>
            <option value="BADAN_USAHA">Badan Usaha / Perusahaan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {applicantType === 'BADAN_USAHA' ? 'Nama Perusahaan' : 'Nama Lengkap'}
          </label>
          <input {...register('applicant.name')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" placeholder="Masukkan nama..." />
          {errors.applicant?.name && <p className="text-xs text-rose-500 mt-1">{errors.applicant.name.message}</p>}
        </div>

        {applicantType === 'PERORANGAN' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">NIK</label>
            <input {...register('applicant.nik')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
          </div>
        )}

        {applicantType === 'BADAN_USAHA' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">NIB</label>
              <input {...register('applicant.nib')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Direktur/Penanggung Jawab</label>
              <input {...register('applicant.directorName')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">NPWP</label>
          <input {...register('applicant.npwp')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
          {errors.applicant?.npwp && <p className="text-xs text-rose-500 mt-1">{errors.applicant.npwp.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nomor Telepon</label>
          <input {...register('applicant.phone')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
          {errors.applicant?.phone && <p className="text-xs text-rose-500 mt-1">{errors.applicant.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
          <input {...register('applicant.email')} type="email" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
          {errors.applicant?.email && <p className="text-xs text-rose-500 mt-1">{errors.applicant.email.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Alamat Lengkap</label>
          <textarea {...register('applicant.address')} rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
          {errors.applicant?.address && <p className="text-xs text-rose-500 mt-1">{errors.applicant.address.message}</p>}
        </div>
      </div>
    </div>
  );
};

export const SubmissionSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">2. Data Pengajuan</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Jenis Pengajuan</label>
          <select {...register('submission.submissionType')} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <option value="BARU">Site Plan Baru</option>
            <option value="REVISI">Revisi Site Plan</option>
            <option value="PERPANJANGAN">Perpanjangan Site Plan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Kegiatan / Pembangunan</label>
          <input {...register('submission.activityName')} type="text" placeholder="Contoh: Perumahan Griya Asri" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
          {errors.submission?.activityName && <p className="text-xs text-rose-500 mt-1">{errors.submission.activityName.message}</p>}
        </div>
      </div>
    </div>
  );
};

export const LocationSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">3. Data Lokasi</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lokasi</label>
          <input {...register('location.locationName')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
          {errors.location?.locationName && <p className="text-xs text-rose-500 mt-1">{errors.location.locationName.message}</p>}
        </div>

        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Desa/Kelurahan</label><input {...register('location.village')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" /></div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kecamatan</label><input {...register('location.district')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" /></div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kabupaten/Kota</label><input {...register('location.city')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" /></div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Provinsi</label><input {...register('location.province')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" /></div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Alamat Lengkap</label>
          <textarea {...register('location.fullAddress')} rows={2} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Luas Lahan (m²)</label>
          <input {...register('location.landArea', { valueAsNumber: true })} type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
          {errors.location?.landArea && <p className="text-xs text-rose-500 mt-1">{errors.location.landArea.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status Kepemilikan</label>
          <select {...register('location.ownershipStatus')} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <option value="SHM">SHM (Sertifikat Hak Milik)</option>
            <option value="HGB">HGB (Hak Guna Bangunan)</option>
            <option value="HAK_PAKAI">Hak Pakai</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
        </div>

        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nomor Sertifikat</label><input {...register('location.certificateNumber')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" /></div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Pemilik Sertifikat</label><input {...register('location.certificateOwner')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" /></div>
      </div>
    </div>
  );
};

export const CoordinateSection = () => {
  const { register, setValue, watch } = useFormContext<FullSubmissionFormValues>();

  // Kita "mengintip" isi koordinat agar bisa ditampilkan di textarea secara real-time
  const currentCoords = watch('coordinate.coordinatesText');

  const handleMapChange = (coords: number[][][]) => {
    // Mengubah array koordinat menjadi teks JSON agar rapi tersimpan
    const coordsString = JSON.stringify(coords, null, 2);

    // Simpan ke dalam state form (react-hook-form)
    setValue('coordinate.coordinatesText', coordsString);

    // Opsional: Jika Anda ingin menyimpan dalam format array asli di field lain
    setValue('coordinate.polygon', coords[0]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">4. Data Koordinat Area</h3>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Klik ikon <b>Polygon</b> di pojok kiri peta untuk mulai menggambar batas lahan.
        Klik titik pertama kembali untuk menutup area.
      </p>

      {/* Wadah Peta */}
      <div className="h-[400px] w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner">
        <GISMapContainer>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Komponen Drawing yang kita buat di Step 2 */}
          <GISDrawingMap onShapeChange={handleMapChange} />
        </GISMapContainer>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Data Koordinat (Terisi Otomatis dari Peta)
        </label>
        <textarea
          {...register('coordinate.coordinatesText')}
          rows={5}
          readOnly // Kita buat readOnly agar user fokus menggambar di peta
          placeholder="Koordinat akan muncul di sini setelah Anda menggambar di peta..."
          className="w-full font-mono text-xs px-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600"
        />
      </div>
    </div>
  );
};

export const SpatialSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">5. Informasi Tata Ruang</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nomor KKPR</label><input {...register('spatial.kkprNumber')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.spatial?.kkprNumber && <p className="text-xs text-rose-500 mt-1">{errors.spatial.kkprNumber.message}</p>}</div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Peruntukan Lahan</label><input {...register('spatial.landUse')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.spatial?.landUse && <p className="text-xs text-rose-500 mt-1">{errors.spatial.landUse.message}</p>}</div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Luas PSU/RTH Area (m²)</label><input {...register('spatial.greenArea', { valueAsNumber: true })} type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.spatial?.greenArea && <p className="text-xs text-rose-500 mt-1">{errors.spatial.greenArea.message}</p>}</div>
      </div>
    </div>
  );
};

export const TechnicalSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">6. Data Teknis Site Plan</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Jumlah Kavling</label><input {...register('technical.lotCount', { valueAsNumber: true })} type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.technical?.lotCount && <p className="text-xs text-rose-500 mt-1">{errors.technical.lotCount.message}</p>}</div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rata-rata Luas Unit (m²)</label><input {...register('technical.unitArea', { valueAsNumber: true })} type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.technical?.unitArea && <p className="text-xs text-rose-500 mt-1">{errors.technical.unitArea.message}</p>}</div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rencana Lebar Jalan Utama (m)</label><input {...register('technical.roadPlan')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.technical?.roadPlan && <p className="text-xs text-rose-500 mt-1">{errors.technical.roadPlan.message}</p>}</div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rencana Drainase</label><input {...register('technical.drainagePlan')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.technical?.drainagePlan && <p className="text-xs text-rose-500 mt-1">{errors.technical.drainagePlan.message}</p>}</div>
      </div>
    </div>
  );
};

export const ConsultantSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">7. Data Konsultan Perencana</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2"><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Perusahaan Konsultan</label><input {...register('consultant.companyName')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.consultant?.companyName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.companyName.message}</p>}</div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Konsultan (Sertifikasi)</label><input {...register('consultant.consultantName')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.consultant?.consultantName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.consultantName.message}</p>}</div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Penanggung Jawab</label><input {...register('consultant.picName')} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700" />{errors.consultant?.picName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.picName.message}</p>}</div>
      </div>
    </div>
  );
};

export const DocumentSection = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">8. Lampiran Dokumen</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Dokumen Legal (Sertifikat, KTP)', 'Dokumen Teknis (Site Plan DWG/PDF)', 'Dokumen Pendukung'].map((doc, idx) => (
          <div key={idx} className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <UploadCloud className="h-8 w-8 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{doc}</p>
            <p className="text-xs text-slate-500">PDF, JPG, PNG hingga 10MB</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PhotoSection = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">9. Foto Lokasi</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['Utara', 'Selatan', 'Timur', 'Barat', 'Akses Jalan'].map((dir, idx) => (
          <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center text-center aspect-square hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <UploadCloud className="h-6 w-6 text-slate-400 mb-2" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Foto {dir}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatementSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">10. Pernyataan Pemohon</h3>
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          Dengan ini saya menyatakan bahwa:
          <br />1. Seluruh data dan dokumen yang dilampirkan adalah benar dan sah.
          <br />2. Lahan yang diajukan tidak dalam status sengketa.
          <br />3. Saya bersedia mengikuti seluruh prosedur dan peraturan yang berlaku.
        </p>
        <label className="flex items-start space-x-3 cursor-pointer mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <input type="checkbox" {...register('statement.agreed')} className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Saya menyetujui pernyataan di atas.
          </span>
        </label>
        {errors.statement?.agreed && <p className="text-xs text-rose-500 mt-2">{errors.statement.agreed.message}</p>}
      </div>
    </div>
  );
};
