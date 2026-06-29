import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FullSubmissionFormValues } from '../schemas/submissionFormSchema';
import {
  UploadCloud, CheckCircle2, Loader2, FileUp, Info,
  Settings2, Compass, RefreshCw
} from 'lucide-react';
import GISMapContainer from '@/components/maps/GISMapContainer';
import GISDrawingMap from '@/components/maps/GISDrawingMap';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
      } else {
        setValue('applicant.name', 'PT. Maju Bersama Jaya');
        setValue('applicant.nib', '9120304050607');
        setValue('applicant.address', 'Kawasan Industri Sentul Blok C2, Babakan Madang, Kabupaten Bogor, Jawa Barat');
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
          <label className={labelClass}>Kategori Rencana Tapak</label>
          <select {...register('submission.category')} className={inputClass}>
            <option value="PERUMAHAN">PERUMAHAN</option>
            <option value="NON_PERUMAHAN">NON_PERUMAHAN</option>
            <option value="FASUM">FASUM</option>
            <option value="INDUSTRI">INDUSTRI</option>
          </select>
        </div>

        <div className="md:col-span-2">
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

// ─── SECTION 4: DATA KOORDINAT AREA & VALIDASI CAD WIZARD [Jakarta 5] ─────────
export const CoordinateSection = () => {
  const { register, setValue } = useFormContext<FullSubmissionFormValues>();
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

    // Update GIS container render
    setUploadedGeoJson({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [params.polygon] }
      }]
    });
  };

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
        <p className="text-[10px] text-slate-400 mt-1">Gunakan alat gambar poligon di sisi kiri peta atau unggah file spasial BPN resmi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input 1: Berkas Spasial Batas Lahan BPN */}
        <div className="bg-slate-50 border border-slate-200 p-4 transition-all duration-300 text-left">
          <label className={labelClass}>Unggah File Spasial BPN (.shp.zip / .geojson)</label>
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
          <label className={labelClass}>Unggah Gambar Rencana CAD (.dwg / .dxf)</label>
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
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer transition-colors"
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
        <label className={labelClass}>Data Koordinat Spasial GeoJSON (Terekam Otomatis)</label>
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
  const { register, watch, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  const category = watch('submission.category') || 'PERUMAHAN';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          6. Parameter Teknis Rencana Tapak
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Rincian parameter teknis fisik pembangunan berdasarkan kriteria teknis dinas terkait.</p>
      </div>

      {category === 'PERUMAHAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left animate-in fade-in duration-300">
          <div>
            <label className={labelClass}>Jumlah Kaveling Efektif</label>
            <input {...register('technical.lotCount', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 150" />
            {errors.technical?.lotCount && <p className="text-xs text-rose-500 mt-1">{errors.technical.lotCount.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Tipe Perumahan</label>
            <select {...register('technical.housingType')} className={inputClass}>
              <option value="NON_SUBSIDI">Komersil / Non-Subsidi</option>
              <option value="SUBSIDI">Masyarakat Berpenghasilan Rendah / Subsidi</option>
              <option value="CAMPURAN">Campuran</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Luas Kaveling Makam / TPU Rencana (m²)</label>
            <input {...register('technical.cemeteryArea', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Penyediaan 2% dari luas total" />
            {errors.technical?.cemeteryArea && <p className="text-xs text-rose-500 mt-1">{errors.technical.cemeteryArea.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Lebar ROW Jalan Utama (m)</label>
            <input {...register('technical.roadRowMain')} type="text" className={inputClass} placeholder="Contoh: ROW 8 Meter" />
          </div>
          <div>
            <label className={labelClass}>Lebar ROW Jalan Lingkungan (m)</label>
            <input {...register('technical.roadRowLocal')} type="text" className={inputClass} placeholder="Contoh: ROW 6 Meter" />
          </div>
          <div>
            <label className={labelClass}>Sistem Distribusi Air Bersih</label>
            <input {...register('technical.waterSystem')} type="text" className={inputClass} placeholder="Contoh: PDAM / Sumur Bor Komunal" />
          </div>
        </div>
      )}

      {category === 'NON_PERUMAHAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left animate-in fade-in duration-300">
          <div>
            <label className={labelClass}>Jumlah Blok / Unit Gedung</label>
            <input {...register('technical.buildingBlocks', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 5 Blok" />
          </div>
          <div>
            <label className={labelClass}>Koefisien Dasar Bangunan (KDB - %)</label>
            <input {...register('technical.kdb', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 60" />
            {errors.technical?.kdb && <p className="text-xs text-rose-500 mt-1">{errors.technical.kdb.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Koefisien Lantai Bangunan (KLB)</label>
            <input {...register('technical.klb', { valueAsNumber: true })} type="number" step="0.1" className={inputClass} placeholder="Contoh: 2.4" />
          </div>
          <div>
            <label className={labelClass}>Koefisien Dasar Hijau (KDH - %)</label>
            <input {...register('technical.kdh', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 20" />
          </div>
          <div>
            <label className={labelClass}>Kapasitas Satuan Ruang Parkir (SRP)</label>
            <input {...register('technical.parkingCapacity', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 50 Mobil" />
          </div>
          <div>
            <label className={labelClass}>Jumlah Lantai Bangunan Maksimum</label>
            <input {...register('technical.maxFloors', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 4 Lantai" />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Total Luas Lantai Bangunan (m²)</label>
            <input {...register('technical.totalFloorArea', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 4500" />
          </div>
        </div>
      )}

      {category === 'FASUM' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left animate-in fade-in duration-300">
          <div>
            <label className={labelClass}>Jenis Layanan Fasilitas</label>
            <select {...register('technical.facilityType')} className={inputClass}>
              <option value="PERIBADATAN">Fasilitas Peribadatan (Masjid/Gereja)</option>
              <option value="KESEHATAN">Fasilitas Kesehatan (Rumah Sakit/Klinik)</option>
              <option value="PENDIDIKAN">Fasilitas Pendidikan (Sekolah/PAUD)</option>
              <option value="SOSIAL_BUDAYA">Fasilitas Sosial / Balai Warga</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Kapasitas Daya Tampung (Pengunjung/Siswa/Jemaah)</label>
            <input {...register('technical.capacity', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 300 Jiwa" />
          </div>
          <div>
            <label className={labelClass}>Aksesibilitas Difabel (Ramp/Guiding Block)</label>
            <select {...register('technical.disabledAccess')} className={inputClass}>
              <option value="LENGKAP">Tersedia Lengkap</option>
              <option value="PARSIAL">Tersedia Sebagian</option>
              <option value="TIDAK_ADA">Tidak Tersedia</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Ketersediaan Parkir Khusus (Ambulans/Bus)</label>
            <select {...register('technical.specialParking')} className={inputClass}>
              <option value="ADA">Tersedia Drop-off Khusus</option>
              <option value="TIDAK_ADA">Tidak Tersedia</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Rencana Sistem Proteksi Kebakaran Aktif</label>
            <input {...register('technical.fireProtection')} type="text" className={inputClass} placeholder="Contoh: Pemasangan Hydrant Mandiri, APAR di setiap koridor" />
          </div>
        </div>
      )}

      {category === 'INDUSTRI' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left animate-in fade-in duration-300">
          <div>
            <label className={labelClass}>Jumlah Unit Gudang / Pabrik</label>
            <input {...register('technical.warehouseCount', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 12 Unit" />
          </div>
          <div>
            <label className={labelClass}>Muatan Sumbu Terberat Kelas Jalan (MST - Ton)</label>
            <input {...register('technical.roadLoadMst')} type="text" className={inputClass} placeholder="Contoh: MST 8 Ton / Kelas III-A" />
          </div>
          <div>
            <label className={labelClass}>Daya Listrik Industri Terpasang</label>
            <input {...register('technical.electricityPower')} type="text" className={inputClass} placeholder="Contoh: 150 kVA" />
          </div>
          <div>
            <label className={labelClass}>Kapasitas Pengolahan IPAL Terencana (m³/hari)</label>
            <input {...register('technical.ipalCapacity')} type="text" className={inputClass} placeholder="Contoh: 50 m3/hari" />
          </div>
          <div>
            <label className={labelClass}>Luas Sabuk Penyangga Hijau (Green Buffer - m²)</label>
            <input {...register('technical.greenBufferArea', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Contoh: 2500" />
          </div>
          <div>
            <label className={labelClass}>Penyediaan Tempat Pembuangan Sementara B3</label>
            <select {...register('technical.tpsB3Provision')} className={inputClass}>
              <option value="YA">Ya, Disediakan TPS Khusus B3 Berizin</option>
              <option value="TIDAK">Tidak Disediakan (Kerjasama Pihak Ketiga)</option>
            </select>
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
        <div className="md:col-span-2"><label className={labelClass}>Nama Biro / Perusahaan Konsultan Perencana</label><input {...register('consultant.companyName')} type="text" className={inputClass} placeholder="PT / CV Biro Rekayasa Geospasial..." />{errors.consultant?.companyName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.companyName.message}</p>}</div>
        <div><label className={labelClass}>Nama Arsitek / Praktisi (Sertifikasi SKEA)</label><input {...register('consultant.consultantName')} type="text" className={inputClass} placeholder="Ar. Nama Lengkap, IAI" />{errors.consultant?.consultantName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.consultantName.message}</p>}</div>
        <div><label className={labelClass}>Nomor Kontak PIC Konsultan</label><input {...register('consultant.picName')} type="text" className={inputClass} placeholder="Nomor telepon penanggung jawab..." />{errors.consultant?.picName && <p className="text-xs text-rose-500 mt-1">{errors.consultant.picName.message}</p>}</div>
      </div>
    </div>
  );
};

// ─── SECTION 8: LAMPIRAN DOKUMEN ──────────────────────────────────────────────
export const DocumentSection = () => {
  const { watch } = useFormContext<FullSubmissionFormValues>();
  const category = watch('submission.category');

  // Menentukan dokumen dinamis berdasarkan kategori site plan
  const getConditionalDocs = () => {
    switch (category) {
      case 'PERUMAHAN':
        return [
          { name: 'Dokumen Rencana PSU', desc: 'Rencana utilitas, jalan, RTH, drainase perumahan' }
        ];
      case 'NON_PERUMAHAN':
        return [
          { name: 'Kajian Dokumen ANDALIN', desc: 'Analisis Dampak Lalu Lintas perhubungan daerah' }
        ];
      case 'FASUM':
        return [
          { name: 'Kajian Dokumen ANDALIN', desc: 'Analisis Dampak Lalu Lintas perhubungan daerah' },
          { name: 'Rekomendasi Instansi Terkait', desc: 'Surat rekomendasi dinas/lembaga vertikal' }
        ];
      case 'INDUSTRI':
        return [
          { name: 'Kajian Analisis Lingkungan AMDAL', desc: 'Dokumen kelayakan lingkungan AMDAL resmi' },
          { name: 'Persetujuan Teknis Air Limbah', desc: 'Rencana pengelolaan IPAL & izin buang limbah cair' }
        ];
      default:
        return [];
    }
  };

  const defaultDocs = [
    { name: 'Dokumen Legalitas Lahan (SHM/HGB/KTP)', desc: 'Scan sertifikat kepemilikan tanah & KTP pemohon' },
    { name: 'Gambar Teknis Rencana Site Plan (CAD/DWG)', desc: 'File gambar tapak format DWG/DXF dari konsultan' },
  ];

  const conditionalDocs = getConditionalDocs();
  const allDocs = [...defaultDocs, ...conditionalDocs];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          8. Upload Lampiran Berkas Dokumen
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">Unggah seluruh dokumen persyaratan administratif dalam bentuk berkas digital resmi.</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 px-4 py-2 flex items-center gap-2 mb-4">
        <Info className="h-4 w-4 text-primary" />
        <span className="text-[10px] text-slate-500 font-semibold uppercase">
          Dokumen Persyaratan untuk Kategori: <span className="text-primary">{category || 'PERUMAHAN'}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
        {allDocs.map((doc, idx) => (
          <div key={idx} className="p-6 flex flex-col items-center justify-center text-center bg-white border border-dashed border-border hover:bg-slate-50/50 transition-colors cursor-pointer select-none relative group min-h-[160px] animate-in zoom-in-95 duration-200">
            <UploadCloud className="h-7 w-7 text-secondary-foreground/60 mb-2.5 group-hover:text-primary transition-colors" />
            <p className="text-xs font-bold text-slate-700 mb-1 leading-snug">{doc.name}</p>
            <p className="text-[9px] text-slate-400 mb-2">{doc.desc}</p>
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