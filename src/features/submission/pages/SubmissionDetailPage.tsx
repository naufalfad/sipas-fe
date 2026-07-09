// --- FILE: src/features/submission/pages/SubmissionDetailPage.tsx ---
/* STREAMING_CHUNK:Configuring imports and base constants */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import { useAuthStore, AppPermission } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { useGisUIStore, type LahanKompensasi } from '@/app/store/useGisUIStore';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { API_BASE_URL } from '@/config'; // Perbaikan: Impor API_BASE_URL terpasang resmi
import type { SubmissionStatus, Submission } from '../types';
import {
  ArrowLeft, Clock, CheckCircle2, Download,
  XCircle, CheckCircle, FileSignature, AlertTriangle, Loader2,
  Reply, Info, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AuditTrailViewer from '@/features/approval/components/AuditTrailViewer';
import {
  SummaryTab, ApplicantTab, LocationTab,
  TechnicalTab, CompensationTab, PhotosTab
} from '../components/detail-tabs';
import { SignatureCanvasPad } from '../components/SignatureCanvasPad';

// ─── STYLING CONSTANTS (PROTECTED VARIATIONS) ──────────────────────────────────
const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide";

const getStatusBadgeClassLocal = (status: string) => {
  switch (status) {
    case 'Disetujui':
      return 'bg-accent/35 text-[#415D43] border border-accent/70'; // Celadon theme
    case 'Ditolak':
      return 'bg-rose-50 text-rose-700 border border-rose-100'; // Rose theme
    default:
      return 'bg-amber-50 text-amber-800 border border-amber-100'; // Amber theme
  }
};

function calculateCentroid(polygon: [number, number][]): [number, number] {
  let totalLng = 0;
  let totalLat = 0;
  polygon.forEach((coord) => {
    const [a, b] = coord;
    if (a >= -15 && a <= 10 && b >= 90 && b <= 145) {
      totalLng += b;
      totalLat += a;
    } else {
      totalLng += a;
      totalLat += b;
    }
  });
  return [totalLng / polygon.length, totalLat / polygon.length];
}

export default function SubmissionDetailPage() {
  /* STREAMING_CHUNK:Initializing page queries and mutations */
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Perbaikan: navigate digunakan secara aktif pada aksi kembali

  const { activeRole: uiActiveRole, userProfile: uiUserProfile } = useUIStore();
  const { user, hasPermission } = useAuthStore(); // Memanfaatkan hasPermission dari store tepercaya

  const effectiveRole = user ? (normalizeRole(user.role) as string) : uiActiveRole;
  const activeRole = effectiveRole;
  const userProfile = user ? {
    name: user.full_name || user.username,
    email: user.email,
  } : uiUserProfile;

  // Zustand State Binding
  const setActiveKompensasi = useGisUIStore((s) => s.setActiveKompensasi);
  const flyTo = useGisUIStore((s) => s.flyTo);

  // Core Form States
  const [notes, setNotes] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [signature, setSignature] = useState('');

  // Veto Override Form States (Fase 3 Kabid)
  const [isVetoModeActive, setIsVetoModeActive] = useState(false);
  const [vetoVerdict, setVetoVerdict] = useState<string>('Sesuai');

  // State untuk Tab Aktif
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pemohon' | 'lokasi' | 'teknis' | 'kompensasi' | 'foto' | 'audit'>('ringkasan');

  // Checklist states (Admin SIPAS)
  const [adminChecks, setAdminChecks] = useState({
    ktp: false,
    sertifikat: false,
    npwp: false,
    kkpr: false,
    technical: false,
    support2: false,
    ska: false,
    cad: false
  });

  const [kabidAgreed, setKabidAgreed] = useState(false);
  const [kadisAgreed, setKadisAgreed] = useState(false);

  // State dictionary kelayakan teknis
  const [checklistStates, setChecklistStates] = useState<Record<string, {
    status: 'Sesuai' | 'Sesuai Bersyarat' | 'Tidak Sesuai';
    catatan: string;
    attachmentUrl?: string;
  }>>({});

  // ─── PERBAIKAN: DEKLARASI PERAN KEPEMIMPINAN (Dipindahkan ke atas untuk menghindari Temporal Dead Zone) ───
  const isAdminActive = effectiveRole === 'Admin SIPAS';
  const isKabidActive = effectiveRole === 'Kepala Bidang';
  const isKadisActive = effectiveRole === 'Kadis';

  // ─── PERBAIKAN: HOISTING MAP HANDLER (Dipindahkan ke atas sebelum referensi JSX) ───
  const handleShowCompensationOnMap = (komp: LahanKompensasi) => {
    setActiveKompensasi(komp);
    const centroid = calculateCentroid(komp.polygon);
    flyTo({
      longitude: centroid[0],
      latitude: centroid[1],
      zoom: 17,
      pitch: 45
    });
    toast.info('GIS Engine memfokuskan kamera ke poligon lahan pengganti!');
  };

  const { data: sub, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id,
  });

  // Pre-populate evaluasi checklist jika sudah ada di DB
  useEffect(() => {
    if (sub) {
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
      }
    }
  }, [sub]);

  // Mutation untuk Update Status dan Verifikasi Berjenjang
  const mutation = useMutation({
    mutationFn: async ({
      status,
      notes,
      passphrase,
      signatureBase64,
      actionTypeOverride,
      kkpr_verdict,
      checklist_items
    }: {
      status: SubmissionStatus;
      notes: string;
      passphrase?: string;
      signatureBase64?: string;
      actionTypeOverride?: 'APPROVE' | 'REJECT' | 'REVERT_TO_TECHNICAL' | 'REVERT_TO_ADMINISTRATIVE' | 'OVERRIDE_VERDICT';
      kkpr_verdict?: string;
      checklist_items?: any[];
    }) => {
      return SubmissionService.updateStatus(
        sub?.id || '',
        status,
        `${userProfile?.name || 'Verifikator'} (${user?.role || activeRole})`,
        notes,
        passphrase,
        signatureBase64,
        actionTypeOverride,
        kkpr_verdict,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        checklist_items
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['submissions'] })
      ]);
      setNotes('');
      setPassphrase('');
      setSignature('');
      setIsVetoModeActive(false);
      setAdminChecks({
        ktp: false,
        sertifikat: false,
        npwp: false,
        kkpr: false,
        technical: false,
        support2: false,
        ska: false,
        cad: false
      });
      setKabidAgreed(false);
      setKadisAgreed(false);
      toast.success('Penyimpanan mutasi status berhasil diselesaikan!');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memproses transaksi: ${error.message}`);
    }
  });

  // ─── EARLY RETURN FOR LOADING STATE ───
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-slate-500">Menghubungkan data basis spasial...</p>
      </div>
    );
  }

  // ─── EARLY RETURN FOR UNDEFINED STATE ───
  if (!sub) {
    return (
      <div className="flex flex-col justify-center items-center py-16 text-center max-w-md mx-auto select-none bg-white border border-border p-8">
        <XCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Berkas Tidak Ditemukan</h3>
        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
          Nomor registrasi berkas pengajuan tidak terdaftar di dalam sistem administrasi GEOSIPAS.
        </p>
        <Link to="/pengajuan/daftar" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors rounded-none decoration-none">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // ─── TYPE NARROWING CONFIRMED ───
  const subData: Submission = sub;

  // Penghitungan Variabel Pembantu di Lingkup Komponen Utama
  const isSlaPaused = subData.status === 'Ditolak' || subData.status === 'Draft';
  const slaDaysRemaining = subData.remaining_sla_days ?? 0;
  const hasRevisionIssues = subData.kkprVerdict === 'Sesuai Bersyarat' || subData.status === 'Ditolak';

  const showAdminPanel = isAdminActive && (subData.status === 'Menunggu Verifikasi' || subData.status === 'Verifikasi Administrasi');
  const showKabidPanel = isKabidActive && subData.status === 'Menunggu Rekomendasi';
  const showKadisPanel = isKadisActive && subData.status === 'Menunggu Persetujuan';

  // REVISI: Pengkondisian panel diputuskan tepercaya murni dari otorisasi PBAC, bukan hardcoded role strings
  const showTeknisPanel = hasPermission(AppPermission.CAN_VERIFY_TECHNICAL) && subData.status === 'Verifikasi Teknis';

  const allAdminChecked = Object.values(adminChecks).every(Boolean);

  // ─── HANDLER: ACTIONS ADMINISTRATOR ───
  const handleAdminAction = (approved: boolean) => {
    const targetStatus = approved ? 'Verifikasi Teknis' : 'Ditolak';
    const defaultNotes = approved ? 'Berkas dinyatakan LENGKAP dan SAH secara administratif. Diteruskan ke Tim Teknis.' : 'Berkas DITOLAK / butuh REVISI administratif.';

    const checklistItemsPayload = approved ? [
      {
        aspekCode: 'legalDoc',
        aspekLabel: 'Keabsahan Dokumen Hak Milik Lahan / Sertifikat BPN',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dinyatakan valid dan sah secara administratif.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: subData.applicant?.type === 'BADAN_USAHA' ? 'nibDoc' : 'ktpDoc',
        aspekLabel: subData.applicant?.type === 'BADAN_USAHA' ? 'Kesesuaian Nomor Induk Berusaha (NIB) Badan Usaha' : 'Kesesuaian Kartu Tanda Penduduk (KTP) Pemohon',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dinyatakan cocok secara administratif.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'npwpDoc',
        aspekLabel: 'Kesesuaian NPWP Wajib Pajak Pemohon',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dinyatakan cocok secara administratif.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'supportDoc',
        aspekLabel: 'Dokumen Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) Terlampir',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dokumen KKPR terlampir and sesuai.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'technicalDoc',
        aspekLabel: 'Kesesuaian Gambar Rencana Teknis CAD / PSU',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Gambar rencana teknis sesuai.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'supportDoc2',
        aspekLabel: 'Kesesuaian Kajian Andalalin / Persetujuan Teknis Lingkungan',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dokumen andalalin/lingkungan sesuai.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'skaDoc',
        aspekLabel: 'Keabsahan Sertifikat Keahlian (SKA) Arsitek',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'SKA Arsitek terdaftar dan sah.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'cadDoc',
        aspekLabel: 'Validitas Peta Koordinat CAD (.dwg/.dxf)',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Berkas peta CAD koordinat valid.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      }
    ] : [];

    mutation.mutate({
      status: targetStatus,
      notes: notes.trim() || defaultNotes,
      checklist_items: checklistItemsPayload
    });
  };

  // ─── HANDLER: ACTIONS KEPALA BIDANG (Fase 3 Veto & Endorse) ───
  const handleKabidEndorse = (approved: boolean) => {
    const targetStatus = approved ? 'Menunggu Persetujuan' : 'Ditolak';
    const defaultNotes = approved ? 'Dokumen Telaah Staf disetujui. Berkas diteruskan ke Kepala Dinas untuk diterbitkan SK.' : 'Rekomendasi penolakan disetujui oleh Kepala Bidang. Berkas dikembalikan ke Pemohon.';

    if (approved && !signature) {
      toast.error('Paraf coret pimpinan wajib dibubuhkan sebelum mengirimkan berkas!');
      return;
    }

    mutation.mutate({
      status: targetStatus,
      notes: notes.trim() || defaultNotes,
      signatureBase64: approved ? signature : undefined,
      actionTypeOverride: approved ? 'APPROVE' : 'REJECT'
    });
  };

  const handleKabidVetoOverride = () => {
    if (!notes.trim()) {
      toast.error('Justifikasi hukum override wajib diisi sebagai dasar hukum diskresi!');
      return;
    }
    if (!signature) {
      toast.error('Paraf coret pimpinan wajib dibubuhkan untuk mengesahkan override keputusan!');
      return;
    }

    mutation.mutate({
      status: 'Menunggu Persetujuan',
      notes: notes.trim(),
      signatureBase64: signature,
      actionTypeOverride: 'OVERRIDE_VERDICT',
      kkpr_verdict: vetoVerdict
    });
  };

  const handleRevertToTechnical = () => {
    if (!notes.trim()) {
      toast.error('Catatan alasan pengembalian internal wajib diisi!');
      return;
    }
    mutation.mutate({
      status: 'Verifikasi Teknis',
      notes: notes.trim(),
      actionTypeOverride: 'REVERT_TO_TECHNICAL'
    });
  };

  // ─── HANDLER: ACTIONS KEPALA DINAS (Fase 4 TTE Final) ───
  const handleKadisTTEApprove = () => {
    if (!passphrase) {
      toast.error('Passphrase PIN TTE wajib diisi untuk melakukan enkripsi berkas SK!');
      return;
    }
    if (passphrase.length < 6) {
      toast.error('PIN TTE minimal berjumlah 6 karakter!');
      return;
    }
    if (!signature) {
      toast.error('Tanda Tangan Pejabat wajib digambar pada canvas drawer!');
      return;
    }

    mutation.mutate({
      status: 'Disetujui',
      notes: notes.trim() || 'SK Pengesahan Site Plan resmi disetujui dan ditandatangani oleh Kepala Dinas secara elektronik.',
      passphrase,
      signatureBase64: signature,
      actionTypeOverride: 'APPROVE'
    });
  };

  const handleKadisRevertToKabid = () => {
    if (!notes.trim()) {
      toast.error('Alasan pengembalian draf SK ke Kepala Bidang wajib dilampirkan!');
      return;
    }
    mutation.mutate({
      status: 'Menunggu Rekomendasi',
      notes: notes.trim(),
      actionTypeOverride: 'REVERT_TO_TECHNICAL'
    });
  };

  const handleKadisReject = () => {
    if (!notes.trim()) {
      toast.error('Justifikasi penolakan keras draf SK wajib diisi!');
      return;
    }
    mutation.mutate({
      status: 'Ditolak',
      notes: notes.trim(),
      actionTypeOverride: 'REJECT'
    });
  };

  // ─── SEKSI HASIL EVALUASI TEKNIS & TELAAH STAF ───
  const renderTelaahStafSection = (data: Submission) => {
    const hasTechnicalResult = data.kkprVerdict || data.telaahStaf;
    if (!hasTechnicalResult) return null;

    const verdictLabel = data.telaahStaf?.verdict || data.kkprVerdict;

    return (
      <div className="mb-6 p-5 bg-[#e8f2ea]/20 border border-[#A1CCA5] space-y-4 rounded-none text-left animate-in fade-in duration-300">
        <div className="flex justify-between items-start border-b border-border pb-3">
          <div className="space-y-1">
            <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest leading-none block">Dinas Technical Recommendation</span>
            <h4 className="text-xs font-black text-slate-900 uppercase">Hasil Evaluasi Teknis &amp; Telaah Staf</h4>
          </div>
          <span className={cn(
            "rounded-none text-[8.5px] font-black tracking-widest px-2.5 py-1 uppercase leading-none border shrink-0",
            verdictLabel === 'Sesuai' || verdictLabel === 'Sesuai / Dapat Disetujui' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              verdictLabel === 'Sesuai Bersyarat' || verdictLabel === 'Sesuai Bersyarat / Ketentuan Khusus' ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-rose-50 text-rose-700 border-rose-200"
          )}>
            {verdictLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Petugas Pemeriksa (Tim Teknis)</span>
            <span className="font-bold text-slate-700 mt-1 block">{data.kkprVerifierName || data.telaahStaf?.payload?.verifier?.name || 'Pakar Geospasial Dinas'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tanggal Verifikasi Teknis</span>
            <span className="font-bold text-slate-700 mt-1 block">
              {data.kkprVerifiedAt ? new Date(data.kkprVerifiedAt).toLocaleString('id-ID') :
                data.telaahStaf?.createdAt ? new Date(data.telaahStaf.createdAt).toLocaleString('id-ID') : '-'}
            </span>
          </div>
        </div>

        {/* Tombol Unduh PDF Dokumen Telaah Staf */}
        <div className="pt-3.5 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dokumen Telaah Staf Resmi (Format PDF)</span>
          <a
            href={`${API_BASE_URL}/docs/Telaah_Staf_${data.id}.pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-black text-[9px] uppercase tracking-widest transition-colors rounded-none decoration-none"
          >
            <Download className="h-3.5 w-3.5" /> Unduh Dokumen Telaah Staf (PDF)
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-700">

      {/* ─── SEKSI 1: HEADER SUMMARY BLOCK ─── */}
      <div className="flex items-center gap-4 select-none">
        <button
          onClick={() => navigate('/pengajuan/daftar')}
          className="p-2 bg-white hover:bg-slate-50 border border-border text-slate-500 hover:text-slate-800 transition-colors rounded-none cursor-pointer outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-left flex-1">
          <h1 className="text-2xl font-bold text-[#111D13] leading-none">
            Rincian Berkas Pengajuan
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Informasi administrasi, penelusuran riwayat evaluasi, dan lampiran berkas teknis {subData.submissionNo}.
          </p>
        </div>

        {/* DYNAMIC SLA TRACKER HUD */}
        <div className="shrink-0 select-none flex items-center gap-3">
          {isSlaPaused ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 animate-pulse text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <Clock className="h-4 w-4 text-rose-600" />
              SLA: DI-PAUSE (Revisi)
            </div>
          ) : subData.status === 'Disetujui' ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              SLA: BERHASIL ({slaDaysRemaining} Hari)
            </div>
          ) : slaDaysRemaining < 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none animate-pulse">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              SLA: TERLEWATI {Math.abs(slaDaysRemaining)} HARI
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <Clock className="h-4 w-4 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
              SLA: {slaDaysRemaining} Hari Tersisa
            </div>
          )}
        </div>
      </div>

      {/* INTERACTIVE SCORECARD KEPATUHAN SPASIAL PEMOHON */}
      {effectiveRole === 'Pemohon' && hasRevisionIssues && (
        <div className="bg-white border border-border p-6 shadow-md text-left space-y-5 animate-in slide-in-from-top-2 duration-300">
          <div className="border-b border-border pb-3 flex justify-between items-center select-none">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest leading-none block">Dinas Tata Ruang Verdict</span>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Laporan Kepatuhan Tata Ruang (KKPR Scorecard)</h3>
            </div>
            <span className={cn(
              "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-none leading-none border",
              subData.kkprVerdict === 'Sesuai' || subData.kkprVerdict === 'Sesuai Bersyarat' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
            )}>
              {subData.kkprVerdict || 'Perlu Perbaikan / Revisi'}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed text-justify">
            Berdasarkan hasil peninjauan dan kalkulasi ulang manual tim teknis dinas, rencana tapak Anda dinilai <strong className="font-bold text-slate-800">{subData.kkprVerdict === 'Sesuai Bersyarat' ? 'Dapat Disetujui dengan Ketentuan Khusus' : 'Belum Memenuhi Syarat Kepatuhan'}</strong>. Silakan tinjau rincian poin evaluasi berikut:
          </p>

          <div className="border border-slate-100 divide-y divide-slate-100">
            {subData.evaluationChecklist && subData.evaluationChecklist.length > 0 ? (
              subData.evaluationChecklist.map((item: any) => {
                const isCompliant = item.statusKelayakan === 'Sesuai';
                const isConditional = item.statusKelayakan === 'Sesuai Bersyarat';
                return (
                  <div key={item.aspekCode} className="p-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold text-slate-800">{item.aspekLabel}</h4>
                      {item.catatanVerifikator && (
                        <p className="text-xs text-slate-500 font-mono italic">"{item.catatanVerifikator}"</p>
                      )}
                      {item.attachmentUrl && (
                        <a
                          href={item.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-[10px] font-bold text-teal-600 hover:underline mt-1"
                        >
                          📥 Unduh Berkas Coretan Dinas
                        </a>
                      )}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border leading-none rounded-none shrink-0",
                      isCompliant ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        isConditional ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {item.statusKelayakan}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Pemeriksaan aspek spasial belum diselesaikan oleh tim teknis dinas.
              </div>
            )}
          </div>

          {subData.status === 'Ditolak' && (
            <div className="pt-3 border-t border-slate-100 text-right">
              <Link
                to={`/pengajuan/edit/${subData.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(220,38,38,0.15)] rounded-none decoration-none"
              >
                <FileSignature className="h-4 w-4" />
                Buka Form Revisi & Perbaiki Sekarang
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ─── SEKSI 2: CORE WORKSPACE GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* KOLOM KIRI (8 col): DETAIL DATA TABULAR */}
        <div className="lg:col-span-8 space-y-6">

          {/* Tab Navigation Menu */}
          <div className="flex border-b border-border overflow-x-auto select-none bg-slate-50 p-1 gap-1">
            {(['ringkasan', 'pemohon', 'lokasi', 'teknis', 'kompensasi', 'foto', 'audit'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const labels: Record<string, string> = {
                ringkasan: 'Ringkasan',
                pemohon: 'Pemohon & Konsultan',
                lokasi: 'Lokasi & Tata Ruang',
                teknis: 'Data Teknis',
                kompensasi: 'Kompensasi Lahan',
                foto: 'Foto Lapangan',
                audit: 'Audit Trail'
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer outline-none border-none whitespace-nowrap",
                    isActive
                      ? "bg-white text-primary border-t-2 border-primary shadow-sm font-black"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  )}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-border p-6 shadow-[1px_1px_4px_rgba(0,0,0,0.015)] rounded-none text-left min-h-[350px]">
            {activeTab === 'ringkasan' && (
              <div className="space-y-6">
                {/* INJEKSI: Seksi Hasil Evaluasi Teknis & Telaah Staf Tepat Di Atas "BERKAS LAMPIRAN" */}
                {renderTelaahStafSection(subData)}
                <SummaryTab sub={subData} />
              </div>
            )}
            {activeTab === 'pemohon' && <ApplicantTab sub={subData} />}
            {activeTab === 'lokasi' && <LocationTab sub={subData} />}
            {activeTab === 'teknis' && <TechnicalTab sub={subData} />}
            {activeTab === 'kompensasi' && (
              <CompensationTab sub={subData} onShowOnMap={handleShowCompensationOnMap} />
            )}
            {activeTab === 'foto' && <PhotosTab sub={subData} />}
            {activeTab === 'audit' && (
              <AuditTrailViewer submissionId={subData.id} />
            )}
          </div>

          {/* Panel Verifikasi Administrasi (Hanya Tampil Untuk Admin) */}
          {showAdminPanel && (
            <div className="bg-white border border-primary p-5 shadow-sm space-y-5 rounded-none text-left animate-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Panel Tindakan: Verifikasi Administrasi</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Lakukan validasi keabsahan dokumen persyaratan pemohon.</p>
                </div>
                <span className="px-2 py-0.5 bg-secondary text-primary font-bold text-[9px] uppercase border border-border">ADMINISTRATOR</span>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.ktp}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, ktp: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    {subData.applicant?.type === 'BADAN_USAHA'
                      ? "Kesesuaian Nomor Induk Berusaha (NIB) Badan Usaha"
                      : "Kesesuaian Kartu Tanda Penduduk (KTP) Pemohon"
                    }
                  </span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.sertifikat}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, sertifikat: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Keabsahan Dokumen Hak Milik Lahan / Sertifikat BPN</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.npwp}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, npwp: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kesesuaian NPWP Wajib Pajak Pemohon</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.kkpr}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, kkpr: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Dokumen Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) Terlampir</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.technical}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, technical: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kesesuaian Gambar Rencana Teknis CAD / PSU</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.support2}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, support2: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kesesuaian Kajian Andalalin / Persetujuan Teknis Lingkungan</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.ska}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, ska: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Keabsahan Sertifikat Keahlian (SKA) Arsitek</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.cad}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, cad: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Validitas Peta Koordinat CAD (.dwg/.dxf)</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Catatan Tambahan Administrasi</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Berikan catatan perbaikan draf kelayakan jika berkas dikembalikan ke pemohon..."
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => handleAdminAction(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  Tolak Berkas
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending || !allAdminChecked}
                  onClick={() => handleAdminAction(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-primary text-white text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Setujui & Teruskan ke Teknis
                </button>
              </div>
            </div>
          )}

        </div>

        {/* KOLOM KANAN (4 col): PANEL TINDAKAN & WORKFLOW BIROKRASI */}
        <div className="lg:col-span-4 space-y-6">

          {/* Status Berkas Saat Ini Card */}
          <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-6 rounded-none text-left select-none">
            <div className="border-b border-border pb-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status Berkas Saat Ini</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold mt-2.5 border ${getStatusBadgeClassLocal(subData.status)}`}>
                {subData.status === 'Disetujui' ? <CheckCircle className="h-3.5 w-3.5 text-[#415D43]" /> :
                  subData.status === 'Ditolak' ? <XCircle className="h-3.5 w-3.5 text-rose-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                {subData.status}
              </span>
            </div>

            {/* Riwayat Alur Proses (Timeline) */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">Riwayat Proses Pelacakan</h4>
              <div className="max-h-[480px] overflow-y-auto pr-2 pl-4 relative">
                {/* Vertical timeline line inside the scrollable container */}
                <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-slate-200/80" />

                <div className="space-y-6 pb-2">
                  {subData.history.map((hist, i) => {
                    const isApproved = hist.status === 'Disetujui';
                    const isRejected = hist.status === 'Ditolak';

                    return (
                      <div key={i} className="relative pl-8">
                        {/* Circle Indicator centered perfectly on the line */}
                        <div className={cn(
                          "absolute left-[23px] top-0.5 rounded-full p-1 border-[3px] border-white text-white z-10 -translate-x-1/2 shadow-sm",
                          isApproved ? "bg-emerald-600" : isRejected ? "bg-rose-600" : "bg-amber-500"
                        )}>
                          {isApproved ? <CheckCircle2 className="h-2.5 w-2.5 text-white" /> :
                            isRejected ? <XCircle className="h-2.5 w-2.5 text-white" /> : <Clock className="h-2.5 w-2.5 text-white" />}
                        </div>

                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-800 text-xs leading-none">
                            {hist.status}
                          </h5>
                          <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono">{hist.date}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-500">{hist.actor}</span>
                          </div>
                          {hist.notes && (
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 p-2.5 border border-slate-100/80 rounded-sm">
                              {hist.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* FULL-WIDTH PANELS: TTE / KABID / KADIS (ditampilkan di bawah grid, full width) */}
      <div className="space-y-6">
        {showTeknisPanel && (
          <div className="bg-white border border-[#415D43] p-5 shadow-sm text-left space-y-5 rounded-none animate-in fade-in duration-300">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center select-none">
              <div>
                <h3 className="text-xs font-black text-[#111D13] uppercase tracking-wider">Otoritas Tim Teknis</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Penilaian Spasial & Komparasi 3 Sisi</p>
              </div>
              <span className="px-2 py-0.5 bg-[#e8f2ea] text-[#415D43] font-bold text-[8.5px] border border-[#A1CCA5] uppercase rounded-none">TIM TEKNIS</span>
            </div>

            <div className="p-3.5 bg-[#e8f2ea]/40 border border-[#A1CCA5]/60 flex items-start gap-2.5 text-xs text-slate-600">
              <Info size={16} className="text-[#415D43] shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-justify">
                Dokumen legalitas dinyatakan valid. Tim Teknis wajib menilai 13 parameter teknis daerah dan keselarasan spasial rencana tapak sebelum menyusun draf Telaah Staf.
              </p>
            </div>

            <Link
              to={`/pengajuan/verifikasi/${subData.id}`}
              className="w-full py-2.5 bg-[#415D43] hover:bg-[#415D43]/90 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-colors cursor-pointer decoration-none shadow-md text-center"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Mulai Verifikasi Teknis</span>
            </Link>
          </div>
        )}

        {showKabidPanel && (
          <div className="bg-white border border-slate-350 p-5 shadow-sm text-left space-y-5 rounded-none animate-in fade-in duration-300">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center select-none">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Otoritas Kepala Bidang</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Peninjauan draf Telaah Staf untuk pengesahan</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[8.5px] uppercase rounded-none">KABID VETO GATE</span>
            </div>

            {/* Informational Alerts */}
            <div className="p-3.5 bg-[#e8f2ea]/40 border border-[#A1CCA5]/60 flex items-start gap-2 text-xs">
              <Info size={14} className="text-[#415D43] shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-600 leading-relaxed text-justify">
                Sesuai dengan SOP Perbup Bogor, Anda memiliki wewenang untuk langsung meloloskan usulan rekomendasi, mengembalikan dokumen untuk penyesuaian lapangan, atau menggunakan **Hak Veto (Override)** teknis jika diperlukan.
              </p>
            </div>

            {/* Veto Toggle Switch */}
            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Aktifkan Hak Veto Khusus</span>
              <button
                type="button"
                onClick={() => {
                  setIsVetoModeActive(!isVetoModeActive);
                  setSignature('');
                }}
                className={cn(
                  "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-slate-500",
                  isVetoModeActive ? "bg-amber-50" : "bg-slate-200"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
                  isVetoModeActive ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>

            {/* Form Override Veto (Kondisional) */}
            {isVetoModeActive ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <label className={labelClass}>Modifikasi Keputusan Akhir</label>
                  <select
                    value={vetoVerdict}
                    onChange={(e) => setVetoVerdict(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 text-xs font-bold text-slate-800 rounded-none outline-none"
                  >
                    <option value="Sesuai">Sesuai (Dapat Disetujui)</option>
                    <option value="Sesuai Bersyarat">Sesuai Bersyarat (Ketentuan Khusus)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Alasan Justifikasi Hukum Veto</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Wajib diisi sebagai pertanggungjawaban hukum..."
                    className={inputClass}
                    required
                  />
                </div>

                <SignatureCanvasPad
                  value={signature}
                  onChange={setSignature}
                  onClear={() => setSignature('')}
                  placeholder="Goreskan paraf override Anda"
                />

                <button
                  type="button"
                  disabled={mutation.isPending || !notes.trim() || !signature}
                  onClick={handleKabidVetoOverride}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-widest rounded-none border-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Terapkan Hak Veto Kabid
                </button>
              </div>
            ) : (
              /* Alur Persetujuan Biasa */
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <label className={labelClass}>Catatan Rekomendasi/Memo Kabid</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Pesan pelengkap draf SK untuk Kepala Dinas..."
                    className={inputClass}
                  />
                </div>

                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={kabidAgreed}
                    onChange={(e) => setKabidAgreed(e.target.checked)}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-[10px] font-bold text-slate-600 leading-normal">
                    Saya secara sadar mengonfirmasi kelayakan draf dokumen ini untuk di-endorse ke Kepala Dinas.
                  </span>
                </label>

                <SignatureCanvasPad
                  value={signature}
                  onChange={setSignature}
                  onClear={() => setSignature('')}
                  placeholder="Goreskan paraf ulasan Anda"
                />

                {/* Tombol Tindakan Kabid */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    disabled={mutation.isPending || !kabidAgreed || !signature}
                    onClick={() => handleKabidEndorse(true)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSignature className="h-3.5 w-3.5 text-teal-400" />}
                    <span>Setujui &amp; Teruskan Draf SK</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 select-none">
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={handleRevertToTechnical}
                      className="py-1.5 border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center gap-1 transition-colors cursor-pointer outline-none"
                    >
                      <Reply size={12} /> Revert ke Teknis
                    </button>
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() => handleKabidEndorse(false)}
                      className="py-1.5 border border-rose-300 bg-rose-50/50 hover:bg-rose-100 text-rose-800 font-bold text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center gap-1 transition-colors cursor-pointer outline-none"
                    >
                      <XCircle size={12} /> Tolak Berkas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showKadisPanel && (
          <div className="bg-white border-2 border-primary p-5 shadow-md text-left space-y-5 rounded-none animate-in fade-in duration-300">
            <div className="border-b border-border pb-3 flex justify-between items-center select-none">
              <div>
                <h3 className="text-xs font-black text-[#111D13] uppercase tracking-wider">Otoritas Kepala Dinas</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Penandatanganan TTE Kriptografis SK Final</p>
              </div>
              <span className="px-2 py-0.5 bg-[#e8f2ea] text-primary font-bold text-[8.5px] border border-[#A1CCA5] uppercase rounded-none">KADIS SECURE TTE</span>
            </div>

            {/* Keamanan & Legalitas BSrE Notice */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 select-none">
                <h5 className="font-bold uppercase tracking-wider text-[9px] text-emerald-900 leading-none">BSrE BSSN Cryptography</h5>
                <p className="text-[9px] leading-normal text-emerald-700 text-justify">
                  Proses ini setara dengan pengesahan basah berdasarkan UU ITE No. 11. Dokumen yang ditandatangani akan memiliki hash digital anti-pemalsuan dari pangkalan data BSSN.
                </p>
              </div>
            </div>

            {/* Input Passphrase */}
            <div className="space-y-1.5">
              <label className={labelClass}>Passphrase PIN TTE Pejabat</label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Masukkan PIN TTE Dinas Anda..."
                className={inputClass}
                required
              />
            </div>

            {/* Memo Keterangan */}
            <div className="space-y-1.5">
              <label className={labelClass}>Catatan Tambahan SK (Opsional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan yang akan dimasukkan ke memo TTE..."
                className={inputClass}
              />
            </div>

            {/* Signature Canvas Pad */}
            <SignatureCanvasPad
              value={signature}
              onChange={setSignature}
              onClear={() => setSignature('')}
              placeholder="Goreskan tanda tangan TTE Anda"
            />

            <label className="flex items-start space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={kadisAgreed}
                onChange={(e) => setKadisAgreed(e.target.checked)}
                className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
              />
              <span className="text-[9.5px] font-bold text-slate-600 leading-normal">
                Saya memvalidasi integritas spasial rencana tapak ini dan bersedia menyematkan sertifikat hukum digital saya.
              </span>
            </label>

            {/* Tombol TTE Kadis */}
            <div className="space-y-2 select-none">
              <button
                type="button"
                disabled={mutation.isPending || !kadisAgreed || !signature || !passphrase}
                onClick={handleKadisTTEApprove}
                className="w-full py-3 bg-[#415D43] hover:bg-[#415D43]/95 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Menjalankan TTE BSrE...</span>
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4 text-[#A1CCA5]" />
                    <span>Sahkan SK &amp; Bubuhkan TTE</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={handleKadisRevertToKabid}
                  className="py-1.5 border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center gap-1 transition-all cursor-pointer outline-none"
                >
                  <Reply size={11} /> Revert ke Kabid
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={handleKadisReject}
                  className="py-1.5 border border-rose-300 bg-rose-50/50 hover:bg-rose-100 text-rose-800 font-bold text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center gap-1 transition-all cursor-pointer outline-none"
                >
                  <XCircle size={11} /> Tolak SK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}