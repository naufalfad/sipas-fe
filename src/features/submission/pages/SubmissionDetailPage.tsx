/**
 * ============================================================================
 * GEOSIPAS PAGE COMPONENT — SubmissionDetailPage [SubmissionDetailPage.tsx] (REVISED v8.4)
 * ============================================================================
 * Peran: Halaman detail berkas pengajuan bagi pemohon dan dinas.
 *        Mendukung peninjauan data administratif, rincian teknis 13-aspek,
 *        visualisasi peta AutoCAD PostGIS terintegrasi, jejak audit (audit-trail),
 *        serta manajemen pendelegasian CTA untuk TTE Kadis.
 * 
 * Pembaruan v8.4: Pemisahan utuh form pengunggahan foto darat dan video drone,
 *                penyelarasan query paralel, serta proteksi reaktif tombol verifikasi.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import { useAuthStore, AppPermission } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { useGisUIStore, type LahanKompensasi } from '@/app/store/useGisUIStore';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { API_BASE_URL } from '@/config';
import type { Submission } from '../types';
import {
  ArrowLeft, Clock, CheckCircle2, Download,
  XCircle, CheckCircle, FileSignature, AlertTriangle, Loader2,
  Info, ShieldCheck, Camera, Lock, Unlock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AuditTrailViewer from '@/features/approval/components/AuditTrailViewer';
import {
  SummaryTab, ApplicantTab, LocationTab,
  TechnicalTab, CompensationTab, PhotosTab, SilsilahTab
} from '../components/detail-tabs';
import { InspectionLogForm } from '../components/InspectionLogForm';
import { AerialInspectionForm } from '../components/AerialInspectionForm';
import { InspectionLogsGallery } from '../components/InspectionLogsGallery';

const getStatusBadgeClassLocal = (status: string) => {
  switch (status) {
    case 'Disetujui':
      return 'bg-accent/35 text-[#415D43] border border-accent/70'; // Celadon theme
    case 'Ditolak':
      return 'bg-rose-50 text-rose-700 border border-rose-100'; // Rose theme
    case 'Tidak Berlaku':
      return 'bg-slate-100 text-slate-500 border border-slate-200'; // Gray theme
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

  const { activeRole: uiActiveRole } = useUIStore();
  const { user, hasPermission } = useAuthStore();

  const effectiveRole = user ? (normalizeRole(user.role) as string) : uiActiveRole;
  const activeRole = effectiveRole;

  // Zustand State Binding
  const setActiveKompensasi = useGisUIStore((s) => s.setActiveKompensasi);
  const flyTo = useGisUIStore((s) => s.flyTo);

  // State untuk Tab Aktif
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pemohon' | 'lokasi' | 'teknis' | 'kompensasi' | 'foto' | 'silsilah' | 'audit' | 'inspeksi' | 'dokumen-sidak'>('ringkasan');

  // State dictionary kelayakan teknis
  const [checklistStates, setChecklistStates] = useState<Record<string, {
    status: 'Sesuai' | 'Sesuai Bersyarat' | 'Tidak Sesuai';
    catatan: string;
    attachmentUrl?: string;
  }>>({});

  // Deklarasi Peran Kepemimpinan & Otoritas
  const isAdminActive = effectiveRole === 'Admin SIPAS';
  const isKabidActive = effectiveRole === 'Kepala Bidang';
  const isKadisActive = effectiveRole === 'Kadis';

  const handleShowCompensationOnMap = (komp: LahanKompensasi) => {
    setActiveKompensasi(komp);
    const centroid = calculateCentroid(komp.polygon);
    flyTo({
      longitude: centroid[0],
      latitude: centroid[1],
      zoom: 17,
    });
    toast.info('GIS Engine memfokuskan kamera ke poligon lahan pengganti!');
  };

  const { data: sub, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id,
  });

  // Query Paralel 1: Mengambil Data Kunjungan Lapangan Titik Darat (Ground Inspections)
  const { data: groundInspectionsRes } = useQuery({
    queryKey: ['ground-inspections', id],
    queryFn: () => SubmissionService.getGroundInspections(id || ''),
    enabled: !!id,
  });
  const groundLogsCount = groundInspectionsRes?.data?.length || 0;

  // Query Paralel 2: Mengambil Data Rekaman Udara Drone (Aerial Inspection)
  const { data: aerialInspectionRes } = useQuery({
    queryKey: ['aerial-inspection', id],
    queryFn: () => SubmissionService.getAerialInspection(id || ''),
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

  // Mutation untuk Kunci Berkas (Claim Lock)
  const claimMutation = useMutation({
    mutationFn: async () => {
      return SubmissionService.claimSubmission(id || '');
    },
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true });
      toast.success(res.message || 'Berkas berhasil dikunci untuk verifikasi Anda.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengunci berkas.');
    }
  });

  // Mutation untuk Lepas Kunci Berkas (Unclaim Lock)
  const unclaimMutation = useMutation({
    mutationFn: async () => {
      return SubmissionService.unclaimSubmission(id || '');
    },
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true });
      toast.success(res.message || 'Kunci berkas berhasil dilepaskan.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal melepaskan kunci berkas.');
    }
  });

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
        <Link to="/pengajuan/daftar" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors rounded-none decoration-none">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const subData: Submission = sub;

  // Penghitungan Variabel Pembantu
  const isSlaPaused = subData.status === 'Ditolak' || subData.status === 'Draft';
  const slaDaysRemaining = subData.remaining_sla_days ?? 0;
  const hasRevisionIssues = subData.kkprVerdict === 'Sesuai Bersyarat' || subData.status === 'Ditolak';

  const showAdminPanel = isAdminActive && (subData.status === 'Pengajuan Dokumen' || subData.status === 'Verifikasi Administrasi');
  const showKabidPanel = isKabidActive && subData.status === 'Menunggu Rekomendasi';
  const showKadisPanel = isKadisActive && subData.status === 'Menunggu Persetujuan';

  // Panel Tim Teknis: tampil selama berkas aktif (bukan terminal: Disetujui/Ditolak/Tidak Berlaku)
  const terminalStatuses = ['Disetujui', 'Ditolak', 'Tidak Berlaku'];
  const showTeknisPanel = hasPermission(AppPermission.CAN_VERIFY_TECHNICAL) && !terminalStatuses.includes(subData.status);
  const isLockedByMe = subData.adminLockId === user?.id || (!!user?.full_name && subData.adminLockName === user.full_name);
  const isTeknisiLockedByMe = subData.teknisiLockId === user?.id || (!!user?.full_name && subData.teknisiLockName === user.full_name);

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
                "bg-rose-50 text-rose-700 border-rose-100"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4 text-left">
          <button
            onClick={() => navigate('/pengajuan/daftar')}
            className="p-2 bg-white hover:bg-slate-50 border border-border text-slate-500 hover:text-slate-800 transition-colors rounded-none cursor-pointer outline-none shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#111D13] leading-tight">
              Rincian Berkas Pengajuan
            </h1>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Informasi administrasi, penelusuran riwayat, dan lampiran berkas teknis {subData.submissionNo}.
            </p>
          </div>
        </div>

        {/* DYNAMIC SLA TRACKER HUD */}
        <div className="flex items-center gap-3 self-start md:self-auto select-none shrink-0">
          {isSlaPaused ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 animate-pulse text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <Clock className="h-3.5 w-3.5 text-rose-600" />
              SLA: DI-PAUSE (Revisi)
            </div>
          ) : subData.status === 'Disetujui' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              SLA: BERHASIL ({slaDaysRemaining} Hari)
            </div>
          ) : slaDaysRemaining < 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              SLA: TERLEWATI {Math.abs(slaDaysRemaining)} HARI
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <Clock className="h-3.5 w-3.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
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
              subData.kkprVerdict === 'Sesuai' || subData.kkprVerdict === 'Sesuai Bersyarat' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-100"
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
                          <Download className="h-3 w-3 mr-1 inline" /> Unduh Berkas Coretan Dinas
                        </a>
                      )}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border leading-none shrink-0",
                      isCompliant ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        isConditional ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-100"
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
            {(['ringkasan', 'pemohon', 'lokasi', 'teknis', 'kompensasi', 'foto', ...((activeRole === 'Admin SIPAS' || activeRole === 'Super Admin') ? ['silsilah'] : []), 'audit', ...(((activeRole && activeRole !== 'Pemohon') || hasPermission(AppPermission.CAN_VERIFY_TECHNICAL)) ? ['dokumen-sidak'] : []), ...(((activeRole && activeRole !== 'Pemohon' && activeRole !== 'Kepala Bidang' && activeRole !== 'Kepala Dinas') || hasPermission(AppPermission.CAN_VERIFY_TECHNICAL)) ? ['inspeksi'] : [])] as const).map((tab) => {
              const isActive = activeTab === tab;
              const labels: Record<string, string> = {
                ringkasan: 'Ringkasan',
                pemohon: 'Pemohon & Konsultan',
                lokasi: 'Lokasi & Tata Ruang',
                teknis: 'Data Teknis',
                kompensasi: 'Kompensasi Lahan',
                foto: 'Foto Lapangan',
                silsilah: 'Pemeriksaan Silsilah',
                audit: 'Audit Trail',
                'dokumen-sidak': 'Dokumentasi Verifikasi',
                inspeksi: 'Input Verifikasi Lapangan'
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as any)}
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
            {activeTab === 'lokasi' && <LocationTab sub={subData} inspectionLogs={groundInspectionsRes?.data || []} />}
            {activeTab === 'teknis' && <TechnicalTab sub={subData} />}
            {activeTab === 'kompensasi' && (
              <CompensationTab sub={subData} onShowOnMap={handleShowCompensationOnMap} />
            )}
            {activeTab === 'foto' && <PhotosTab sub={subData} />}
            {activeTab === 'silsilah' && <SilsilahTab sub={subData} />}
            {activeTab === 'audit' && <AuditTrailViewer submissionId={subData.id} />}
            {activeTab === 'dokumen-sidak' && (
              <InspectionLogsGallery submissionId={subData.id} polygon={subData.location?.polygon} />
            )}
            {activeTab === 'inspeksi' && (
              /* ─── PEMBARUAN v8.4: SUB-LAYOUT PEMISAH VISUAL TEGAS ANTARA FORM DARAT & UDARA DRONE ─── */
              <div className="space-y-8 divide-y divide-slate-200">
                <div className="animate-in fade-in duration-300">
                  <InspectionLogForm
                    submissionId={subData.id}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['submission', id] });
                      queryClient.invalidateQueries({ queryKey: ['ground-inspections', id] });
                    }}
                  />
                </div>
                <div className="pt-8 animate-in fade-in duration-300">
                  <AerialInspectionForm
                    submissionId={subData.id}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['submission', id] });
                      queryClient.invalidateQueries({ queryKey: ['aerial-inspection', id] });
                    }}
                  />
                </div>
              </div>
            )}
          </div>

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

              {/* prominent download button in status card once signed */}
              {subData.status === 'Disetujui' && subData.signedPdfUrl && (
                <div className="pt-4 mt-2">
                  <a
                    href={`${API_BASE_URL}${subData.signedPdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 transition-colors decoration-none"
                  >
                    <Download className="h-4 w-4" />
                    <span>Unduh SK Resmi (PDF)</span>
                  </a>
                </div>
              )}
            </div>

            {/* Riwayat Alur Proses (Timeline - Perfectly Aligned & High Contrast) */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">Riwayat Proses Pelacakan</h4>
              <div className="max-h-[480px] overflow-y-auto pr-2 relative text-left">

                {/* Sumbu Garis Vertikal */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200/80" />

                <div className="space-y-6 pb-2">
                  {subData.history.map((hist, i) => {
                    const isApproved = hist.status === 'Disetujui';
                    const isRejected = hist.status === 'Ditolak';

                    // Resolusi warna lingkaran solid untuk kontras tinggi
                    const getCircleBgClass = (status: string) => {
                      switch (status) {
                        case 'Disetujui':
                          return 'bg-emerald-500 border-white text-white';
                        case 'Ditolak':
                          return 'bg-rose-500 border-white text-white';
                        case 'Verifikasi Teknis':
                          return 'bg-indigo-500 border-white text-white';
                        case 'Verifikasi Administrasi':
                          return 'bg-blue-500 border-white text-white';
                        default:
                          return 'bg-amber-500 border-white text-white';
                      }
                    };

                    return (
                      <div key={i} className="relative pl-10 pb-1">

                        {/* Lingkaran Penanda */}
                        <div className={cn(
                          "absolute left-4 top-0.5 rounded-full p-1.5 border-[3px] z-10 -translate-x-1/2 shadow-sm flex items-center justify-center",
                          getCircleBgClass(hist.status)
                        )}>
                          {isApproved && <CheckCircle2 className="h-3 w-3" />}
                          {isRejected && <XCircle className="h-3 w-3" />}
                          {!isApproved && !isRejected && <Clock className="h-3 w-3" />}
                        </div>

                        {/* Konten Log Riwayat */}
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
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 p-2.5 border border-slate-100/80 rounded-none text-justify">
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

      {/* FULL-WIDTH PANELS: DECOUPLED DELEGATED CTA BUTTONS (TTE / KABID / KADIS) */}
      <div className="space-y-6">
        {/* ADMIN PANEL */}
        {showAdminPanel && (
          <div className="bg-white border border-primary p-5 shadow-sm text-left space-y-4 rounded-none animate-in fade-in duration-300">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center select-none">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Otoritas Admin SIPAS</h3>
                <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Verifikasi Persyaratan Administrasi & Kelengkapan Formal</p>
              </div>
              <span className="px-2.5 py-1 bg-slate-800 text-white font-bold text-[8.5px] uppercase tracking-wider rounded-none">ADMINISTRATOR</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
              <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-justify">
                Berkas permohonan baru saja masuk atau sedang dalam antrean. Anda diwajibkan memeriksa kesesuaian dan kelengkapan dokumen persyaratan formal pemohon (seperti KTP, NIB, NPWP, Sertifikat BPN) sebelum meloloskannya ke tahap pemeriksaan tim teknis.
              </p>
            </div>

            {!subData.adminLockId ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 rounded-none leading-relaxed">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Berkas Belum Dikunci</p>
                    <p className="mt-1 text-slate-600">
                      Anda harus mengunci berkas ini terlebih dahulu sebelum dapat mengisi checklist verifikasi persyaratan formal. Mengunci berkas mencegah admin lain memverifikasi berkas yang sama secara bersamaan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={claimMutation.isPending}
                  onClick={() => claimMutation.mutate()}
                  className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border border-primary transition-colors cursor-pointer shadow-md"
                >
                  {claimMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  <span>Kunci &amp; Mulai Verifikasi Administrasi</span>
                </button>
              </div>
            ) : !isLockedByMe ? (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-start gap-2.5 rounded-none leading-relaxed">
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Berkas Sedang Terkunci</p>
                  <p className="mt-1 text-slate-600">
                    Berkas ini sedang diperiksa dan dikunci oleh <span className="font-bold text-slate-800">{subData.adminLockName}</span>. Anda tidak dapat melakukan verifikasi administrasi untuk berkas ini kecuali kunci dilepaskan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={unclaimMutation.isPending}
                  onClick={() => unclaimMutation.mutate()}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all rounded-none cursor-pointer border border-border bg-white"
                >
                  {unclaimMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 inline" /> : <><Unlock className="h-3.5 w-3.5 mr-1 inline" /> Lepas Kunci (Batal)</>}
                </button>
                <Link
                  to={`/pengajuan/verifikasi-administrasi/${subData.id}`}
                  className="flex-1 py-2.5 bg-primary hover:opacity-90 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-colors cursor-pointer decoration-none shadow-md text-center"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Mulai Verifikasi Administrasi</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TIM TEKNIS PANEL */}
        {showTeknisPanel && (
          <div className="bg-white border border-[#415D43] p-5 shadow-sm text-left space-y-4 rounded-none animate-in fade-in duration-300">
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

            {!subData.teknisiLockId ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 rounded-none leading-relaxed">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Berkas Belum Dikunci</p>
                    <p className="mt-1 text-slate-600">
                      Anda harus mengunci berkas ini terlebih dahulu sebelum dapat melakukan verifikasi teknis. Mengunci berkas mencegah tim teknis lain memverifikasi berkas yang sama secara bersamaan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={claimMutation.isPending}
                  onClick={() => claimMutation.mutate()}
                  className="w-full py-2.5 bg-[#415D43] hover:bg-[#415D43]/95 text-white font-bold text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border border-[#415D43] transition-colors cursor-pointer shadow-md"
                >
                  {claimMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  <span>Kunci &amp; Mulai Verifikasi Teknis</span>
                </button>
              </div>
            ) : !isTeknisiLockedByMe ? (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-start gap-2.5 rounded-none leading-relaxed">
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Berkas Sedang Terkunci</p>
                  <p className="mt-1 text-slate-600">
                    Berkas ini sedang diperiksa dan dikunci oleh <span className="font-bold text-slate-800">{subData.teknisiLockName}</span>. Anda tidak dapat melakukan verifikasi teknis untuk berkas ini kecuali kunci dilepaskan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 w-full pt-2">
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={unclaimMutation.isPending}
                    onClick={() => unclaimMutation.mutate()}
                    className="px-4 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all rounded-none cursor-pointer border border-border bg-white flex items-center justify-center"
                  >
                    {unclaimMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Unlock size={13} className="mr-1.5 text-slate-400" />
                    )}
                    <span>Lepas Kunci</span>
                  </button>

                  {/* ─── PEMBARUAN v8.4: TOMBOL VERIFIKASI TEKNIS REAKTIF BERDASARKAN KELENGKAPAN SURVEI DARAT ─── */}
                  {groundLogsCount > 0 ? (
                    <Link
                      to={`/pengajuan/verifikasi/${subData.id}`}
                      className="flex-1 py-2.5 bg-[#415D43] hover:bg-[#415D43]/90 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-colors cursor-pointer decoration-none shadow-md text-center"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Mulai Verifikasi Teknis</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Matriks Penilaian Teknis Terkunci: Wajib mengunggah log inspeksi lapangan darat terlebih dahulu."
                      className="flex-1 py-2.5 bg-slate-100 text-slate-400 font-bold text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed shadow-none"
                    >
                      <Lock size={13} className="text-slate-400" />
                      <span>Verifikasi Terkunci</span>
                    </button>
                  )}
                </div>

                {groundLogsCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('inspeksi');
                      document.getElementById('root')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 bg-slate-100 border border-slate-350 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm text-center"
                  >
                    <Camera size={13} className="text-slate-500" />
                    <span>Ambil Foto Lapangan Tambahan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('inspeksi');
                      document.getElementById('root')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-colors cursor-pointer shadow-md text-center"
                  >
                    <Camera size={14} className="text-teal-400" />
                    <span>Ambil Foto Verifikasi Lapangan</span>
                  </button>
                )}

                {/* NOTIFIKASI PROTEKSI TOMBOL VERIFIKASI */}
                {groundLogsCount === 0 && (
                  <div className="flex items-center gap-1.5 justify-center text-[9.5px] text-rose-600 font-semibold mt-1">
                    <AlertTriangle size={11} className="shrink-0" />
                    <span>Ulasan kunjungan lapangan darat wajib dikirim terlebih dahulu untuk membuka kunci penilaian.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* KABID CTA PANEL */}
        {showKabidPanel && (
          <div className="bg-white border border-[#415D43] p-5 shadow-sm text-left space-y-4 rounded-none animate-in fade-in duration-300">
            <div className="border-b border-slate-150 pb-3 flex justify-between items-center select-none">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Verifikasi Kepala Bidang
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Peninjauan Teknis &amp; Kompilasi Diktum SK
                </p>
              </div>

              {/* Badge Solid, Sharp */}
              <span className="px-3 py-1 bg-slate-800 text-white font-bold text-[8.5px] uppercase tracking-wider rounded-none">
                VERIFIKASI KABID
              </span>
            </div>

            <div className="p-3.5 bg-[#e8f2ea]/40 border border-[#A1CCA5]/60 flex items-start gap-2.5 text-xs text-slate-600">
              <Info size={16} className="text-[#415D43] shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-justify">
                Dokumen rekomendasi teknis (Telaah Staf) dari Tim Teknis telah terbit. Sesuai prosedur penandatanganan Perbup Bogor No. 4 Tahun 2025, Anda diwajibkan melakukan tinjauan naskah, memeriksa keselarasan spasial, membubuhkan paraf, and merilis draf resmi Surat Keputusan (SK) di portal khusus peninjauan.
              </p>
            </div>

            <Link
              to={`/pengajuan/verifikasi/${subData.id}/tinjau-kabid`}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-colors cursor-pointer decoration-none shadow-md text-center"
            >
              <FileSignature className="h-4 w-4 text-teal-400 animate-pulse" />
              <span>Mulai Peninjauan &amp; Buat Draf SK</span>
            </Link>
          </div>
        )}

        {/* KADIS CTA PANEL */}
        {showKadisPanel && (
          <div className="bg-white border-2 border-primary p-5 shadow-md text-left space-y-4 rounded-none animate-in fade-in duration-300">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center select-none">
              <div>
                <h3 className="text-xs font-black text-[#111D13] uppercase tracking-wider">Otoritas Kepala Dinas</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Pengesahan Kriptografis TTE BSrE Final</p>
              </div>
              <span className="px-2 py-0.5 bg-[#e8f2ea] text-primary font-bold text-[8.5px] border border-[#A1CCA5] uppercase rounded-none">KADIS SECURE TTE</span>
            </div>

            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 select-none">
                <h5 className="font-bold uppercase tracking-wider text-[9px] text-emerald-900 leading-none">Pemeriksaan Dual-PDF &amp; TTE BSrE</h5>
                <p className="text-[9px] leading-normal text-emerald-700 text-justify">
                  Berkas pengesahan site plan telah disetujui Kabid and nomor SK resmi telah digenerasi otomatis oleh sistem. Kepala Dinas diwajibkan untuk memeriksa draf Surat Keputusan bersama rekomendasi teknis secara berdampingan di modul aman sebelum menandatanganinya secara digital.
                </p>
              </div>
            </div>

            <Link
              to={`/pengajuan/verifikasi/${subData.id}/sahkan-kadis`}
              className="w-full py-3 bg-[#415D43] hover:bg-[#415D43]/95 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 border-none transition-all cursor-pointer shadow-md text-center decoration-none"
            >
              <FileSignature className="h-4 w-4 text-[#A1CCA5] animate-bounce" style={{ animationDuration: '3s' }} />
              <span>Mulai TTE &amp; Pengesahan SK</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}