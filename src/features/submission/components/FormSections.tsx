import { useFormContext } from 'react-hook-form';
import type { FullSubmissionFormValues } from '../schemas/submissionFormSchema';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import GISMapContainer from '@/components/maps/GISMapContainer';
import GISDrawingMap from '@/components/maps/GISDrawingMap';

/**
 * ============================================================================
 * FORM CONTROL STYLE SPECIFICATION (PROTECTED VARIATIONS)
 * ============================================================================
 * Variabel gaya terpusat untuk memastikan konsistensi visual di seluruh kolom form.
 * Input menggunakan latar putih bersih dengan border DAE4DB tipis untuk kontras tinggi,
 * siku kaku (rounded-none), dan focus transition ke Hunter Green (#415D43).
 * ============================================================================
 */
const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";

const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide";

// ─── SECTION 1: DATA PEMOHON ──────────────────────────────────────────────────
export const ApplicantSection = () => {
  const { register, watch, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  const applicantType = watch('applicant.type');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          1. Data Pemohon
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Lengkapi data identitas pemohon perseorangan atau badan usaha secara sah.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <div className="md:col-span-2">
          <label className={labelClass}>Jenis Pemohon</label>
          <select {...register('applicant.type')} className={inputClass}>
            <option value="PERORANGAN">Perorangan (Individu)</option>
            <option value="BADAN_USAHA">Badan Usaha / Perusahaan</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>
            {applicantType === 'BADAN_USAHA' ? 'Nama Perusahaan' : 'Nama Lengkap'}
          </label>
          <input {...register('applicant.name')} type="text" className={inputClass} placeholder="Masukkan nama..." />
          {errors.applicant?.name && <p className="text-xs text-rose-500 mt-1">{errors.applicant.name.message}</p>}
        </div>

        {applicantType === 'PERORANGAN' && (
          <div>
            <label className={labelClass}>NIK (Nomor Induk Kependudukan)</label>
            <input {...register('applicant.nik')} type="text" className={inputClass} placeholder="32xxxxxxxxxxxxxx" />
          </div>
        )}

        {applicantType === 'BADAN_USAHA' && (
          <>
            <div>
              <label className={labelClass}>NIB (Nomor Induk Berusaha)</label>
              <input {...register('applicant.nib')} type="text" className={inputClass} placeholder="Masukkan NIB perusahaan..." />
            </div>
            <div>
              <label className={labelClass}>Nama Direktur / Penanggung Jawab</label>
              <input {...register('applicant.directorName')} type="text" className={inputClass} placeholder="Nama penanggung jawab..." />
            </div>
          </>
        )}

        <div>
          <label className={labelClass}>NPWP (Nomor Pokok Wajib Pajak)</label>
          <input {...register('applicant.npwp')} type="text" className={inputClass} placeholder="00.000.000.0-000.000" />
          {errors.applicant?.npwp && <p className="text-xs text-rose-500 mt-1">{errors.applicant.npwp.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Nomor Telepon aktif</label>
          <input {...register('applicant.phone')} type="text" className={inputClass} placeholder="08xxxxxxxxxx" />
          {errors.applicant?.phone && <p className="text-xs text-rose-500 mt-1">{errors.applicant.phone.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Alamat Surat Elektronik (Email)</label>
          <input {...register('applicant.email')} type="email" className={inputClass} placeholder="contoh@perusahaan.com" />
          {errors.applicant?.email && <p className="text-xs text-rose-500 mt-1">{errors.applicant.email.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Alamat Lengkap Pemohon</label>
          <textarea {...register('applicant.address')} rows={3} className={inputClass} placeholder="Tulis alamat korespondensi lengkap..." />
          {errors.applicant?.address && <p className="text-xs text-rose-500 mt-1">{errors.applicant.address.message}</p>}
        </div>
      </div>
    </div>
  );
};

// ─── SECTION 2: DATA PENGAJUAN ────────────────────────────────────────────────
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
          <label className={labelClass}>Jenis Permohonan Site Plan</label>
          <select {...register('submission.submissionType')} className={inputClass}>
            <option value="BARU">Site Plan Baru (Lahan Bersih)</option>
            <option value="REVISI">Revisi Pengesahan Site Plan</option>
            <option value="PERPANJANGAN">Perpanjangan Masa Berlaku</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Nama Kegiatan / Pembangunan</label>
          <input {...register('submission.activityName')} type="text" placeholder="Contoh: Perumahan Pakuan Green Regency" className={inputClass} />
          {errors.submission?.activityName && <p className="text-xs text-rose-500 mt-1">{errors.submission.activityName.message}</p>}
        </div>
      </div>
    </div>
  );
};

// ─── SECTION 3: DATA LOKASI ──────────────────────────────────────────────────
export const LocationSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          3. Data Lokasi Spasial
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Informasi lokasi administrasi geografis tapak perizinan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <div className="md:col-span-2">
          <label className={labelClass}>Nama Lokasi Tapak</label>
          <input {...register('location.locationName')} type="text" placeholder="Contoh: Blok A Sektor III" className={inputClass} />
          {errors.location?.locationName && <p className="text-xs text-rose-500 mt-1">{errors.location.locationName.message}</p>}
        </div>

        <div><label className={labelClass}>Desa / Kelurahan</label><input {...register('location.village')} type="text" className={inputClass} placeholder="Nama Kelurahan..." /></div>
        <div><label className={labelClass}>Kecamatan</label><input {...register('location.district')} type="text" className={inputClass} placeholder="Nama Kecamatan..." /></div>
        <div><label className={labelClass}>Kabupaten / Kota</label><input {...register('location.city')} type="text" className={inputClass} placeholder="Kabupaten Bogor" /></div>
        <div><label className={labelClass}>Provinsi</label><input {...register('location.province')} type="text" className={inputClass} placeholder="Jawa Barat" /></div>

        <div className="md:col-span-2">
          <label className={labelClass}>Alamat Lengkap Lokasi Proyek</label>
          <textarea {...register('location.fullAddress')} rows={2} className={inputClass} placeholder="Tulis alamat lokasi fisik tapak secara rinci..." />
        </div>

        <div>
          <label className={labelClass}>Luas Lahan Bersih (m²)</label>
          <input {...register('location.landArea', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 15000" />
          {errors.location?.landArea && <p className="text-xs text-rose-500 mt-1">{errors.location.landArea.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Status Kepemilikan Hak Atas Tanah</label>
          <select {...register('location.ownershipStatus')} className={inputClass}>
            <option value="SHM">SHM (Sertifikat Hak Milik)</option>
            <option value="HGB">HGB (Hak Guna Bangunan)</option>
            <option value="HAK_PAKAI">Hak Pakai Dinas</option>
            <option value="LAINNYA">Lainnya / Surat Adat</option>
          </select>
        </div>

        <div><label className={labelClass}>Nomor Sertifikat Tanah</label><input {...register('location.certificateNumber')} type="text" className={inputClass} placeholder="No. Sertifikat Hak..." /></div>
        <div><label className={labelClass}>Nama Pemilik Sertifikat Resmi</label><input {...register('location.certificateOwner')} type="text" className={inputClass} placeholder="Nama pemegang hak..." /></div>
      </div>
    </div>
  );
};

// ─── SECTION 4: DATA KOORDINAT AREA ──────────────────────────────────────────
export const CoordinateSection = () => {
  const { register, setValue } = useFormContext<FullSubmissionFormValues>();

  const handleMapChange = (coords: number[][][]) => {
    const coordsString = JSON.stringify(coords, null, 2);
    setValue('coordinate.coordinatesText', coordsString);
    setValue('coordinate.polygon', coords[0]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          4. Data Koordinat Batas Lahan
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Gunakan alat gambar poligon di sisi kiri peta untuk merekam koordinat koordinat tapak bidang tanah BPN.</p>
      </div>

      {/* Wadah Peta Imersif dengan Outline Tipis untuk Perlindungan Kontras */}
      <div className="h-[400px] w-full overflow-hidden border border-border shadow-inner">
        <GISMapContainer>
          <GISDrawingMap onShapeChange={handleMapChange} />
        </GISMapContainer>
      </div>

      <div className="text-left">
        <label className={labelClass}>Data Koordinat Spasial GeoJSON (Terekam Otomatis)</label>
        <textarea
          {...register('coordinate.coordinatesText')}
          rows={5}
          readOnly
          placeholder="Koordinat poligon spasial akan terisi secara otomatis di sini saat Anda menyelesaikan gambar bidang tanah di atas peta..."
          className="w-full font-mono text-[10px] px-3.5 py-2 border border-border bg-slate-50/50 hover:bg-slate-100/50 text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary rounded-none transition-all"
        />
      </div>
    </div>
  );
};

// ─── SECTION 5: INFORMASI TATA RUANG ─────────────────────────────────────────
export const SpatialSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          5. Informasi Kesesuaian Tata Ruang
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Data sinkronisasi KKPR (Kesesuaian Kegiatan Pemanfaatan Ruang) daerah.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <div><label className={labelClass}>Nomor SK KKPR / IPPT</label><input {...register('spatial.kkprNumber')} type="text" className={inputClass} placeholder="No. SK KKPR Dinas..." />{errors.spatial?.kkprNumber && <p className="text-xs text-rose-500 mt-1">{errors.spatial.kkprNumber.message}</p>}</div>
        <div><label className={labelClass}>Kriteria Peruntukan Lahan (Zonasi Perda)</label><input {...register('spatial.landUse')} type="text" className={inputClass} placeholder="Contoh: Kawasan Hunian Kepadatan Sedang" />{errors.spatial?.landUse && <p className="text-xs text-rose-500 mt-1">{errors.spatial.landUse.message}</p>}</div>
        <div><label className={labelClass}>Luas Rencana Fasum / RTH Lahan (m²)</label><input {...register('spatial.greenArea', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Minimal 20% dari total luas" />{errors.spatial?.greenArea && <p className="text-xs text-rose-500 mt-1">{errors.spatial.greenArea.message}</p>}</div>
      </div>
    </div>
  );
};

// ─── SECTION 6: DATA TEKNIS SITE PLAN ─────────────────────────────────────────
export const TechnicalSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          6. Parameter Teknis Rencana Tapak
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Rincian parameter struktur bangunan perumahan berdasarkan kriteria teknis Kabupaten Bogor.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <div><label className={labelClass}>Estimasi Jumlah Kavling Unit</label><input {...register('technical.lotCount', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Jumlah unit kavling rencana..." />{errors.technical?.lotCount && <p className="text-xs text-rose-500 mt-1">{errors.technical.lotCount.message}</p>}</div>
        <div><label className={labelClass}>Rata-rata Luas Bangunan per Unit (m²)</label><input {...register('technical.unitArea', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Luas unit kavling rata-rata..." />{errors.technical?.unitArea && <p className="text-xs text-rose-500 mt-1">{errors.technical.unitArea.message}</p>}</div>
        <div><label className={labelClass}>Rencana Lebar Jalan Utama (ROW - Meter)</label><input {...register('technical.roadPlan')} type="text" className={inputClass} placeholder="Contoh: ROW 8 Meter" />{errors.technical?.roadPlan && <p className="text-xs text-rose-500 mt-1">{errors.technical.roadPlan.message}</p>}</div>
        <div><label className={labelClass}>Deskripsi Sistem Drainase & Pembuangan</label><input {...register('technical.drainagePlan')} type="text" className={inputClass} placeholder="Contoh: Saluran Terbuka Buis Beton U-Ditch" />{errors.technical?.drainagePlan && <p className="text-xs text-rose-500 mt-1">{errors.technical.drainagePlan.message}</p>}</div>
      </div>
    </div>
  );
};

// ─── SECTION 7: DATA KONSULTAN PERENCANA ─────────────────────────────────────
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
        <div className="md:col-span-2"><label className={labelClass}>Nama Biro / Perusahaan Konsultan Perencana</label><input {...register('consultant.companyName')} type="text" className={inputClass} placeholder="PT / CV Biro Rekayasa Geospasial..." />{errors.consultant?.companyName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.companyName.message}</p>}</div>
        <div><label className={labelClass}>Nama Arsitek / Praktisi (Sertifikasi SKEA)</label><input {...register('consultant.consultantName')} type="text" className={inputClass} placeholder="Ar. Nama Lengkap, IAI" />{errors.consultant?.consultantName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.consultantName.message}</p>}</div>
        <div><label className={labelClass}>Nomor Kontak PIC Konsultan</label><input {...register('consultant.picName')} type="text" className={inputClass} placeholder="Nomor telepon penanggung jawab..." />{errors.consultant?.picName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.picName.message}</p>}</div>
      </div>
    </div>
  );
};

// ─── SECTION 8: LAMPIRAN DOKUMEN ──────────────────────────────────────────────
export const DocumentSection = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          8. Upload Lampiran Berkas Dokumen
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Unggah seluruh dokumen persyaratan administratif dalam bentuk berkas digital resmi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
        {['Dokumen Legalitas Lahan (SHM/HGB/KTP)', 'Gambar Teknis Rencana Site Plan (CAD/DWG)', 'Rekomendasi Lingkungan (AMDAL/UKL-UPL)'].map((doc, idx) => (
          <div key={idx} className="p-6 flex flex-col items-center justify-center text-center bg-white border border-dashed border-border hover:bg-slate-50/50 transition-colors cursor-pointer select-none">
            <UploadCloud className="h-7 w-7 text-secondary-foreground/60 mb-2.5" />
            <p className="text-xs font-bold text-slate-700 mb-1">{doc}</p>
            <p className="text-[10px] text-slate-400">PDF, JPG, PNG atau zip hingga 15MB</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SECTION 9: FOTO LOKASI ───────────────────────────────────────────────────
export const PhotoSection = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          9. Bukti Foto Kondisi Fisik Lapangan
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Sertakan dokumentasi foto kondisi riil rona tapak di lapangan dari 5 penjuru arah mata angin.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
        {['Sisi Utara', 'Sisi Selatan', 'Sisi Timur', 'Sisi Barat', 'Akses Jalan Utama'].map((dir, idx) => (
          <div key={idx} className="p-4 flex flex-col items-center justify-center text-center aspect-square bg-white border border-border hover:bg-slate-50/50 transition-colors cursor-pointer select-none">
            <UploadCloud className="h-5 w-5 text-secondary-foreground/60 mb-2" />
            <p className="text-[11px] font-bold text-slate-700">{dir}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SECTION 10: PERNYATAAN PEMOHON ──────────────────────────────────────────
export const StatementSection = () => {
  const { register, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          10. Surat Pernyataan Tanggung Jawab Mutlak
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Pernyataan komitmen keabsahan data dan kesediaan tunduk pada peraturan tata ruang daerah.</p>
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