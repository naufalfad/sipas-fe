import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Download,
  MapPin,
  Lock,
  Loader2,
  Layers,
  FileCheck
} from 'lucide-react';
import { SubmissionService } from '../services/submission.service';
import { API_BASE_URL as SUB_API_BASE_URL } from '../services/submission.service';

export const SitePlanPublicVerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const id = searchParams.get('id') || undefined;
  const sk = searchParams.get('sk') || undefined;
  const hash = searchParams.get('hash') || undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (!id && !sk) {
      setError('Parameter identifikasi dokumen (ID Permohonan atau Nomor SK) tidak ditemukan.');
      setLoading(false);
      return;
    }

    const fetchVerification = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await SubmissionService.getPublicVerification({ id, sk, hash });
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Gagal memverifikasi keaslian naskah dinas SK Site Plan.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [id, sk, hash]);

  // Ekstrak base URL host dari SUB_API_BASE_URL (misal http://localhost:8000)
  const backendHost = SUB_API_BASE_URL.replace(/\/api\/v1\/submissions.*$/, '');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 selection:bg-emerald-600 selection:text-white font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Kop Resmi Instansi Dinas Pemkab Bogor */}
        <header className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl p-1 shadow-sm flex-shrink-0 flex items-center justify-center bg-slate-50 border border-slate-200">
              <img src="/logo_bogor.png" alt="Logo Kabupaten Bogor" className="w-full h-full object-contain" />
            </div>
            
            <div className="space-y-0.5 flex-grow">
              <p className="text-xs uppercase font-extrabold tracking-widest text-emerald-800">
                Pemerintah Kabupaten Bogor
              </p>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU (DPMPTSP)
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sistem Informasi Pelayanan Pengesahan Tata Ruang & Site Plan Digital (GEOSIPAS)
              </p>
              <p className="text-[11px] text-slate-400">
                Laman Resmi Verifikasi Naskah SK Site Plan • Sertifikasi BSrE - BSSN
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-emerald-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Komplek Pemda Jl. Tegar Beriman No. 1, Cibinong 16914</span>
            <span className="font-semibold text-emerald-800">Verifikasi Naskah Mandiri</span>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <Loader2 className="w-10 h-10 text-emerald-700 animate-spin mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Memeriksa Basis Data & Tanda Tangan Elektronik...</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sedang memvalidasi sertifikat kriptografi BSrE pada server Dinas Kabupaten Bogor
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto text-red-600 shadow-sm">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-red-950">Dokumen Tidak Ditemukan atau Tidak Sah</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {error}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
              >
                Kembali ke Beranda GEOSIPAS
              </button>
            </div>
          </div>
        )}

        {/* Success Verified Document Display */}
        {!loading && data && (
          <div className="space-y-6">
            
            {/* Kartu Status Utama (Badge Validasi) */}
            <div className={`rounded-2xl p-6 sm:p-7 border shadow-sm transition-all ${
              data.is_valid
                ? 'bg-emerald-50/80 border-emerald-300/90'
                : 'bg-amber-50/80 border-amber-300/90'
            }`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  data.is_valid
                    ? 'bg-emerald-700 text-white'
                    : 'bg-amber-600 text-white'
                }`}>
                  {data.is_valid ? <ShieldCheck className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
                </div>

                <div className="space-y-1.5 flex-grow">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white border border-emerald-200 text-emerald-800 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>{data.is_valid ? 'Status: Sah & Disetujui Resmi' : `Status: ${data.status}`}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {data.is_valid ? 'SURAT KEPUTUSAN (SK) SITE PLAN RESMI & SAH' : 'DOKUMEN DALAM PROSES PENELAAHAN'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                    Naskah Surat Keputusan Pengesahan Rencana Tapak (Site Plan) ini terdaftar resmi pada Sistem GEOSIPAS Kabupaten Bogor dengan nomor penetapan{' '}
                    <strong className="text-emerald-950 font-mono font-bold">{data.sk_number || data.submission_no}</strong> dan ditandatangani secara elektronik (TTE) tersertifikasi Balai Sertifikasi Elektronik (BSrE - BSSN).
                  </p>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Langsung Unduh SK Resmi PDF */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    Salinan Sah Surat Keputusan (SK) Pengesahan Site Plan
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dokumen resmi berformat PDF lengkap dengan Kop Lambang Daerah, tabel kaveling/PSU, dan barcode TTE.
                  </div>
                </div>
              </div>

              <a
                href={`${backendHost}${data.pdf_download_url}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Salinan Sah SK (PDF)</span>
              </a>
            </div>

            {/* Rincian Subjek Pemohon & Objek Lokasi */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" /> Rincian Keputusan & Subjek Pemohon
                </h3>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded">
                  ID: {data.id}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs sm:text-sm">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Nomor SK Penetapan Dinas
                  </span>
                  <span className="font-mono font-bold text-emerald-800 text-sm sm:text-base">
                    {data.sk_number || '-'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Nomor Registrasi Sistem
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {data.submission_no}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Tanggal Pengesahan SK
                  </span>
                  <span className="font-semibold text-slate-800">
                    {data.sk_issued_date || '-'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Nama Pemohon / Pengembang
                  </span>
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {data.applicant_name}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Nama Proyek / Perumahan
                  </span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    {data.housing_name || '-'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Jenis Pemohon & NIB
                  </span>
                  <span className="text-slate-700">
                    {data.applicant_type} • NIB: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-900 font-bold">{data.applicant_nib || '-'}</code>
                  </span>
                </div>

                <div className="md:col-span-2 pt-3 border-t border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Lokasi Bidang Tanah yang Disahkan
                  </span>
                  <span className="text-slate-800 font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    {data.location_address ? `${data.location_address}, ` : ''}
                    Desa/Kelurahan {data.location_village || '-'}, Kecamatan {data.location_district || '-'}, {data.location_city}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Luas Lahan Total yang Disahkan
                  </span>
                  <span className="font-black text-emerald-800 text-base">
                    {data.land_area ? data.land_area.toLocaleString('id-ID') : '0'} m²
                  </span>
                </div>
              </div>
            </div>

            {/* Matriks Ketentuan Teknis Tata Ruang (Spatial Envelope) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" /> Batas Intensitas & Parameter Teknis Rencana Tapak
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ketentuan intensitas pemanfaatan ruang yang disahkan dalam Surat Keputusan ini:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Maksimum KDB</span>
                  <span className="font-bold text-emerald-800 text-sm">
                    Maks {data.approved_kdb_max ?? 60}%
                  </span>
                  <span className="text-[11px] text-slate-500 block">Batas tapak terbangun</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Maksimum KLB</span>
                  <span className="font-bold text-emerald-800 text-sm">
                    Maks {data.approved_klb_max ?? 1.8}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Total luas lantai</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Minimum KDH</span>
                  <span className="font-bold text-emerald-800 text-sm">
                    Min {data.approved_kdh_min ?? 20}%
                  </span>
                  <span className="text-[11px] text-slate-500 block">Resapan hijau terbuka</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Minimum GSB</span>
                  <span className="font-bold text-emerald-800 text-sm">
                    Min {data.approved_gsb_min ?? 5.0} Meter
                  </span>
                  <span className="text-[11px] text-slate-500 block">Sempadan as jalan</span>
                </div>
              </div>
            </div>

            {/* Blok Keaslian TTE Sertifikasi BSrE - BSSN */}
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-800 rounded-xl text-white shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Sertifikasi Tanda Tangan Elektronik (TTE) BSrE - BSSN
                  </h4>
                  <p className="text-xs text-emerald-800 font-medium">
                    Dokumen ini sah dan terjamin integritasnya secara kriptografis terhadap perubahan naskah.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">Pejabat Penandatangan:</span>
                  <div className="font-bold text-slate-900 text-sm">{data.signer_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">NIP. {data.signer_nip}</div>
                  <div className="text-[11px] text-emerald-900 font-medium leading-relaxed">{data.signer_title}</div>
                </div>

                <div className="space-y-1 sm:border-l sm:border-emerald-200 sm:pl-4">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">Otoritas Sertifikasi Induk:</span>
                  <div className="font-bold text-slate-900">{data.certification_authority}</div>
                  
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold pt-1">Kode Hash Integritas Dokumen (SHA-256):</span>
                  <code className="text-[10px] text-emerald-900 font-mono break-all block bg-white p-2 rounded-lg border border-emerald-300 shadow-inner">
                    {data.qr_code_hash || 'SHA256:SITEPLAN-BSRE-TEGAR-BERIMAN'}
                  </code>
                  
                  <div className="text-[11px] text-slate-500 pt-1">
                    Waktu Verifikasi Sistem: <strong className="text-slate-800">{data.verified_at}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Keterangan Hukum */}
            <footer className="text-center text-xs text-slate-500 space-y-1.5 pt-4 border-t border-slate-200">
              <p>
                Dokumen ini merupakan salinan sah elektronik berdasarkan UU No. 11/2008 jo UU No. 1/2024 tentang ITE, 
                UU No. 6/2023 tentang Cipta Kerja, UU No. 1/2011, dan Perbup Bogor No. 4/2025.
              </p>
              <p className="text-[11px] text-slate-400">
                Pemerintah Kabupaten Bogor • DPMPTSP • Sistem Informasi GEOSIPAS
              </p>
            </footer>

          </div>
        )}
      </div>
    </div>
  );
};
