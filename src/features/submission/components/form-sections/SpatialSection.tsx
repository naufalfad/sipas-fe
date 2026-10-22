import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  CheckCircle2, 
  Building2, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Info
} from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { LabelWithInfo } from './LabelWithInfo';
import { FormattedInput } from './FormattedInput';
import { ContextualUploadBox } from './ContextualUploadBox';
import { cn } from '@/lib/utils';
import { inputClass } from './styles';

import { pkkprApi } from '@/features/pkkpr/api/pkkprApi';
import type { PKKPRListItem, PKKPRQuotaSummary } from '@/features/pkkpr/types/pkkpr.types';
import { PKKPRQuotaCard } from '@/features/pkkpr/components/PKKPRQuotaCard';

const ZONING_OPTIONS = {
  PERUMAHAN: [
    { value: 'Kawasan Hunian Kepadatan Sangat Tinggi', label: 'Kawasan Hunian Kepadatan Sangat Tinggi (R-1)' },
    { value: 'Kawasan Hunian Kepadatan Tinggi', label: 'Kawasan Hunian Kepadatan Tinggi (R-2)' },
    { value: 'Kawasan Hunian Kepadatan Sedang', label: 'Kawasan Hunian Kepadatan Sedang (R-3)' },
    { value: 'Kawasan Hunian Kepadatan Rendah', label: 'Kawasan Hunian Kepadatan Rendah (R-4)' },
    { value: 'Kawasan Hunian Kepadatan Sangat Rendah', label: 'Kawasan Hunian Kepadatan Sangat Rendah (R-5)' }
  ],
  NON_PERUMAHAN: [
    { value: 'Kawasan Perdagangan dan Jasa', label: 'Kawasan Perdagangan dan Jasa (K)' },
    { value: 'Kawasan Perkantoran', label: 'Kawasan Perkantoran (KT)' },
    { value: 'Kawasan Pariwisata', label: 'Kawasan Pariwisata (W)' }
  ],
  FASUM: [
    { value: 'Kawasan Fasilitas Pelayanan Umum', label: 'Kawasan Fasilitas Pelayanan Umum (SPU)' },
    { value: 'Kawasan Ruang Terbuka Hijau', label: 'Kawasan Ruang Terbuka Hijau (RTH)' }
  ],
  INDUSTRI: [
    { value: 'Kawasan Peruntukan Industri', label: 'Kawasan Peruntukan Industri (KPI)' },
    { value: 'Kawasan Pergudangan', label: 'Kawasan Pergudangan (G)' }
  ]
};

export const SpatialSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FullSubmissionFormValues>();
  
  const category = watch('submission.category') || 'PERUMAHAN';
  const landArea = watch('location.landArea') || 0;
  const greenAreaVal = watch('spatial.greenArea');
  const pkkprOrigin = watch('spatial.pkkprOrigin') || 'INTERNAL';
  const pkkprId = watch('spatial.pkkprId');

  const [greenAreaPercent, setGreenAreaPercent] = useState<string>('');
  
  // State data PKKPR Induk (Socio-Engineering & Quota)
  const [approvedSKs, setApprovedSKs] = useState<PKKPRListItem[]>([]);
  const [selectedQuota, setSelectedQuota] = useState<PKKPRQuotaSummary | null>(null);
  const [isLoadingSKs, setIsLoadingSKs] = useState(false);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);
  const [hasLoadedInitialSK, setHasLoadedInitialSK] = useState(false);

  // Ambil daftar SK PKKPR sah milik pemohon
  useEffect(() => {
    let isMounted = true;
    if (pkkprOrigin === 'INTERNAL') {
      setIsLoadingSKs(true);
      pkkprApi.getMyApprovedSK()
        .then((items) => {
          if (isMounted) {
            setApprovedSKs(items || []);
          }
        })
        .catch((err) => {
          console.error("Gagal memuat SK PKKPR aktif:", err);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingSKs(false);
            setHasLoadedInitialSK(true);
          }
        });
    }
    return () => { isMounted = false; };
  }, [pkkprOrigin]);

  // Muat ringkasan kuota jika pkkprId sudah terisi (misal saat edit draft)
  useEffect(() => {
    let isMounted = true;
    if (pkkprId && pkkprOrigin === 'INTERNAL') {
      setIsLoadingQuota(true);
      pkkprApi.getQuotaSummary(pkkprId)
        .then((summary) => {
          if (isMounted) {
            setSelectedQuota(summary);
          }
        })
        .catch((err) => {
          console.error("Gagal memuat ringkasan kuota:", err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingQuota(false);
        });
    } else if (!pkkprId) {
      setSelectedQuota(null);
    }
    return () => { isMounted = false; };
  }, [pkkprId, pkkprOrigin]);

  // Handler saat pemohon memilih salah satu SK PKKPR Internal
  const handleSelectSK = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setValue('spatial.pkkprId', '');
      setValue('spatial.kkprNumber', '');
      setSelectedQuota(null);
      return;
    }

    const chosenSK = approvedSKs.find(sk => sk.id === selectedId);
    setValue('spatial.pkkprId', selectedId);
    if (chosenSK) {
      setValue('spatial.kkprNumber', chosenSK.sk_number || chosenSK.submission_no);
    }

    // Ambil kuota dan jalankan Smart Autofill
    try {
      setIsLoadingQuota(true);
      const summary = await pkkprApi.getQuotaSummary(selectedId);
      setSelectedQuota(summary);

      // Autofill Intensitas Ruang & Parameter RDTR (Socio-Engineering: Mengurangi repetisi kerja pemohon)
      if (summary.envelope) {
        if (summary.envelope.approved_kdb_max != null) {
          setValue('technical.kdb', summary.envelope.approved_kdb_max);
        }
        if (summary.envelope.approved_klb_max != null) {
          setValue('technical.klb', summary.envelope.approved_klb_max);
        }
        if (summary.envelope.approved_kdh_min != null) {
          setValue('technical.kdh', summary.envelope.approved_kdh_min);
        }
        if (summary.envelope.approved_gsb_min != null) {
          setValue('technical.applicantGsb', summary.envelope.approved_gsb_min);
        }
        if (summary.envelope.approved_max_floors != null) {
          setValue('technical.maxFloors', summary.envelope.approved_max_floors);
        }
        if (summary.envelope.spatial_zone_name) {
          setValue('spatial.landUse', summary.envelope.spatial_zone_name);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil ringkasan kuota SK terpilih:", err);
    } finally {
      setIsLoadingQuota(false);
    }
  };

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
      {/* Header Bagian */}
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          Kesesuaian Tata Ruang (PKKPR & RTH)
        </h3>
        <p className="text-[11px] text-slate-500 mt-1">
          Validasi izin pemanfaatan ruang berjenjang (Perbup Bogor No. 4/2025) dan batas aman ruang terbuka hijau.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        {/* ─── KOTAK SOSIO-ENGINEERING: ASAL DOKUMEN PKKPR ────────────────── */}
        <div className="md:col-span-2 p-5 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 border border-emerald-200 rounded-xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100/80 pb-3">
            <div>
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Referensi Izin Pemanfaatan Ruang Induk (PKKPR)</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pilih sumber penerbitan izin tata ruang yang menjadi dasar pengesahan rencana tapak Anda.
              </p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              Prasyarat Mutlak Tata Ruang
            </span>
          </div>

          {/* Segmented Button: Pemilihan Asal Terbitan SK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setValue('spatial.pkkprOrigin', 'INTERNAL');
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all cursor-pointer",
                pkkprOrigin === 'INTERNAL'
                  ? "bg-white text-emerald-800 shadow-sm border border-emerald-200"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>🏛️</span>
              <span>Terbitan Digital GEOSIPAS</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-normal">
                Rekomendasi
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setValue('spatial.pkkprOrigin', 'LEGACY_EXTERNAL_OSS');
                setValue('spatial.pkkprId', '');
                setSelectedQuota(null);
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all cursor-pointer",
                pkkprOrigin === 'LEGACY_EXTERNAL_OSS'
                  ? "bg-white text-slate-900 shadow-sm border border-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>📄</span>
              <span>Terbitan Eksternal (OSS / ATR-BPN)</span>
            </button>
          </div>

          {/* ─── MODE A: TERBITAN DIGITAL GEOSIPAS ──────────────────────────── */}
          {pkkprOrigin === 'INTERNAL' && (
            <div className="space-y-3 pt-1">
              <div>
                <LabelWithInfo
                  label="Pilih SK PKKPR Sah Anda di Kabupaten Bogor"
                  helpText="Daftar SK PKKPR resmi yang telah disetujui Kepala Dinas dan memiliki kuota lahan bertahap."
                />
                
                {isLoadingSKs ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Memeriksa berkas SK PKKPR aktif Anda...</span>
                  </div>
                ) : approvedSKs.length > 0 ? (
                  <div className="relative">
                    <select
                      value={pkkprId || ''}
                      onChange={handleSelectSK}
                      className={cn(inputClass, 'h-[40px] cursor-pointer bg-white text-xs font-semibold text-slate-800 border-emerald-300 focus:border-emerald-500')}
                    >
                      <option value="">-- Klik untuk Memilih SK PKKPR Sah Milik Anda --</option>
                      {approvedSKs.map((sk) => (
                        <option key={sk.id} value={sk.id}>
                          {sk.sk_number || sk.submission_no} — {sk.applicant_name} ({sk.proposed_land_area_m2.toLocaleString('id-ID')} m²)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : hasLoadedInitialSK ? (
                  /* Sosio-Engineering Callout: Jika belum punya PKKPR */
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-amber-900">
                          Anda Belum Memiliki SK PKKPR yang Disetujui
                        </h5>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Sesuai amanat UU Cipta Kerja dan Perbup Bogor No. 4/2025, rencana tapak (Site Plan) hanya dapat diajukan setelah SK izin pemanfaatan ruang terbit.
                        </p>
                      </div>
                    </div>
                    <a
                      href="/pkkpr/create"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                    >
                      <span>Ajukan PKKPR Baru</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : null}
              </div>

              {/* Tampilkan Loading Quota */}
              {isLoadingQuota && (
                <div className="flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Sinkronisasi kuota lahan bertahap & parameter tata ruang...</span>
                  </div>
                </div>
              )}

              {/* Tampilkan Kartu Kuota Interaktif (PKKPRQuotaCard) */}
              {selectedQuota && !isLoadingQuota && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Informasi Kuota Bertahap & Parameter Terverifikasi:</span>
                  </div>
                  <PKKPRQuotaCard
                    summary={selectedQuota}
                    currentProposedAreaM2={landArea}
                  />

                  {/* Penyesuaian / Verifikasi Luas Usulan Tahap Ini */}
                  <div className="p-3.5 bg-white border border-emerald-200/90 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Luas Usulan Tahap Ini (m²)
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Tersinkronisasi otomatis dari luas gambar batas peta/CAD di Tahap 4. Anda tetap dapat menyesuaikan angka ini bila dibutuhkan.
                      </span>
                    </div>
                    <div className="w-full sm:w-48 shrink-0">
                      <FormattedInput
                        name="location.landArea"
                        placeholder="Luas usulan (m²)"
                        unit="m²"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── MODE B: TERBITAN EKSTERNAL (OSS-RBA / ATR-BPN) ─────────────── */}
          {pkkprOrigin === 'LEGACY_EXTERNAL_OSS' && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-300">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Untuk SK PKKPR yang diterbitkan langsung melalui sistem <strong>OSS-RBA Pusat</strong> atau <strong>Kementerian ATR/BPN</strong>, silakan cantumkan nomor SK resmi dan wajib melampirkan berkas salinan PDF pada kolom di bawah.
                </p>
              </div>

              <div>
                <LabelWithInfo
                  label="Nomor SK PKKPR Resmi (OSS-RBA / ATR-BPN)"
                  helpText="Contoh format: 503/PKKPR/PUPR/2026/089 atau 91203019381920001."
                />
                <input
                  {...register('spatial.kkprNumber')}
                  type="text"
                  className={inputClass}
                  placeholder="Contoh: 503/PKKPR/PUPR/2026/089"
                />
                {errors.spatial?.kkprNumber && (
                  <p className="text-xs text-rose-500 mt-1">{errors.spatial.kkprNumber.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── PERUNTUKAN ZONASI PERDA ──────────────────────────────────────── */}
        <div>
          <LabelWithInfo 
            label="Kriteria Peruntukan Lahan (Zonasi Perda)" 
            helpText="Kriteria rencana peruntukan zonasi perumahan atau komersial sesuai Perda Rencana Tata Ruang Wilayah (RTRW)." 
          />
          <select 
            {...register('spatial.landUse')} 
            className={cn(inputClass, "h-[38px] cursor-pointer")}
          >
            <option value="">-- Pilih Zonasi Peruntukan Lahan --</option>
            {ZONING_OPTIONS[category as keyof typeof ZONING_OPTIONS]?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.spatial?.landUse && <p className="text-xs text-rose-500 mt-1">{errors.spatial.landUse.message}</p>}
        </div>

        {/* ─── RUANG TERBUKA HIJAU (RTH) KALKULATOR ────────────────────────── */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border border-[#DAE4DB] bg-[#f4f7f4]/20 p-4 rounded-lg">
          <div>
            <LabelWithInfo 
              label="Luas Rencana Fasum / RTH Lahan (m²)" 
              helpText={`Luas area untuk Fasilitas Umum (Fasum) dan Ruang Terbuka Hijau (RTH) minimal 20% dari total luas lahan (${landArea > 0 ? (landArea * 0.2).toLocaleString('id-ID') : '0'} m²).`} 
            />
            <FormattedInput name="spatial.greenArea" placeholder="Minimal 20% dari total luas" unit="m²" onChangeCustom={handleLuasChangeVal} />
            {errors.spatial?.greenArea && <p className="text-xs text-rose-500 mt-1">{errors.spatial.greenArea.message}</p>}
          </div>

          <div>
            <LabelWithInfo 
              label="Kalkulator Persentase RTH (%)" 
              helpText={`Masukkan target persentase atau hitung otomatis. Luas Lahan Aktif: ${landArea.toLocaleString('id-ID')} m².`} 
            />
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

        {/* ─── DYNAMIC UPLOAD: SK KKPR / IPPT Awal ─────────────────────────── */}
        <div className="md:col-span-2 pt-2 border-t border-slate-100">
          <ContextualUploadBox
            label="Unggah Dokumen SK KKPR / IPPT Awal (Wajib jika Terbitan Eksternal)"
            fieldKey="document.supportDoc"
            helpText="Unggah dokumen keputusan KKPR atau izin prinsip yang didapatkan dari BKPRD/DPMPTSP/OSS dalam format PDF."
          />
        </div>
      </div>
    </div>
  );
};