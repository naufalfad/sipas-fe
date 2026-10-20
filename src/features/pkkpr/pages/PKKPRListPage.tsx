import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pkkprApi } from '../api/pkkprApi';
import type { PKKPRListItem } from '../types/pkkpr.types';
import { PKKPRStatusBadge } from '../components/PKKPRStatusBadge';

export const PKKPRListPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<PKKPRListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pkkprApi.list(statusFilter || undefined);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar permohonan PKKPR.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      item.submission_no.toLowerCase().includes(search.toLowerCase()) ||
      (item.sk_number && item.sk_number.toLowerCase().includes(search.toLowerCase())) ||
      item.location_village.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalCount = items.length;
  const approvedCount = items.filter((i) => i.status === 'DISETUJUI').length;
  const inProgressCount = items.filter((i) => !['DISETUJUI', 'DITOLAK', 'DRAFT'].includes(i.status)).length;
  const rejectedCount = items.filter((i) => i.status === 'DITOLAK').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Aksi */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg text-lg">🏛️</span>
            Pelayanan PKKPR Kabupaten Bogor
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (Prasyarat Utama Pengesahan Site Plan & PBG)
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={() => navigate('/pkkpr/create')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            <span className="mr-2 text-base">+</span> Buat Pengajuan PKKPR Baru
          </button>
        </div>
      </div>

      {/* Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Permohonan</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
            Σ
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sedang Diproses Dinas</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
            ⏳
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">SK Terbit (Disetujui)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            ✓
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Perlu Perbaikan / Ditolak</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{rejectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
            ✕
          </div>
        </div>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-96 relative">
          <input
            type="text"
            placeholder="Cari nama pemohon, no registrasi, lokasi desa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="">Semua Status Berkas</option>
            <option value="PENGAJUAN_BERKAS">Pengajuan Berkas</option>
            <option value="VERIFIKASI_ADMINISTRASI">Verifikasi Administrasi</option>
            <option value="KAJIAN_TEKNIS_SPASIAL">Kajian Spasial PUPR</option>
            <option value="SIDANG_FPR">Sidang FPR</option>
            <option value="MENUNGGU_REKOMENDASI_KABID">Draf SK Kabid</option>
            <option value="MENUNGGU_TTE_KADIS">Menunggu TTE Kadis</option>
            <option value="DISETUJUI">SK Terbit (Disetujui)</option>
            <option value="DITOLAK">Ditolak / Revisi</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh Data"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Tabel Data Permohonan */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3" />
            <p className="text-sm font-medium">Memuat data permohonan PKKPR...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <p className="font-medium">{error}</p>
            <button onClick={loadData} className="mt-3 text-sm text-emerald-600 underline">
              Coba Muat Ulang
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-base font-semibold text-gray-700">Tidak ada permohonan PKKPR yang ditemukan.</p>
            <p className="text-sm text-gray-400 mt-1">Silakan sesuaikan kata kunci pencarian atau buat pengajuan baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">No. Registrasi & Tanggal</th>
                  <th className="px-6 py-3.5">Pemohon & Kategori</th>
                  <th className="px-6 py-3.5">Lokasi & Luas Tanah</th>
                  <th className="px-6 py-3.5">Status Permohonan</th>
                  <th className="px-6 py-3.5">Petugas Pengunci</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.submission_no}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      {item.sk_number && (
                        <div className="text-xs font-mono text-emerald-700 mt-1 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                          SK: {item.sk_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.applicant_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.category === 'NON_BERUSAHA' ? 'Non-Berusaha (Sosial/Pribadi)' : 'Berusaha (Penilaian FPR)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {item.location_village}, {item.location_district}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.proposed_land_area_m2.toLocaleString('id-ID')} m²
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PKKPRStatusBadge status={item.status} />
                      <div className="text-xs text-gray-400 mt-1">SLA: Hari ke-{item.elapsed_days}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {item.admin_lock_name ? (
                        <div className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
                          Admin: {item.admin_lock_name}
                        </div>
                      ) : item.technical_lock_name ? (
                        <div className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                          Teknis: {item.technical_lock_name}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Terbuka (Belum Dikunci)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/pkkpr/${item.id}`)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Lihat Berkas →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
