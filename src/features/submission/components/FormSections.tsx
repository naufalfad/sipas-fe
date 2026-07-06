/**
 * ============================================================================
 * GEOSIPAS SUBMISSION FORM SECTIONS — [FormSections.tsx] (REVISED v3)
 * ============================================================================
 * Peran: Menyediakan komponen-komponen formulir pendaftaran 10-tahap secara
 *        modular dan terpadu, mendukung distributed uploads on-the-fly,
 *        dan input metrik usulan spasial pemohon secara presisi.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import type { FullSubmissionFormValues } from '../schemas/submissionFormSchema';
import bogorRegions from '../data/bogorRegions.json';
import {
  UploadCloud, CheckCircle2, Loader2, FileUp, Info,
  Settings2, Compass, RefreshCw, Layers, FileCheck, CheckCircle
} from 'lucide-react';
import GISMapContainer from '@/components/maps/GISMapContainer';
import GISDrawingMap from '@/components/maps/GISDrawingMap';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const uploadFileToBackend = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:8000/api/v1/submissions/upload', {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Gagal mengunggah berkas ke server');
  }

  const data = await response.json();
  return data; // { file_name, file_path, file_url }
};

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

const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 tracking-wide";

const LabelWithInfo = ({ label, helpText }: { label: string; helpText?: string }) => {
  return (
    <label className={labelClass}>
      {label}
      {helpText && (
        <span className="relative group inline-block ml-1.5 align-middle select-none normal-case tracking-normal">
          <span className="cursor-pointer text-slate-400 hover:text-primary transition-colors">
            <Info size={13} className="inline-block" />
          </span>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block w-[260px] bg-[#111D13] text-white text-[10px] font-semibold p-2.5 pointer-events-none z-50 rounded-none shadow-md border border-[#709775]/25 leading-normal text-left">
            {helpText}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#111D13]" />
          </span>
        </span>
      )}
    </label>
  );
};

const FormattedInput = ({
  name,
  placeholder,
  unit = 'm²',
  min = 0,
  isDecimal = false,
  onChangeCustom,
}: {
  name: string;
  placeholder?: string;
  unit?: string;
  min?: number;
  isDecimal?: boolean;
  onChangeCustom?: (val: number | undefined) => void;
}) => {
  const { control } = useFormContext<FullSubmissionFormValues>();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name as any}
      render={({ field: { value, onChange, onBlur } }) => {
        const numVal = value !== undefined && value !== null && !isNaN(Number(value)) ? Number(value) : undefined;

        let displayVal = '';
        if (isFocused) {
          displayVal = numVal !== undefined ? String(numVal) : '';
        } else {
          displayVal = numVal !== undefined
            ? `${numVal.toLocaleString('id-ID', { maximumFractionDigits: isDecimal ? 2 : 0 })} ${unit}`.trim()
            : '';
        }

        const handleFocus = () => {
          setIsFocused(true);
        };

        const handleBlur = () => {
          setIsFocused(false);
          onBlur();
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const cleanText = e.target.value.replace(/[^0-9.-]/g, '');
          const num = Number(cleanText);
          if (cleanText === '' || isNaN(num)) {
            onChange(undefined);
            if (onChangeCustom) onChangeCustom(undefined);
          } else {
            const finalNum = Math.max(min, num);
            onChange(finalNum);
            if (onChangeCustom) onChangeCustom(finalNum);
          }
        };

        const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
          (e.target as HTMLInputElement).blur();
        };

        return (
          <input
            type="text"
            value={displayVal}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            onWheel={handleWheel}
            placeholder={placeholder}
            className={inputClass}
          />
        );
      }}
    />
  );
};

// ─── PURE FABRICATION: REUSABLE CONTEXTUAL DIRECT UPLOAD COMPONENT ───────────
export const ContextualUploadBox = ({
  label,
  fieldKey,
  accept = ".pdf,.jpg,.jpeg,.png,.zip",
  helpText
}: {
  label: string;
  fieldKey: string;
  accept?: string;
  helpText?: string;
}) => {
  const { setValue, watch } = useFormContext<FullSubmissionFormValues>();
  const [loading, setLoading] = useState(false);
  const fileUrl = watch(fieldKey as any);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const res = await uploadFileToBackend(file);
        setValue(fieldKey as any, res.file_url);
        toast.success(`Berhasil mengunggah: ${file.name}`);
      } catch (err) {
        toast.error('Gagal mengunggah berkas ke server');
      } finally {
        setLoading(false);
      }
    }
  };

  const onClear = () => {
    setValue(fieldKey as any, undefined);
  };

  return (
    <div className="space-y-1.5 text-left select-none">
      <LabelWithInfo label={label} helpText={helpText} />
      {loading ? (
        <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-dashed border-border">
          <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse leading-none">Mengunggah...</span>
        </div>
      ) : fileUrl ? (
        <div className="flex items-center justify-between p-3 bg-[#e8f2ea]/20 border border-primary/30">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle className="h-4.5 w-4.5 text-primary shrink-0" />
            <span className="text-[11px] font-mono text-primary truncate max-w-[240px]">{fileUrl.split('/').pop() || 'File terunggah'}</span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer outline-none border-none bg-transparent"
          >
            Hapus
          </button>
        </div>
      ) : (
        <div className="relative border border-dashed border-slate-300 bg-slate-50/30 hover:bg-slate-50 p-3 flex items-center justify-center gap-2 cursor-pointer transition-all">
          <input
            type="file"
            accept={accept}
            onChange={onFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <UploadCloud className="h-4.5 w-4.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Klik untuk Unggah Berkas</span>
        </div>
      )}
    </div>
  );
};

// ─── SUB-KOMPONEN: CAD GEOREFERENCE WIZARD (MODULAR SPATIAL ALIGNER) ──────────
export const CADGeoreferenceWizard = ({
  isOpen,
  onClose,
  onComplete,
  cadFileName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (params: {
    A: number; B: number; Tx: number; Ty: number;
    scale: number; rotation: number; polygon: [number, number][]
  }) => void;
  cadFileName: string;
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [point1Mapped, setPoint1Mapped] = useState(false);
  const [point2Mapped, setPoint2Mapped] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  if (!isOpen) return null;

  const handleMapPoint1 = () => {
    setPoint1Mapped(true);
    toast.success('Titik Kontrol 1 berhasil dikunci!');
    setStep(2);
  };

  const handleMapPoint2 = () => {
    setPoint2Mapped(true);
    toast.success('Titik Kontrol 2 berhasil dikunci!');
    setStep(3);
  };

  const handleRunCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      // Simulasi perhitungan parameter matriks Helmert 2D [Jakarta 5]
      const scale = 1.0024;
      const rotation = 0.4812; // rad (~27.5 derajat)
      const Tx = 106.816629;
      const Ty = -6.595189;
      const A = scale * Math.cos(rotation);
      const B = scale * Math.sin(rotation);

      // Hasil poligon georeferenced bumi nyata [Longitude, Latitude]
      const transformedPolygon: [number, number][] = [
        [106.8160, -6.5945],
        [106.8175, -6.5945],
        [106.8175, -6.5960],
        [106.8160, -6.5960],
        [106.8160, -6.5945]
      ];

      onComplete({ A, B, Tx, Ty, scale, rotation, polygon: transformedPolygon });
      setIsCalibrating(false);
      toast.success('Kalibrasi Helmert 2D Berhasil!', {
        description: `Skala: ${scale.toFixed(4)} | Rotasi: ${(rotation * (180 / Math.PI)).toFixed(1)}°`,
      });
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-4xl flex flex-col shadow-2xl h-[85vh]">

        {/* Header Wizard */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-left shrink-0">
          <div>
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none">CAD Spasial Aligner</span>
            <h3 className="text-xs font-bold text-slate-800 leading-tight mt-1.5 uppercase">
              wizard penyelarasan koordinat: {cadFileName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 font-bold text-sm cursor-pointer outline-none border-none bg-transparent"
          >
            Batal
          </button>
        </div>

        {/* Wizard Guide */}
        <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-200 text-left text-[11px] font-semibold text-amber-800 leading-relaxed flex items-center gap-2.5 shrink-0">
          <Settings2 className="h-4.5 w-4.5 shrink-0 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
          <p>
            {step === 1 && 'Langkah 1: Klik Titik Batas Tanah Barat Laut di layar CAD kanan, lalu klik posisi yang cocok di Peta Spasial kiri.'}
            {step === 2 && 'Langkah 2: Klik Titik Batas Tanah Tenggara di layar CAD kanan, lalu klik posisi yang cocok di Peta Spasial kiri.'}
            {step === 3 && 'Langkah 3: Koordinat kontrol terkunci. Jalankan kalkulasi matriks Helmert untuk mentranslasikan denah CAD.'}
          </p>
        </div>

        {/* Main Split Panels Workspace */}
        <div className="flex-1 flex divide-x divide-slate-200 min-h-0">

          {/* Panel Kiri: Peta Target (Peta Bumi Nyata) */}
          <div className="w-1/2 h-full relative">
            <div className="absolute top-3 left-3 z-10 bg-white border border-slate-200 px-2.5 py-1 text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none">
              Peta Spasial Target (GIS)
            </div>
            <GISMapContainer center={[-6.595189, 106.816629]} zoom={16}>
              {/* Titik Jangkar Peta */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none">
                {step === 1 && (
                  <div className="relative flex items-center justify-center h-8 w-8">
                    <span className="absolute h-full w-full rounded-full bg-teal-400 opacity-70 animate-ping" />
                    <span className="relative h-3 w-3 rounded-full bg-teal-600 border border-white" />
                  </div>
                )}
                {step === 2 && (
                  <div className="relative flex items-center justify-center h-8 w-8 translate-x-12 translate-y-12">
                    <span className="absolute h-full w-full rounded-full bg-amber-400 opacity-70 animate-ping" />
                    <span className="relative h-3 w-3 rounded-full bg-amber-600 border border-white" />
                  </div>
                )}
              </div>
            </GISMapContainer>
          </div>

          {/* Panel Kanan: Gambar CAD (Koordinat Lokal) */}
          <div className="w-1/2 h-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
            <div className="absolute top-3 left-3 z-10 bg-slate-900 border border-slate-700 px-2.5 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Gambar Kerja CAD (Lokal 0,0)
            </div>

            {/* Simulasi Gambar CAD Vektor */}
            <div className="relative w-64 h-64 border border-slate-800 flex items-center justify-center">
              <Compass className="absolute top-2 right-2 text-slate-700 animate-spin-slow" size={24} />
              <div className="w-48 h-48 border-2 border-dashed border-teal-500/60 bg-teal-500/5 relative flex items-center justify-center">
                <span className="text-[10px] font-mono text-teal-500/40 select-none">LAY_PTSP_KDB</span>

                {/* Titik Kontrol CAD 1 */}
                <button
                  type="button"
                  disabled={step !== 1}
                  onClick={handleMapPoint1}
                  className={cn(
                    "absolute -top-2 -left-2 h-5 w-5 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer outline-none",
                    point1Mapped
                      ? "bg-teal-600 border-white text-white"
                      : "bg-slate-900 border-teal-500 text-teal-400 hover:scale-115"
                  )}
                >
                  <span className="text-[9px] font-black leading-none">1</span>
                </button>

                {/* Titik Kontrol CAD 2 */}
                <button
                  type="button"
                  disabled={step !== 2}
                  onClick={handleMapPoint2}
                  className={cn(
                    "absolute -bottom-2 -right-2 h-5 w-5 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer outline-none",
                    point2Mapped
                      ? "bg-amber-600 border-white text-white"
                      : "bg-slate-900 border-amber-500 text-amber-400 hover:scale-115"
                  )}
                >
                  <span className="text-[9px] font-black leading-none">2</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Wizard Controls */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span>Status Titik Ikat:</span>
            <span className={point1Mapped ? 'text-teal-600 font-bold' : 'text-slate-400'}>
              [1] {point1Mapped ? 'Terkunci' : 'Belum Terikat'}
            </span>
            <span>•</span>
            <span className={point2Mapped ? 'text-amber-600 font-bold' : 'text-slate-400'}>
              [2] {point2Mapped ? 'Terkunci' : 'Belum Terikat'}
            </span>
          </div>

          <button
            type="button"
            disabled={step !== 3 || isCalibrating}
            onClick={handleRunCalibration}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 disabled:bg-slate-200 hover:bg-teal-600 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest rounded-none transition-colors border-none outline-none cursor-pointer"
          >
            {isCalibrating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Memproses Helmert 2D...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Kalkulasi & Sinkronisasi Spasial</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── SECTION 1: DATA PEMOHON ──────────────────────────────────────────────────
export const ApplicantSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  const applicantType = watch('applicant.type');
  const [ocrLoading, setOcrLoading] = useState<'KTP' | 'NIB' | null>(null);

  const handleOCRUpload = (file: File, type: 'KTP' | 'NIB') => {
    if (!file) return;
    setOcrLoading(type);

    setTimeout(() => {
      if (type === 'KTP') {
        setValue('applicant.name', 'Budi Santoso');
        setValue('applicant.nik', '3201020304050607');
        setValue('applicant.address', 'Jl. Raya Pajajaran No. 123, Bogor Tengah, Kota Bogor, Jawa Barat');
        // Direct upload to legal doc as standard fallback
        setValue('document.legalDoc', 'uploads/permohonan/mock_KTP_uploaded.pdf');
      } else {
        setValue('applicant.name', 'PT. Maju Bersama Jaya');
        setValue('applicant.nib', '9120304050607');
        setValue('applicant.address', 'Kawasan Industri Sentul Blok C2, Babakan Madang, Kabupaten Bogor, Jawa Barat');
        // Direct upload to legal doc as standard fallback
        setValue('document.legalDoc', 'uploads/permohonan/mock_NIB_uploaded.pdf');
      }
      setOcrLoading(null);
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'KTP' | 'NIB') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleOCRUpload(file, type);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          1. Data Pemohon
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Lengkapi data identitas pemohon perseorangan atau badan usaha secara sah.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'KTP')}
          className="border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 p-4 text-center cursor-pointer transition-all relative flex flex-col items-center justify-center min-h-[100px]"
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleOCRUpload(file, 'KTP');
            }}
          />
          {ocrLoading === 'KTP' ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-[10px] font-bold text-primary">Mengekstrak data KTP (OCR)...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="h-6 w-6 text-slate-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Upload KTP untuk Auto-Fill</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Seret & lepas gambar KTP Anda di sini</p>
            </>
          )}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'NIB')}
          className="border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 p-4 text-center cursor-pointer transition-all relative flex flex-col items-center justify-center min-h-[100px]"
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleOCRUpload(file, 'NIB');
            }}
          />
          {ocrLoading === 'NIB' ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-[10px] font-bold text-primary">Mengekstrak data NIB (OCR)...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="h-6 w-6 text-slate-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Upload NIB untuk Auto-Fill</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Seret & lepas file NIB di sini</p>
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

// ─── SECTION 3: DATA LOKASI ──────────────────────────────────────────────────
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
  }, [selectedDistrict, setValue, villagesList]);

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
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          3. Data Lokasi Spasial
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Informasi lokasi administrasi geografis tapak perizinan.</p>
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
          <textarea {...register('location.fullAddress')} rows={2} className={inputClass} placeholder="Tulis alamat lokasi fisik tapak secara rinci..." />
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
            <option value="HAK_PAKAI">Hak Pakai Dinas</option>
            <option value="LAINNYA">Lainnya / Surat Adat</option>
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
            label="Unggah Scan Dokumen Sertifikat Tanah (SHM/HGB)"
            fieldKey="document.legalDoc"
            helpText="Unggah scan dokumen sertifikat kepemilikan tanah asli BPN untuk validasi data administratif."
          />
        </div>
      </div>
    </div>
  );
};

// ─── SECTION 4: DATA KOORDINAT AREA & VALIDASI CAD WIZARD [Jakarta 5] ─────────
export const CoordinateSection = () => {
  const { register, setValue, watch } = useFormContext<FullSubmissionFormValues>();
  const [spatialLoading, setSpatialLoading] = useState(false);
  const [uploadedGeoJson, setUploadedGeoJson] = useState<any>(null);

  // State untuk kontrol modal Wizard Georeferencing CAD
  const [isCadWizardOpen, setIsCadWizardOpen] = useState(false);
  const [cadFileName, setCadFileName] = useState('');

  const handleSpatialFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSpatialLoading(true);
    const reader = new FileReader();

    if (file.name.endsWith('.geojson')) {
      reader.onload = (event) => {
        try {
          const geojson = JSON.parse(event.target?.result as string);
          setUploadedGeoJson(geojson);

          // Sinkronisasi data koordinat ke form
          const firstFeature = geojson.features?.[0] || geojson;
          if (firstFeature && firstFeature.geometry && firstFeature.geometry.type === 'Polygon') {
            const coords = firstFeature.geometry.coordinates;
            setValue('coordinate.polygon', coords[0]);
            setValue('coordinate.coordinatesText', JSON.stringify(coords, null, 2));
            toast.success('Batas spasial GeoJSON berhasil diunggah!');
          }
        } catch (err) {
          toast.error('Format GeoJSON tidak valid!');
        } finally {
          setSpatialLoading(false);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.zip')) {
      reader.onload = () => {
        setTimeout(() => {
          const mockGeoJson = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [106.8160, -6.5945],
                      [106.8175, -6.5945],
                      [106.8175, -6.5960],
                      [106.8160, -6.5960],
                      [106.8160, -6.5945]
                    ]
                  ]
                }
              }
            ]
          };
          setUploadedGeoJson(mockGeoJson);
          setValue('coordinate.polygon', mockGeoJson.features[0].geometry.coordinates[0]);
          setValue('coordinate.coordinatesText', JSON.stringify(mockGeoJson.features[0].geometry.coordinates, null, 2));
          setSpatialLoading(false);
          toast.success('File Shapefile BPN berhasil diekstrak!');
        }, 1500);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Format file tidak didukung! Gunakan .geojson atau .zip (SHP)');
      setSpatialLoading(false);
    }
  };

  // Handler Unggah CAD Kerja (.dwg/.dxf) -> Triggers Aligner Wizard [Jakarta 5]
  const handleCadFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.dwg') || file.name.endsWith('.dxf')) {
      setCadFileName(file.name);
      setValue('coordinate.cadFileName', file.name);
      setIsCadWizardOpen(true);
    } else {
      toast.error('Format file salah! Harap pilih gambar kerja CAD berformat .dwg atau .dxf');
    }
  };

  // Hasil Sinkronisasi Matriks Helmert 2D dari Wizard Aligner
  const handleGeoreferenceComplete = (params: {
    A: number; B: number; Tx: number; Ty: number;
    scale: number; rotation: number; polygon: [number, number][];
  }) => {
    setValue('coordinate.cadParamA', params.A);
    setValue('coordinate.cadParamB', params.B);
    setValue('coordinate.cadParamTx', params.Tx);
    setValue('coordinate.cadParamTy', params.Ty);
    setValue('coordinate.cadScale', params.scale);
    setValue('coordinate.cadRotation', params.rotation);
    setValue('coordinate.polygon', params.polygon);
    setValue('coordinate.coordinatesText', JSON.stringify([params.polygon], null, 2));

    // Update GIS container render dengan overlapping site plan layout ar-ar polygon
    const boundaryFeature = {
      type: 'Feature',
      properties: { label: 'Batas Lahan BPN' },
      geometry: { type: 'Polygon', coordinates: [params.polygon] }
    };

    // Blok A Kaveling (dikalkulasi secara relatif dalam koordinat terkalibrasi)
    const lotAFeature = {
      type: 'Feature',
      properties: { label: 'Blok Kaveling A' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.5, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.5, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.5],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.5],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1]
        ]]
      }
    };

    const lotBFeature = {
      type: 'Feature',
      properties: { label: 'Blok Kaveling B' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.6, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.9, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.9, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.5],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.6, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.5],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.6, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1]
        ]]
      }
    };

    const roadFeature = {
      type: 'Feature',
      properties: { label: 'Lebar Jalan Utama' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.05, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.52],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.95, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.52],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.95, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.58],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.05, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.58],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.05, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.52]
        ]]
      }
    };

    const rthFeature = {
      type: 'Feature',
      properties: { label: 'Rencana Fasum & RTH' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.6],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.9, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.6],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.9, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.9],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.9],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.6]
        ]]
      }
    };

    setUploadedGeoJson({
      type: 'FeatureCollection',
      features: [boundaryFeature, lotAFeature, lotBFeature, roadFeature, rthFeature]
    });
  };

  const handleMapChange = (coords: number[][][]) => {
    const coordsString = JSON.stringify(coords, null, 2);
    setValue('coordinate.coordinatesText', coordsString);
    setValue('coordinate.polygon', coords[0]);
  };

  const handleResetCoordinates = () => {
    const spatialInput = document.getElementById('spatial-file-input') as HTMLInputElement;
    const cadInput = document.getElementById('cad-file-input') as HTMLInputElement;
    if (spatialInput) spatialInput.value = '';
    if (cadInput) cadInput.value = '';

    setUploadedGeoJson(null);
    setCadFileName('');

    setValue('coordinate.polygon', undefined);
    setValue('coordinate.coordinatesText', '');
    setValue('coordinate.cadFileName', undefined);
    setValue('coordinate.cadParamA', undefined);
    setValue('coordinate.cadParamB', undefined);
    setValue('coordinate.cadParamTx', undefined);
    setValue('coordinate.cadParamTy', undefined);
    setValue('coordinate.cadScale', undefined);
    setValue('coordinate.cadRotation', undefined);

    toast.info('Data koordinat dan file terunggah telah di-reset.');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
            4. Data Koordinat Batas Lahan
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Unggah file spasial BPN resmi atau gambar rencana CAD untuk menyelaraskan koordinat tapak.</p>
        </div>
        <button
          type="button"
          onClick={handleResetCoordinates}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 text-xs font-bold rounded-none transition-colors cursor-pointer outline-none"
        >
          <RefreshCw className="h-3.5 w-3.5 animate-spin-hover" />
          Reset Spasial / Ulangi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input 1: Berkas Spasial Batas Lahan BPN */}
        <div className="bg-slate-50 border border-slate-200 p-4 transition-all duration-300 text-left">
          <LabelWithInfo label="Unggah File Spasial BPN (.shp.zip / .geojson)" helpText="Unggah file koordinat poligon batas lahan resmi dari BPN untuk proses sinkronisasi spasial otomatis." />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
            <input
              type="file"
              accept=".geojson,.zip"
              className="hidden"
              id="spatial-file-input"
              onChange={handleSpatialFileUpload}
            />
            <label
              htmlFor="spatial-file-input"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white font-semibold text-xs cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <FileUp className="h-4.5 w-4.5" />
              Pilih Berkas Spasial
            </label>
            <span className="text-[10px] text-slate-400">
              {spatialLoading ? 'Memproses berkas spasial...' : 'Menerima file ESRI Shapefile (.zip) atau GeoJSON'}
            </span>
          </div>
        </div>

        {/* Input 2: Berkas Gambar Kerja CAD Site Plan [Jakarta 5] */}
        <div className="bg-slate-50 border border-slate-200 p-4 transition-all duration-300 text-left">
          <LabelWithInfo label="Unggah Gambar Rencana CAD (.dwg / .dxf)" helpText="Unggah berkas gambar tapak AutoCAD. Sistem akan memandu Anda melakukan transformasi Helmert untuk georeferensi denah." />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
            <input
              type="file"
              accept=".dwg,.dxf"
              className="hidden"
              id="cad-file-input"
              onChange={handleCadFileUpload}
            />
            <label
              htmlFor="cad-file-input"
              className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              <FileUp className="h-4.5 w-4.5" />
              Pilih Berkas CAD
            </label>
            <span className="text-[10px] text-slate-400">
              {cadFileName ? `Terpilih: ${cadFileName}` : 'Unggah denah autocad untuk memulai penyelarasan koordinat'}
            </span>
          </div>
        </div>
      </div>

      {/* Wadah Peta Imersif dengan Outline Tipis untuk Perlindungan Kontras */}
      <div className="h-[400px] w-full overflow-hidden border border-border shadow-inner relative">
        {spatialLoading && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <div className="bg-white p-3 shadow-md flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-[10px] font-bold text-slate-700">Memproses Peta Spasial...</span>
            </div>
          </div>
        )}
        <GISMapContainer>
          <GISDrawingMap onShapeChange={handleMapChange} initialGeoJson={uploadedGeoJson} />
        </GISMapContainer>
      </div>

      <div className="text-left">
        <LabelWithInfo label="Data Koordinat Spasial GeoJSON (Terekam Otomatis)" helpText="Koordinat poligon spasial akan terisi secara otomatis di sini saat Anda menyelesaikan gambar bidang tanah di atas peta..." />
        <textarea
          {...register('coordinate.coordinatesText')}
          rows={5}
          readOnly
          placeholder="Koordinat poligon spasial akan terisi secara otomatis di sini saat Anda menyelesaikan gambar bidang tanah di atas peta..."
          className="w-full font-mono text-[10px] px-3.5 py-2 border border-border bg-slate-50/50 hover:bg-slate-100/50 text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary rounded-none transition-all"
        />
      </div>

      {/* CAD Georeference Wizard Modal Overlay */}
      <CADGeoreferenceWizard
        isOpen={isCadWizardOpen}
        cadFileName={cadFileName}
        onClose={() => setIsCadWizardOpen(false)}
        onComplete={handleGeoreferenceComplete}
      />
    </div>
  );
};

// ─── SECTION 5: INFORMASI TATA RUANG ─────────────────────────────────────────
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
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          5. Informasi Kesesuaian Tata Ruang
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Data sinkronisasi KKPR (Kesesuaian Kegiatan Pemanfaatan Ruang) daerah.</p>
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

// ─── SECTION 6: DATA TEKNIS SITE PLAN ─────────────────────────────────────────
export const TechnicalSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  const category = watch('submission.category') || 'PERUMAHAN';
  const landArea = watch('location.landArea') || 0;

  const cemeteryAreaVal = watch('technical.cemeteryArea');
  const [cemeteryPercent, setCemeteryPercent] = useState<string>('');

  const handleCemeteryLuasChangeVal = (val: number | undefined) => {
    if (landArea > 0 && val !== undefined && !isNaN(val)) {
      setCemeteryPercent(((val / landArea) * 100).toFixed(1));
    } else {
      setCemeteryPercent('');
    }
  };

  const handleCemeteryPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Math.max(0, Number(e.target.value));
    setCemeteryPercent(e.target.value === '' ? '' : String(percent));
    if (landArea > 0 && !isNaN(percent)) {
      setValue('technical.cemeteryArea', Math.round((percent / 100) * landArea));
    }
  };

  useEffect(() => {
    if (landArea > 0 && cemeteryAreaVal) {
      setCemeteryPercent(((cemeteryAreaVal / landArea) * 100).toFixed(1));
    }
  }, [landArea, cemeteryAreaVal]);

  // ─── REVISI: KALKULATOR KDB MANDIRI LIVE UNTUK PEMOHON ───
  const applicantBuildingAreaVal = watch('technical.applicantBuildingArea');
  const [computedKdbPercent, setComputedKdbPercent] = useState<string>('');

  const handleBuildingAreaChange = (val: number | undefined) => {
    if (landArea > 0 && val !== undefined && !isNaN(val)) {
      const calculated = (val / landArea) * 100;
      setValue('technical.kdb', Math.round(calculated * 100) / 100);
      setComputedKdbPercent(calculated.toFixed(1));
    } else {
      setValue('technical.kdb', undefined);
      setComputedKdbPercent('');
    }
  };

  useEffect(() => {
    if (landArea > 0 && applicantBuildingAreaVal) {
      const calculated = (applicantBuildingAreaVal / landArea) * 100;
      setComputedKdbPercent(calculated.toFixed(1));
    }
  }, [landArea, applicantBuildingAreaVal]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          6. Parameter Teknis Rencana Tapak
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Rincian parameter teknis fisik pembangunan berdasarkan kriteria teknis dinas terkait.</p>
      </div>

      {/* ─── BARU: BLOK DEKLARASI MANDIRI KESESUAIAN TATA RUANG (PROPOSED METRICS) ─── */}
      <div className="border border-primary/25 bg-[#e8f2ea]/20 p-5 space-y-4 text-left">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Deklarasi Mandiri Kesesuaian Tata Ruang (Proposed Metrics)
        </h4>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Tuliskan estimasi dimensi teknis yang Anda rencanakan pada site plan. Nilai ini akan dihitung ulang secara manual oleh dinas menggunakan berkas CAD yang Anda unggah [Buku 1, 11].
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <LabelWithInfo label="Luas Lantai Dasar Bangunan (m²)" helpText="Total luasan lantai dasar bangunan rencana untuk kalkulasi KDB." />
            <FormattedInput name="technical.applicantBuildingArea" placeholder="Contoh: 6000" unit="m²" onChangeCustom={handleBuildingAreaChange} />
          </div>

          <div>
            <LabelWithInfo label="Garis Sempadan Bangunan (GSB - m)" helpText="Batas penarikan mundur minimal dinding bangunan dari tepi rencana jalan (Buku 2 Hal 22)." />
            <FormattedInput name="technical.applicantGsb" placeholder="Contoh: 5" unit="meter" />
          </div>

          <div>
            <LabelWithInfo label="Luas Hijau Resapan Rencana (RTH - m²)" helpText="Total luasan area pekarangan hijau penyerap air hujan yang akan dibangun." />
            <FormattedInput name="technical.applicantRthArea" placeholder="Contoh: 1500" unit="m²" />
          </div>
        </div>

        {/* Real-time calculated proposed KDB Indicator */}
        {computedKdbPercent && (
          <div className="pt-2 border-t border-primary/10 flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span>Estimasi KDB Usulan:</span>
            <span className={cn(
              "font-bold font-mono px-2 py-0.5 rounded-none border text-[11px]",
              Number(computedKdbPercent) <= 60.0
                ? "bg-[#e8f2ea] text-primary border-[#A1CCA5]"
                : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
            )}>
              {computedKdbPercent}% {Number(computedKdbPercent) <= 60.0 ? " (Memenuhi Batas Maks 60%)" : " (Melanggar Batas Maks 60%!)"}
            </span>
          </div>
        )}
      </div>

      {category === 'PERUMAHAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left animate-in fade-in duration-300">
          <div>
            <LabelWithInfo label="Jumlah Kaveling Efektif" helpText="Jumlah total unit kaveling hunian efektif yang akan dibangun pada rencana tapak." />
            <FormattedInput name="technical.lotCount" placeholder="Contoh: 150" unit="Kaveling" />
            {errors.technical?.lotCount && <p className="text-xs text-rose-500 mt-1">{errors.technical.lotCount.message}</p>}
          </div>
          <div>
            <LabelWithInfo label="Tipe Perumahan" helpText="Klasifikasi jenis pembangunan perumahan (Komersil, MBR/Subsidi, atau Campuran)." />
            <select {...register('technical.housingType')} className={inputClass}>
              <option value="NON_SUBSIDI">Komersil / Non-Subsidi</option>
              <option value="SUBSIDI">Masyarakat Berpenghasilan Rendah / Subsidi</option>
              <option value="CAMPURAN">Campuran</option>
            </select>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border border-[#DAE4DB] bg-[#f4f7f4]/20 p-4">
            <div>
              <LabelWithInfo label="Luas Kaveling Makam / TPU Rencana (m²)" helpText={`Penyediaan area makam fisik / TPU rencana (wajib minimal 2% dari total luas lahan perumahan: ${landArea > 0 ? (landArea * 0.02).toLocaleString('id-ID') : '0'} m²).`} />
              <FormattedInput name="technical.cemeteryArea" placeholder="Penyediaan 2% dari luas total" unit="m²" onChangeCustom={handleCemeteryLuasChangeVal} />
              {errors.technical?.cemeteryArea && <p className="text-xs text-rose-500 mt-1">{errors.technical.cemeteryArea.message}</p>}
            </div>

            <div>
              <LabelWithInfo label="Kalkulator Persentase TPU (%)" helpText={`Masukkan target persentase atau hitung otomatis. Luas Lahan Aktif: ${landArea.toLocaleString('id-ID')} m².`} />
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={cemeteryPercent}
                  onChange={handleCemeteryPercentChange}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className={inputClass}
                  placeholder="Contoh: 2"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">%</span>
              </div>
              {cemeteryPercent && !isNaN(Number(cemeteryPercent)) && (
                <span className={cn(
                  "text-[10px] font-bold mt-1 block",
                  Number(cemeteryPercent) >= 2 ? "text-primary" : "text-rose-600"
                )}>
                  {Number(cemeteryPercent) >= 2 ? "✓ Memenuhi standar minimal 2%" : "⚠ Kurang dari standar minimal 2%"}
                </span>
              )}
            </div>
          </div>

          <div>
            <LabelWithInfo label="Lebar ROW Jalan Utama (m)" helpText="Lebar ruang milik jalan utama kawasan tapak perumahan (misal: ROW 8 Meter)." />
            <input {...register('technical.roadRowMain')} type="text" className={inputClass} placeholder="Contoh: ROW 8 Meter" />
          </div>
          <div>
            <LabelWithInfo label="Lebar ROW Jalan Lingkungan (m)" helpText="Lebar ruang milik jalan penghubung antar kaveling hunian (misal: ROW 6 Meter)." />
            <input {...register('technical.roadRowLocal')} type="text" className={inputClass} placeholder="Contoh: ROW 6 Meter" />
          </div>
          <div>
            <LabelWithInfo label="Sistem Distribusi Air Bersih" helpText="Sistem penyediaan air minum bagi warga kawasan tapak perumahan." />
            <input {...register('technical.waterSystem')} type="text" className={inputClass} placeholder="Contoh: PDAM / Sumur Bor Komunal" />
          </div>

          {/* ─── DYNAMIC UPLOAD: Dokumen Rencana PSU ─── */}
          <div className="md:col-span-2 pt-2 border-t border-slate-100">
            <ContextualUploadBox
              label="Unggah Dokumen Detail Rencana PSU"
              fieldKey="document.technicalDoc"
              helpText="Unggah draf rencana sistem Prasarana, Sarana, dan Utilitas (PSU) yang divalidasi oleh konsultan perencana."
            />
          </div>
        </div>
      )}

      {category === 'NON_PERUMAHAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left animate-in fade-in duration-300">
          <div>
            <LabelWithInfo label="Jumlah Blok / Unit Gedung" helpText="Jumlah total unit blok gedung utama atau ruko komersial yang direncanakan." />
            <FormattedInput name="technical.buildingBlocks" placeholder="Contoh: 5 Blok" unit="Blok" />
          </div>
          <div>
            <LabelWithInfo label="Koefisien Dasar Bangunan (KDB - %)" helpText="Persentase luas lantai dasar bangunan terhadap total luas lahan." />
            <FormattedInput name="technical.kdb" placeholder="Contoh: 60" unit="%" />
            {errors.technical?.kdb && <p className="text-xs text-rose-500 mt-1">{errors.technical.kdb.message}</p>}
          </div>
          <div>
            <LabelWithInfo label="Koefisien Lantai Bangunan (KLB)" helpText="Angka perbandingan luas seluruh lantai bangunan terhadap total luas lahan." />
            <FormattedInput name="technical.klb" placeholder="Contoh: 2.4" unit="" isDecimal={true} />
          </div>
          <div>
            <LabelWithInfo label="Koefisien Dasar Hijau (KDH - %)" helpText="Persentase ruang terbuka luar bangunan yang ditumbuhi tanaman/hijau minimal." />
            <FormattedInput name="technical.kdh" placeholder="Contoh: 20" unit="%" />
          </div>
          <div>
            <LabelWithInfo label="Kapasitas Satuan Ruang Parkir (SRP)" helpText="Kapasitas total Satuan Ruang Parkir (SRP) kendaraan yang disediakan di dalam area tapak." />
            <FormattedInput name="technical.parkingCapacity" placeholder="Contoh: 50 Mobil" unit="SRP" />
          </div>
          <div>
            <LabelWithInfo label="Jumlah Lantai Bangunan Maksimum" helpText="Jumlah lantai gedung maksimum yang direncanakan." />
            <FormattedInput name="technical.maxFloors" placeholder="Contoh: 4 Lantai" unit="Lantai" />
          </div>
          <div className="md:col-span-2">
            <LabelWithInfo label="Total Luas Lantai Bangunan (m²)" helpText="Akumulasi luas seluruh lantai bangunan yang direncanakan (m²)." />
            <FormattedInput name="technical.totalFloorArea" placeholder="Contoh: 4500" unit="m²" />
          </div>

          {/* ─── DYNAMIC UPLOAD: Dokumen Andalalin ─── */}
          <div className="md:col-span-2 pt-2 border-t border-slate-100">
            <ContextualUploadBox
              label="Unggah Dokumen Kajian Dampak Lalu Lintas (Andalalin)"
              fieldKey="document.supportDoc2"
              helpText="Unggah surat persetujuan teknis Andalalin yang diterbitkan resmi oleh Dinas Perhubungan setempat."
            />
          </div>
        </div>
      )}

      {category === 'FASUM' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left animate-in fade-in duration-300">
          <div>
            <LabelWithInfo label="Jenis Layanan Fasilitas" helpText="Fokus utama fungsi pelayanan publik yang akan diselenggarakan." />
            <select {...register('technical.facilityType')} className={inputClass}>
              <option value="PERIBADATAN">Fasilitas Peribadatan (Masjid/Gereja)</option>
              <option value="KESEHATAN">Fasilitas Kesehatan (Rumah Sakit/Klinik)</option>
              <option value="PENDIDIKAN">Fasilitas Pendidikan (Sekolah/PAUD)</option>
              <option value="SOSIAL_BUDAYA">Fasilitas Sosial / Balai Warga</option>
            </select>
          </div>
          <div>
            <LabelWithInfo label="Kapasitas Daya Tampung (Pengunjung/Siswa/Jemaah)" helpText="Kapasitas daya tampung maksimum dalam sekali pelayanan." />
            <FormattedInput name="technical.capacity" placeholder="Contoh: 300 Jiwa" unit="Jiwa" />
          </div>
          <div>
            <LabelWithInfo label="Aksesibilitas Difabel (Ramp/Guiding Block)" helpText="Penyediaan infrastruktur ramah penyandang disabilitas (tata jalan pemandu/ramp kursi roda)." />
            <select {...register('technical.disabledAccess')} className={inputClass}>
              <option value="LENGKAP">Tersedia Lengkap</option>
              <option value="PARSIAL">Tersedia Sebagian</option>
              <option value="TIDAK_ADA">Tidak Tersedia</option>
            </select>
          </div>
          <div>
            <LabelWithInfo label="Ketersediaan Parkir Khusus (Ambulans/Bus)" helpText="Akses parkir/tunggu khusus kendaraan darurat pelayanan umum." />
            <select {...register('technical.specialParking')} className={inputClass}>
              <option value="ADA">Tersedia Drop-off Khusus</option>
              <option value="TIDAK_ADA">Tidak Tersedia</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <LabelWithInfo label="Rencana Sistem Proteksi Kebakaran Aktif" helpText="Infrastruktur pemadam kebakaran mandiri yang terpasang di area tapak pelayanan." />
            <input {...register('technical.fireProtection')} type="text" className={inputClass} placeholder="Contoh: Pemasangan Hydrant Mandiri, APAR di setiap koridor" />
          </div>

          {/* ─── DYNAMIC UPLOAD: Andalalin / Rekomendasi Instansi ─── */}
          <div className="md:col-span-2 pt-2 border-t border-slate-100">
            <ContextualUploadBox
              label="Unggah Dokumen Persetujuan Andalalin / Rekomendasi Instansi"
              fieldKey="document.supportDoc2"
              helpText="Unggah surat rekomendasi teknis dinas sektoral (misal Dinas Perhubungan atau Dinas Kesehatan)."
            />
          </div>
        </div>
      )}

      {category === 'INDUSTRI' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left animate-in fade-in duration-300">
          <div>
            <LabelWithInfo label="Jumlah Unit Gudang / Pabrik" helpText="Jumlah total bangunan unit pabrik atau gudang logistik penyimpanan." />
            <FormattedInput name="technical.warehouseCount" placeholder="Contoh: 12 Unit" unit="Unit" />
          </div>
          <div>
            <LabelWithInfo label="Muatan Sumbu Terberat Kelas Jalan (MST - Ton)" helpText="Kekuatan muatan maksimal jalan masuk ke kawasan industri untuk truk logistik." />
            <input {...register('technical.roadLoadMst')} type="text" className={inputClass} placeholder="Contoh: MST 8 Ton / Kelas III-A" />
          </div>
          <div>
            <LabelWithInfo label="Daya Listrik Industri Terpasang" helpText="Total suplai daya listrik dari PLN yang dialokasikan bagi aktivitas industri." />
            <input {...register('technical.electricityPower')} type="text" className={inputClass} placeholder="Contoh: 150 kVA" />
          </div>
          <div>
            <LabelWithInfo label="Kapasitas Pengolahan IPAL Terencana (m³/hari)" helpText="Daya pengolahan air limbah kawasan industri per hari sebelum dibuang ke saluran kota." />
            <input {...register('technical.ipalCapacity')} type="text" className={inputClass} placeholder="Contoh: 50 m3/hari" />
          </div>
          <div>
            <LabelWithInfo label="Luas Sabuk Penyangga Hijau (Green Buffer - m²)" helpText="Luas area hijau penyangga pembatas aktivitas polusi industri dengan kawasan pemukiman." />
            <FormattedInput name="technical.greenBufferArea" placeholder="Contoh: 2500" unit="m²" />
          </div>
          <div>
            <LabelWithInfo label="Penyediaan Tempat Pembuangan Sementara B3" helpText="Ketersediaan tempat penyimpanan sementara khusus untuk limbah Bahan Berbahaya dan Beracun (B3)." />
            <select {...register('technical.tpsB3Provision')} className={inputClass}>
              <option value="YA">Ya, Disediakan TPS Khusus B3 Berizin</option>
              <option value="TIDAK">Tidak Disediakan (Kerjasama Pihak Ketiga)</option>
            </select>
          </div>

          {/* ─── DYNAMIC UPLOADS: AMDAL & Persetujuan Air Limbah ─── */}
          <div className="md:col-span-2 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContextualUploadBox
              label="Unggah Dokumen Analisis Lingkungan AMDAL/UKL-UPL"
              fieldKey="document.technicalDoc"
              helpText="Unggah dokumen kelayakan lingkungan yang diterbitkan oleh Dinas Lingkungan Hidup."
            />
            <ContextualUploadBox
              label="Unggah Dokumen Persetujuan Teknis Air Limbah"
              fieldKey="document.supportDoc2"
              helpText="Unggah persetujuan teknis pembuangan/pemanfaatan air limbah industri."
            />
          </div>
        </div>
      )}
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
            fieldKey="document.supportDoc"
            helpText="Unggah bukti sertifikat lisensi arsitek aktif (IAI) guna jaminan tanggung jawab teknis gambar."
          />
        </div>
      </div>
    </div>
  );
};

// ─── SECTION 8: LAMPIRAN DOKUMEN (SUMMARY / REKAPITULASI DOKUMEN TERUNGGAH) ───
export const DocumentSection = () => {
  const { watch } = useFormContext<FullSubmissionFormValues>();

  // Membaca state seluruh file yang diunggah secara asinkron di sepanjang langkah 1-7
  const legalDoc = watch('document.legalDoc');
  const technicalDoc = watch('document.technicalDoc');
  const supportDoc = watch('document.supportDoc');
  const supportDoc2 = watch('document.supportDoc2');

  const docSummary = [
    { name: 'Sertifikat Tanah & KTP (Langkah 3)', value: legalDoc, mandatory: true },
    { name: 'Gambar Rencana Teknis CAD / Amdal (Langkah 4/6)', value: technicalDoc, mandatory: true },
    { name: 'SK KKPR Awal / SKA Arsitek (Langkah 5/7)', value: supportDoc, mandatory: true },
    { name: 'Andalalin / Persetujuan Teknis Limbah B3 (Langkah 6)', value: supportDoc2, mandatory: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          8. Rekapitulasi Berkas Dokumen Terunggah
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Guna mematuhi asas transparansi, pastikan seluruh dokumen administratif dan spasial di bawah ini telah terisi secara sah.</p>
      </div>

      <div className="bg-[#e8f2ea]/30 border border-primary/10 p-4 text-left select-none mb-4">
        <h5 className="text-[10px] font-bold text-[#111D13] uppercase tracking-wide flex items-center gap-1.5 mb-1">
          <Info size={14} className="text-primary" />
          Status Berkas Pendaftaran Terdistribusi
        </h5>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Sistem GEOSIPAS v3.0 mendistribusikan penempatan tombol unggah berkas secara langsung di langkah (*step*) pengisian data yang relevan agar meminimalkan beban ingatan Anda (*low cognitive load*).
        </p>
      </div>

      {/* Grid Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {docSummary.map((doc, idx) => {
          const isUploaded = !!doc.value;
          return (
            <div
              key={idx}
              className={cn(
                "p-4 border transition-all duration-300 flex items-center justify-between rounded-none shadow-none",
                isUploaded
                  ? "bg-[#e8f2ea]/20 border-primary/40 text-primary"
                  : doc.mandatory
                    ? "bg-amber-50/20 border-amber-200 text-amber-800 animate-pulse"
                    : "bg-slate-50/50 border-slate-200 text-slate-400"
              )}
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs truncate">{doc.name}</h4>
                <p className="text-[10px] opacity-75 mt-1 leading-none font-medium">
                  {isUploaded
                    ? `✓ Berkas Siap: ${typeof doc.value === 'string' ? doc.value.split('/').pop() : 'OK'}`
                    : doc.mandatory
                      ? '⚠ Wajib Diisi (Kembali ke langkah bersangkutan)'
                      : 'Pilihan (Opsional)'}
                </p>
              </div>

              {isUploaded ? (
                <span className="h-6 w-6 bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 rounded-full border border-white">
                  ✓
                </span>
              ) : doc.mandatory ? (
                <span className="h-6 w-6 bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 rounded-full border border-white">
                  !
                </span>
              ) : (
                <span className="h-6 w-6 bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0 rounded-full border-none">
                  -
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── SECTION 9: FOTO LOKASI ───────────────────────────────────────────────────
export const PhotoSection = () => {
  const { watch, setValue } = useFormContext<FullSubmissionFormValues>();

  const getPhotoFieldKey = (dir: string) => {
    if (dir.includes('Utara')) return 'photo.photoNorth';
    if (dir.includes('Selatan')) return 'photo.photoSouth';
    if (dir.includes('Timur')) return 'photo.photoEast';
    if (dir.includes('Barat')) return 'photo.photoWest';
    return 'photo.photoAccess';
  };

  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: any) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(prev => ({ ...prev, [fieldKey]: true }));
        const uploadResult = await uploadFileToBackend(file);
        setValue(fieldKey, uploadResult.file_url);
        toast.success(`Berhasil mengunggah foto: ${file.name}`);
      } catch (err) {
        toast.error('Gagal mengunggah foto ke server');
      } finally {
        setIsUploading(prev => ({ ...prev, [fieldKey]: false }));
      }
    }
  };

  const handleClearPhoto = (fieldKey: any) => {
    setValue(fieldKey, undefined);
  };

  const triggerPhotoInput = (idx: number) => {
    const input = document.getElementById(`photo-upload-${idx}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

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
        {['Sisi Utara', 'Sisi Selatan', 'Sisi Timur', 'Sisi Barat', 'Akses Jalan Utama'].map((dir, idx) => {
          const fieldKey = getPhotoFieldKey(dir);
          const fileValue = watch(fieldKey as any);

          return (
            <div key={idx} className="relative group aspect-square border border-border bg-white overflow-hidden select-none rounded-none">
              <input
                type="file"
                id={`photo-upload-${idx}`}
                className="hidden"
                onChange={(e) => handlePhotoChange(e, fieldKey)}
                accept="image/*"
              />

              {isUploading[fieldKey] ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-slate-50">
                  <Loader2 className="h-5 w-5 text-primary mb-2 animate-spin" />
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider">Mengunggah...</p>
                </div>
              ) : fileValue ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-1.5 animate-in zoom-in-95 duration-200">
                  <img
                    src={fileValue instanceof File ? URL.createObjectURL(fileValue) : fileValue}
                    alt={dir}
                    className="object-cover w-full h-full border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearPhoto(fieldKey);
                    }}
                    className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-none text-[8px] font-black uppercase tracking-wider border-none cursor-pointer shadow-md transition-colors outline-none"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => triggerPhotoInput(idx)}
                  className="w-full h-full flex flex-col items-center justify-center text-center p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <UploadCloud className="h-5 w-5 text-secondary-foreground/60 mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-[10px] font-bold text-slate-700 leading-snug">{dir}</p>
                  <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">Pilih Foto</p>
                </div>
              )}
            </div>
          );
        })}
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