import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pkkprApi } from '../api/pkkprApi';
import type { PKKPRDetail } from '../types/pkkpr.types';
import { PKKPRStatusBadge } from '../components/PKKPRStatusBadge';

export const PKKPRDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/pkkpr')}
            className="text-xs font-semibold text-gray-400 hover:text-emerald-700 flex items-center gap-1 mb-1"
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

        {/* Action Button Jembatan ke Site Plan jika SK sudah Terbit */}
        {detail.status === 'DISETUJUI' && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => navigate('/submissions/create', { state: { preselected_pkkpr_id: detail.id } })}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <span>📐</span> Ajukan Pengesahan Site Plan
            </button>
            <span className="text-xs text-emerald-800 font-mono">
              SK Terbit: {detail.sk_number}
            </span>
          </div>
        )}
      </div>

      {/* Grid Informasi Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri & Tengah: Rincian Kegiatan & Lokasi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span>📍</span> Informasi Lokasi & Rencana Kegiatan
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
        </div>

        {/* Kolom Kanan: Panel Tindakan Petugas Berdasarkan Tahapan */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span>⚙️</span> Panel Otoritas Petugas
            </h2>

            {/* Tahap 1: Verifikasi Administrasi (Admin) */}
            {detail.status === 'PENGAJUAN_BERKAS' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Berkas baru masuk. Silakan kunci berkas untuk memulai verifikasi formal.</p>
                <button
                  disabled={actionLoading}
                  onClick={handleClaimAdmin}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg shadow-sm"
                >
                  🔒 Kunci Berkas Administrasi (Claim)
                </button>
              </div>
            )}

            {detail.status === 'VERIFIKASI_ADMINISTRASI' && (
              <div className="space-y-2">
                <p className="text-xs text-amber-700 font-medium">Sedang dalam peninjauan administrasi.</p>
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
              </div>
            )}

            {/* Tahap 2: Kajian Teknis Spasial (Tim Teknis PUPR) */}
            {detail.status === 'KAJIAN_TEKNIS_SPASIAL' && (
              <div className="space-y-2">
                <p className="text-xs text-indigo-700 font-medium">Tahap analisis spasial GIS oleh Tim Teknis PUPR.</p>
                {!detail.technical_lock_id ? (
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
                )}
              </div>
            )}

            {/* Tahap 3: Sidang FPR */}
            {detail.status === 'SIDANG_FPR' && (
              <div className="space-y-2">
                <p className="text-xs text-purple-700 font-medium">Kajian spasial selesai. Berkas siap dibahas dalam Sidang Komite FPR.</p>
                <button
                  disabled={actionLoading}
                  onClick={() => setShowFPRModal(true)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                >
                  📝 Catat Notula Sidang & Rekomendasi FPR
                </button>
              </div>
            )}

            {/* Tahap 4: Formulasi Draf SK Kabid */}
            {detail.status === 'MENUNGGU_REKOMENDASI_KABID' && (
              <div className="space-y-2">
                <p className="text-xs text-cyan-800 font-medium">Rekomendasi FPR selesai. Kabid merumuskan draf SK.</p>
                <button
                  disabled={actionLoading}
                  onClick={() => setShowDraftSKModal(true)}
                  className="w-full py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs rounded-lg shadow-sm"
                >
                  ✍️ Rumuskan & Paraf Draf SK (Kabid)
                </button>
              </div>
            )}

            {/* Tahap 5: Otorisasi TTE Kadis */}
            {detail.status === 'MENUNGGU_TTE_KADIS' && (
              <div className="space-y-2">
                <p className="text-xs text-yellow-800 font-medium">Draf SK telah diparaf Kabid. Menunggu TTE resmi Kadis DPMPTSP.</p>
                <button
                  disabled={actionLoading}
                  onClick={() => setShowTTEModal(true)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md"
                >
                  🔏 Tandatangani TTE BSrE (Kepala Dinas)
                </button>
              </div>
            )}

            {detail.status === 'DISETUJUI' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>✓</span> SK PKKPR Resmi Aktif
                </p>
                <p>Nomor: {detail.sk_number}</p>
                <p>QR Integritas: {detail.qr_code_hash?.substring(0, 16)}...</p>
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
