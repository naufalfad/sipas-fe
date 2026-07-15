/**
 * ============================================================================
 * GEOSIPAS PAGE — SubmissionAdminVerificationPage [SubmissionAdminVerificationPage.tsx] (NEW)
 * ============================================================================
 * Peran: Halaman khusus Admin SIPAS untuk melakukan verifikasi persyaratan
 *        formal (dokumen administrasi) secara luas, lega, dan komprehensif.
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store/useAuthStore';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { SubmissionStatus } from '../types';
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2,
  ShieldCheck, FileText, ExternalLink, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

// ─── STYLING CONSTANTS (PROTECTED VARIATIONS) ──────────────────────────────────
const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide";

export default function SubmissionAdminVerificationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [notes, setNotes] = useState('');
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);
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

  const { data: sub, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id,
  });

  // --- SPATIAL OVERLAPS QUERY ---
  const { data: overlaps = [] } = useQuery({
    queryKey: ['spatial-overlaps', id],
    queryFn: () => SubmissionService.getSpatialOverlaps(id || ''),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: async ({
      status,
      notes,
      checklist_items
    }: {
      status: SubmissionStatus;
      notes: string;
      checklist_items?: any[];
    }) => {
      // Jika statusnya disetujui ('Verifikasi Teknis') dan ada rencana tautan silsilah, lakukan penautan silsilah terlebih dahulu sebelum menyetujui!
      if (status === 'Verifikasi Teknis' && pendingParentId) {
        await SubmissionService.linkParent(id || '', {
          baseline_source: 'DIGITAL',
          parent_id_permohonan: pendingParentId,
          notes: 'Ditautkan secara dinamis saat Admin menyetujui kelayakan administrasi.'
        });
      }

      const actorInfo = `${user?.full_name || 'Verifikator'} (${user?.role || 'Admin SIPAS'})`;
      return SubmissionService.updateStatus(
        id || '',
        status,
        actorInfo,
        notes,
        undefined,
        undefined,
        undefined,
        undefined,
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
      toast.success('Hasil verifikasi administrasi berhasil direkam!');
      navigate(`/pengajuan/detail/${id}`);
    },
    onError: (error: Error) => {
      toast.error(`Gagal menyimpan verifikasi: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center space-y-4 font-sans">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-slate-500">Memuat berkas administrasi...</p>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="flex flex-col justify-center items-center py-16 text-center max-w-md mx-auto select-none bg-white border border-border p-8 font-sans">
        <XCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Berkas Tidak Ditemukan</h3>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          Nomor registrasi berkas pengajuan tidak terdaftar di sistem.
        </p>
        <button onClick={() => navigate('/pengajuan/daftar')} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-none cursor-pointer border-none outline-none">
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const allChecked = Object.values(adminChecks).every(Boolean);

  const handleAdminVerifySubmit = (approved: boolean) => {
    const targetStatus = approved ? 'Verifikasi Teknis' : 'Ditolak';
    const defaultNotes = approved 
      ? 'Berkas LENGKAP secara administratif. Diteruskan ke Tim Teknis.' 
      : 'Berkas DITOLAK / butuh REVISI administratif.';

    const checklistItemsPayload = approved ? [
      {
        aspekCode: 'legalDoc',
        aspekLabel: 'Dokumen Hak Milik Lahan / Sertifikat BPN',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dinyatakan valid dan sah secara administratif.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: sub.applicant?.type === 'BADAN_USAHA' ? 'nibDoc' : 'ktpDoc',
        aspekLabel: sub.applicant?.type === 'BADAN_USAHA' ? 'Nomor Induk Berusaha (NIB) Badan Usaha' : 'Kartu Tanda Penduduk (KTP) Pemohon',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dinyatakan cocok secara administratif.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'npwpDoc',
        aspekLabel: 'NPWP Wajib Pajak Pemohon',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dinyatakan cocok secara administratif.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'supportDoc',
        aspekLabel: 'Dokumen Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) Terlampir',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dokumen KKPR terlampir.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'technicalDoc',
        aspekLabel: 'Gambar Rencana Teknis CAD / PSU',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Gambar rencana teknis sesuai.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'supportDoc2',
        aspekLabel: 'Kajian Andalalin / Persetujuan Teknis Lingkungan',
        statusKelayakan: 'Sesuai',
        catatanVerifikator: 'Dokumen andalalin/lingkungan sesuai.',
        verifiedById: user?.id,
        verifiedAt: new Date().toISOString()
      },
      {
        aspekCode: 'skaDoc',
        aspekLabel: 'Sertifikat Keahlian (SKA) Arsitek',
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

  const getDocUrl = (key: string) => {
    const doc = sub.documents?.find((d: any) => d.key === key);
    if (!doc?.url) return null;
    if (doc.url.startsWith('http://') || doc.url.startsWith('https://')) {
      return doc.url;
    }
    return `http://localhost:8000${doc.url.startsWith('/') ? '' : '/'}${doc.url}`;
  };

  const getDocName = (key: string) => {
    const doc = sub.documents?.find((d: any) => d.key === key);
    return doc?.name || null;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-left">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 select-none">
        <Link
          to={`/pengajuan/detail/${id}`}
          className="p-2 bg-white hover:bg-slate-50 border border-border text-slate-500 hover:text-slate-800 transition-colors rounded-none"
        >
          <ArrowLeft className="h-4 w-5" />
        </Link>
        <div className="text-left flex-1">
          <h1 className="text-xl font-bold text-[#111D13] leading-none uppercase">
            Workspace Verifikasi Administrasi
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Pemeriksaan validitas berkas persyaratan formal untuk registrasi {sub.submissionNo} ({sub.housingName}).
          </p>
        </div>
        <span className="px-3 py-1.5 bg-slate-800 text-white font-bold text-[9px] uppercase tracking-wider rounded-none">
          Peran: Administrator
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* KOLOM KIRI: DOKUMEN VIEWER / REGISTER LIST */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-border p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-primary" />
              Unggahan Berkas Persyaratan Pemohon
            </h3>
            
            <p className="text-[10px] text-slate-400 leading-normal">
              Silakan klik tombol tautan eksternal untuk mengunduh dan meninjau kebenaran dokumen di tab browser baru sebelum mencentang kelayakan formal.
            </p>

            <div className="border border-slate-100 divide-y divide-slate-100">
              
              {/* Sertifikat Tanah BPN */}
              <div className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">Sertifikat Tanah / Hak Milik BPN</span>
                  <span className="text-[9px] text-slate-400 font-mono">{getDocName('legalDoc') || 'sertifikat_lahan.pdf'}</span>
                </div>
                {getDocUrl('legalDoc') ? (
                  <a href={getDocUrl('legalDoc')!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold">
                    <span>Tinjau</span> <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[10px]">Belum diunggah</span>
                )}
              </div>

              {/* KTP / NIB */}
              <div className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">
                    {sub.applicant?.type === 'BADAN_USAHA' ? 'Nomor Induk Berusaha (NIB) Perusahaan' : 'KTP Pemohon'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {sub.applicant?.type === 'BADAN_USAHA' ? (getDocName('nibDoc') || 'nib_perusahaan.pdf') : (getDocName('ktpDoc') || 'ktp_identitas.pdf')}
                  </span>
                </div>
                {getDocUrl(sub.applicant?.type === 'BADAN_USAHA' ? 'nibDoc' : 'ktpDoc') ? (
                  <a href={getDocUrl(sub.applicant?.type === 'BADAN_USAHA' ? 'nibDoc' : 'ktpDoc')!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold">
                    <span>Tinjau</span> <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[10px]">Belum diunggah</span>
                )}
              </div>

              {/* NPWP */}
              <div className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">NPWP Wajib Pajak</span>
                  <span className="text-[9px] text-slate-400 font-mono">{sub.applicant?.npwp || '-'}</span>
                </div>
                <span className="text-slate-400 italic text-[10px]">Terverifikasi via API</span>
              </div>

              {/* SK KKPR */}
              <div className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">SK KKPR Terlampir</span>
                  <span className="text-[9px] text-slate-400 font-mono">{getDocName('supportDoc') || 'sk_kkpr.pdf'}</span>
                </div>
                {getDocUrl('supportDoc') ? (
                  <a href={getDocUrl('supportDoc')!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold">
                    <span>Tinjau</span> <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[10px]">Belum diunggah</span>
                )}
              </div>

              {/* Rencana Teknis CAD */}
              <div className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">Gambar Rencana Teknis CAD / PSU</span>
                  <span className="text-[9px] text-slate-400 font-mono">{getDocName('technicalDoc') || 'rencana_teknis.pdf'}</span>
                </div>
                {getDocUrl('technicalDoc') ? (
                  <a href={getDocUrl('technicalDoc')!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold">
                    <span>Tinjau</span> <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[10px]">Belum diunggah</span>
                )}
              </div>

              {/* Andalalin / Lingkungan */}
              <div className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">Kajian Andalalin / Persetujuan Teknis Lingkungan</span>
                  <span className="text-[9px] text-slate-400 font-mono">{getDocName('supportDoc2') || 'andalalin_izin.pdf'}</span>
                </div>
                {getDocUrl('supportDoc2') ? (
                  <a href={getDocUrl('supportDoc2')!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold">
                    <span>Tinjau</span> <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[10px]">Belum diunggah</span>
                )}
              </div>

              {/* SKA Arsitek */}
              <div className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">Sertifikat Keahlian (SKA) Arsitek</span>
                  <span className="text-[9px] text-slate-400 font-mono">{getDocName('skaDoc') || 'ska_arsitek.pdf'}</span>
                </div>
                {getDocUrl('skaDoc') ? (
                  <a href={getDocUrl('skaDoc')!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold">
                    <span>Tinjau</span> <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[10px]">Belum diunggah</span>
                )}
              </div>

              {/* Peta Koordinat CAD */}
              <div className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">Berkas Peta Koordinat CAD (.dwg/.dxf)</span>
                  <span className="text-[9px] text-slate-400 font-mono">{getDocName('cadDoc') || 'peta_siteplan.dxf'}</span>
                </div>
                {getDocUrl('cadDoc') ? (
                  <a href={getDocUrl('cadDoc')!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold">
                    <span>Tinjau</span> <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[10px]">Belum diunggah</span>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* KOLOM KANAN: FORM CHECKLIST & MUTASI STATUS */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-primary p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center select-none">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Form Lembar Kerja Administrasi</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Penetapan Validitas Persyaratan Formal</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 text-[10px] text-slate-500 leading-relaxed text-justify">
              Sebagai Administrator, Anda wajib mencentang kedelapan aspek persyaratan formal di bawah ini setelah memverifikasi keaslian dan kesesuaian berkas lampiran fisik pemohon.
            </div>

            {/* SPATIAL CONFLICT WARNING FOR NEW SUBMISSIONS */}
            {sub.submissionDetails?.submissionType === 'BARU' && overlaps.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-normal space-y-3 animate-in fade-in duration-300">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5">Temuan Konflik Spasial (PostGIS)</span>
                    <p className="text-[10px] leading-relaxed text-slate-500">
                      Sistem mendeteksi koordinat bidang tanah permohonan baru ini bertumpang tindih dengan koordinat SK aktif yang sudah terbit di database:
                    </p>
                  </div>
                </div>

                <div className="border border-rose-200/50 bg-white overflow-hidden">
                  <table className="w-full text-[10px] font-sans">
                    <tbody className="divide-y divide-rose-100 bg-white text-slate-700">
                      {overlaps.map((item: any) => (
                        <tr key={item.id_permohonan}>
                          <td className="p-2 font-mono font-bold text-[9px] text-slate-600">{item.sk_number || item.submission_no}</td>
                          <td className="p-2 font-semibold">{item.housing_name}</td>
                          <td className="p-2 text-right font-bold text-rose-600">{item.overlap_percentage}% Overlap</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!pendingParentId ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 italic">
                      Apakah Anda ingin mengaitkan pengusulan baru ini sebagai **Revisi** untuk menggantikan SK lama tersebut saat menyetujui verifikasi ini?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const firstOverlap = overlaps[0];
                        setPendingParentId(firstOverlap.id_permohonan);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-wider text-[9px] border-none rounded-none cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Tandai Rencana Tautan (Revisi)
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[10px] uppercase tracking-wider block text-teal-900">Rencana Tautan Silsilah Disiapkan</span>
                        <p className="text-[9px] leading-relaxed text-teal-700 mt-0.5">
                          Tautan silsilah akan disimpan ke database dan kategori permohonan akan otomatis diubah menjadi <strong>REVISI</strong> jika Anda menyetujui hasil verifikasi lembar kerja ini.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingParentId(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-600 hover:bg-slate-700 text-white font-bold uppercase tracking-wider text-[8px] border-none rounded-none cursor-pointer transition-colors"
                    >
                      Batalkan Rencana Tautan
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Checklist Checkboxes */}
            <div className="space-y-3.5">
              
              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={adminChecks.ktp}
                  onChange={(e) => setAdminChecks(prev => ({ ...prev, ktp: e.target.checked }))}
                  className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-slate-700">
                  {sub.applicant?.type === 'BADAN_USAHA'
                    ? "Nomor Induk Berusaha (NIB) Badan Usaha valid di lembar persetujuan"
                    : "Kartu Tanda Penduduk (KTP) Pemohon sesuai data kependudukan"
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
                <span className="text-xs font-semibold text-slate-700">Dokumen Sertifikat Tanah BPN sah & tidak bersengketa</span>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={adminChecks.npwp}
                  onChange={(e) => setAdminChecks(prev => ({ ...prev, npwp: e.target.checked }))}
                  className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-slate-700">NPWP Wajib Pajak aktif dan terisi lengkap</span>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={adminChecks.kkpr}
                  onChange={(e) => setAdminChecks(prev => ({ ...prev, kkpr: e.target.checked }))}
                  className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-slate-700">Dokumen Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) sesuai zonasi</span>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={adminChecks.technical}
                  onChange={(e) => setAdminChecks(prev => ({ ...prev, technical: e.target.checked }))}
                  className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-slate-700">Gambar Rencana Teknis CAD / Masterplan PSU terlampir</span>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={adminChecks.support2}
                  onChange={(e) => setAdminChecks(prev => ({ ...prev, support2: e.target.checked }))}
                  className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-slate-700">Kajian Andalalin / Persetujuan Teknis Lingkungan lengkap</span>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={adminChecks.ska}
                  onChange={(e) => setAdminChecks(prev => ({ ...prev, ska: e.target.checked }))}
                  className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-slate-700">Sertifikat Keahlian (SKA) Arsitek aktif</span>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={adminChecks.cad}
                  onChange={(e) => setAdminChecks(prev => ({ ...prev, cad: e.target.checked }))}
                  className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-slate-700">Berkas biner koordinat peta CAD (.dwg/.dxf) dapat dibuka</span>
              </label>

            </div>

            {/* Notes */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className={labelClass}>Catatan Tambahan Verifikasi Administrasi</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Berikan alasan spesifik jika berkas dikembalikan/ditolak, atau catatan administratif penting..."
                className={inputClass}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 select-none">
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => handleAdminVerifySubmit(false)}
                className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer bg-transparent"
              >
                Tolak Berkas
              </button>
              <button
                type="button"
                disabled={mutation.isPending || !allChecked}
                onClick={() => handleAdminVerifySubmit(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:opacity-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-primary text-white text-xs font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer"
              >
                {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Setujui & Teruskan ke Teknis
              </button>
            </div>
            
            {!allChecked && (
              <div className="flex items-start gap-2 text-[10px] text-amber-700 bg-amber-50 p-2.5 border border-amber-100">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <span>Tombol persetujuan akan aktif setelah semua dokumen formal dicentang sebagai valid.</span>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
