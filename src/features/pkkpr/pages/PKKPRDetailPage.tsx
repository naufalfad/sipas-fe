import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  Compass,
  CheckCircle2,
  Clock,
  Lock,
  ExternalLink,
  Download,
  Printer,
  FileCheck
} from 'lucide-react';
import { GeoJSON } from 'react-leaflet';

import { pkkprApi } from '../api/pkkprApi';
import type { PKKPRDetail } from '../types/pkkpr.types';
import { PKKPRStatusBadge } from '../components/PKKPRStatusBadge';
import { PKKPRQuotaCard } from '../components/PKKPRQuotaCard';
import { useAuthStore } from '@/app/store/useAuthStore';
import GISMapContainer from '@/components/maps/GISMapContainer';
import { API_BASE_URL } from '@/config';

const getFileUrl = (filePath: string) => {
  if (!filePath) return '#';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const cleanPath = filePath.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanPath}`;
};

export const PKKPRDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const justSubmitted = Boolean((location.state as any)?.justSubmitted);
  const [showSuccessBanner, setShowSuccessBanner] = useState(justSubmitted);

  const userRole = (user?.role || '').toUpperCase().replace(/\s+/g, '_');
  const isAdmin = userRole.includes('ADMIN') || userRole.includes('SUPER');
  const isTimTeknis = userRole.includes('TEKNIS') || userRole.includes('SUPER');
  const isKabid = userRole.includes('KABID') || userRole.includes('SUPER');
  const isKadis = userRole.includes('KADIS') || userRole.includes('SUPER');
  const isPemohon = userRole.includes('PEMOHON') && !isAdmin && !isTimTeknis && !isKabid && !isKadis;

  const [detail, setDetail] = useState<PKKPRDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);


  // Modal / Form States
  const [showSpatialModal, setShowSpatialModal] = useState(false);
  const [showFPRModal, setShowFPRModal] = useState(false);
  const [showDraftSKModal, setShowDraftSKModal] = useState(false);
  const [showTTEModal, setShowTTEModal] = useState(false);

  // Form Inputs
  const [spatialForm, setSpatialForm] = useState({
    approved_land_area_m2: 0,
    approved_kdb_max: 60,
    approved_klb_max: 1.8,
    approved_kdh_min: 20,
    approved_gsb_min: 5,
    approved_max_floors: 3,
    spatial_zone_code: 'R-2',
    spatial_zone_name: 'Zona Perumahan Kepadatan Sedang'
  });

  const [fprForm, setFprForm] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    official_report_no: `BA-FPR/${new Date().getFullYear()}/001`,
    recommendation: 'DISETUJUI_SELURUHNYA' as const,
    ptp_bpn_number: 'PTP/BPN/2026/042',
    zoning_compliance_notes: 'Sesuai dengan ketentuan rencana tata ruang wilayah (RTRW) Kabupaten Bogor.',
    infrastructure_notes: 'Akses jalan utama memenuhi ROW minimal 8 meter.'
  });

  const [draftSKForm, setDraftSKForm] = useState({
    draft_sk_number: `503/PKKPR/DPMPTSP/${new Date().getFullYear()}/001`,
    kabid_notes: 'Draf SK telah diselaraskan dengan rekomendasi rapat pleno FPR.'
  });

  const [ttePin, setTtePin] = useState('123456');

  const loadDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await pkkprApi.getDetail(id);
      setDetail(data);
      setSpatialForm((prev) => ({
        ...prev,
        approved_land_area_m2: data.approved_land_area_m2 || data.proposed_land_area_m2
      }));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail permohonan PKKPR.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleClaimAdmin = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const updated = await pkkprApi.claimAdmin(id);
      setDetail(updated);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyAdmin = async (action: 'APPROVE' | 'REJECT') => {
    if (!id) return;
    try {
      setActionLoading(true);
      const updated = await pkkprApi.verifyAdmin(id, action);
      setDetail(updated);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimTechnical = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const updated = await pkkprApi.claimTechnical(id);
      setDetail(updated);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSpatial = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const updated = await pkkprApi.evaluateSpatial(id, spatialForm);
      setDetail(updated);
      setShowSpatialModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveFPR = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const updated = await pkkprApi.recordFPR(id, fprForm);
      setDetail(updated);
      setShowFPRModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDraftSK = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const updated = await pkkprApi.draftSK(id, draftSKForm);
      setDetail(updated);
      setShowDraftSKModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignTTE = async () => {
    if (!id || !detail) return;
    try {
      setActionLoading(true);
      const skNumber = detail.sk_draft?.draft_sk_number || `503/PKKPR/${new Date().getFullYear()}/${detail.submission_no.split('/').pop()}`;
      const updated = await pkkprApi.signKadisTTE(id, skNumber, ttePin);
      setDetail(updated);
      setShowTTEModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 max-w-4xl mx-auto">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-sm">Memuat berkas permohonan PKKPR...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center text-rose-600 max-w-4xl mx-auto">
        <p className="font-semibold">{error || 'Data permohonan tidak ditemukan.'}</p>
        <button onClick={() => navigate('/pkkpr')} className="mt-4 px-4 py-2 border rounded-md text-sm">
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner Notifikasi Pasca-Pendaftaran Berhasil */}
      {showSuccessBanner && (
        <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-lg border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-800 rounded-xl flex-shrink-0 text-xl shadow-inner">🎉</div>
            <div>
              <h3 className="font-bold text-base text-emerald-100 flex items-center gap-2">
                Pendaftaran Permohonan PKKPR Berhasil Diterima!
              </h3>
              <p className="text-xs text-emerald-200 mt-1 leading-relaxed">
                Nomor registrasi resmi Anda: <span className="font-mono font-bold text-white bg-emerald-800/90 px-2 py-0.5 rounded border border-emerald-600">{detail.submission_no}</span>. Berkas telah masuk ke antrean digital dinas Kabupaten Bogor (SLA 12 hari kerja).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <a
              href={pkkprApi.getReceiptUrl(detail.id)}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Cetak Lembar Tanda Terima (PDF)</span>
            </a>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="p-2 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800/60 text-xs transition-colors"
              title="Tutup pemberitahuan"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/pkkpr')}
            className="text-xs font-semibold text-gray-400 hover:text-emerald-700 flex items-center gap-1 mb-1 transition-colors"
          >
            ← Kembali ke Antrean PKKPR
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{detail.submission_no}</h1>
            <PKKPRStatusBadge status={detail.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Diajukan oleh <strong className="text-gray-700">{detail.applicant_name}</strong> pada{' '}
            {new Date(detail.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Action Buttons: Download SK & Receipt & Bridging to Site Plan */}
        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
          {/* Tanda Terima Registrasi Online (Bisa dicetak kapan pun oleh pemohon/petugas) */}
          <a
            href={pkkprApi.getReceiptUrl(detail.id)}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-xs shadow-sm flex items-center gap-2 transition-all"
            title="Cetak Bukti Tanda Terima Registrasi PKKPR Online (PDF)"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Tanda Terima (PDF)</span>
          </a>

          {/* Unduh SK Resmi PKKPR jika status DISETUJUI */}
          {detail.status === 'DISETUJUI' && (
            <a
              href={pkkprApi.getDownloadSKUrl(detail.id)}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95"
              title="Unduh Salinan Sah Surat Keputusan (SK) PKKPR Resmi Berformat PDF"
            >
              <Download className="w-4 h-4" />
              <span>Unduh SK PKKPR Resmi</span>
            </a>
          )}

          {/* Action Button Jembatan ke Site Plan jika SK sudah Terbit */}
          {detail.status === 'DISETUJUI' && (
            <button
              onClick={() => navigate('/pengajuan/tambah', { state: { preselected_pkkpr_id: detail.id, preselected_pkkpr_no: detail.sk_number } })}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <span>📐</span> Ajukan Site Plan
            </button>
          )}
        </div>
      </div>

      {/* Grid Informasi Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri & Tengah: Rincian Kegiatan & Lokasi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span>📍</span> Informasi Lokasi, Hak Tanah & Rencana Kegiatan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Kategori Permohonan</p>
                <p className="font-semibold text-gray-800 mt-0.5">
                  {detail.category === 'NON_BERUSAHA' ? 'Non-Berusaha' : 'Berusaha (Penilaian FPR)'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Kode KBLI Usaha</p>
                <p className="font-semibold text-gray-800 mt-0.5 font-mono">{detail.kbli_code || '-'}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400 uppercase font-medium">Uraian Pemanfaatan Ruang</p>
                <p className="text-gray-700 mt-0.5 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {detail.activity_description}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Desa / Kecamatan</p>
                <p className="font-semibold text-gray-800 mt-0.5">
                  {detail.location_village}, {detail.location_district}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Kota / Kabupaten</p>
                <p className="font-semibold text-gray-800 mt-0.5">{detail.location_city}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400 uppercase font-medium">Alamat Lengkap</p>
                <p className="text-gray-800 mt-0.5">{detail.location_address}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Status Hak Atas Tanah</p>
                <p className="font-semibold text-emerald-800 mt-0.5">
                  {detail.land_ownership_status || 'SHM'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Nomor Sertifikat / Bukti Hak</p>
                <p className="font-semibold text-gray-900 mt-0.5 font-mono">
                  {detail.certificate_number || '-'}
                </p>
              </div>

              {detail.certificate_owner && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 uppercase font-medium">Atas Nama Pemilik Sertifikat</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {detail.certificate_owner}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Luas Lahan Dimohon</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {detail.proposed_land_area_m2.toLocaleString('id-ID')} m²
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Luas Lahan Disetujui</p>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">
                  {detail.approved_land_area_m2 ? `${detail.approved_land_area_m2.toLocaleString('id-ID')} m²` : 'Menunggu Telaah Teknis'}
                </p>
              </div>
            </div>
          </div>

          {/* Parameter Amplop Ruang (Envelope of Limits) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span>📏</span> Batasan Parameter Ruang (Ketetapan SK PKKPR)
            </h2>

            {detail.approved_kdb_max ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <p className="text-xs text-indigo-700 font-semibold uppercase">KDB Maksimal</p>
                  <p className="text-xl font-bold text-indigo-900 mt-1">{detail.approved_kdb_max}%</p>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <p className="text-xs text-indigo-700 font-semibold uppercase">KLB Maksimal</p>
                  <p className="text-xl font-bold text-indigo-900 mt-1">{detail.approved_klb_max}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <p className="text-xs text-emerald-700 font-semibold uppercase">KDH Minimal</p>
                  <p className="text-xl font-bold text-emerald-900 mt-1">{detail.approved_kdh_min}%</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <p className="text-xs text-emerald-700 font-semibold uppercase">GSB Minimal</p>
                  <p className="text-xl font-bold text-emerald-900 mt-1">{detail.approved_gsb_min} m</p>
                </div>

                <div className="col-span-2 sm:col-span-4 p-3 bg-gray-50 border rounded-lg text-left text-xs text-gray-600 flex justify-between items-center">
                  <span>
                    <strong>Pola Ruang: </strong> {detail.spatial_zone_name || '-'} ({detail.spatial_zone_code || '-'})
                  </span>
                  <span>
                    <strong>Tinggi Lantai Maks: </strong> {detail.approved_max_floors ? `${detail.approved_max_floors} Lantai` : '-'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 text-gray-500 text-sm text-center rounded-lg">
                Parameter amplop ruang akan dirumuskan oleh Tim Teknis PUPR pada tahap Kajian Spasial.
              </div>
            )}
          </div>

          {/* Kuota Pemanfaatan Lahan Site Plan Bertahap (Perbup Bogor No. 4/2025) */}
          {detail.status === 'DISETUJUI' && (
            <div className="space-y-3">
              <PKKPRQuotaCard pkkprId={detail.id} />
            </div>
          )}

          {/* Riwayat Sidang Forum Penataan Ruang (FPR) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span>👥</span> Hasil Sidang Forum Penataan Ruang (FPR)
            </h2>

            {detail.fpr_reviews.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Belum ada risalah sidang komite FPR yang tercatat.</p>
            ) : (
              <div className="space-y-3">
                {detail.fpr_reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-purple-50/50 border border-purple-100 rounded-lg text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900">Berita Acara: {rev.official_report_no}</span>
                      <span className="px-2.5 py-0.5 bg-purple-200 text-purple-800 rounded text-xs font-semibold">
                        {rev.recommendation}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      <strong>Tanggal Sidang: </strong> {rev.meeting_date} | <strong>PTP BPN: </strong> {rev.ptp_bpn_number || '-'}
                    </p>
                    <p className="text-xs text-gray-700 bg-white p-2.5 rounded border border-purple-100">
                      <strong>Catatan Kesesuaian Tata Ruang: </strong> {rev.zoning_compliance_notes}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peta Poligon Lahan WGS84 */}
          {detail.geometry && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600" /> Batas Spasial Poligon Lahan
                </h2>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                  GeoJSON PostGIS (SRID 4326)
                </span>
              </div>

              <div className="h-72 w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner relative">
                <GISMapContainer
                  center={[-6.597, 106.800]}
                  zoom={14}
                  className="h-full w-full"
                >
                  <GeoJSON
                    data={detail.geometry as any}
                    style={{
                      color: '#059669',
                      weight: 3,
                      fillColor: '#10b981',
                      fillOpacity: 0.25
                    }}
                  />
                </GISMapContainer>
              </div>
            </div>
          )}

          {/* Dokumen Persyaratan & Terbitan Resmi Sistem */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> Dokumen & Output Pelayanan
              </span>
              <span className="text-xs text-gray-400 font-normal">Format Resmi PDF</span>
            </h2>

            {/* Dokumen Hasil Pelayanan Daring (Deliverables) */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
              <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-700" /> Dokumen Resmi Hasil Pelayanan Sistem:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Tanda Terima Pendaftaran */}
                <a
                  href={pkkprApi.getReceiptUrl(detail.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-white border border-emerald-200 hover:border-emerald-400 rounded-lg flex items-center justify-between hover:bg-emerald-50/40 transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="p-2 bg-emerald-100/60 rounded-lg text-emerald-800 group-hover:bg-emerald-200 transition-colors">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-950">Tanda Terima Pendaftaran</div>
                      <div className="text-[10px] text-gray-500 font-mono">Bukti Registrasi & Info SLA</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                </a>

                {/* 2. Surat Keputusan (SK) PKKPR Resmi */}
                {detail.status === 'DISETUJUI' ? (
                  <a
                    href={pkkprApi.getDownloadSKUrl(detail.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-white border border-emerald-300 hover:border-emerald-500 rounded-lg flex items-center justify-between hover:bg-emerald-50 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 bg-emerald-600 rounded-lg text-white group-hover:bg-emerald-700 transition-colors">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-950">Surat Keputusan (SK) PKKPR</div>
                        <div className="text-[10px] text-emerald-700 font-mono">{detail.sk_number}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 bg-slate-100/70 border border-dashed border-slate-300 rounded-lg flex items-center gap-2.5 text-slate-400">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-[11px] text-slate-600">Surat Keputusan (SK) PKKPR</div>
                      <div className="text-[10px]">Tersedia otomatis setelah persetujuan akhir Kepala Dinas</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dokumen Persyaratan yang Dilampirkan Pemohon */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-700 mb-2.5">Lampiran Berkas Pemohon:</p>
              {detail.files.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Belum ada dokumen persyaratan yang diunggah.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detail.files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-gray-800 truncate">
                            [{file.file_type}] {file.file_name}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {(file.file_size / 1024).toFixed(1)} KB • {file.mime_type}
                          </div>
                        </div>
                      </div>
                      <a
                        href={getFileUrl(file.file_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded transition-colors flex-shrink-0"
                        title="Buka / Unduh Dokumen"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Panel Tindakan Petugas Berdasarkan Tahapan & Role SoD */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>⚙️</span> Panel Otoritas Petugas
              </span>
              <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                Peran: {user?.role || 'Guest'}
              </span>
            </h2>

            {/* Tahap 1: Verifikasi Administrasi (Admin SIPAS) */}
            {detail.status === 'PENGAJUAN_BERKAS' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Berkas baru masuk. Silakan kunci berkas untuk memulai verifikasi formal.</p>
                {isAdmin ? (
                  <button
                    disabled={actionLoading}
                    onClick={handleClaimAdmin}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg shadow-sm"
                  >
                    🔒 Kunci Berkas Administrasi (Claim)
                  </button>
                ) : (
                  <RoleLockedNotice targetRole="Admin SIPAS" />
                )}
              </div>
            )}

            {detail.status === 'VERIFIKASI_ADMINISTRASI' && (
              <div className="space-y-2">
                <p className="text-xs text-amber-700 font-medium">
                  Sedang dalam peninjauan administrasi{detail.admin_lock_name ? ` oleh ${detail.admin_lock_name}` : ''}.
                </p>
                {isAdmin ? (
                  <div className="flex gap-2">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleVerifyAdmin('APPROVE')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                    >
                      ✓ Loloskan Formal
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleVerifyAdmin('REJECT')}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                    >
                      ✕ Tolak Berkas
                    </button>
                  </div>
                ) : (
                  <RoleLockedNotice targetRole="Admin SIPAS" />
                )}
              </div>
            )}

            {/* Tahap 2: Kajian Teknis Spasial (Tim Teknis PUPR) */}
            {detail.status === 'KAJIAN_TEKNIS_SPASIAL' && (
              <div className="space-y-2">
                <p className="text-xs text-indigo-700 font-medium">Tahap analisis spasial GIS oleh Tim Teknis PUPR.</p>
                {isTimTeknis ? (
                  !detail.technical_lock_id ? (
                    <button
                      disabled={actionLoading}
                      onClick={handleClaimTechnical}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm"
                    >
                      🔒 Kunci Berkas Teknis (Claim)
                    </button>
                  ) : (
                    <button
                      disabled={actionLoading}
                      onClick={() => setShowSpatialModal(true)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                    >
                      📐 Input Hasil Kajian Spasial & Parameter Ruang
                    </button>
                  )
                ) : (
                  <RoleLockedNotice targetRole="Tim Teknis PUPR" />
                )}
              </div>
            )}

            {/* Tahap 3: Sidang FPR */}
            {detail.status === 'SIDANG_FPR' && (
              <div className="space-y-2">
                <p className="text-xs text-purple-700 font-medium">Kajian spasial selesai. Berkas siap dibahas dalam Sidang Komite FPR.</p>
                {isTimTeknis || isKabid ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowFPRModal(true)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                  >
                    📝 Catat Notula Sidang & Rekomendasi FPR
                  </button>
                ) : (
                  <RoleLockedNotice targetRole="Tim Teknis / Sekretariat FPR" />
                )}
              </div>
            )}

            {/* Tahap 4: Formulasi Draf SK Kabid */}
            {detail.status === 'MENUNGGU_REKOMENDASI_KABID' && (
              <div className="space-y-2">
                <p className="text-xs text-cyan-800 font-medium">Rekomendasi FPR selesai. Kabid merumuskan draf SK.</p>
                {isKabid ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowDraftSKModal(true)}
                    className="w-full py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs rounded-lg shadow-sm"
                  >
                    ✍️ Rumuskan & Paraf Draf SK (Kabid)
                  </button>
                ) : (
                  <RoleLockedNotice targetRole="Kepala Bidang (Kabid)" />
                )}
              </div>
            )}

            {/* Tahap 5: Otorisasi TTE Kadis */}
            {detail.status === 'MENUNGGU_TTE_KADIS' && (
              <div className="space-y-2">
                <p className="text-xs text-yellow-800 font-medium">Draf SK telah diparaf Kabid. Menunggu TTE resmi Kadis DPMPTSP.</p>
                {isKadis ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowTTEModal(true)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md"
                  >
                    🔏 Tandatangani TTE BSrE (Kepala Dinas)
                  </button>
                ) : (
                  <RoleLockedNotice targetRole="Kepala Dinas (Kadis)" />
                )}
              </div>
            )}

            {detail.status === 'DISETUJUI' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 border-b border-emerald-200 pb-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-emerald-950">SK PKKPR Resmi Aktif</p>
                    <p className="text-[11px] text-emerald-700 font-mono">No: {detail.sk_number}</p>
                  </div>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 text-[11px] space-y-1">
                  <p><strong>Penerbit:</strong> Kepala DPMPTSP Kab. Bogor</p>
                  <p><strong>Otorisasi:</strong> TTE Digital BSrE BSSN</p>
                  <p className="truncate font-mono text-[10px] text-gray-500">Hash: {detail.qr_code_hash}</p>
                </div>

                <a
                  href={pkkprApi.getDownloadSKUrl(detail.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors block text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh SK Resmi (PDF)</span>
                </a>
              </div>
            )}

            {/* Info Status untuk Pemohon */}
            {isPemohon && detail.status !== 'DISETUJUI' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
                <div className="font-bold flex items-center gap-1 text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> Informasi Pemohon:
                </div>
                <p className="leading-relaxed">
                  Permohonan Anda saat ini berada dalam tahap{' '}
                  <strong className="text-emerald-700">{detail.status.replace(/_/g, ' ')}</strong>. Seluruh proses verifikasi dan telaah dilakukan secara berjenjang oleh dinas teknis terkait.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL KAJIAN SPASIAL */}
      {showSpatialModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">
              Kajian Spasial & Parameter Tata Ruang
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-medium mb-1">Luas Lahan Disetujui (m²)</label>
                <input
                  type="number"
                  value={spatialForm.approved_land_area_m2}
                  onChange={(e) => setSpatialForm({ ...spatialForm, approved_land_area_m2: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">KDB Maksimal (%)</label>
                <input
                  type="number"
                  value={spatialForm.approved_kdb_max}
                  onChange={(e) => setSpatialForm({ ...spatialForm, approved_kdb_max: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">KLB Maksimal</label>
                <input
                  type="number"
                  step="0.1"
                  value={spatialForm.approved_klb_max}
                  onChange={(e) => setSpatialForm({ ...spatialForm, approved_klb_max: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">KDH Minimal (%)</label>
                <input
                  type="number"
                  value={spatialForm.approved_kdh_min}
                  onChange={(e) => setSpatialForm({ ...spatialForm, approved_kdh_min: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">GSB Minimal (meter)</label>
                <input
                  type="number"
                  value={spatialForm.approved_gsb_min}
                  onChange={(e) => setSpatialForm({ ...spatialForm, approved_gsb_min: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-medium mb-1">Kode & Nama Zona RDTR</label>
                <input
                  type="text"
                  value={spatialForm.spatial_zone_name}
                  onChange={(e) => setSpatialForm({ ...spatialForm, spatial_zone_name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowSpatialModal(false)} className="px-4 py-2 border rounded text-xs">
                Batal
              </button>
              <button onClick={handleSaveSpatial} className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold">
                Simpan & Teruskan ke Sidang FPR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIDANG FPR */}
      {showFPRModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">
              Risalah & Notula Sidang Komite Forum Penataan Ruang (FPR)
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Nomor Berita Acara Rapat FPR</label>
                <input
                  type="text"
                  value={fprForm.official_report_no}
                  onChange={(e) => setFprForm({ ...fprForm, official_report_no: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Rekomendasi Akhir Sidang FPR</label>
                <select
                  value={fprForm.recommendation}
                  onChange={(e) => setFprForm({ ...fprForm, recommendation: e.target.value as any })}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="DISETUJUI_SELURUHNYA">Disetujui Seluruhnya</option>
                  <option value="DISETUJUI_SEBAGIAN">Disetujui Sebagian</option>
                  <option value="DITOLAK">Ditolak / Tidak Sesuai Tata Ruang</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Pertimbangan Teknis Pertanahan (PTP BPN)</label>
                <input
                  type="text"
                  value={fprForm.ptp_bpn_number}
                  onChange={(e) => setFprForm({ ...fprForm, ptp_bpn_number: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Catatan Kesesuaian Tata Ruang</label>
                <textarea
                  rows={3}
                  value={fprForm.zoning_compliance_notes}
                  onChange={(e) => setFprForm({ ...fprForm, zoning_compliance_notes: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowFPRModal(false)} className="px-4 py-2 border rounded text-xs">
                Batal
              </button>
              <button onClick={handleSaveFPR} className="px-4 py-2 bg-purple-600 text-white rounded text-xs font-semibold">
                Simpan Hasil Sidang FPR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DRAF SK KABID */}
      {showDraftSKModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">
              Perumusan Draf Surat Keputusan (Kabid)
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Nomor Draf SK PKKPR</label>
                <input
                  type="text"
                  value={draftSKForm.draft_sk_number}
                  onChange={(e) => setDraftSKForm({ ...draftSKForm, draft_sk_number: e.target.value })}
                  className="w-full p-2 border rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Catatan Tambahan Kabid</label>
                <textarea
                  rows={3}
                  value={draftSKForm.kabid_notes}
                  onChange={(e) => setDraftSKForm({ ...draftSKForm, kabid_notes: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowDraftSKModal(false)} className="px-4 py-2 border rounded text-xs">
                Batal
              </button>
              <button onClick={handleSaveDraftSK} className="px-4 py-2 bg-cyan-700 text-white rounded text-xs font-semibold">
                Paraf Draf & Kirim ke Kadis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TTE KADIS */}
      {showTTEModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">
              Otorisasi TTE BSrE Kepala Dinas
            </h3>
            <p className="text-xs text-gray-500">
              Masukkan PIN Passphrase sertifikat digital BSrE BSSN Anda untuk menandatangani SK PKKPR resmi.
            </p>
            <div>
              <label className="block text-xs font-medium mb-1">PIN Passphrase TTE</label>
              <input
                type="password"
                value={ttePin}
                onChange={(e) => setTtePin(e.target.value)}
                placeholder="******"
                className="w-full p-2 border rounded text-center tracking-widest text-lg font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowTTEModal(false)} className="px-3 py-1.5 border rounded text-xs">
                Batal
              </button>
              <button onClick={handleSignTTE} className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold shadow">
                Tandatangani SK Secara Sah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RoleLockedNotice: React.FC<{ targetRole: string }> = ({ targetRole }) => {
  return (
    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1 text-amber-900">
      <div className="font-semibold flex items-center gap-1.5 text-amber-950">
        <Lock className="w-3.5 h-3.5 text-amber-700" /> Wewenang Dibatasi
      </div>
      <p className="text-[11px] leading-relaxed text-amber-800">
        Tindakan pada tahapan ini khusus didelegasikan kepada peran <strong>{targetRole}</strong> sesuai prinsip Separation of Duties (SoD).
      </p>
    </div>
  );
};

