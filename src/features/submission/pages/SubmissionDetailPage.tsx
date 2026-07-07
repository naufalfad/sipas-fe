/**
 * ============================================================================
 * GEOSIPAS DETIL & COCKPIT VERIFIKASI — [SubmissionDetailPage.tsx] (REVISED v3)
 * ============================================================================
 * Peran: Layar utama verifikasi dinas lintas OPD dan dasbor scorecard pemohon.
 *        Mengintegrasikan 13 aspek checklist toggle, tabel komparasi tiga sisi,
 *        SLA tracking dinamis, andalalin/AMDAL check, dan tanda tangan digital.
 * ============================================================================
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { useGisUIStore, type LahanKompensasi } from '@/app/store/useGisUIStore';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { SubmissionStatus } from '../types';
import {
  ArrowLeft, Clock, CheckCircle2,
  XCircle, CheckCircle, FileSignature, AlertTriangle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AuditTrailViewer from '@/features/approval/components/AuditTrailViewer';
import {
  SummaryTab, ApplicantTab, LocationTab,
  TechnicalTab, CompensationTab, PhotosTab
} from '../components/detail-tabs';
import { SignatureCanvasPad } from '../components/SignatureCanvasPad';
import { VERIFICATION_ASPECTS } from '../constants/verificationAspects';

// ─── STYLING CONSTANTS (PROTECTED VARIATIONS) ──────────────────────────────────
const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide";

const getStatusBadgeClass = (status: string) => {
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
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { activeRole: uiActiveRole, userProfile: uiUserProfile } = useUIStore();
  const { user } = useAuthStore();

  const effectiveRole = user ? (normalizeRole(user.role) as string) : uiActiveRole;
  const activeRole = effectiveRole;
  const userProfile = user ? {
    name: user.full_name || user.username,
    email: user.email,
  } : uiUserProfile;

  // Zustand State Binding [sipas-fe.txt, Purworejo 8]
  const setActiveKompensasi = useGisUIStore((s) => s.setActiveKompensasi);
  const flyTo = useGisUIStore((s) => s.flyTo);

  const [notes, setNotes] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [signature, setSignature] = useState('');

  // State untuk Tab Aktif
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pemohon' | 'lokasi' | 'teknis' | 'kompensasi' | 'foto' | 'audit'>('ringkasan');

  // Checklist states
  const [adminChecks, setAdminChecks] = useState({
    ktp: false,
    sertifikat: false,
    npwp: false,
    kkpr: false
  });


  const [kabidAgreed, setKabidAgreed] = useState(false);


  // State dictionary untuk mumpung 13-aspek pemeriksaan dinas
  const [checklistStates, setChecklistStates] = useState<Record<string, {
    status: 'Sesuai' | 'Sesuai Bersyarat' | 'Tidak Sesuai';
    catatan: string;
    attachmentUrl?: string;
    isUploading?: boolean;
  }>>({});

  const [isVerificationConsentOpen, setIsVerificationConsentOpen] = useState(false);
  const [hasReviewedDocs, setHasReviewedDocs] = useState(false);

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

  const mutation = useMutation({
    mutationFn: async ({
      status,
      notes,
      passphrase,
      signatureBase64,
      actionTypeOverride
    }: {
      status: SubmissionStatus;
      notes: string;
      passphrase?: string;
      signatureBase64?: string;
      actionTypeOverride?: 'APPROVE' | 'REJECT' | 'REVERT_TO_TECHNICAL' | 'REVERT_TO_ADMINISTRATIVE';
    }) => {
      return SubmissionService.updateStatus(
        sub?.id || '',
        status,
        `${userProfile?.name || activeRole}`,
        notes,
        passphrase,
        signatureBase64,
        actionTypeOverride
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
      setAdminChecks({ ktp: false, sertifikat: false, npwp: false, kkpr: false });
      setKabidAgreed(false);
      toast.success('Status berkas berhasil diperbarui!');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memproses verifikasi: ${error.message}`);
    }
  });



  // Helper variables for role-based conditional rendering
  const isAdminActive = effectiveRole === 'Admin SIPAS';
  const isTechActive = effectiveRole === 'Tim Teknis';
  const isKabidActive = effectiveRole === 'Kepala Bidang';

  const showAdminPanel = sub && isAdminActive && (sub.status === 'Menunggu Verifikasi' || sub.status === 'Verifikasi Administrasi');
  const showTechPanel = sub && isTechActive && sub.status === 'Verifikasi Teknis';
  const showKabidPanel = sub && isKabidActive && sub.status === 'Menunggu Persetujuan';

  const allAdminChecked = Object.values(adminChecks).every(Boolean);

  const handleAdminAction = (approved: boolean) => {
    const targetStatus = approved ? 'Verifikasi Teknis' : 'Ditolak';
    const defaultNotes = approved ? 'Berkas dinyatakan LENGKAP dan SAH secara administratif. Diteruskan ke Tim Teknis.' : 'Berkas DITOLAK / butuh REVISI administratif.';
    mutation.mutate({
      status: targetStatus,
      notes: notes.trim() || defaultNotes
    });
  };


  const handleKabidAction = (approved: boolean) => {
    const targetStatus = approved ? 'Disetujui' : 'Ditolak';
    const defaultNotes = approved ? 'Dokumen Site Plan disahkan secara hukum menggunakan Tanda Tangan Elektronik (TTE) resmi dinas.' : 'Permohonan pengesahan ditolak oleh Kepala Bidang.';

    if (approved) {
      if (!passphrase) {
        toast.error('Passphrase PIN TTE wajib diisi untuk melakukan pengesahan!');
        return;
      }
      if (passphrase.length < 6) {
        toast.error('Passphrase PIN TTE minimal 6 karakter!');
        return;
      }
      if (!signature) {
        toast.error('Tanda Tangan Pejabat wajib digambar pada pad drawer!');
        return;
      }
    }

    mutation.mutate({
      status: targetStatus,
      notes: notes.trim() || defaultNotes,
      passphrase: approved ? passphrase : undefined,
      signatureBase64: approved ? signature : undefined
    });
  };

  const handleRevertToTechnical = () => {
    if (!notes.trim()) {
      toast.error('Catatan alasan pengembalian wajib diisi sebelum mengembalikan berkas ke Tim Teknis.');
      return;
    }
    mutation.mutate({
      status: 'Verifikasi Teknis',
      notes: notes.trim(),
      actionTypeOverride: 'REVERT_TO_TECHNICAL'
    });
  };


  const handleAdminActionLocal = (approved: boolean) => handleAdminAction(approved);
  const handleKabidActionLocal = (approved: boolean) => handleKabidAction(approved);

  // ── HANDLER PENGEMBALIAN INTERNAL: Kabid → Tim Teknis ──────────────────────
  const handleRevertToTechnicalLocal = () => handleRevertToTechnical();

  // Handler Visualisasi Lahan Kompensasi pada Peta Spasial [Purworejo 8]
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



  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-slate-500">Menghubungkan data basis spasial...</p>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="flex flex-col justify-center items-center py-16 text-center max-w-md mx-auto select-none bg-white border border-border p-8">
        <XCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Berkas Tidak Ditemukan</h3>
        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
          Nomor registrasi berkas pengajuan tidak terdaftar di dalam sistem administrasi GEOSIPAS.
        </p>
        <Link to="/pengajuan/daftar" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors rounded-none">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // SLA and Pause variables
  const isSlaPaused = sub.status === 'Ditolak' || sub.status === 'Draft';
  const slaDaysRemaining = sub.remaining_sla_days ?? 0;

  // ─── REVISI: INTERACTIVE SCORECARD UNTUK PEMOHON ───
  const hasRevisionIssues = sub.kkprVerdict === 'Sesuai Bersyarat' || sub.status === 'Ditolak';

  return (
    <div className="space-y-6 font-sans text-slate-700">

      {/* ─── SEKSI 1: HEADER SUMMARY BLOCK ─── */}
      <div className="flex items-center gap-4 select-none">
        <Link to="/pengajuan/daftar" className="p-2 bg-white hover:bg-slate-50 border border-border text-slate-500 hover:text-slate-800 transition-colors rounded-none">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-left flex-1">
          <h1 className="text-2xl font-bold text-[#111D13] leading-none">
            Rincian Berkas Pengajuan
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Informasi administrasi, penelusuran riwayat evaluasi, dan lampiran berkas teknis {sub.submissionNo}.
          </p>
        </div>

        {/* ─── DYNAMIC SLA TRACKER HUD [Bogor 16] ─── */}
        <div className="shrink-0 select-none flex items-center gap-3">
          {isSlaPaused ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 animate-pulse text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <Clock className="h-4 w-4 text-rose-600" />
              SLA: DI-PAUSE (Revisi)
            </div>
          ) : sub.status === 'Disetujui' ? (
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

      {/* ─── BARU: INTERACTIVE SCORECARD KEPATUHAN SPASIAL PEMOHON ─── */}
      {effectiveRole === 'Pemohon' && hasRevisionIssues && (
        <div className="bg-white border border-border p-6 shadow-md text-left space-y-5 animate-in slide-in-from-top-2 duration-300">
          <div className="border-b border-border pb-3 flex justify-between items-center select-none">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest leading-none block">Dinas Tata Ruang Verdict</span>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Laporan Kepatuhan Tata Ruang (KKPR Scorecard)</h3>
            </div>
            <span className={cn(
              "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-none leading-none border",
              sub.kkprVerdict === 'Sesuai Bersyarat' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
            )}>
              {sub.kkprVerdict || 'Perlu Perbaikan'}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed text-justify">
            Berdasarkan hasil peninjauan dan kalkulasi ulang manual tim teknis dinas, rencana tapak Anda dinilai <strong className="font-bold text-slate-800">{sub.kkprVerdict === 'Sesuai Bersyarat' ? 'Dapat Disetujui dengan Ketentuan Khusus' : 'Belum Memenuhi Syarat Kepatuhan'}</strong>. Silakan tinjau rincian poin evaluasi berikut:
          </p>

          <div className="border border-slate-100 divide-y divide-slate-100">
            {sub.evaluationChecklist && sub.evaluationChecklist.length > 0 ? (
              sub.evaluationChecklist.map((item: any) => {
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

          {sub.status === 'Ditolak' && (
            <div className="pt-3 border-t border-slate-100 text-right">
              <Link
                to={`/pengajuan/edit/${sub.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(220,38,38,0.15)] rounded-none decoration-none"
              >
                <FileSignature className="h-4 w-4" />
                Buka Form Revisi & Perbaiki Sekarang
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ─── SEKSI 2: CORE WORKSPACE GRID (SPLIT 2/3 DAN 1/3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Informasi Proyek & Berkas Laporan */}
        <div className="lg:col-span-2 space-y-6">

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
            {activeTab === 'ringkasan' && <SummaryTab sub={sub} />}
            {activeTab === 'pemohon' && <ApplicantTab sub={sub} />}
            {activeTab === 'lokasi' && <LocationTab sub={sub} />}
            {activeTab === 'teknis' && <TechnicalTab sub={sub} />}
            {activeTab === 'kompensasi' && (
              <CompensationTab sub={sub} onShowOnMap={handleShowCompensationOnMap} />
            )}
            {activeTab === 'foto' && <PhotosTab sub={sub} />}
            {activeTab === 'audit' && (
              <AuditTrailViewer submissionId={sub.id} />
            )}
          </div>

          {/* ─── KANVAS TINDAKAN EVALUASI (Dinamis Berdasarkan Hak Akses) ─── */}

          {/* Panel Admin SIPAS */}
          {showAdminPanel && (
            <div className="bg-white border border-primary p-5 shadow-[1px_1px_5px_rgba(0,0,0,0.02)] space-y-5 rounded-none text-left animate-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Panel Tindakan: Verifikasi Administrasi</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Lakukan validasi keabsahan fisik berkas pemohon.</p>
                </div>
                <span className="px-2 py-0.5 bg-secondary text-primary font-bold text-[9px] uppercase border border-border">ADMINISTRATOR</span>
              </div>

              {/* Checklist */}
              <div className="space-y-2.5">
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.ktp}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, ktp: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kesesuaian Identitas Pemohon (KTP / NIB Direktur)</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.sertifikat}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, sertifikat: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Keabsahan Sertifikat Kepemilikan Tanah / Surat Hak Atas Lahan</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.npwp}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, npwp: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kesesuaian NPWP Wajib Pajak (Badan Usaha / Perorangan)</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.kkpr}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, kkpr: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Dokumen Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) Sesuai Rencana</span>
                </label>
              </div>

              {/* Catatan Area */}
              <div className="space-y-1.5">
                <label className={labelClass}>Catatan Evaluasi / Alasan Penolakan</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Berikan keterangan kelayakan administrasi berkas di sini..."
                  className={inputClass}
                />
              </div>

              {/* Tindakan */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => handleAdminActionLocal(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  Tolak Berkas
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending || !allAdminChecked}
                  onClick={() => handleAdminActionLocal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-primary text-white text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Setujui & Teruskan ke Teknis
                </button>
              </div>
            </div>
          )}

          {/* Panel Tim Teknis */}
          {showTechPanel && (
            <div className="bg-[#e8f2ea]/20 border border-primary p-5 text-left space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Proses Verifikasi Teknis & Spasial</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Lakukan evaluasi terhadap 13 aspek spasial dan sandingan parameter rencana tapak.</p>
                </div>
                <span className="px-2 py-0.5 bg-[#e8f2ea] text-primary font-bold text-[9px] uppercase border border-[#A1CCA5]">TIM TEKNIS</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-600 max-w-xl">
                  Anda sedang bertindak sebagai Tim Teknis. Lembar verifikasi khusus telah disediakan pada halaman terpisah guna menjamin compliance pengawasan dokumen pemohon sebelum pengambilan keputusan.
                </p>
                <button
                  type="button"
                  onClick={() => setIsVerificationConsentOpen(true)}
                  className="px-5 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-none hover:bg-primary/95 transition-all cursor-pointer border-none"
                >
                  Mulai Lembar Verifikasi
                </button>
              </div>
            </div>
          )}

          {/* Consent Compliance Modal */}
          {isVerificationConsentOpen && (
            <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border-2 border-primary max-w-lg w-full p-6 space-y-5 text-left animate-in fade-in zoom-in-95 duration-200">
                <div className="border-b border-border pb-3">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Pernyataan Konfirmasi Verifikasi</h3>
                  <p className="text-[10px] text-slate-400 mt-1">SOP Audit Berkas & Keputusan Teknis Kabupaten Bogor [Buku 2]</p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sebelum memulai pengisian lembar verifikasi teknis, Anda diwajibkan untuk mengunduh dan meninjau keabsahan berkas permohonan yang telah diunggah oleh pemohon:
                  </p>
                  
                  <div className="space-y-2 max-h-[180px] overflow-y-auto border border-border p-2 bg-slate-50">
                    {sub.documents && sub.documents.length > 0 ? (
                      sub.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-white border border-border/60 text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={doc.name}>
                            {doc.name}
                          </span>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-primary font-bold hover:underline shrink-0"
                          >
                            Unduh Berkas
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400">Tidak ada berkas dokumen yang terlampir.</p>
                    )}
                  </div>
                  
                  <label className="flex items-start gap-2.5 cursor-pointer pt-2 select-none">
                    <input
                      type="checkbox"
                      checked={hasReviewedDocs}
                      onChange={(e) => setHasReviewedDocs(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 accent-primary cursor-pointer border border-slate-300 rounded-none"
                    />
                    <span className="text-[10px] text-slate-600 leading-normal font-bold">
                      Saya menyatakan telah mengunduh, meneliti, dan bertanggung jawab atas kesesuaian berkas di atas secara administratif dan spasial.
                    </span>
                  </label>
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerificationConsentOpen(false);
                      setHasReviewedDocs(false);
                    }}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all rounded-none cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={!hasReviewedDocs}
                    onClick={() => {
                      navigate(`/pengajuan/verifikasi/${sub.id}`);
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
                  >
                    Lanjutkan ke Lembar Verifikasi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Panel Kepala Bidang / TTE */}
          {showKabidPanel && (
            <div className="bg-white border border-primary p-5 shadow-[1px_1px_5px_rgba(0,0,0,0.02)] space-y-5 rounded-none text-left animate-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Panel Tindakan: Pengesahan & TTE</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tandatangani Surat Keputusan (SK) Site Plan secara elektronik.</p>
                </div>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-bold text-[9px] uppercase border border-teal-200">KEPALA BIDANG</span>
              </div>

              {/* Peringatan TTE */}
              <div className="bg-[#e8f2ea]/40 border border-primary/20 p-4 flex items-start gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h5 className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">Persetujuan TTE Dinas</h5>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    Tindakan ini akan menyematkan tanda tangan sertifikat elektronik BSrE resmi pada Surat Keputusan (SK) Pengesahan Site Plan pemohon secara legal di mata hukum.
                  </p>
                </div>
              </div>

              {/* Checkbox */}
              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kabidAgreed}
                  onChange={(e) => setKabidAgreed(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-slate-800">
                  Saya secara sadar menyetujui rekomendasi kelayakan teknis berkas pengajuan dan siap menandatangani SK.
                </span>
              </label>

              {/* Catatan Area */}
              <div className="space-y-1.5">
                <label className={labelClass}>Catatan Pengesahan Pimpinan (Opsional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Masukkan pesan pengesahan untuk pengaju..."
                  className={inputClass}
                />
              </div>

              {/* Passphrase Input Field */}
              <div className="space-y-1.5">
                <label className={labelClass}>Passphrase PIN TTE Pejabat</label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Masukkan PIN TTE Anda (Min. 6 Karakter)..."
                  className={inputClass}
                  required
                />
              </div>

              {/* Tanda Tangan Canvas Pad */}
              <SignatureCanvasPad
                value={signature}
                onChange={setSignature}
                onClear={() => setSignature('')}
              />

              {/* Tindakan */}
              <div className="pt-2 flex items-center justify-end gap-3 flex-wrap">
                {/* Kembalikan ke Tim Teknis — Jalur Revert Internal (amber) */}
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={handleRevertToTechnicalLocal}
                  title="Kembalikan ke Tim Teknis untuk klarifikasi teknis (SLA tetap berjalan)"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                  </svg>
                  Kembalikan ke Tim Teknis
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => handleKabidActionLocal(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  Tolak Pengesahan
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending || !kabidAgreed}
                  onClick={() => handleKabidActionLocal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#415D43] hover:bg-[#415D43]/95 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-[#415D43] text-white text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileSignature className="h-3.5 w-3.5" />
                  )}
                  Tanda Tangan SK & Sahkan
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Kolom Kanan (1/3): Status & Riwayat Pelacakan */}
        <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-6 rounded-none text-left">

          {/* Status Terkini */}
          <div className="border-b border-border pb-5 select-none">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status Berkas Saat Ini</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold mt-2.5 border ${getStatusBadgeClass(sub.status)}`}>
              {sub.status === 'Disetujui' ? <CheckCircle className="h-3.5 w-3.5 text-[#415D43]" /> :
                sub.status === 'Ditolak' ? <XCircle className="h-3.5 w-3.5 text-rose-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
              {sub.status}
            </span>
          </div>

          {/* Riwayat Alur Proses (Timeline) */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">Riwayat Proses Pelacakan</h4>

            <div className="relative border-l border-border/80 ml-3 pl-6 space-y-6 py-1">
              {sub.history.map((hist, i) => {
                const isApproved = hist.status === 'Disetujui';
                const isRejected = hist.status === 'Ditolak';

                return (
                  <div key={i} className="relative">
                    {/* Circle timeline nodes (bulat sempurna terlindung di index.css) */}
                    <div className={`absolute -left-9 mt-0.5 rounded-full p-1 border-4 border-white text-white ${isApproved ? 'bg-emerald-600' : isRejected ? 'bg-rose-600' : 'bg-amber-500'
                      }`}>
                      {isApproved ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> :
                        isRejected ? <XCircle className="h-3.5 w-3.5 text-white" /> : <Clock className="h-3.5 w-3.5 text-white" />}
                    </div>

                    <h5 className="font-bold text-slate-800 text-xs leading-none">{hist.status}</h5>
                    <div className="text-[10px] text-slate-400 mt-1.5 flex items-center space-x-2">
                      <span>{hist.date}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-500">{hist.actor}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{hist.notes}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}