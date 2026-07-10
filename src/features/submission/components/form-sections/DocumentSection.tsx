import { useFormContext } from 'react-hook-form';
import { CheckCircle2, Info } from 'lucide-react';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { cn } from '@/lib/utils';

// ─── PURE FABRICATION: PARSER NAMA FILE ASLI ───────────────────────────
const getOriginalFileName = (url: string): string => {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    const nameParam = parsedUrl.searchParams.get('name');
    if (nameParam) return decodeURIComponent(nameParam);
  } catch (e) {
    // Fallback jika URL tidak valid
  }
  const lastSegment = url.split('/').pop() || 'File terunggah';
  return lastSegment.split('?')[0];
};

export const DocumentSection = () => {
  const { watch } = useFormContext<FullSubmissionFormValues>();

  // Membaca state reaktif pendaftaran untuk menyaring tipe dokumen (GRASP: Information Expert)
  const applicantType = watch('applicant.type');
  const submissionCategory = watch('submission.category');

  // Membaca state seluruh file yang diunggah secara asinkron di sepanjang langkah 1-7
  const legalDoc = watch('document.legalDoc');
  const technicalDoc = watch('document.technicalDoc');
  const supportDoc = watch('document.supportDoc');
  const supportDoc2 = watch('document.supportDoc2');
  const skaDoc = watch('document.skaDoc');
  const cadDoc = watch('document.cadDoc');
  const ktpDoc = watch('document.ktpDoc');
  const nibDoc = watch('document.nibDoc');
  const tpuMethod = watch('tpu.method');
  const tpuDoc = watch('tpu.buktiDokumenUrl');

  // ─── DEKLARATIF CHECKLIST MATRIX (Protected Variations) ───────────────
  const docSummary = [];

  // 1. Validasi Identitas Pemohon (Langkah 1)
  if (applicantType === 'PERORANGAN') {
    docSummary.push({
      name: 'Scan Kartu Tanda Penduduk (KTP) Pemohon',
      value: ktpDoc,
      mandatory: true
    });
  } else if (applicantType === 'BADAN_USAHA') {
    docSummary.push({
      name: 'Nomor Induk Berusaha (NIB) Badan Usaha',
      value: nibDoc,
      mandatory: true
    });
  }

  // 2. Validasi Kepemilikan Lahan (Langkah 3)
  docSummary.push({
    name: 'Sertifikat Kepemilikan Tanah Resmi (SHM/HGB)',
    value: legalDoc,
    mandatory: true
  });

  // 3. Validasi Batas Spasial CAD (Langkah 4)
  docSummary.push({
    name: 'File Peta Koordinat CAD Terkalibrasi (.dwg/.dxf)',
    value: cadDoc,
    mandatory: true
  });

  // 4. Validasi SK KKPR Awal / IPPT (Langkah 5)
  docSummary.push({
    name: 'SK KKPR atau Surat Izin Peruntukan Penggunaan Tanah (IPPT)',
    value: supportDoc,
    mandatory: true
  });

  // 5. Validasi Parameter Teknis Dinamis (Langkah 6)
  if (submissionCategory === 'PERUMAHAN') {
    docSummary.push({
      name: 'Dokumen Detail Perencanaan Prasarana, Sarana, dan Utilitas (PSU)',
      value: technicalDoc,
      mandatory: true
    });
  } else if (submissionCategory === 'NON_PERUMAHAN') {
    docSummary.push({
      name: 'Dokumen Kajian Dampak Lalu Lintas (Andalalin)',
      value: supportDoc2,
      mandatory: false
    });
  } else if (submissionCategory === 'FASUM') {
    docSummary.push({
      name: 'Rekomendasi Instansi Sektoral / Persetujuan Andalalin',
      value: supportDoc2,
      mandatory: false
    });
  } else if (submissionCategory === 'INDUSTRI') {
    docSummary.push({
      name: 'Dokumen Kelayakan Lingkungan Hidup (AMDAL / UKL-UPL)',
      value: technicalDoc,
      mandatory: true
    });
    docSummary.push({
      name: 'Persetujuan Teknis Pembuangan & Pengolahan Air Limbah',
      value: supportDoc2,
      mandatory: true
    });
  }

  // 5b. Validasi Dokumen TPU (Khusus Perumahan dengan Metode Non-Mandiri)
  if (submissionCategory === 'PERUMAHAN' && tpuMethod && tpuMethod !== 'MANDIRI') {
    let docName = 'Dokumen Bukti PKS / Izin Penggunaan TPU';
    if (tpuMethod === 'KERJASAMA' || tpuMethod === 'INTEGRASI_WARGA') {
      docName = 'Dokumen Perjanjian Kerja Sama (PKS) TPU';
    } else if (tpuMethod === 'KOMPENSASI_UANG') {
      docName = 'Bukti Setor Retribusi Kas Daerah TPU';
    } else if (tpuMethod === 'EKSISTING') {
      docName = 'Surat Rekomendasi / Izin Penggunaan TPU Pemda';
    }

    docSummary.push({
      name: docName,
      value: tpuDoc,
      mandatory: true
    });
  }

  // 6. Validasi Legalitas Perencana (Langkah 7)
  docSummary.push({
    name: 'Scan Sertifikat Keahlian (SKA / SKEA) Arsitek Penanggung Jawab',
    value: skaDoc,
    mandatory: true
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          Rekapitulasi Berkas Dokumen Terunggah
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
                    ? `✓ Berkas Siap: ${typeof doc.value === 'string' ? getOriginalFileName(doc.value) : 'OK'}`
                    : doc.mandatory
                      ? '⚠ Berkas Wajib Diisi (Kembali ke langkah bersangkutan)'
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