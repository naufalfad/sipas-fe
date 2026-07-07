import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { SubmissionStatus } from '../types';
import {
  ArrowLeft, Loader2, UploadCloud,
  FileSignature, AlertTriangle, ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadFileToBackend } from '@/features/submission/utils/upload';
import { VERIFICATION_ASPECTS } from '../constants/verificationAspects';

const getDocCategoryLabel = (key?: string) => {
  if (key === 'legalDoc') return 'Sertifikat Tanah & KTP (Langkah 3)';
  if (key === 'technicalDoc') return 'Gambar Rencana Teknis CAD (Langkah 6)';
  if (key === 'supportDoc') return 'SK KKPR Awal / IPPT (Langkah 5)';
  if (key === 'supportDoc2') return 'Andalalin / Persetujuan Teknis Limbah B3 (Langkah 6)';
  if (key === 'skaDoc') return 'Scan Sertifikat Keahlian (SKA) Arsitek (Langkah 7)';
  if (key === 'cadDoc') return 'File Peta Koordinat CAD (.dwg/.dxf) (Langkah 4)';
  return 'Dokumen Lampiran Pendukung';
};

const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide";

export default function SubmissionVerificationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user: userProfile } = useAuthStore();
  const activeRole = userProfile?.role || '';
  const effectiveRole = normalizeRole(activeRole);

  const [kkprVerdict, setKkprVerdict] = useState<string>('Sesuai');
  const [verifiedKdb, setVerifiedKdb] = useState<number | ''>('');
  const [verifiedKlb, setVerifiedKlb] = useState<number | ''>('');
  const [verifiedKdh, setVerifiedKdh] = useState<number | ''>('');
  const [verifiedGsb, setVerifiedGsb] = useState<number | ''>('');
  const [verifiedRthArea, setVerifiedRthArea] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');

  const [checklistStates, setChecklistStates] = useState<Record<string, {
    status: 'Sesuai' | 'Sesuai Bersyarat' | 'Tidak Sesuai';
    catatan: string;
    attachmentUrl?: string;
    isUploading?: boolean;
  }>>({});

  const [expandedAspect, setExpandedAspect] = useState<string | null>(null);

  const { data: sub, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id,
  });

  // Pre-populate verifier inputs
  useEffect(() => {
    if (sub) {
      if (sub.kkprVerdict) setKkprVerdict(sub.kkprVerdict);
      if (sub.verifiedKdb !== undefined && sub.verifiedKdb !== null) setVerifiedKdb(sub.verifiedKdb);
      if (sub.verifiedKlb !== undefined && sub.verifiedKlb !== null) setVerifiedKlb(sub.verifiedKlb);
      if (sub.verifiedKdh !== undefined && sub.verifiedKdh !== null) setVerifiedKdh(sub.verifiedKdh);
      if (sub.verifiedGsb !== undefined && sub.verifiedGsb !== null) setVerifiedGsb(sub.verifiedGsb);
      if (sub.verifiedRthArea !== undefined && sub.verifiedRthArea !== null) setVerifiedRthArea(sub.verifiedRthArea);

      if (sub.evaluationChecklist && sub.evaluationChecklist.length > 0) {
        const mappedStates: typeof checklistStates = {};
        sub.evaluationChecklist.forEach((item) => {
          mappedStates[item.aspekCode] = {
            status: item.statusKelayakan as any,
            catatan: item.catatanVerifikator || '',
            attachmentUrl: item.attachmentUrl
          };
        });
        setChecklistStates(mappedStates);
      } else {
        const defaultStates: typeof checklistStates = {};
        VERIFICATION_ASPECTS.forEach((aspect) => {
          defaultStates[aspect.code] = {
            status: 'Sesuai',
            catatan: ''
          };
        });
        setChecklistStates(defaultStates);
      }
    }
  }, [sub]);

  // Derived evaluation values mapping
  const checklistStatesMapped = useMemo(() => {
    const output: Record<string, {
      aspekLabel: string;
      statusKelayakan: 'Sesuai' | 'Sesuai Bersyarat' | 'Tidak Sesuai';
      catatanVerifikator: string;
      attachmentUrl?: string;
    }> = {};

    VERIFICATION_ASPECTS.forEach((aspect) => {
      const state = checklistStates[aspect.code] || { status: 'Sesuai', catatan: '' };
      output[aspect.code] = {
        aspekLabel: aspect.label,
        statusKelayakan: state.status,
        catatanVerifikator: state.catatan,
        attachmentUrl: state.attachmentUrl
      };
    });

    return output;
  }, [checklistStates]);

  const kkpr_verdict_final = useMemo(() => kkprVerdict, [kkprVerdict]);
  const verified_kdb_final = useMemo(() => (verifiedKdb === '' ? undefined : verifiedKdb), [verifiedKdb]);
  const verified_klb_final = useMemo(() => (verifiedKlb === '' ? undefined : verifiedKlb), [verifiedKlb]);
  const verified_kdh_final = useMemo(() => (verifiedKdh === '' ? undefined : verifiedKdh), [verifiedKdh]);
  const verified_gsb_final = useMemo(() => (verifiedGsb === '' ? undefined : verifiedGsb), [verifiedGsb]);
  const verified_rth_area_final = useMemo(() => (verifiedRthArea === '' ? undefined : verifiedRthArea), [verifiedRthArea]);

  const mutation = useMutation({
    mutationFn: async ({
      status,
      notes,
      actionTypeOverride
    }: {
      status: SubmissionStatus;
      notes: string;
      actionTypeOverride?: 'APPROVE' | 'REJECT' | 'REVERT_TO_TECHNICAL' | 'REVERT_TO_ADMINISTRATIVE';
    }) => {
      const checklistItemsPayload = Object.entries(checklistStatesMapped).map(([code, item]) => ({
        aspekCode: code,
        aspekLabel: item.aspekLabel,
        statusKelayakan: item.statusKelayakan,
        catatanVerifikator: item.catatanVerifikator,
        attachmentUrl: item.attachmentUrl
      }));

      return SubmissionService.updateStatus(
        sub?.id || '',
        status,
        `${userProfile?.full_name || userProfile?.username || 'Verifikator'} (${activeRole})`,
        notes,
        undefined,
        undefined,
        actionTypeOverride,
        kkpr_verdict_final,
        verified_kdb_final,
        verified_klb_final,
        verified_kdh_final,
        verified_gsb_final,
        verified_rth_area_final,
        checklistItemsPayload
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['submissions'] })
      ]);
      toast.success('Hasil verifikasi teknis berhasil dikirim!');
      navigate(`/pengajuan/detail/${id}`);
    },
    onError: (error: Error) => {
      toast.error(`Gagal mengirim verifikasi: ${error.message}`);
    }
  });

  const handleToggleAspect = (code: string, statusVal: 'Sesuai' | 'Sesuai Bersyarat' | 'Tidak Sesuai') => {
    setChecklistStates((prev) => ({
      ...prev,
      [code]: { ...prev[code], status: statusVal }
    }));
  };

  const handleAspectNoteChange = (code: string, noteVal: string) => {
    setChecklistStates((prev) => ({
      ...prev,
      [code]: { ...prev[code], catatan: noteVal }
    }));
  };

  const handleAspectAttachmentUpload = async (code: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setChecklistStates((prev) => ({
        ...prev,
        [code]: { ...prev[code], isUploading: true }
      }));

      const res = await uploadFileToBackend(file);
      setChecklistStates((prev) => ({
        ...prev,
        [code]: {
          ...prev[code],
          attachmentUrl: res.file_url,
          isUploading: false
        }
      }));
      toast.success(`Berhasil unggah lampiran bukti aspek ${code}`);
    } catch (err) {
      toast.error('Gagal mengunggah file penunjang evaluasi');
      setChecklistStates((prev) => ({
        ...prev,
        [code]: { ...prev[code], isUploading: false }
      }));
    }
  };

  const handleTriggerSubmissionVerification = () => {
    if (!notes.trim()) {
      toast.warning('Tolong isi Catatan Penilaian Global / Justifikasi terlebih dahulu.');
      return;
    }
    const targetStatus: SubmissionStatus = kkprVerdict === 'Tidak Sesuai / Ditolak' ? 'Ditolak' : 'Menunggu Persetujuan';
    const actionOverride = kkprVerdict === 'Tidak Sesuai / Ditolak' ? 'REJECT' as const : 'APPROVE' as const;
    mutation.mutate({
      status: targetStatus,
      notes: notes.trim(),
      actionTypeOverride: actionOverride
    });
  };

  const handleRevertToAdministrativeLocal = () => {
    if (!notes.trim()) {
      toast.warning('Wajib memasukkan alasan / catatan evaluasi sebelum melakukan pengembalian berkas.');
      return;
    }
    mutation.mutate({
      status: 'Verifikasi Administrasi',
      notes: notes.trim(),
      actionTypeOverride: 'REVERT_TO_ADMINISTRATIVE'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-slate-500 font-medium">Memuat Formulir Verifikasi Teknis...</span>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-8 text-center bg-white border border-border space-y-4 max-w-md mx-auto mt-10 text-left">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
        <h4 className="font-bold text-slate-800 text-center">Permohonan Tidak Ditemukan</h4>
        <p className="text-xs text-slate-500 text-center">Berkas pendaftaran dengan ID yang dicari tidak terdaftar dalam pangkalan data.</p>
        <Link to="/pengajuan" className="block text-center text-xs font-bold text-primary hover:underline">
          Kembali ke Daftar Antrean
        </Link>
      </div>
    );
  }

  // Double check authorization
  const isVerifier = effectiveRole === 'Tim Teknis' || effectiveRole === 'Kepala Bidang' || effectiveRole === 'Super Admin';
  if (!isVerifier || sub.status !== 'Verifikasi Teknis') {
    return (
      <div className="p-8 text-center bg-white border border-border space-y-4 max-w-md mx-auto mt-10 text-left">
        <ShieldCheck className="h-10 w-10 text-amber-500 mx-auto" />
        <h4 className="font-bold text-slate-800 text-center">Akses Terbatas</h4>
        <p className="text-xs text-slate-500 text-center">Halaman verifikasi teknis hanya dapat diakses oleh pejabat berwenang ketika berkas berada pada tahapan Verifikasi Teknis.</p>
        <button onClick={() => navigate(`/pengajuan/detail/${sub.id}`)} className="w-full text-center text-xs font-bold text-primary hover:underline bg-transparent border-none outline-none">
          Kembali ke Detail Permohonan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <button
            onClick={() => navigate(`/pengajuan/detail/${sub.id}`)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-2 font-bold bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Detail Permohonan
          </button>
          <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
            <FileSignature className="h-6 w-6 text-primary" />
            Lembar Verifikasi Teknis & Spasial
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            No. Permohonan: <span className="font-mono font-bold text-slate-700">{sub.submissionNo}</span> • Pemohon: <span className="font-bold text-slate-700">{sub.developerName}</span>
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0 self-start md:self-center">
          TAHAPAN: {sub.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kolom Informasi & Dokumen Pendaftaran (Lebar 1/3) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card Ringkasan Permohonan */}
          <div className="bg-white border border-border p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">Detail Pendaftaran</h3>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-slate-400">Rencana Tapak:</span>
              <span className="font-bold text-slate-800 text-right truncate">{sub.housingName}</span>
              <span className="text-slate-400">Luas Lahan:</span>
              <span className="font-mono text-slate-800 text-right">{sub.landArea?.toLocaleString('id-ID')} m²</span>
              <span className="text-slate-400">Jenis Kegiatan:</span>
              <span className="font-bold text-primary text-right">{sub.submissionDetails?.category || '-'}</span>
              <span className="text-slate-400">Lokasi:</span>
              <span className="text-slate-600 text-right truncate" title={sub.locationDetails?.fullAddress}>
                {sub.locationDetails?.village || '-'}, {sub.locationDetails?.district || '-'}
              </span>
            </div>
          </div>

          {/* List Dokumen Terunggah untuk Download */}
          <div className="bg-white border border-border p-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Berkas Unggahan Pemohon</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Daftar file administrasi & gambar CAD asli pemohon.</p>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {sub.documents && sub.documents.length > 0 ? (
                sub.documents.map((doc: any) => (
                  <div key={doc.id} className="p-3 bg-slate-50 border border-border hover:bg-slate-100/50 transition-colors flex flex-col space-y-2 text-left">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-teal-600 block leading-none mb-1">
                        {getDocCategoryLabel(doc.key)}
                      </span>
                      <h5 className="font-bold text-xs text-slate-800 truncate" title={doc.name}>
                        {doc.name}
                      </h5>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-white border border-border hover:bg-slate-50 text-[10px] font-bold text-slate-700 transition-all rounded-none cursor-pointer self-start"
                    >
                      📥 Unduh Berkas
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">Tidak ada berkas terlampir.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Verifikasi Cockpit (Lebar 2/3) */}
        <div className="lg:col-span-2 bg-white border border-primary p-5 shadow-[1px_1px_5px_rgba(0,0,0,0.02)] space-y-5 rounded-none text-left">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Lembar Evaluasi Tim Teknis</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Sandi metrik intensitas fisik dan nyalakan switch checklist evaluasi spasial.</p>
            </div>
            <span className="px-2 py-0.5 bg-[#e8f2ea] text-primary font-bold text-[9px] uppercase border border-[#A1CCA5]">VERIFIER</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Kolom Kiri Cockpit: Sandingan Metrik & Verdict */}
            <div className="xl:col-span-5 space-y-5">
              {/* Sandingan Metrik Tiga Sisi (Comparison Ledger) */}
              <div className="space-y-2 text-left">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-wider block mb-1">
                  Sandingan Metrik Tiga Sisi (Comparison Ledger)
                </h4>
                <div className="overflow-x-auto border border-border">
                  <table className="min-w-full divide-y divide-border text-[11px] font-sans">
                    <thead className="bg-slate-50 font-bold text-slate-500 text-left">
                      <tr>
                        <th className="px-3 py-2 border-r border-border">Parameter</th>
                        <th className="px-3 py-2 border-r border-border">Proposed</th>
                        <th className="px-3 py-2 border-r border-border">Bylaws</th>
                        <th className="px-3 py-2">Verified (Dinas)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white text-slate-700">
                      <tr>
                        <td className="px-3 py-2 border-r border-border font-semibold">KDB</td>
                        <td className="px-3 py-2 border-r border-border font-mono">
                          {sub.technical?.applicantBuildingArea ? `${sub.technical.applicantBuildingArea.toLocaleString('id-ID')} m²` : '-'}
                          {sub.landArea && sub.technical?.applicantBuildingArea ? ` (${((sub.technical.applicantBuildingArea / sub.landArea) * 100).toFixed(1)}%)` : ''}
                        </td>
                        <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Maks {sub.bylawMaxKdb || 60}%</td>
                        <td className="px-3 py-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              value={verifiedKdb}
                              onChange={(e) => setVerifiedKdb(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="KDB..."
                              className="w-16 px-1.5 py-0.5 bg-white border border-border focus:outline-none focus:border-primary text-xs font-mono"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 border-r border-border font-semibold">KLB</td>
                        <td className="px-3 py-2 border-r border-border font-mono">{sub.technical?.klb || '-'}</td>
                        <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Maks {sub.bylawMaxKlb || 3.5}</td>
                        <td className="px-3 py-1">
                          <input
                            type="number"
                            step="0.01"
                            value={verifiedKlb}
                            onChange={(e) => setVerifiedKlb(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="KLB..."
                            className="w-16 px-1.5 py-0.5 bg-white border border-border focus:outline-none focus:border-primary text-xs font-mono"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 border-r border-border font-semibold">KDH</td>
                        <td className="px-3 py-2 border-r border-border font-mono">{sub.technical?.kdh ? `${sub.technical.kdh}%` : '-'}</td>
                        <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Min {sub.bylawMinKdh || 10}%</td>
                        <td className="px-3 py-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              value={verifiedKdh}
                              onChange={(e) => setVerifiedKdh(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="KDH..."
                              className="w-16 px-1.5 py-0.5 bg-white border border-border focus:outline-none focus:border-primary text-xs font-mono"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 border-r border-border font-semibold">GSB</td>
                        <td className="px-3 py-2 border-r border-border font-mono">{sub.technical?.applicantGsb ? `${sub.technical.applicantGsb} m` : '-'}</td>
                        <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Min {sub.bylawMinGsb || 5} m</td>
                        <td className="px-3 py-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.1"
                              value={verifiedGsb}
                              onChange={(e) => setVerifiedGsb(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="GSB..."
                              className="w-16 px-1.5 py-0.5 bg-white border border-border focus:outline-none focus:border-primary text-xs font-mono"
                            />
                            <span className="text-slate-400">m</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 border-r border-border font-semibold">RTH</td>
                        <td className="px-3 py-2 border-r border-border font-mono">{sub.technical?.applicantRthArea ? `${sub.technical.applicantRthArea.toLocaleString('id-ID')} m²` : '-'}</td>
                        <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Min {sub.bylawMinRthArea || 1400} m²</td>
                        <td className="px-3 py-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={verifiedRthArea}
                              onChange={(e) => setVerifiedRthArea(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="RTH..."
                              className="w-16 px-1.5 py-0.5 bg-white border border-border focus:outline-none focus:border-primary text-xs font-mono"
                            />
                            <span className="text-slate-400">m²</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Decision Verdict (Kesimpulan Akhir KKPR) */}
              <div className="space-y-4 text-left border-t border-border pt-4">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-wider block mb-1">
                  Keputusan Akhir Verifikasi
                </h4>
                <div className="space-y-1.5">
                  <label className={labelClass}>Kesimpulan Akhir KKPR</label>
                  <select
                    value={kkprVerdict}
                    onChange={(e) => setKkprVerdict(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Sesuai">Sesuai (Dapat Disetujui)</option>
                    <option value="Sesuai Bersyarat">Sesuai Bersyarat (Ketentuan Khusus)</option>
                    <option value="Perlu Perbaikan / Revisi">Perlu Perbaikan / Revisi</option>
                    <option value="Tidak Sesuai / Ditolak">Tidak Sesuai / Ditolak</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className={labelClass}>Catatan Penilaian Global / Justifikasi</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tuliskan justifikasi detail persetujuan..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Kolom Kanan Cockpit: Checklist 13 Aspek */}
            <div className="xl:col-span-7 space-y-3">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-wider block mb-1">
                Checklist Evaluasi 13 Aspek Teknis & Spasial
              </h4>
              <div className="border border-border divide-y divide-border bg-white max-h-[450px] overflow-y-auto">
                {VERIFICATION_ASPECTS.map((aspect) => {
                  const state = checklistStates[aspect.code] || { status: 'Sesuai', catatan: '' };
                  const isExpanded = expandedAspect === aspect.code;
                  const isSesuai = state.status === 'Sesuai';
                  
                  return (
                    <div key={aspect.code} className="transition-all duration-200">
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedAspect(isExpanded ? null : aspect.code)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left border-none outline-none cursor-pointer",
                          isExpanded ? "bg-slate-50/80" : "bg-white"
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
                            KODE: {aspect.code}
                          </span>
                          <h5 className="font-bold text-xs text-slate-800 leading-tight truncate">{aspect.label}</h5>
                        </div>
                        
                        <div className="flex items-center space-x-3 shrink-0">
                          {/* Short Status Badge on Header */}
                          <span className={cn(
                            "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border leading-none rounded-none shrink-0",
                            isSesuai
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {isSesuai ? 'Sesuai' : 'Tidak Sesuai'}
                          </span>
                          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isExpanded && "rotate-180")} />
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-3 bg-slate-50/30 border-t border-border space-y-3 animate-in fade-in duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p className="text-[10px] text-slate-500 leading-relaxed flex-1">{aspect.helpText}</p>
                            
                            {/* 2-way Toggle Switch */}
                            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wider",
                                isSesuai ? "text-emerald-700" : "text-rose-600"
                              )}>
                                {isSesuai ? 'Sesuai' : 'Tidak Sesuai'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleAspect(aspect.code, isSesuai ? 'Tidak Sesuai' : 'Sesuai')}
                                className={cn(
                                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none border-none p-0",
                                  isSesuai ? "bg-emerald-600" : "bg-slate-300"
                                )}
                              >
                                <span
                                  className={cn(
                                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                    isSesuai ? "translate-x-4" : "translate-x-0"
                                  )}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Catatan Per Aspek & Upload Bukti Koreksi */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                            <div className="md:col-span-2">
                              <input
                                type="text"
                                value={state.catatan}
                                onChange={(e) => handleAspectNoteChange(aspect.code, e.target.value)}
                                placeholder="Catatan khusus aspek ini..."
                                className="w-full px-2 py-1 bg-white border border-border text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary text-[10px]"
                              />
                            </div>
                            <div>
                              {state.isUploading ? (
                                <div className="flex items-center gap-2 px-2 py-1 bg-white border border-border text-slate-400 text-[10px]">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                                  <span>Mengunggah...</span>
                                </div>
                              ) : state.attachmentUrl ? (
                                <div className="flex items-center justify-between gap-2 px-2 py-0.5 bg-[#e8f2ea]/20 border border-primary/30 text-[10px]">
                                  <a
                                    href={state.attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary font-bold hover:underline truncate max-w-[90px]"
                                  >
                                    📥 Bukti
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => setChecklistStates(prev => ({
                                      ...prev,
                                      [aspect.code]: { ...prev[aspect.code], attachmentUrl: undefined }
                                    }))}
                                    className="text-rose-600 font-bold hover:text-rose-700 transition-colors"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              ) : (
                                <div className="relative border border-dashed border-slate-300 bg-white hover:bg-slate-50 px-2 py-1 flex items-center justify-center gap-1 cursor-pointer transition-all">
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleAspectAttachmentUpload(aspect.code, e)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                  <UploadCloud className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="text-[10px] text-slate-500 font-bold">Unggah Bukti</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 flex-wrap border-t border-border">
            {/* Kembalikan ke Admin — Jalur Revert Internal (amber) */}
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={handleRevertToAdministrativeLocal}
              title="Kembalikan ke Admin SIPAS untuk perbaikan dokumen (SLA tetap berjalan)"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
              </svg>
              Kembalikan ke Admin
            </button>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={handleTriggerSubmissionVerification}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 border border-primary text-white text-xs font-bold transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Kirim Keputusan Verifikasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
