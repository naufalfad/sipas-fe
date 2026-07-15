/**
 * ============================================================================
 * GEOSIPAS HTTP CONTROLLER — SubmissionSection [SubmissionSection.tsx] (REVISED v5.1)
 * ============================================================================
 * Peran: Komponen formulir Tahap 2 (Jenis & Kategori Pengajuan).
 *        Mendukung antarmuka dinamis pengisian silsilah permohonan lama (Revisi)
 *        melalui Opsi A (Pencarian Digital) maupun Opsi B (Unggah Fisik)
 *        secara tipe-aman dan modular.
 * ============================================================================
 */

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { LabelWithInfo } from './LabelWithInfo';
import { ContextualUploadBox } from './ContextualUploadBox';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { inputClass } from './styles';

export const SubmissionSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FullSubmissionFormValues>();

  const submissionType = watch('submission.submissionType');
  const baselineSource = watch('baseline_source');
  const parentId = watch('parent_id_permohonan');

  // --- AUTOMATIC CLEAN STATE TRANSITION (Anti-Pollution Guard) ---
  useEffect(() => {
    if (submissionType !== 'REVISI') {
      setValue('baseline_source', undefined);
      setValue('parent_id_permohonan', undefined);
      setValue('legacy_metadata', undefined);
    }
  }, [submissionType, setValue]);

  // --- AUTO-FILL EFFECT FOR OPSI A (DIGITAL REVISION) ---
  useEffect(() => {
    if (submissionType === 'REVISI' && baselineSource === 'DIGITAL' && parentId) {
      const fetchAndFill = async () => {
        try {
          const parentData = await SubmissionService.getById(parentId);
          if (parentData) {
            // Fill applicant details
            if (parentData.applicant) {
              setValue('applicant.type', parentData.applicant.type || 'PERORANGAN');
              setValue('applicant.name', parentData.applicant.name || '');
              setValue('applicant.nik', parentData.applicant.nik || undefined);
              setValue('applicant.nib', parentData.applicant.nib || undefined);
              setValue('applicant.npwp', parentData.applicant.npwp || '');
              setValue('applicant.directorName', parentData.applicant.directorName || undefined);
              setValue('applicant.phone', parentData.applicant.phone || '');
              setValue('applicant.email', parentData.applicant.email || '');
              setValue('applicant.address', parentData.applicant.address || '');
            }
            // Fill location details
            if (parentData.locationDetails) {
              setValue('location.locationName', parentData.locationDetails.locationName || '');
              setValue('location.village', parentData.locationDetails.village || '');
              setValue('location.district', parentData.locationDetails.district || '');
              setValue('location.city', parentData.locationDetails.city || 'Kabupaten Bogor');
              setValue('location.province', parentData.locationDetails.province || 'Jawa Barat');
              setValue('location.fullAddress', parentData.locationDetails.fullAddress || '');
              setValue('location.landArea', parentData.locationDetails.landArea || 0);
              setValue('location.ownershipStatus', parentData.locationDetails.ownershipStatus || 'SHM');
              setValue('location.certificateNumber', parentData.locationDetails.certificateNumber || '');
              setValue('location.certificateOwner', parentData.locationDetails.certificateOwner || '');
            }
            toast.success('Data pemohon dan lokasi otomatis terisi dari SK Digital Induk!');
          }
        } catch (err) {
          console.error('Gagal mengambil data SK induk untuk auto-fill:', err);
        }
      };
      fetchAndFill();
    }
  }, [parentId, submissionType, baselineSource, setValue]);

  // --- OPSI A: AMBIL DAFTAR PERMOHONAN DISETUJUI YANG SAH SECARA REAL-TIME ---
  const { data: submissions = [], isLoading: isLoadingApproved } = useQuery({
    queryKey: ['submissions-approved-only'],
    queryFn: () => SubmissionService.getAllList(),
    enabled: submissionType === 'REVISI' && baselineSource === 'DIGITAL',
  });

  // Filter berkas legal berstatus terminal 'Disetujui' milik pemohon (Active SK)
  const approvedSubmissions = submissions.filter((s) => s.status === 'Disetujui');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          1. Data Pengajuan
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

        {/* ─── UPDATE FASE 5 (REVISI): ANTARMUKA DINAMIS SILSILAH SK LAMA ─── */}
        {submissionType === 'REVISI' && (
          <div className="md:col-span-2 border border-slate-200 bg-slate-50/50 p-5 space-y-4 rounded-none animate-in fade-in duration-300">
            <div>
              <LabelWithInfo
                label="Sumber Data SK Lama (Baseline)"
                helpText="Pilih Opsi A (Digital) jika SK lama diterbitkan melalui portal ini. Pilih Opsi B (Legacy) jika SK lama berupa dokumen kertas fisik/offline."
              />
              <div className="flex items-center space-x-6 mt-3.5 select-none">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    value="DIGITAL"
                    checked={baselineSource === 'DIGITAL'}
                    onChange={() => {
                      setValue('baseline_source', 'DIGITAL');
                      setValue('legacy_metadata', undefined);
                    }}
                    className="h-4.5 w-4.5 text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">Opsi A: SK Terdaftar Digital</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    value="LEGACY"
                    checked={baselineSource === 'LEGACY'}
                    onChange={() => {
                      setValue('baseline_source', 'LEGACY');
                      setValue('parent_id_permohonan', undefined);
                    }}
                    className="h-4.5 w-4.5 text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">Opsi B: SK Fisik / Offline (Scan PDF)</span>
                </label>
              </div>
              {errors.baseline_source && (
                <p className="text-xs text-rose-500 mt-1.5 font-bold">{errors.baseline_source.message}</p>
              )}
            </div>

            {/* OPSI A: SINKRONISASI DIGITAL LANGSUNG */}
            {baselineSource === 'DIGITAL' && (
              <div className="space-y-1.5 text-left animate-in fade-in duration-300">
                <LabelWithInfo
                  label="Pilih Berkas SK Site Plan Terdahulu"
                  helpText="Sistem memuat daftar seluruh pengesahan aktif yang terikat sah secara perdata dengan akun login Anda."
                />
                {isLoadingApproved ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 text-slate-400 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600 shrink-0" />
                    <span className="font-bold uppercase tracking-wider">Menghubungkan basis data digital...</span>
                  </div>
                ) : approvedSubmissions.length === 0 ? (
                  <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-normal">
                    <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5">Tidak Ada Berkas Aktif</span>
                      <p className="text-[10px] leading-relaxed text-slate-500">Akun Anda belum memiliki rekaman pengesahan SK aktif di sistem ini. Harap gunakan pilihan **Opsi B (SK Fisik/Offline)** untuk menginput berkas manual.</p>
                    </div>
                  </div>
                ) : (
                  <select
                    {...register('parent_id_permohonan')}
                    className={inputClass}
                  >
                    <option value="">-- Pilih Surat Keputusan (SK) Lama Terdaftar --</option>
                    {approvedSubmissions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.skNumber || s.submissionNo} - {s.housingName}
                      </option>
                    ))}
                  </select>
                )}
                {errors.parent_id_permohonan && (
                  <p className="text-xs text-rose-500 mt-1.5 font-bold">{errors.parent_id_permohonan.message}</p>
                )}
              </div>
            )}

            {/* OPSI B: MANUAL INPUT METADATA + SCAN PDF */}
            {baselineSource === 'LEGACY' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <LabelWithInfo
                    label="Nomor SK Pengesahan Fisik Lama"
                    helpText="Masukkan nomor Surat Keputusan site plan terdahulu secara lengkap sesuai cetakan kertas asli."
                  />
                  <input
                    type="text"
                    {...register('legacy_metadata.replaced_sk_number')}
                    placeholder="Contoh: 600/120/415.19/2020"
                    className={inputClass}
                  />
                  {errors.legacy_metadata?.replaced_sk_number && (
                    <p className="text-xs text-rose-500 mt-1.5 font-bold">{errors.legacy_metadata.replaced_sk_number.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <LabelWithInfo
                    label="Tanggal Penerbitan SK Fisik"
                    helpText="Masukkan tanggal pengesahan yang tertera pada lembar tanda tangan dokumen SK fisik lama."
                  />
                  <input
                    type="date"
                    {...register('legacy_metadata.replaced_sk_date')}
                    className={inputClass}
                    style={{ colorScheme: 'light' }}
                  />
                  {errors.legacy_metadata?.replaced_sk_date && (
                    <p className="text-xs text-rose-500 mt-1.5 font-bold">{errors.legacy_metadata.replaced_sk_date.message}</p>
                  )}
                </div>

                <div className="md:col-span-2 pt-2.5 border-t border-slate-200">
                  <ContextualUploadBox
                    label="Unggah Scan Salinan Surat Keputusan (SK) Fisik (PDF)"
                    fieldKey="legacy_metadata.replaced_sk_doc_url"
                    accept=".pdf"
                    helpText="Unggah scan lembar draf SK lama utuh dari halaman judul hingga tanda tangan dalam format PDF (Maks. 10MB)."
                  />
                  {errors.legacy_metadata?.replaced_sk_doc_url && (
                    <p className="text-xs text-rose-500 mt-1.5 font-bold">{errors.legacy_metadata.replaced_sk_doc_url.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};