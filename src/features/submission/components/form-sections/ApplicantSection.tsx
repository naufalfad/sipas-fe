import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { LabelWithInfo } from './LabelWithInfo';
import { inputClass, labelClass } from './styles';
import { uploadFileToBackend } from '../../utils/upload';

export const ApplicantSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  const applicantType = watch('applicant.type');
  const [ocrLoading, setOcrLoading] = useState<'KTP' | 'NIB' | null>(null);

  const ktpDoc = watch('document.ktpDoc');
  const nibDoc = watch('document.nibDoc');

  const handleOCRUpload = async (file: File, type: 'KTP' | 'NIB') => {
    if (!file) return;

    // Batasan ukuran unggah maksimal 20MB secara ketat
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Berkas terlalu besar! Batas ukuran maksimal adalah 20MB.');
      return;
    }

    try {
      setOcrLoading(type);
      const res = await uploadFileToBackend(file);
      const fileUrl = `${res.file_url}?name=${encodeURIComponent(file.name)}`;

      if (type === 'KTP') {
        setValue('document.ktpDoc', fileUrl);
        setValue('applicant.name', 'Budi Santoso');
        setValue('applicant.nik', '3201020304050607');
        setValue('applicant.address', 'Jl. Raya Pajajaran No. 123, Bogor Tengah, Kota Bogor, Jawa Barat');
        toast.success(`Berhasil mengunggah KTP: ${file.name}`);
      } else {
        setValue('document.nibDoc', fileUrl);
        setValue('applicant.name', 'PT. Maju Bersama Jaya');
        setValue('applicant.nib', '9120304050607');
        setValue('applicant.address', 'Kawasan Industri Sentul Blok C2, Babakan Madang, Kabupaten Bogor, Jawa Barat');
        toast.success(`Berhasil mengunggah NIB: ${file.name}`);
      }
    } catch (err) {
      toast.error('Gagal mengunggah berkas identitas pemohon ke server');
    } finally {
      setOcrLoading(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'KTP' | 'NIB') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleOCRUpload(file, type);
  };

  const getOriginalFileName = (url?: string) => {
    if (!url) return '';
    try {
      const parsedUrl = new URL(url, window.location.origin);
      const nameParam = parsedUrl.searchParams.get('name');
      if (nameParam) return decodeURIComponent(nameParam);
    } catch (e) { }
    const lastSegment = url.split('/').pop() || 'File terunggah';
    return lastSegment.split('?')[0];
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Bagian - Bersih & Tanpa Label Nomor Langkah */}
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          Identitas Pemohon
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Lengkapi berkas identitas pemohon perorangan atau badan usaha secara sah untuk keperluan otentikasi berkas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kotak Unggah KTP */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'KTP')}
          className="border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 p-4 text-center cursor-pointer transition-all relative flex flex-col items-center justify-center min-h-[100px]"
        >
          {ocrLoading === 'KTP' ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-[10px] font-bold text-primary">Mengunggah & Mengekstrak data KTP (OCR)...</p>
            </div>
          ) : ktpDoc ? (
            <div className="flex flex-col items-center justify-center p-2.5 w-full h-full relative z-10">
              <CheckCircle2 className="h-7 w-7 text-primary mb-1 shrink-0" />
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">KTP Terunggah</p>
              <span className="text-[9px] font-mono text-slate-500 truncate max-w-[200px] mt-0.5" title={getOriginalFileName(ktpDoc)}>
                {getOriginalFileName(ktpDoc)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setValue('document.ktpDoc', undefined);
                }}
                className="mt-2 text-[9px] font-bold text-rose-600 hover:text-rose-700 transition-colors border-none bg-transparent cursor-pointer"
              >
                Hapus Berkas
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleOCRUpload(file, 'KTP');
                }}
              />
              <UploadCloud className="h-6 w-6 text-slate-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Unggah KTP Pemohon (Auto-Fill)</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Seret & lepas file atau klik untuk memilih</p>
            </>
          )}
        </div>

        {/* Kotak Unggah NIB */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'NIB')}
          className="border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 p-4 text-center cursor-pointer transition-all relative flex flex-col items-center justify-center min-h-[100px]"
        >
          {ocrLoading === 'NIB' ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-[10px] font-bold text-primary">Mengunggah & Mengekstrak data NIB (OCR)...</p>
            </div>
          ) : nibDoc ? (
            <div className="flex flex-col items-center justify-center p-2.5 w-full h-full relative z-10">
              <CheckCircle2 className="h-7 w-7 text-primary mb-1 shrink-0" />
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">NIB Terunggah</p>
              <span className="text-[9px] font-mono text-slate-500 truncate max-w-[200px] mt-0.5" title={getOriginalFileName(nibDoc)}>
                {getOriginalFileName(nibDoc)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setValue('document.nibDoc', undefined);
                }}
                className="mt-2 text-[9px] font-bold text-rose-600 hover:text-rose-700 transition-colors border-none bg-transparent cursor-pointer"
              >
                Hapus Berkas
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleOCRUpload(file, 'NIB');
                }}
              />
              <UploadCloud className="h-6 w-6 text-slate-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Unggah NIB Perusahaan (Auto-Fill)</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Seret & lepas file atau klik untuk memilih</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <div className="md:col-span-2">
          <LabelWithInfo label="Jenis Pemohon" helpText="Pilih klasifikasi pemohon, apakah mengajukan atas nama perorangan atau badan hukum/perusahaan." />
          <select {...register('applicant.type')} className={inputClass}>
            <option value="PERORANGAN">Perorangan (Individu)</option>
            <option value="BADAN_USAHA">Badan Usaha / Perusahaan</option>
          </select>
        </div>

        <div>
          <LabelWithInfo
            label={applicantType === 'BADAN_USAHA' ? 'Nama Perusahaan' : 'Nama Lengkap'}
            helpText="Nama lengkap perorangan sesuai KTP, atau nama resmi badan hukum/PT/CV yang terdaftar."
          />
          <input {...register('applicant.name')} type="text" className={inputClass} placeholder="Masukkan nama..." />
          {errors.applicant?.name && <p className="text-xs text-rose-500 mt-1">{errors.applicant.name.message}</p>}
        </div>

        {applicantType === 'PERORANGAN' && (
          <div>
            <LabelWithInfo label="NIK (Nomor Induk Kependudukan)" helpText="Nomor Induk Kependudukan (16 digit) sesuai KTP pemohon aktif." />
            <input
              {...register('applicant.nik', {
                onChange: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
              })}
              type="text"
              className={inputClass}
              placeholder="32xxxxxxxxxxxxxx"
            />
            {errors.applicant?.nik && <p className="text-xs text-rose-500 mt-1">{errors.applicant.nik.message}</p>}
          </div>
        )}

        {applicantType === 'BADAN_USAHA' && (
          <>
            <div>
              <LabelWithInfo label="NIB (Nomor Induk Berusaha)" helpText="Nomor Induk Berusaha resmi dari Lembaga OSS Republik Indonesia." />
              <input
                {...register('applicant.nib', {
                  onChange: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
                })}
                type="text"
                className={inputClass}
                placeholder="Masukkan NIB perusahaan..."
              />
              {errors.applicant?.nib && <p className="text-xs text-rose-500 mt-1">{errors.applicant.nib.message}</p>}
            </div>
            <div>
              <LabelWithInfo label="Nama Direktur / Penanggung Jawab" helpText="Nama lengkap Direktur Utama atau penanggung jawab resmi perusahaan." />
              <input {...register('applicant.directorName')} type="text" className={inputClass} placeholder="Nama penanggung jawab..." />
              {errors.applicant?.directorName && <p className="text-xs text-rose-500 mt-1">{errors.applicant.directorName.message}</p>}
            </div>
          </>
        )}

        <div>
          <LabelWithInfo label="NPWP (Nomor Pokok Wajib Pajak)" helpText="Nomor Pokok Wajib Pajak (pribadi atau perusahaan) yang masih aktif terdaftar." />
          <input {...register('applicant.npwp')} type="text" className={inputClass} placeholder="00.000.000.0-000.000" />
          {errors.applicant?.npwp && <p className="text-xs text-rose-500 mt-1">{errors.applicant.npwp.message}</p>}
        </div>

        <div>
          <LabelWithInfo label="Nomor Telepon aktif" helpText="Nomor WhatsApp/telepon aktif untuk koordinasi dinas dan verifikasi lapangan." />
          <input
            type="text"
            className={inputClass}
            placeholder="08xxxxxxxxxx"
            {...register('applicant.phone', {
              onChange: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
            })}
          />
          {errors.applicant?.phone && <p className="text-xs text-rose-500 mt-1">{errors.applicant.phone.message}</p>}
        </div>

        <div className="md:col-span-2">
          <LabelWithInfo label="Alamat Surat Elektronik (Email)" helpText="Alamat email resmi pemohon guna pengiriman dokumen digital SK resmi." />
          <input {...register('applicant.email')} type="email" className={inputClass} placeholder="contoh@perusahaan.com" />
          {errors.applicant?.email && <p className="text-xs text-rose-500 mt-1">{errors.applicant.email.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Alamat Lengkap Pemohon</label>
          <textarea {...register('applicant.address')} rows={3} className={inputClass} placeholder="Jl. Contoh Blok A No.00 RT00/00" />
          {errors.applicant?.address && <p className="text-xs text-rose-500 mt-1">{errors.applicant.address.message}</p>}
        </div>
      </div>
    </div>
  );
};