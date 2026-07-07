import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckCircle2, Layers } from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { LabelWithInfo } from './LabelWithInfo';
import { FormattedInput } from './FormattedInput';
import { ContextualUploadBox } from './ContextualUploadBox';
import { cn } from '@/lib/utils';
import { inputClass } from './styles';

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
  const applicantGsbVal = watch('technical.applicantGsb');
  const applicantRthAreaVal = watch('technical.applicantRthArea') || 0;
  const [computedKdbPercent, setComputedKdbPercent] = useState<string>('');

  const computedRthPercent = landArea > 0 ? ((applicantRthAreaVal / landArea) * 100).toFixed(1) : '';

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
      {/* Header Bagian - Bersih & Tanpa Label Nomor Langkah */}
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          Parameter Teknis Rencana Tapak
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Rincian dimensi teknis fisik rencana tapak pembangunan berdasarkan kriteria kelayakan dinas terkait.
        </p>
      </div>

      {/* ─── BLOK DEKLARASI MANDIRI KESESUAIAN TATA RUANG (PROPOSED METRICS) ─── */}
      <div className="border border-primary/25 bg-[#e8f2ea]/20 p-5 space-y-4 text-left">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Deklarasi Mandiri Kesesuaian Tata Ruang (Proposed Metrics)
        </h4>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Tuliskan estimasi dimensi teknis yang Anda rencanakan pada site plan. Nilai ini akan dihitung ulang secara manual oleh dinas menggunakan berkas CAD yang Anda unggah.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <LabelWithInfo label="Luas Lantai Dasar Bangunan (m²)" helpText="Total luasan lantai dasar bangunan rencana untuk kalkulasi KDB." />
            <FormattedInput name="technical.applicantBuildingArea" placeholder="Contoh: 6000" unit="m²" onChangeCustom={handleBuildingAreaChange} />
          </div>

          <div>
            <LabelWithInfo label="Garis Sempadan Bangunan (GSB - m)" helpText="Batas penarikan mundur minimal dinding bangunan dari tepi rencana jalan." />
            <FormattedInput name="technical.applicantGsb" placeholder="Contoh: 5" unit="meter" />
          </div>

          <div>
            <LabelWithInfo label="Luas Hijau Resapan Rencana (RTH - m²)" helpText="Total luasan area pekarangan hijau penyerap air hujan yang akan dibangun." />
            <FormattedInput name="technical.applicantRthArea" placeholder="Contoh: 1500" unit="m²" />
          </div>
        </div>

        {/* Real-time calculated proposed indicators with Perda references */}
        <div className="pt-3.5 border-t border-primary/10 space-y-2.5">
          <div className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">
            Uji Mandiri Parameter Kepatuhan Perda (Standard Acuan Kab. Bogor)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold text-slate-700">
            {/* Reference Land Area */}
            <div className="p-2.5 bg-white border border-slate-200">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Luas Lahan Acuan</span>
              <span className="font-bold font-mono text-slate-800 text-[11px]">{landArea > 0 ? `${landArea.toLocaleString('id-ID')} m²` : '-'}</span>
            </div>

            {/* KDB Proposed */}
            <div className="p-2.5 bg-white border border-slate-200">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Estimasi KDB Usulan (Maks 60%)</span>
              {computedKdbPercent ? (
                <span className={cn(
                  "font-bold font-mono text-[10px] px-1.5 py-0.5 border leading-none inline-block",
                  Number(computedKdbPercent) <= 60.0
                    ? "bg-[#e8f2ea] text-primary border-[#A1CCA5]"
                    : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                )}>
                  {computedKdbPercent}% {Number(computedKdbPercent) <= 60.0 ? "✓ Lolos" : "⚠ Melanggar"}
                </span>
              ) : (
                <span className="text-slate-400 font-medium text-[11px]">-</span>
              )}
            </div>

            {/* GSB Proposed */}
            <div className="p-2.5 bg-white border border-slate-200">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Garis Sempadan (Min 5m)</span>
              {applicantGsbVal !== undefined && applicantGsbVal > 0 ? (
                <span className={cn(
                  "font-bold font-mono text-[10px] px-1.5 py-0.5 border leading-none inline-block",
                  Number(applicantGsbVal) >= 5.0
                    ? "bg-[#e8f2ea] text-primary border-[#A1CCA5]"
                    : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                )}>
                  {applicantGsbVal} meter {Number(applicantGsbVal) >= 5.0 ? "✓ Lolos" : "⚠ Melanggar"}
                </span>
              ) : (
                <span className="text-slate-400 font-medium text-[11px]">-</span>
              )}
            </div>

            {/* RTH Proposed */}
            <div className="p-2.5 bg-white border border-slate-200">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Porsi RTH Usulan (Min 10%)</span>
              {computedRthPercent ? (
                <span className={cn(
                  "font-bold font-mono text-[10px] px-1.5 py-0.5 border leading-none inline-block",
                  Number(computedRthPercent) >= 10.0
                    ? "bg-[#e8f2ea] text-primary border-[#A1CCA5]"
                    : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                )}>
                  {computedRthPercent}% {Number(computedRthPercent) >= 10.0 ? "✓ Lolos" : "⚠ Melanggar"}
                </span>
              ) : (
                <span className="text-slate-400 font-medium text-[11px]">-</span>
              )}
            </div>
          </div>
        </div>
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