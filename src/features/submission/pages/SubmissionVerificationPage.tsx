/**
 * ============================================================================
 * GEOSIPAS PAGE COMPONENT — SubmissionVerificationPage [SubmissionVerificationPage.tsx] (REVISED v10.4)
 * ============================================================================
 * Peran: Halaman verifikasi teknis bagi Tim Teknis dinas.
 *        Mendukung evaluasi 13-aspek spasial Perda, pengisian dimensi fisik riel (m²),
 *        pembukaan kunci draf Telaah Staf reaktif, visualisasi peta AutoCAD,
 *        serta penaksiran kelayakan spasial secara atomik.
 * 
 * Pembaruan v10.4: Rekonfigurasi reaktif tombol verifikasi dan spanduk kepatuhan
 *                berdasarkan kelengkapan sidak darat murni (Ground Inspections).
 * ============================================================================
 */

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, AppPermission } from '@/app/store/useAuthStore';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { SubmissionStatus } from '../types';
import {
  ArrowLeft, Loader2, ShieldCheck, FileText, AlertTriangle, Ruler,
  ChevronDown, Info, Trash2, UploadCloud, FileSignature, Calculator, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadFileToBackend } from '@/features/submission/utils/upload';
import { VERIFICATION_ASPECTS } from '../constants/verificationAspects';

// Impor Komponen Peta Baru Berbasis Canvas & PostGIS (Fase 3)
import SitePlanViewerMap from '@/components/maps/SitePlanViewerMap';

const getDocCategoryLabel = (key?: string) => {
  if (key === 'legalDoc') return 'Sertifikat Tanah & KTP';
  if (key === 'technicalDoc') return 'Gambar Rencana Teknis CAD';
  if (key === 'supportDoc') return 'SK KKPR Awal / IPPT';
  if (key === 'supportDoc2') return 'Andalalin / Persetujuan Teknis Limbah B3';
  if (key === 'skaDoc') return 'Scan Sertifikat Keahlian (SKA) Arsitek';
  if (key === 'cadDoc') return 'File Peta Koordinat CAD (.dwg/.dxf)';
  return 'Dokumen Lampiran Pendukung';
};

const labelClass = "block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider";
const inputClass = "w-full px-3.5 py-2 bg-white border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-sans text-xs rounded-none";

export default function SubmissionVerificationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user: userProfile, hasPermission } = useAuthStore();
  const activeRole = userProfile?.role || '';

  const [kkprVerdict, setKkprVerdict] = useState<string>('Sesuai');

  // STATE DIMENSI FISIK RIIL (m²)
  const [verifiedLandArea, setVerifiedLandArea] = useState<number | ''>('');
  const [verifiedBuildingArea, setVerifiedBuildingArea] = useState<number | ''>('');
  const [verifiedTotalFloorArea, setVerifiedTotalFloorArea] = useState<number | ''>('');
  const [verifiedRthArea, setVerifiedRthArea] = useState<number | ''>('');
  const [verifiedGsb, setVerifiedGsb] = useState<number | ''>('');
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

  // Query: Mengambil Data Kunjungan Lapangan Titik Darat (Ground Inspections)
  const { data: groundInspectionsRes } = useQuery({
    queryKey: ['ground-inspections', id],
    queryFn: () => SubmissionService.getGroundInspections(id || ''),
    enabled: !!id,
  });
  const groundLogsCount = groundInspectionsRes?.data?.length || 0;
  const hasVerifiedLog = groundInspectionsRes?.data?.some((log: any) => log.isVerified) || false;

  // FILTERED ASPECTS BY CATEGORY
  const filteredAspects = useMemo(() => {
    if (!sub) return VERIFICATION_ASPECTS;
    const category = sub.submissionDetails?.category || 'PERUMAHAN';

    return VERIFICATION_ASPECTS.filter((aspect) => {
      if (aspect.code === 'tech_cemetery' && category !== 'PERUMAHAN') {
        return false;
      }
      if (category === 'PERUMAHAN') {
        return aspect.code !== 'REQ_ENV_IMPACT';
      }
      if (category === 'FASUM') {
        return aspect.code !== 'REQ_ENV_IMPACT';
      }
      return true;
    });
  }, [sub]);

  // Synchronize baseline parameters and fallbacks
  useEffect(() => {
    if (sub) {
      if (sub.kkprVerdict) setKkprVerdict(sub.kkprVerdict);

      // Sinkronisasi data fisik absolut terverifikasi dari DB ke state lokal
      setVerifiedLandArea(sub.verifiedLandArea ?? sub.landArea ?? '');
      setVerifiedBuildingArea(sub.verifiedBuildingArea ?? sub.applicantBuildingArea ?? '');
      setVerifiedTotalFloorArea(sub.verifiedTotalFloorArea ?? sub.technical?.totalFloorArea ?? '');
      setVerifiedRthArea(sub.verifiedRthArea ?? sub.applicantRthArea ?? '');
      setVerifiedGsb(sub.verifiedGsb ?? sub.applicantGsb ?? '');

      if (sub.evaluationChecklist && sub.evaluationChecklist.length > 0) {
        const mappedStates: Record<string, any> = {};
        sub.evaluationChecklist.forEach((item) => {
          mappedStates[item.aspekCode] = {
            status: item.statusKelayakan,
            catatan: item.catatanVerifikator || '',
            attachmentUrl: item.attachmentUrl
          };
        });
        if (sub.compensations) {
          sub.compensations.forEach((comp: any) => {
            if (!mappedStates[comp.id]) {
              mappedStates[comp.id] = {
                status: comp.status === 'TERPENUHI' ? 'Sesuai' : 'Tidak Sesuai',
                catatan: '',
                attachmentUrl: comp.documentUrl
              };
            }
          });
        }
        setChecklistStates(mappedStates);
      } else {
        const defaultStates: Record<string, any> = {};
        filteredAspects.forEach((aspect) => {
          defaultStates[aspect.code] = {
            status: 'Sesuai',
            catatan: ''
          };
        });
        if (sub.compensations) {
          sub.compensations.forEach((comp: any) => {
            defaultStates[comp.id] = {
              status: comp.status === 'TERPENUHI' ? 'Sesuai' : 'Tidak Sesuai',
              catatan: ''
            };
          });
        }
        setChecklistStates(defaultStates);
      }
    }
  }, [sub, filteredAspects]);

  // CLIENT-SIDE REACTIVE CALCULATOR ENGINE (KDB, KLB, KDH %)
  const computedKdb = useMemo(() => {
    if (verifiedBuildingArea !== '' && verifiedLandArea) {
      return (Number(verifiedBuildingArea) / Number(verifiedLandArea)) * 100;
    }
    return null;
  }, [verifiedBuildingArea, verifiedLandArea]);

  const computedKlb = useMemo(() => {
    if (verifiedTotalFloorArea !== '' && verifiedLandArea) {
      return Number(verifiedTotalFloorArea) / Number(verifiedLandArea);
    }
    return null;
  }, [verifiedTotalFloorArea, verifiedLandArea]);

  const computedKdh = useMemo(() => {
    if (verifiedRthArea !== '' && verifiedLandArea) {
      return (Number(verifiedRthArea) / Number(verifiedLandArea)) * 100;
    }
    return null;
  }, [verifiedRthArea, verifiedLandArea]);

  // PERHITUNGAN QUANTITATIVE GALAT SPASIAL (m² & %)
  const proposedLandArea = sub?.landArea ?? 0;
  const proposedBuildingArea = sub?.technical?.applicantBuildingArea ?? sub?.applicantBuildingArea ?? 0;
  const proposedTotalFloorArea = sub?.technical?.totalFloorArea ?? 0;
  const proposedRthArea = sub?.technical?.applicantRthArea ?? sub?.applicantRthArea ?? 0;

  const landError = useMemo(() => {
    if (verifiedLandArea !== '' && proposedLandArea > 0) {
      const diff = Number(verifiedLandArea) - proposedLandArea;
      const pct = (diff / proposedLandArea) * 100;
      return { diff, pct };
    }
    return null;
  }, [verifiedLandArea, proposedLandArea]);

  const buildingError = useMemo(() => {
    if (verifiedBuildingArea !== '' && proposedBuildingArea > 0) {
      const diff = Number(verifiedBuildingArea) - proposedBuildingArea;
      const pct = (diff / proposedBuildingArea) * 100;
      return { diff, pct };
    }
    return null;
  }, [verifiedBuildingArea, proposedBuildingArea]);

  const floorError = useMemo(() => {
    if (verifiedTotalFloorArea !== '' && proposedTotalFloorArea > 0) {
      const diff = Number(verifiedTotalFloorArea) - proposedTotalFloorArea;
      const pct = (diff / proposedTotalFloorArea) * 100;
      return { diff, pct };
    }
    return null;
  }, [verifiedTotalFloorArea, proposedTotalFloorArea]);

  const rthError = useMemo(() => {
    if (verifiedRthArea !== '' && proposedRthArea > 0) {
      const diff = Number(verifiedRthArea) - proposedRthArea;
      const pct = (diff / proposedRthArea) * 100;
      return { diff, pct };
    }
    return null;
  }, [verifiedRthArea, proposedRthArea]);

  // Aturan Batas Pelanggaran Perda RDTR secara Live
  const isKdbViolated = useMemo(() => {
    const limit = sub?.bylawMaxKdb ?? 60;
    if (computedKdb !== null) {
      return computedKdb > limit;
    }
    return false;
  }, [computedKdb, sub?.bylawMaxKdb]);

  const isKlbViolated = useMemo(() => {
    const limit = sub?.bylawMaxKlb ?? 3.5;
    if (computedKlb !== null) {
      return computedKlb > limit;
    }
    return false;
  }, [computedKlb, sub?.bylawMaxKlb]);

  const isKdhViolated = useMemo(() => {
    const limit = sub?.bylawMinKdh ?? 10;
    if (computedKdh !== null) {
      return computedKdh < limit;
    }
    return false;
  }, [computedKdh, sub?.bylawMinKdh]);

  const isGsbViolated = useMemo(() => {
    const limit = sub?.bylawMinGsb ?? 5;
    if (verifiedGsb !== '') {
      return Number(verifiedGsb) < limit;
    }
    return false;
  }, [verifiedGsb, sub?.bylawMinGsb]);

  const dynamicMinRth = useMemo(() => {
    const minKdhPercent = sub?.bylawMinKdh ?? 10;
    const currentLandArea = verifiedLandArea !== '' ? Number(verifiedLandArea) : (sub?.landArea ?? 0);
    return (minKdhPercent / 100) * currentLandArea;
  }, [sub?.bylawMinKdh, sub?.landArea, verifiedLandArea]);

  const isRthViolated = useMemo(() => {
    if (verifiedRthArea !== '') {
      return Number(verifiedRthArea) < dynamicMinRth;
    }
    return false;
  }, [verifiedRthArea, dynamicMinRth]);

  const centerCoord = useMemo<[number, number] | undefined>(() => {
    if (sub?.coordinate?.polygon && sub.coordinate.polygon.length > 0) {
      const pts = sub.coordinate.polygon;
      const sum = pts.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
      return [sum[0] / pts.length, sum[1] / pts.length];
    }
    return undefined;
  }, [sub]);

  const checklistStatesMapped = useMemo(() => {
    const output: Record<string, any> = {};
    filteredAspects.forEach((aspect) => {
      const state = checklistStates[aspect.code] || { status: 'Sesuai', catatan: '' };
      output[aspect.code] = {
        aspekLabel: aspect.label,
        statusKelayakan: state.status,
        catatanVerifikator: state.catatan,
        attachmentUrl: state.attachmentUrl,
        verifiedById: userProfile?.id || undefined,
        verifiedAt: new Date().toISOString()
      };
    });

    if (sub?.compensations) {
      sub.compensations.forEach((comp: any) => {
        const state = checklistStates[comp.id] || { status: comp.status === 'TERPENUHI' ? 'Sesuai' : 'Tidak Sesuai', catatan: '' };
        output[comp.id] = {
          aspekLabel: `Kompensasi: Lahan ${comp.type.replace(/_/g, ' ')} (${comp.requiredAreaM2} m²)`,
          statusKelayakan: state.status,
          catatanVerifikator: state.catatan,
          attachmentUrl: comp.documentUrl,
          verifiedById: userProfile?.id || undefined,
          verifiedAt: new Date().toISOString()
        };
      });
    }
    return output;
  }, [checklistStates, userProfile, filteredAspects, sub]);

  const allAspectsToRender = useMemo(() => {
    const list = [...filteredAspects.map(a => ({ ...a, isComp: false }))];
    if (sub?.compensations) {
      sub.compensations.forEach((comp: any) => {
        list.push({
          code: comp.id,
          label: `Kompensasi: Lahan ${comp.type.replace(/_/g, ' ')} (${comp.requiredAreaM2} m²)`,
          helpText: `Kewajiban kompensasi alih fungsi lahan yang dideklarasikan oleh pemohon di ${comp.locationAddress || 'luar kawasan perumahan'}. Nominal retribusi/denda: Rp ${(comp.nominalAmount || 0).toLocaleString('id-ID')}.`,
          isComp: true
        } as any);
      });
    }
    return list;
  }, [filteredAspects, sub]);

  const mutation = useMutation({
    mutationFn: async ({
      status,
      notes,
      actionTypeOverride
    }: {
      status: SubmissionStatus;
      notes: string;
      actionTypeOverride?: 'APPROVE' | 'REJECT' | 'REVERT_TO_TECHNICAL' | 'REVERT_TO_ADMINISTRATIVE' | 'OVERRIDE_VERDICT' | 'SAVE_TECHNICAL_MATRIX';
    }) => {
      const checklistItemsPayload = Object.entries(checklistStatesMapped).map(([code, item]) => ({
        aspekCode: code,
        aspekLabel: item.aspekLabel,
        statusKelayakan: item.statusKelayakan,
        catatanVerifikator: item.catatanVerifikator,
        attachmentUrl: item.attachmentUrl,
        verifiedById: item.verifiedById,
        verifiedAt: item.verifiedAt
      }));

      // Kirim data luasan fisik absolut (m²) langsung ke BE
      return SubmissionService.updateStatus(
        sub?.id || '',
        status,
        `${userProfile?.full_name || userProfile?.username || 'Verifikator'} (${activeRole})`,
        notes,
        undefined,
        undefined,
        actionTypeOverride,
        kkprVerdict,
        verifiedLandArea === '' ? undefined : Number(verifiedLandArea),
        verifiedBuildingArea === '' ? undefined : Number(verifiedBuildingArea),
        verifiedTotalFloorArea === '' ? undefined : Number(verifiedTotalFloorArea),
        verifiedRthArea === '' ? undefined : Number(verifiedRthArea),
        verifiedGsb === '' ? undefined : Number(verifiedGsb),
        checklistItemsPayload
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['submissions'] })
      ]);
      toast.success('Penyimpanan matriks berhasil! Membuka halaman draf Telaah Staf.');
      navigate(`/pengajuan/verifikasi/${id}/preview-telaah`);
    },
    onError: (error: Error) => {
      toast.error(`Gagal memproses draf dokumen telaah: ${error.message}`);
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

  // ─── PEMBARUAN v10.4: TOMBOL VERIFIKASI REAKTIF BERDASARKAN HASIL SIDAK DARAT (groundLogsCount) ───
  const handleCreateStaffAnalysisDraft = () => {
    if (groundLogsCount === 0) {
      toast.error('Gagal memproses draf dokumen telaah!', {
        description: 'Anda wajib mengunggah setidaknya 1 bukti kunjungan lapangan darat (Ground Inspection) sebelum dapat mengesahkan matriks verifikasi teknis.',
      });
      return;
    }
    if (!notes.trim()) {
      toast.warning('Tolong isi Catatan Penilaian Global / Justifikasi terlebih dahulu.');
      return;
    }
    mutation.mutate({
      status: 'Verifikasi Teknis',
      notes: notes.trim(),
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

  if (isLoading || !sub) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Memuat Berkas...</p>
        </div>
      </div>
    );
  }

  const isAuthorizedVerifier = hasPermission(AppPermission.CAN_VERIFY_TECHNICAL);
  const isLockedByMe = sub.teknisiLockId === userProfile?.id || (!!userProfile?.full_name && sub.teknisiLockName === userProfile.full_name);

  if (!isAuthorizedVerifier || sub.status !== 'Verifikasi Teknis') {
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

  if (!sub.teknisiLockId || !isLockedByMe) {
    return (
      <div className="p-8 text-left bg-white border border-slate-300 max-w-md mx-auto mt-12 rounded-none space-y-4">
        <AlertTriangle className="h-8 w-8 text-rose-600" />
        <h4 className="font-bold text-slate-900 uppercase tracking-wide">Berkas Terkunci</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          {!sub.teknisiLockId
            ? "Berkas ini belum dikunci. Silakan kembali ke halaman detail permohonan untuk mengunci berkas terlebih dahulu."
            : `Berkas ini sedang diperiksa dan dikunci oleh ${sub.teknisiLockName}.`}
        </p>
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer uppercase tracking-wider p-0"
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

      {/* INPUT DIMENSI FISIK RIIL TERVERIFIKASI */}
      <div className="space-y-4 bg-white border border-slate-300 p-5 rounded-none text-left">
        <div className="border-b border-slate-200 pb-2 flex items-center gap-2">
          <Ruler className="h-4.5 w-4.5 text-slate-800 shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-widest flex items-center gap-1.5 leading-none">
              <span className="uppercase">Input Dimensi Fisik Riil Terverifikasi</span>
              <span className="text-[11px] font-semibold text-slate-400 lowercase">(m² / meter)</span>
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Kunci luasan fisik riil hasil verifikasi lapangan spasial Anda. Perbandingan galat langsung dideklarasikan di bawah input.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Input: Luas Lahan */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold block leading-normal text-slate-500">
              <span className="uppercase tracking-wider">Luas Lahan Terverifikasi</span>
              <span className="block text-[9px] font-medium text-slate-400 lowercase mt-0.5">(m²)</span>
            </span>
            <input
              type="number"
              value={verifiedLandArea}
              onChange={(e) => setVerifiedLandArea(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Input m²"
              className={inputClass}
            />
            {landError && (
              <span className={cn(
                "text-[9px] font-bold block leading-snug mt-1",
                landError.diff >= 0 ? "text-emerald-700" : "text-rose-600"
              )}>
                Selisih: {landError.diff >= 0 ? '+' : ''}{landError.diff.toLocaleString('id-ID')} m² ({landError.pct >= 0 ? '+' : ''}{landError.pct.toFixed(1)}%)
              </span>
            )}
          </div>

          {/* Input: Luas Dasar Bangunan */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold block leading-normal text-slate-500">
              <span className="uppercase tracking-wider">Luas Dasar Bangunan</span>
              <span className="block text-[9px] font-medium text-slate-400 lowercase mt-0.5">(m²)</span>
            </span>
            <input
              type="number"
              value={verifiedBuildingArea}
              onChange={(e) => setVerifiedBuildingArea(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Input m²"
              className={inputClass}
            />
            {buildingError && (
              <span className={cn(
                "text-[9px] font-bold block leading-snug mt-1",
                buildingError.diff <= 0 ? "text-emerald-700" : "text-rose-600 animate-pulse"
              )}>
                Selisih: {buildingError.diff >= 0 ? '+' : ''}{buildingError.diff.toLocaleString('id-ID')} m² ({buildingError.pct >= 0 ? '+' : ''}{buildingError.pct.toFixed(1)}%)
              </span>
            )}
          </div>

          {/* Input: Luas Total Lantai */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold block leading-normal text-slate-500">
              <span className="uppercase tracking-wider">Luas Total Lantai</span>
              <span className="block text-[9px] font-medium text-slate-400 lowercase mt-0.5">(m²)</span>
            </span>
            <input
              type="number"
              value={verifiedTotalFloorArea}
              onChange={(e) => setVerifiedTotalFloorArea(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Input m²"
              className={inputClass}
            />
            {floorError && (
              <span className={cn(
                "text-[9px] font-bold block leading-snug mt-1",
                floorError.diff <= 0 ? "text-emerald-700" : "text-rose-600 animate-pulse"
              )}>
                Selisih: {floorError.diff >= 0 ? '+' : ''}{floorError.diff.toLocaleString('id-ID')} m² ({floorError.pct >= 0 ? '+' : ''}{floorError.pct.toFixed(1)}%)
              </span>
            )}
          </div>

          {/* Input: Luas RTH Terverifikasi */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold block leading-normal text-slate-500">
              <span className="uppercase tracking-wider">Luas RTH Terverifikasi</span>
              <span className="block text-[9px] font-medium text-slate-400 lowercase mt-0.5">(m²)</span>
            </span>
            <input
              type="number"
              value={verifiedRthArea}
              onChange={(e) => setVerifiedRthArea(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Input m²"
              className={inputClass}
            />
            {rthError && (
              <span className={cn(
                "text-[9px] font-bold block leading-snug mt-1",
                rthError.diff >= 0 ? "text-emerald-700" : "text-rose-600 animate-pulse"
              )}>
                Selisih: {rthError.diff >= 0 ? '+' : ''}{rthError.diff.toLocaleString('id-ID')} m² ({rthError.pct >= 0 ? '+' : ''}{rthError.pct.toFixed(1)}%)
              </span>
            )}
          </div>

          {/* Input: GSB */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold block leading-normal text-slate-500">
              <span className="uppercase tracking-wider">Garis Sempadan</span>
              <span className="block text-[9px] font-medium text-slate-400 lowercase mt-0.5">(m)</span>
            </span>
            <input
              type="number"
              step="0.1"
              value={verifiedGsb}
              onChange={(e) => setVerifiedGsb(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Input meter"
              className={inputClass}
            />
            {isGsbViolated && (
              <span className="text-[9px] font-bold text-rose-600 block mt-1 animate-pulse">
                ⚠ Melanggar GSB Min {sub.bylawMinGsb}m
              </span>
            )}
          </div>
        </div>

        {/* Laporan Galat & Narasi Selisih Spasial */}
        {(landError || buildingError || floorError || rthError) && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wide">
              <Calculator className="h-4 w-4 text-slate-500" />
              Laporan Analisis Galat / Selisih Dimensi Fisik (Verifikasi Lapangan vs Usulan)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <p className="leading-relaxed">
                  <strong>Luas Lahan:</strong> Usulan pemohon adalah <span className="font-mono font-semibold">{proposedLandArea.toLocaleString('id-ID')} m²</span>,
                  sedangkan hasil verifikasi fisik lapangan adalah <span className="font-mono font-semibold">{verifiedLandArea !== '' ? Number(verifiedLandArea).toLocaleString('id-ID') : '-'} m²</span>.
                  {landError && (
                    <span className={cn("font-bold ml-1", landError.diff >= 0 ? "text-emerald-700" : "text-rose-600")}>
                      Terdapat selisih sebesar {landError.diff >= 0 ? `tambahan +${landError.diff.toLocaleString('id-ID')}` : `pengurangan {landError.diff.toLocaleString('id-ID')}`} m² ({landError.diff >= 0 ? '+' : ''}{landError.pct.toFixed(1)}%).
                    </span>
                  )}
                </p>
                <p className="leading-relaxed">
                  <strong>Luas Dasar Bangunan (KDB):</strong> Usulan pemohon adalah <span className="font-mono font-semibold">{proposedBuildingArea.toLocaleString('id-ID')} m²</span>,
                  sedangkan hasil verifikasi adalah <span className="font-mono font-semibold">{verifiedBuildingArea !== '' ? Number(verifiedBuildingArea).toLocaleString('id-ID') : '-'} m²</span>.
                  {buildingError && (
                    <span className={cn("font-bold ml-1", buildingError.diff <= 0 ? "text-emerald-700" : "text-rose-600")}>
                      Selisih sebesar {buildingError.diff >= 0 ? `+${buildingError.diff.toLocaleString('id-ID')}` : `${buildingError.diff.toLocaleString('id-ID')}`} m² ({buildingError.diff >= 0 ? '+' : ''}{buildingError.pct.toFixed(1)}%).
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="leading-relaxed">
                  <strong>Luas Total Lantai (KLB):</strong> Usulan pemohon adalah <span className="font-mono font-semibold">{proposedTotalFloorArea.toLocaleString('id-ID')} m²</span>,
                  sedangkan hasil verifikasi adalah <span className="font-mono font-semibold">{verifiedTotalFloorArea !== '' ? Number(verifiedTotalFloorArea).toLocaleString('id-ID') : '-'} m²</span>.
                  {floorError && (
                    <span className={cn("font-bold ml-1", floorError.diff <= 0 ? "text-emerald-700" : "text-rose-600")}>
                      Selisih sebesar {floorError.diff >= 0 ? `+${floorError.diff.toLocaleString('id-ID')}` : `${floorError.diff.toLocaleString('id-ID')}`} m² ({floorError.diff >= 0 ? '+' : ''}{floorError.pct.toFixed(1)}%).
                    </span>
                  )}
                </p>
                <p className="leading-relaxed">
                  <strong>Luas Ruang Terbuka Hijau (RTH):</strong> Usulan pemohon adalah <span className="font-mono font-semibold">{proposedRthArea.toLocaleString('id-ID')} m²</span>,
                  sedangkan hasil verifikasi adalah <span className="font-mono font-semibold">{verifiedRthArea !== '' ? Number(verifiedRthArea).toLocaleString('id-ID') : '-'} m²</span>.
                  {rthError && (
                    <span className={cn("font-bold ml-1", rthError.diff >= 0 ? "text-emerald-700" : "text-rose-600")}>
                      Selisih sebesar {rthError.diff >= 0 ? `+${rthError.diff.toLocaleString('id-ID')}` : `${rthError.diff.toLocaleString('id-ID')}`} m² ({rthError.diff >= 0 ? '+' : ''}{rthError.pct.toFixed(1)}%).
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIVE INTERACTIVE SCORECARD TABLE */}
      <div className="space-y-4 bg-white border border-slate-300 p-5 rounded-none">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Live Scorecard Kepatuhan Perda RDTR</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Persentase dihitung secara reaktif oleh sistem mengikuti input luasan fisik (m²) Anda di form atas.</p>
        </div>

        <div className="w-full overflow-x-auto border border-slate-300 bg-white rounded-none">
          <table className="w-full min-w-[500px] text-xs font-sans text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3 border-r border-slate-300">Parameter RDTR</th>
                <th className="px-4 py-3 border-r border-slate-300">Proposed (Pemohon)</th>
                <th className="px-4 py-3 border-r border-slate-300">Bylaws (Standar Perda)</th>
                <th className="px-4 py-3">Live Verified (Dinas)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-slate-800 bg-white">
              {/* Row: KDB */}
              <tr>
                <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">KDB (Koefisien Dasar Bangunan)</td>
                <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">
                  {proposedBuildingArea ? `${proposedBuildingArea.toLocaleString('id-ID')} m²` : '-'}
                  <span className="text-slate-500 block text-[9px] font-sans mt-0.5">({sub.kdbPercent ? `${sub.kdbPercent}%` : '—'})</span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Maks {sub.bylawMaxKdb || 60}%</td>
                <td className="px-4 py-3.5">
                  {computedKdb !== null ? (
                    <span className={cn(
                      "font-bold font-mono text-[11px] px-2 py-0.5 border leading-none inline-block",
                      !isKdbViolated ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                    )}>
                      {verifiedBuildingArea !== '' ? `${Number(verifiedBuildingArea).toLocaleString('id-ID')} m² (${computedKdb.toFixed(1)}%)` : '-'} {!isKdbViolated ? "Memenuhi" : "Melanggar Batas"}
                    </span>
                  ) : <span className="text-slate-400 italic">Menunggu Luas Lahan &amp; Tapak...</span>}
                </td>
              </tr>
              {/* Row: KLB */}
              <tr>
                <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">KLB (Koefisien Lantai Bangunan)</td>
                <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">
                  {proposedTotalFloorArea ? `${proposedTotalFloorArea.toLocaleString('id-ID')} m²` : '-'}
                  <span className="text-slate-500 block text-[9px] font-sans mt-0.5">({sub.klbValue ? `${sub.klbValue}x` : '—'})</span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Maks {sub.bylawMaxKlb || 3.5}</td>
                <td className="px-4 py-3.5">
                  {computedKlb !== null ? (
                    <span className={cn(
                      "font-bold font-mono text-[11px] px-2 py-0.5 border leading-none inline-block",
                      !isKlbViolated ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                    )}>
                      {verifiedTotalFloorArea !== '' ? `${Number(verifiedTotalFloorArea).toLocaleString('id-ID')} m² (${computedKlb.toFixed(2)}x)` : '-'} {!isKlbViolated ? "Memenuhi" : "Melanggar Batas"}
                    </span>
                  ) : <span className="text-slate-400 italic">Menunggu Luas Lahan &amp; Lantai...</span>}
                </td>
              </tr>
              {/* Row: KDH */}
              <tr>
                <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">KDH (Koefisien Dasar Hijau)</td>
                <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">
                  {proposedRthArea ? `${proposedRthArea.toLocaleString('id-ID')} m²` : '-'}
                  <span className="text-slate-500 block text-[9px] font-sans mt-0.5">({sub.kdhPercent ? `${sub.kdhPercent}%` : '—'})</span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Min {sub.bylawMinKdh || 10}%</td>
                <td className="px-4 py-3.5">
                  {computedKdh !== null ? (
                    <span className={cn(
                      "font-bold font-mono text-[11px] px-2 py-0.5 border leading-none inline-block",
                      !isKdhViolated ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                    )}>
                      {verifiedRthArea !== '' ? `${Number(verifiedRthArea).toLocaleString('id-ID')} m² (${computedKdh.toFixed(1)}%)` : '-'} {!isKdhViolated ? "Memenuhi" : "Kurang Dari Batas"}
                    </span>
                  ) : <span className="text-slate-400 italic">Menunggu Luas Lahan &amp; RTH...</span>}
                </td>
              </tr>
              {/* Row: GSB */}
              <tr>
                <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">GSB (Garis Sempadan Bangunan)</td>
                <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">
                  {sub.technical?.applicantGsb ? `${sub.technical.applicantGsb} m` : '—'}
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Min {sub.bylawMinGsb || 5} m</td>
                <td className="px-4 py-3.5">
                  {verifiedGsb !== '' ? (
                    <span className={cn(
                      "font-bold font-mono text-[11px] px-2 py-0.5 border leading-none inline-block",
                      !isGsbViolated ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                    )}>
                      {verifiedGsb} m {!isGsbViolated ? "Memenuhi" : "Kurang Dari Batas"}
                    </span>
                  ) : <span className="text-slate-400 italic">Menunggu GSB...</span>}
                </td>
              </tr>
              {/* Row: RTH */}
              <tr>
                <td className="px-4 py-3.5 font-bold border-r border-slate-300 bg-slate-50/50">RTH (Ruang Terbuka Hijau)</td>
                <td className="px-4 py-3.5 font-mono text-[11px] border-r border-slate-300">
                  {proposedRthArea ? `${proposedRthArea.toLocaleString('id-ID')} m²` : '-'}
                  <span className="text-slate-500 block text-[9px] font-sans mt-0.5">({proposedRthArea && proposedLandArea ? `${((proposedRthArea / proposedLandArea) * 100).toFixed(1)}%` : '—'})</span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-500 border-r border-slate-300">Min {dynamicMinRth.toLocaleString('id-ID')} m² ({sub?.bylawMinKdh || 10}%)</td>
                <td className="px-4 py-3.5">
                  {verifiedRthArea !== '' ? (
                    <span className={cn(
                      "font-bold font-mono text-[11px] px-2 py-0.5 border leading-none inline-block",
                      !isRthViolated ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                    )}>
                      {Number(verifiedRthArea).toLocaleString('id-ID')} m² ({computedKdh !== null ? `${computedKdh.toFixed(1)}%` : '—'}) {!isRthViolated ? "Memenuhi" : "Kurang Dari Batas"}
                    </span>
                  ) : <span className="text-slate-400 italic">Menunggu RTH...</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* KOLOM KIRI: CHECKLIST EVALUASI 13 ASPEK (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ─── PEMBARUAN v10.4: SPANDUK EVALUASI REAKTIF TERHADAP HASIL SIDAK DARAT (groundLogsCount) ─── */}
          {groundLogsCount === 0 ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 rounded-none leading-relaxed select-none text-left animate-in fade-in duration-300">
              <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px]">Peringatan Keras: Belum Ada Log Kunjungan Lapangan</p>
                <p className="mt-1 text-slate-500">
                  Sistem mendeteksi bahwa berkas ini belum memiliki dokumentasi survei verifikasi lapangan darat (Ground Inspection). Berdasarkan Perbup Bogor, Tim Teknis <strong>diwajibkan mengunggah sekurangnya 1 bukti foto geotagged</strong> di lokasi proyek sebelum dapat mengesahkan matriks verifikasi dan menerbitkan draf Telaah Staf.
                </p>
              </div>
            </div>
          ) : !hasVerifiedLog ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 rounded-none leading-relaxed select-none text-left animate-pulse">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px]">Peringatan Keamanan: Koordinat Di Luar Lokasi</p>
                <p className="mt-1 text-slate-500">
                  Terdapat {groundLogsCount} log kunjungan lapangan darat yang tercatat, namun seluruh foto dokumentasi terdeteksi diambil di luar batas toleransi lokasi lahan proyek (jarak deviasi &gt; 100m). Mohon pastikan kembali validitas presensi sebelum melanjutkan.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 rounded-none leading-normal select-none text-left">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-900">Kunjungan Lapangan Terverifikasi</p>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  Sistem mendeteksi {groundLogsCount} bukti ulasan kunjungan lapangan darat geotagged yang valid secara spasial. Penilaian siap disahkan.
                </p>
              </div>
            </div>
          )}

          <div className="border-b border-slate-300 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Checklist Evaluasi Aspek Spasial</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Lakukan evaluasi kelayakan spasial secara mendetail per parameter.</p>
            </div>
            <div className="px-3 py-1 bg-slate-100 border border-slate-400 text-slate-800 font-mono text-[10px] font-bold rounded-none uppercase">
              {Object.keys(checklistStates).filter(k => allAspectsToRender.some(a => a.code === k) && checklistStates[k].status === 'Sesuai').length} / {allAspectsToRender.length} Sesuai
            </div>
          </div>

          <div className="divide-y divide-slate-300 border-b border-slate-300">
            {allAspectsToRender.map((aspect) => {
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
                      <button
                        type="button"
                        onClick={() => handleToggleAspect(aspect.code, isSesuai ? 'Tidak Sesuai' : 'Sesuai')}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                          isSesuai ? "bg-emerald-500" : "bg-slate-300"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            isSesuai ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>

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
                                <Trash2 className="h-3.5 w-3.5" /> Hapus
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
        </div>

        {/* KOLOM KANAN: DETAIL PENGAJUAN, PETA, TPU, DOKUMEN (col-span-5) */}
        <div className="lg:col-span-5 space-y-8">

          {/* Section: Detail Pendaftaran */}
          <div className="space-y-4">
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
                <span className="text-slate-700 text-right font-medium" title={sub.locationDetails?.fullAddress}>{sub.locationDetails?.village || '-'}, {sub.locationDetails?.district || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section: Mini-Map Visualisasi Spasial Tapak */}
          <div className="space-y-4 pt-4 border-t border-slate-300 text-left">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Visualisasi Georeferensi Tapak</h2>
            <SitePlanViewerMap
              idPermohonan={sub.id}
              center={centerCoord}
              className="h-[220px] w-full border border-border"
            />
          </div>

          {/* Section: Rincian TPU Pemohon */}
          {sub.tpu && (
            <div className="space-y-4 pt-4 border-t border-slate-300 text-left">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Detail TPU Rencana</h2>
              <div className="bg-[#e8f2ea]/20 p-4 border border-[#DAE4DB] space-y-3 text-xs">
                <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                  <span className="text-slate-500">Metode TPU</span>
                  <span className="font-bold text-slate-800 uppercase">{sub.tpu.method?.replace(/_/g, ' ')}</span>
                </div>
                {sub.tpu.method === 'MANDIRI' && (
                  <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                    <span className="text-slate-500">Luas TPU</span>
                    <span className="font-mono font-bold text-slate-800">{sub.tpu.area?.toLocaleString('id-ID')} m²</span>
                  </div>
                )}
                {sub.tpu.method === 'EKSISTING' && (
                  <>
                    <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                      <span className="text-slate-500">Nama TPU Pemda</span>
                      <span className="font-bold text-slate-800">{sub.tpu.namaTpu}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                      <span className="text-slate-500">Alamat TPU</span>
                      <span className="font-medium text-slate-700">{sub.tpu.alamat}</span>
                    </div>
                  </>
                )}
                {(sub.tpu.method === 'KERJASAMA' || sub.tpu.method === 'INTEGRASI_WARGA') && (
                  <>
                    <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                      <span className="text-slate-500">Nama Makam</span>
                      <span className="font-bold text-slate-800">{sub.tpu.namaTpu}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                      <span className="text-slate-500">Pengurus Makam</span>
                      <span className="font-bold text-slate-800">{sub.tpu.pengurusTpu}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                      <span className="text-slate-500">No. PKS</span>
                      <span className="font-mono font-bold text-slate-800">{sub.tpu.noPks}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                      <span className="text-slate-500">Lokasi</span>
                      <span className="font-medium text-slate-700">{sub.tpu.alamat}</span>
                    </div>
                  </>
                )}
                {sub.tpu.method === 'KOMPENSASI_UANG' && (
                  <>
                    <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                      <span className="text-slate-500">Nominal Retribusi</span>
                      <span className="font-mono font-bold text-slate-800">Rp {(sub.tpu.nominalKompensasi || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#DAE4DB] pb-1.5">
                      <span className="text-slate-500">Keterangan</span>
                      <span className="font-medium text-slate-700">{sub.tpu.alamat}</span>
                    </div>
                  </>
                )}
                {sub.tpu.buktiDokumenUrl && (
                  <div className="flex justify-between pt-1.5 items-center">
                    <span className="text-slate-500">Dokumen Bukti TPU</span>
                    <a
                      href={sub.tpu.buktiDokumenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Lihat Dokumen
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

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

      </div>

      {/* SECTION BAWAH: KEPUTUSAN HASIL TELAAH (FULL WIDTH) */}
      <div className="mt-8 pt-8 border-t border-slate-300 space-y-6 text-left">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Keputusan Hasil Telaah</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Tentukan keputusan akhir kelayakan teknis permohonan site plan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className={labelClass}>Kesimpulan Hasil Telaah KKPR</label>
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

          <div className="md:col-span-2 space-y-1.5">
            <label className={labelClass}>Catatan Penilaian Global / Justifikasi</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan alasan teknis secara komprehensif..."
              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-slate-800 text-xs rounded-none outline-none transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200">
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
            onClick={handleCreateStaffAnalysisDraft}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-widest transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <FileText className="h-3.5 w-3.5 mr-1" />
            )}
            Buat Dokumen Telaah
          </button>
        </div>
      </div>
    </div>
  );
}