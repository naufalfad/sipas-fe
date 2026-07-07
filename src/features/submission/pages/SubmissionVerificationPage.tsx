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
  ChevronDown, Check, X, Trash2, Info
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

const inputClass = "w-full px-3 py-2 bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider";

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

    // Limit to 20MB
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Berkas terlalu besar! Batas ukuran maksimal adalah 20MB.');
      return;
    }

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
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
        <span className="text-slate-500 font-medium text-xs tracking-wider uppercase">Memuat Formulir Verifikasi Teknis...</span>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-8 text-left bg-white border border-slate-300 max-w-md mx-auto mt-12 rounded-none space-y-4">
        <AlertTriangle className="h-8 w-8 text-rose-600" />
        <h4 className="font-bold text-slate-900 uppercase tracking-wide">Permohonan Tidak Ditemukan</h4>
        <p className="text-xs text-slate-500 leading-relaxed">Berkas pendaftaran dengan ID yang dicari tidak terdaftar dalam pangkalan data.</p>
        <Link to="/pengajuan" className="inline-block text-xs font-bold text-slate-900 underline hover:text-slate-700">
          Kembali ke Daftar Antrean
        </Link>
      </div>
    );
  }

  const isVerifier = effectiveRole === 'Tim Teknis' || effectiveRole === 'Kepala Bidang' || effectiveRole === 'Super Admin';
  if (!isVerifier || sub.status !== 'Verifikasi Teknis') {
    return (
      <div className="p-8 text-left bg-white border border-slate-300 max-w-md mx-auto mt-12 rounded-none space-y-4">
        <ShieldCheck className="h-8 w-8 text-amber-600" />
        <h4 className="font-bold text-slate-900 uppercase tracking-wide">Akses Terbatas</h4>
        <p className="text-xs text-slate-500 leading-relaxed">Halaman verifikasi teknis hanya dapat diakses oleh pejabat berwenang ketika berkas berada pada tahapan Verifikasi Teknis.</p>
        <button onClick={() => navigate(`/pengajuan/detail/${sub.id}`)} className="text-xs font-bold text-slate-900 underline hover:text-slate-700 bg-transparent border-none cursor-pointer p-0">
          Kembali ke Detail Permohonan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-left max-w-[1600px] mx-auto px-4 py-6">
      {/* Navigation & Header */}
      <div className="border-b border-slate-300 pb-6 space-y-4">
        <button
          onClick={() => navigate(`/pengajuan/detail/${sub.id}`)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer uppercase tracking-wider p-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Detail Permohonan
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3 rounded-none">
              <FileSignature className="h-6 w-6 text-slate-800 shrink-0" />
              LEMBAR VERIFIKASI TEKNIS & SPASIAL
            </h1>
            <p className="text-xs text-slate-500">
              No. Permohonan: <span className="font-mono font-bold text-slate-800">{sub.submissionNo}</span> • Pemohon: <span className="font-bold text-slate-800 uppercase">{sub.developerName}</span>
            </p>
          </div>
          <div className="border border-slate-800 px-3 py-1.5 text-xs font-bold bg-slate-900 text-white tracking-widest uppercase rounded-none self-start">
            TAHAPAN: {sub.status}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* KOLOM KIRI: METRIK perbandingan, FORM KEPUTUSAN, DETAIL PENGAJUAN (col-span-5) */}
        <div className="lg:col-span-5 space-y-8">

          {/* Section: Sandingan Metrik Tapak */}
          <div className="space-y-4">
            <div className="border-b border-slate-300 pb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Sandingan Metrik Tapak (3-Sisi)</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Perbandingan rencana usulan pemohon, regulasi tata ruang (bylaw), dan hasil verifikasi dinas.</p>
            </div>

            {/* Container tabel dengan overflow-x-auto agar tidak terpotong di mobile */}
            <div className="w-full overflow-x-auto border border-slate-300 bg-white rounded-none">
              <table className="w-full min-w-[500px] text-xs font-sans text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3 border-r border-slate-300">Parameter</th>
                    <th className="px-4 py-3 border-r border-slate-300">Proposed (Usulan)</th>
                    <th className="px-4 py-3 border-r border-slate-300">Bylaws (Aturan)</th>
                    <th className="px-4 py-3 w-[120px]">Verified (Dinas)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800 bg-white">
                  <tr>
                    <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">KDB</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">
                      {sub.technical?.applicantBuildingArea ? `${sub.technical.applicantBuildingArea.toLocaleString('id-ID')} m²` : '-'}
                      {sub.landArea && sub.technical?.applicantBuildingArea ? (
                        <span className="text-slate-500 block text-[9px] font-sans mt-1">({((sub.technical.applicantBuildingArea / sub.landArea) * 100).toFixed(1)}%)</span>
                      ) : ''}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Maks {sub.bylawMaxKdb || 60}%</td>
                    <td className="px-3 py-2 bg-slate-50/30">
                      <div className="relative flex items-center w-full">
                        <input
                          type="number"
                          step="0.01"
                          value={verifiedKdb}
                          onChange={(e) => setVerifiedKdb(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="KDB"
                          className="w-full pl-2 pr-6 py-1.5 bg-white border border-slate-300 focus:border-slate-800 text-xs font-mono rounded-none outline-none"
                        />
                        <span className="absolute right-2 text-[10px] font-bold text-slate-400 pointer-events-none">%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">KLB</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">{sub.technical?.klb || '-'}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Maks {sub.bylawMaxKlb || 3.5}</td>
                    <td className="px-3 py-2 bg-slate-50/30">
                      <input
                        type="number"
                        step="0.01"
                        value={verifiedKlb}
                        onChange={(e) => setVerifiedKlb(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="KLB"
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 focus:border-slate-800 text-xs font-mono rounded-none outline-none"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">KDH</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">{sub.technical?.kdh ? `${sub.technical.kdh}%` : '-'}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Min {sub.bylawMinKdh || 10}%</td>
                    <td className="px-3 py-2 bg-slate-50/30">
                      <div className="relative flex items-center w-full">
                        <input
                          type="number"
                          step="0.01"
                          value={verifiedKdh}
                          onChange={(e) => setVerifiedKdh(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="KDH"
                          className="w-full pl-2 pr-6 py-1.5 bg-white border border-slate-300 focus:border-slate-800 text-xs font-mono rounded-none outline-none"
                        />
                        <span className="absolute right-2 text-[10px] font-bold text-slate-400 pointer-events-none">%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">GSB</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">{sub.technical?.applicantGsb ? `${sub.technical.applicantGsb} m` : '-'}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Min {sub.bylawMinGsb || 5} m</td>
                    <td className="px-3 py-2 bg-slate-50/30">
                      <div className="relative flex items-center w-full">
                        <input
                          type="number"
                          step="0.1"
                          value={verifiedGsb}
                          onChange={(e) => setVerifiedGsb(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="GSB"
                          className="w-full pl-2 pr-6 py-1.5 bg-white border border-slate-300 focus:border-slate-800 text-xs font-mono rounded-none outline-none"
                        />
                        <span className="absolute right-2 text-[10px] font-bold text-slate-400 pointer-events-none">m</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">RTH</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">{sub.technical?.applicantRthArea ? `${sub.technical.applicantRthArea.toLocaleString('id-ID')} m²` : '-'}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Min {sub.bylawMinRthArea || 1400} m²</td>
                    <td className="px-3 py-2 bg-slate-50/30">
                      <div className="relative flex items-center w-full">
                        <input
                          type="number"
                          value={verifiedRthArea}
                          onChange={(e) => setVerifiedRthArea(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="RTH"
                          className="w-full pl-2 pr-8 py-1.5 bg-white border border-slate-300 focus:border-slate-800 text-xs font-mono rounded-none outline-none"
                        />
                        <span className="absolute right-2 text-[9px] font-bold text-slate-400 pointer-events-none">m²</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Keputusan Akhir */}
          <div className="space-y-4 pt-4 border-t border-slate-300">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Keputusan Akhir Verifikasi</h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Kesimpulan Akhir KKPR</label>
                <select
                  value={kkprVerdict}
                  onChange={(e) => setKkprVerdict(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-slate-800 text-xs font-semibold text-slate-800 rounded-none outline-none"
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
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan alasan teknis secara komprehensif..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-slate-800 text-xs rounded-none outline-none transition-all text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section: Ringkasan Pengajuan */}
          <div className="space-y-4 pt-4 border-t border-slate-300">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Detail Pendaftaran</h2>
            <div className="divide-y divide-slate-200 text-xs">
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500">Nama Perumahan</span>
                <span className="font-bold text-slate-800 text-right">{sub.housingName}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500">Luas Lahan</span>
                <span className="font-mono font-bold text-slate-800 text-right">{sub.landArea?.toLocaleString('id-ID')} m²</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500">Jenis Kegiatan</span>
                <span className="font-bold text-slate-800 text-right uppercase text-[11px]">{sub.submissionDetails?.category || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500">Lokasi Tapak</span>
                <span className="text-slate-700 text-right font-medium" title={sub.locationDetails?.fullAddress}>
                  {sub.locationDetails?.village || '-'}, {sub.locationDetails?.district || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Berkas Unggahan Pemohon */}
          <div className="space-y-4 pt-4 border-t border-slate-300">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Berkas Unggahan Pemohon</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Daftar file administrasi dan gambar CAD yang diunggah pemohon.</p>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-300 max-h-[250px] overflow-y-auto bg-white rounded-none">
              {sub.documents && sub.documents.length > 0 ? (
                sub.documents.map((doc: any) => (
                  <div key={doc.id} className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 block">
                        {getDocCategoryLabel(doc.key)}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900 truncate" title={doc.name}>
                        {doc.name}
                      </h5>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors rounded-none cursor-pointer shrink-0"
                    >
                      Unduh
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-slate-50">
                  <p className="text-xs text-slate-400 font-medium">Tidak ada berkas terlampir.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: CHECKLIST EVALUASI 13 ASPEK (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border-b border-slate-300 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Checklist Evaluasi 13 Aspek</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Lakukan evaluasi kelayakan spasial secara mendetail per parameter.</p>
            </div>
            <div className="px-3 py-1 bg-slate-100 border border-slate-400 text-slate-800 font-mono text-[10px] font-bold rounded-none uppercase">
              {Object.values(checklistStates).filter(v => v.status === 'Sesuai').length} / 13 Sesuai
            </div>
          </div>

          <div className="divide-y divide-slate-300 border-b border-slate-300">
            {VERIFICATION_ASPECTS.map((aspect) => {
              const state = checklistStates[aspect.code] || { status: 'Sesuai', catatan: '' };
              const isExpanded = expandedAspect === aspect.code;
              const isSesuai = state.status === 'Sesuai';

              return (
                <div key={aspect.code} className="py-4 first:pt-0 last:pb-0">
                  {/* Row Header */}
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setExpandedAspect(isExpanded ? null : aspect.code)}
                      className="flex-1 text-left bg-transparent border-none outline-none cursor-pointer group p-0 min-w-0"
                    >
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                          KODE: {aspect.code}
                        </span>
                        <h5 className="font-bold text-xs text-slate-900 group-hover:text-slate-600 transition-colors leading-tight">
                          {aspect.label}
                        </h5>
                      </div>
                    </button>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Segmented Flat Control (Instead of Rounded Switch Toggle) */}
                      <div className="flex border border-slate-300 rounded-none overflow-hidden text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleToggleAspect(aspect.code, 'Sesuai')}
                          className={cn(
                            "px-2.5 py-1 font-bold uppercase tracking-wider transition-all border-none cursor-pointer rounded-none",
                            isSesuai
                              ? "bg-slate-900 text-white"
                              : "bg-white text-slate-400 hover:bg-slate-50"
                          )}
                        >
                          Sesuai
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAspect(aspect.code, 'Tidak Sesuai')}
                          className={cn(
                            "px-2.5 py-1 font-bold uppercase tracking-wider transition-all border-none cursor-pointer rounded-none",
                            !isSesuai
                              ? "bg-rose-700 text-white"
                              : "bg-white text-slate-400 hover:bg-slate-50"
                          )}
                        >
                          Tidak
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedAspect(isExpanded ? null : aspect.code)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer rounded-none"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                      </button>
                    </div>
                  </div>

                  {/* Row Body Content (Accordion) */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-dashed border-slate-200 space-y-4 animate-in fade-in duration-200 pl-2">

                      {/* Help Text */}
                      <div className="text-[10px] text-slate-600 leading-relaxed flex items-start gap-2 bg-slate-50 p-3 border-l-2 border-slate-800 rounded-none">
                        <Info className="h-4 w-4 text-slate-600 shrink-0" />
                        <span className="text-justify">{aspect.helpText}</span>
                      </div>

                      {/* Catatan Per Aspek & Upload Bukti */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-8">
                          <input
                            type="text"
                            value={state.catatan}
                            onChange={(e) => handleAspectNoteChange(aspect.code, e.target.value)}
                            placeholder="Tuliskan temuan verifikasi spesifik aspek ini..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-slate-800 text-[10px] rounded-none outline-none"
                          />
                        </div>

                        <div className="md:col-span-4">
                          {state.isUploading ? (
                            <div className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-400 text-[10px] rounded-none">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500 shrink-0" />
                              <span className="font-bold uppercase tracking-wider">Mengunggah...</span>
                            </div>
                          ) : state.attachmentUrl ? (
                            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 border border-slate-300 text-[10px] rounded-none">
                              <a
                                href={state.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-900 font-bold hover:underline truncate max-w-[120px] uppercase tracking-wider"
                              >
                                📂 Bukti Fisik
                              </a>
                              <button
                                type="button"
                                onClick={() => setChecklistStates(prev => ({
                                  ...prev,
                                  [aspect.code]: { ...prev[aspect.code], attachmentUrl: undefined }
                                }))}
                                className="text-rose-700 font-bold hover:text-rose-900 transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent outline-none p-0 uppercase text-[9px] tracking-wider"
                              >
                                <Trash2 className="h-3 w-3" /> Hapus
                              </button>
                            </div>
                          ) : (
                            <div className="relative border border-dashed border-slate-300 hover:border-slate-800 bg-white hover:bg-slate-50 px-3 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all rounded-none">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleAspectAttachmentUpload(aspect.code, e)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              <UploadCloud className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unggah Bukti</span>
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

          {/* Action Buttons Section */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-300">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={handleRevertToAdministrativeLocal}
              title="Kembalikan berkas ke administrasi pemohon"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-widest transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-widest transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Kirim Hasil Keputusan
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}