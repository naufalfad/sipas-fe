import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  FileText,
  MapPin,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  FileCheck,
  Search,
  Compass,
  ShieldCheck,
  Info,
  Loader2,
  Upload,
  ExternalLink
} from 'lucide-react';
// @ts-ignore
import * as turf from '@turf/turf';
import { toast } from 'sonner';

import { API_BASE_URL } from '@/config';

import { pkkprApi } from '../api/pkkprApi';
import type { SubmitPKKPRPayload, PKKPRCategory, KBLIItem } from '../types/pkkpr.types';
import { useAuthStore } from '@/app/store/useAuthStore';
import GISMapContainer from '@/components/maps/GISMapContainer';
import GISDrawingMap from '@/components/maps/GISDrawingMap';
import bogorRegions from '@/features/submission/data/bogorRegions.json';
import rawKbliList from '../data/kbli2020.json';

const kbliList = rawKbliList as KBLIItem[];

interface UploadedDocState {
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  file_type: string;
}

const getFileUrl = (filePath: string, fileUrl?: string) => {
  if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
    return fileUrl;
  }
  if (!filePath) return '#';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const cleanPath = filePath.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanPath}`;
};

export const PKKPRCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<SubmitPKKPRPayload>({
    applicant_type: 'BADAN_USAHA',
    applicant_name: user?.company || user?.full_name || '',
    applicant_nik: '',
    applicant_nib: '',
    applicant_npwp: '',
    applicant_phone: user?.phone || '',
    applicant_email: user?.email || '',
    category: 'BERUSAHA_PENILAIAN',
    activity_description: '',
    kbli_code: '68111',
    location_address: '',
    location_village: 'Cijujung',
    location_district: 'Sukaraja',
    location_city: 'Kabupaten Bogor',
    land_ownership_status: 'SHM',
    certificate_number: '',
    certificate_owner: '',
    proposed_land_area_m2: 10000,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [106.827153, -6.597147],
          [106.828153, -6.597147],
          [106.828153, -6.598147],
          [106.827153, -6.598147],
          [106.827153, -6.597147]
        ]
      ]
    }
  });

  // State Dokumen Persyaratan
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDocState>>({});
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  // State Integritas
  const [agreementChecked, setAgreementChecked] = useState(false);

  // KBLI Search State
  const [kbliSearch, setKbliSearch] = useState('');
  const [isKbliOpen, setIsKbliOpen] = useState(false);
  const selectedKbli = useMemo(() => {
    return kbliList.find((k) => k.code === formData.kbli_code) || null;
  }, [formData.kbli_code]);

  const filteredKbli = useMemo(() => {
    if (!kbliSearch.trim()) return kbliList.slice(0, 15);
    const q = kbliSearch.toLowerCase();
    return kbliList.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [kbliSearch]);

  // Flattened Villages List for Reverse Auto-fill (Desa -> Kecamatan -> Kab. Bogor)
  const flatVillages = useMemo(() => {
    const list: Array<{
      desa_id: string;
      desa_nama: string;
      desa_status: string;
      kecamatan_id: string;
      kecamatan_nama: string;
      display_label: string;
    }> = [];

    bogorRegions.forEach((kec: any) => {
      kec.desa_kelurahan.forEach((des: any) => {
        list.push({
          desa_id: des.id_desa_kelurahan,
          desa_nama: des.nama,
          desa_status: des.status,
          kecamatan_id: kec.id_kecamatan,
          kecamatan_nama: kec.nama_kecamatan,
          display_label: `${des.nama} (Kec. ${kec.nama_kecamatan}) [${des.status}]`
        });
      });
    });

    return list;
  }, []);

  const [villageSearch, setVillageSearch] = useState(
    formData.location_village ? `${formData.location_village} (Kec. ${formData.location_district})` : ''
  );
  const [isVillageOpen, setIsVillageOpen] = useState(false);

  const filteredVillages = useMemo(() => {
    if (!villageSearch.trim()) return [];
    const q = villageSearch.toLowerCase();
    return flatVillages
      .filter(
        (v) =>
          v.desa_nama.toLowerCase().includes(q) ||
          v.kecamatan_nama.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [villageSearch, flatVillages]);

  // District list for top-down selection
  const districts = useMemo(() => {
    return bogorRegions.map((k: any) => k.nama_kecamatan).sort();
  }, []);

  // Handle Field Updates
  const handleInputChange = (field: keyof SubmitPKKPRPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle Reverse Village Selection
  const handleSelectVillage = (v: (typeof flatVillages)[0]) => {
    setFormData((prev) => ({
      ...prev,
      location_village: v.desa_nama,
      location_district: v.kecamatan_nama,
      location_city: 'Kabupaten Bogor'
    }));
    setVillageSearch(`${v.desa_nama} (Kec. ${v.kecamatan_nama})`);
    setIsVillageOpen(false);
  };

  // Handle GeoJSON File Upload
  const handleGeoJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let polyGeom: any = null;
        if (parsed.type === 'FeatureCollection' && parsed.features?.length > 0) {
          const polyFeature = parsed.features.find(
            (f: any) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
          );
          if (polyFeature) polyGeom = polyFeature.geometry;
        } else if (parsed.type === 'Feature' && parsed.geometry) {
          polyGeom = parsed.geometry;
        } else if (parsed.type === 'Polygon' || parsed.type === 'MultiPolygon') {
          polyGeom = parsed;
        }

        if (!polyGeom || !polyGeom.coordinates) {
          toast.error('File GeoJSON tidak memuat poligon koordinat yang valid.');
          return;
        }

        let polygonForTurf = polyGeom;
        if (polyGeom.type === 'MultiPolygon') {
          polygonForTurf = {
            type: 'Polygon',
            coordinates: polyGeom.coordinates[0]
          };
        }

        let areaM2 = 0;
        try {
          areaM2 = Math.round(turf.area(polygonForTurf));
        } catch (err) {
          console.warn('Gagal menghitung luas turf:', err);
        }

        setFormData((prev) => ({
          ...prev,
          geometry: polygonForTurf,
          proposed_land_area_m2: areaM2 > 0 ? areaM2 : prev.proposed_land_area_m2
        }));

        toast.success(
          `Poligon spasial berhasil dimuat! Luas terhitung: ${areaM2.toLocaleString('id-ID')} m²`
        );
      } catch (err: any) {
        toast.error('Gagal membaca file GeoJSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Handle Document Upload
  const handleDocumentUpload = async (file: File, docType: string) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Ukuran file maksimal adalah 25MB.');
      return;
    }

    try {
      setUploadingDocType(docType);
      const result = await pkkprApi.uploadFile(file, docType);
      setUploadedDocs((prev) => ({
        ...prev,
        [docType]: result
      }));
      toast.success(`Berkas ${file.name} berhasil diunggah.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah berkas.');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleRemoveDoc = (docType: string) => {
    setUploadedDocs((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
    toast.info('Dokumen dihapus dari lampiran.');
  };

  // Validasi Step Sebelum Lanjut
  const handleNextStep = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!formData.applicant_name.trim()) {
        setErrorMessage('Nama pemohon / badan usaha wajib diisi.');
        return;
      }
      if (formData.applicant_type === 'BADAN_USAHA' && !formData.applicant_nib) {
        setErrorMessage('NIB (Nomor Induk Berusaha) wajib diisi untuk Badan Usaha.');
        return;
      }
      if (!formData.applicant_phone) {
        setErrorMessage('Nomor telepon / WhatsApp aktif wajib diisi.');
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.activity_description.trim()) {
        setErrorMessage('Deskripsi rencana pemanfaatan ruang wajib diisi secara jelas.');
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.location_address.trim()) {
        setErrorMessage('Alamat lokasi bidang tanah wajib diisi.');
        return;
      }
      if (!formData.location_village || !formData.location_district) {
        setErrorMessage('Desa/Kelurahan dan Kecamatan di Kabupaten Bogor wajib ditentukan.');
        return;
      }
      if (!formData.certificate_number) {
        setErrorMessage('Nomor sertifikat atau bukti kepemilikan tanah wajib diisi.');
        return;
      }
      if (formData.proposed_land_area_m2 <= 0) {
        setErrorMessage('Luas bidang tanah harus lebih besar dari 0 m².');
        return;
      }
      if (!formData.geometry?.coordinates?.length) {
        setErrorMessage('Batas poligon koordinat lahan wajib digambar atau di-upload.');
        return;
      }
    }

    if (currentStep === 4) {
      if (!uploadedDocs['KTP']) {
        setErrorMessage('Dokumen KTP Pemohon / Penanggung Jawab wajib diunggah.');
        return;
      }
      if (!uploadedDocs['BUKTI_HAK_TANAH']) {
        setErrorMessage('Dokumen Bukti Kepemilikan Hak Atas Tanah (SHM/HGB/dsb.) wajib diunggah.');
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  // Submit Final
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (!agreementChecked) {
        throw new Error('Anda wajib menyetujui pernyataan integritas dan kebenaran data tata ruang.');
      }

      // Convert uploaded documents to payload array
      const filesPayload = Object.values(uploadedDocs).map((doc) => ({
        file_type: doc.file_type,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
        mime_type: doc.mime_type
      }));

      const finalPayload: SubmitPKKPRPayload = {
        ...formData,
        files: filesPayload
      };

      const res = await pkkprApi.submit(finalPayload);
      toast.success(`Permohonan PKKPR ${res.submission_no} berhasil didaftarkan!`);
      navigate(`/pkkpr/${res.id}`, { state: { justSubmitted: true } });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirimkan permohonan PKKPR.');
      toast.error(err.message || 'Terjadi kesalahan pengiriman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { step: 1, label: 'Identitas Pemohon', icon: User },
    { step: 2, label: 'Rencana Ruang', icon: Compass },
    { step: 3, label: 'Lokasi & Spasial', icon: MapPin },
    { step: 4, label: 'Unggah Dokumen', icon: UploadCloud },
    { step: 5, label: 'Konfirmasi', icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <button
            onClick={() => navigate('/pkkpr')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar PKKPR
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Formulir Permohonan PKKPR Digital
          </h1>
          <p className="text-sm text-gray-500">
            Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang — Dinas Perumahan, Kawasan Permukiman dan Pertanahan Kabupaten Bogor
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Sesuai Perbup No. 4/2025
          </span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;

            return (
              <React.Fragment key={item.step}>
                <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? '✓' : <Icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider hidden sm:block">
                      Tahap {item.step}
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        isActive ? 'text-gray-900 font-bold' : isCompleted ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {item.label}
                    </div>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 hidden md:block transition-colors ${
                      currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Periksa kelengkapan isian:</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* ─── TAHAP 1: IDENTITAS PEMOHON ────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" /> Tahap 1: Data Identitas Pemohon
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pilih tipe pemohon dan lengkapi data legalitas identitas sesuai NIB / KTP.
            </p>
          </div>

          {/* Tipe Pemohon Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Tipe Pemohon *</label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => handleInputChange('applicant_type', 'BADAN_USAHA')}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-semibold transition-all ${
                  formData.applicant_type === 'BADAN_USAHA'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Badan Usaha (PT / CV)</span>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('applicant_type', 'PERORANGAN')}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-semibold transition-all ${
                  formData.applicant_type === 'PERORANGAN'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>Perorangan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {formData.applicant_type === 'BADAN_USAHA'
                  ? 'Nama Perusahaan / Badan Usaha *'
                  : 'Nama Lengkap Pemohon (Sesuai KTP) *'}
              </label>
              <input
                type="text"
                value={formData.applicant_name}
                onChange={(e) => handleInputChange('applicant_name', e.target.value)}
                placeholder={
                  formData.applicant_type === 'BADAN_USAHA'
                    ? 'Contoh: PT. Sentosa Mandiri Properti'
                    : 'Contoh: Ahmad Hidayat'
                }
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {formData.applicant_type === 'BADAN_USAHA' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nomor Induk Berusaha (NIB) *
                </label>
                <input
                  type="text"
                  maxLength={13}
                  value={formData.applicant_nib || ''}
                  onChange={(e) => handleInputChange('applicant_nib', e.target.value)}
                  placeholder="13 digit angka NIB OSS RBA"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {formData.applicant_type === 'BADAN_USAHA'
                  ? 'NIK Penanggung Jawab / Direksi'
                  : 'NIK Pemohon (16 Digit) *'}
              </label>
              <input
                type="text"
                maxLength={16}
                value={formData.applicant_nik || ''}
                onChange={(e) => handleInputChange('applicant_nik', e.target.value)}
                placeholder="16 digit NIK tertera di KTP"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {formData.applicant_type === 'BADAN_USAHA' ? 'NPWP Perusahaan' : 'NPWP Pribadi (Opsional)'}
              </label>
              <input
                type="text"
                value={formData.applicant_npwp || ''}
                onChange={(e) => handleInputChange('applicant_npwp', e.target.value)}
                placeholder="00.000.000.0-000.000"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nomor WhatsApp / Telepon Aktif *
              </label>
              <input
                type="text"
                value={formData.applicant_phone || ''}
                onChange={(e) => handleInputChange('applicant_phone', e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alamat Email Korespondensi *
              </label>
              <input
                type="email"
                value={formData.applicant_email || ''}
                onChange={(e) => handleInputChange('applicant_email', e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAHAP 2: RENCANA PEMANFAATAN RUANG ─────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600" /> Tahap 2: Rencana Pemanfaatan Ruang
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tentukan klasifikasi baku lapangan usaha (KBLI 2020) dan deskripsikan rencana kegiatan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Pengajuan *</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as PKKPRCategory)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="BERUSAHA_PENILAIAN">Berusaha (Penilaian Komprehensif Dinas / FPR)</option>
                <option value="NON_BERUSAHA">Non-Berusaha (Rumah Tinggal Pribadi / Fasilitas Sosial)</option>
              </select>
            </div>

            {/* KBLI Combobox Search */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kode KBLI 2020 (Pencarian Otomatis) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik kode atau kata kunci (contoh: 68111, Perumahan, Hotel)..."
                  value={kbliSearch || (selectedKbli ? `${selectedKbli.code} - ${selectedKbli.name}` : '')}
                  onChange={(e) => {
                    setKbliSearch(e.target.value);
                    setIsKbliOpen(true);
                  }}
                  onFocus={() => setIsKbliOpen(true)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>

              {isKbliOpen && (
                <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {filteredKbli.length === 0 ? (
                    <div className="p-3 text-xs text-gray-500 text-center">KBLI tidak ditemukan.</div>
                  ) : (
                    filteredKbli.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          handleInputChange('kbli_code', item.code);
                          setKbliSearch(`${item.code} - ${item.name}`);
                          setIsKbliOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 text-xs border-b border-gray-50 flex flex-col gap-0.5 transition-colors"
                      >
                        <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                          <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
                            {item.code}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[11px] text-gray-500">{item.category}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KBLI Description Card */}
          {selectedKbli && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-700" /> Lingkup Kegiatan KBLI {selectedKbli.code}:
              </div>
              <p className="text-emerald-900 leading-relaxed">{selectedKbli.description}</p>
            </div>
          )}

          {/* Activity Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Deskripsi Lengkap Kegiatan Pemanfaatan Ruang *
            </label>
            <textarea
              rows={4}
              value={formData.activity_description}
              onChange={(e) => handleInputChange('activity_description', e.target.value)}
              placeholder="Contoh: Rencana pembangunan perumahan komersial terpadu sebanyak 180 unit rumah tinggal tipe 36 dan 45, dilengkapi dengan fasilitas jalan lingkungan lebar 8 meter, saluran drainase terintegrasi, taman bermain seluas 500 m², dan sarana ibadah."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Jelaskan jenis peruntukan, perkiraan kapasitas unit/bangunan, dan sarana prasarana yang akan dibangun.
            </p>
          </div>
        </div>
      )}

      {/* ─── TAHAP 3: LOKASI & BATAS SPASIAL ───────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Tahap 3: Lokasi, Legalitas Tanah, & Batas Spasial
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tentukan lokasi (Desa auto-fill Kabupaten Bogor), nomor sertifikat kepemilikan, dan gambar poligon batas lahan.
            </p>
          </div>

          {/* Reverse Auto-fill Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" /> Wilayah Administrasi Kabupaten Bogor
              </span>
              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-100/60 px-2 py-0.5 rounded">
                Bottom-Up Auto Fill Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Desa Search with Reverse Auto-fill */}
              <div className="sm:col-span-2 relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ketik / Pilih Desa atau Kelurahan *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={villageSearch}
                    placeholder="Ketik nama Desa... (misal: Pabuaran, Sentul, Cijujung)"
                    onChange={(e) => {
                      setVillageSearch(e.target.value);
                      setIsVillageOpen(true);
                    }}
                    onFocus={() => setIsVillageOpen(true)}
                    className="w-full pl-9 pr-3.5 py-2.5 border border-emerald-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                </div>

                {isVillageOpen && filteredVillages.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    {filteredVillages.map((v) => (
                      <button
                        key={`${v.kecamatan_id}-${v.desa_id}`}
                        type="button"
                        onClick={() => handleSelectVillage(v)}
                        className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-xs border-b border-gray-50 flex items-center justify-between"
                      >
                        <span className="font-semibold text-gray-800">{v.desa_nama}</span>
                        <span className="text-gray-500 text-[11px]">
                          Kec. {v.kecamatan_nama} ({v.desa_status})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Kecamatan Dropdown (Terkait) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kecamatan *</label>
                <select
                  value={formData.location_district}
                  onChange={(e) => {
                    handleInputChange('location_district', e.target.value);
                    handleInputChange('location_village', '');
                    setVillageSearch('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Pilih Kecamatan --</option>
                  {districts.map((d: string) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Readonly Badges Kab & Prov */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-600">
              <span className="text-gray-400">Hierarki Wilayah:</span>
              <span className="bg-white border px-2 py-0.5 rounded font-medium text-gray-700">
                Provinsi: <strong>Jawa Barat</strong>
              </span>
              <span className="text-gray-300">→</span>
              <span className="bg-white border px-2 py-0.5 rounded font-medium text-gray-700">
                Kabupaten: <strong>{formData.location_city}</strong>
              </span>
              <span className="text-gray-300">→</span>
              <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium text-emerald-900">
                Kec. {formData.location_district || '...'}
              </span>
              <span className="text-gray-300">→</span>
              <span className="bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-semibold text-emerald-950">
                Desa {formData.location_village || '...'}
              </span>
            </div>

            {/* Alamat Jalan Lengkap */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alamat Lengkap / Jalan / RT / RW *
              </label>
              <input
                type="text"
                value={formData.location_address}
                onChange={(e) => handleInputChange('location_address', e.target.value)}
                placeholder="Contoh: Jl. Raya Sukaraja No. 45 RT 02 / RW 04, Dusun Karang Asem"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Legalitas Kepemilikan Hak Atas Tanah */}
          <div className="border border-gray-200 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" /> Legalitas Kepemilikan Hak Atas Tanah
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status Hak Tanah *
                </label>
                <select
                  value={formData.land_ownership_status || 'SHM'}
                  onChange={(e) => handleInputChange('land_ownership_status', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="SHM">Sertifikat Hak Milik (SHM)</option>
                  <option value="HGB">Sertifikat Hak Guna Bangunan (HGB)</option>
                  <option value="HAK_PAKAI">Hak Pakai</option>
                  <option value="GIRIK_LETTER_C">Girik / Letter C / Adat</option>
                  <option value="LAINNYA">Lainnya / Perjanjian Kerjasama</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nomor Sertifikat / Bukti Tanah *
                </label>
                <input
                  type="text"
                  value={formData.certificate_number || ''}
                  onChange={(e) => handleInputChange('certificate_number', e.target.value)}
                  placeholder="Contoh: SHM No. 04821/Cijujung"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Pemegang Hak / Pemilik
                </label>
                <input
                  type="text"
                  value={formData.certificate_owner || ''}
                  onChange={(e) => handleInputChange('certificate_owner', e.target.value)}
                  placeholder="Sesuai nama di buku tanah"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Interactive GIS Drawing Map & Auto Area */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-600" /> Peta Spasial Batas Bidang Lahan (Polygon)
                </label>
                <p className="text-[11px] text-gray-500">
                  Gunakan alat poligon di peta untuk menggambar bidang, atau unggah file GeoJSON (.json/.geojson).
                </p>
              </div>

              {/* GeoJSON File Upload Button */}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:border-emerald-600 rounded-lg text-xs font-semibold text-gray-700 shadow-sm transition-all">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upload File GeoJSON</span>
                  <input
                    type="file"
                    accept=".json,.geojson"
                    onChange={handleGeoJsonFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Map Container */}
            <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-300 shadow-inner relative">
              <GISMapContainer
                center={[-6.597, 106.800]}
                zoom={13}
                className="h-full w-full"
              >
                <GISDrawingMap
                  onShapeChange={(coords) => {
                    if (coords && coords.length > 0 && coords[0].length >= 3) {
                      const ring = coords[0];
                      const closedRing = [...ring];
                      if (
                        ring[0][0] !== ring[ring.length - 1][0] ||
                        ring[0][1] !== ring[ring.length - 1][1]
                      ) {
                        closedRing.push(ring[0]);
                      }
                      const polyGeoJson = {
                        type: 'Polygon',
                        coordinates: [closedRing]
                      };
                      try {
                        const areaM2 = Math.round(turf.area(polyGeoJson));
                        if (areaM2 > 0) {
                          setFormData((prev) => ({
                            ...prev,
                            proposed_land_area_m2: areaM2,
                            geometry: polyGeoJson as any
                          }));
                          toast.info(`Luas bidang terhitung: ${areaM2.toLocaleString('id-ID')} m²`);
                        }
                      } catch (err) {
                        console.error('Turf area error:', err);
                      }
                    }
                  }}
                  initialValue={
                    formData.geometry?.coordinates ? (formData.geometry.coordinates as any) : undefined
                  }
                />
              </GISMapContainer>
            </div>

            {/* Proposed Area Input & Turf Indicator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">
                  Luas Tanah Yang Dimohonkan (m²) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={formData.proposed_land_area_m2}
                    onChange={(e) => handleInputChange('proposed_land_area_m2', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-emerald-300 rounded-lg text-sm font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  />
                  <span className="text-xs font-bold text-emerald-800">m²</span>
                </div>
              </div>
              <div className="text-xs text-emerald-800 space-y-0.5">
                <div className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terkoneksi Geometri Spasial:
                </div>
                <div>
                  Koordinat Poligon: {formData.geometry?.coordinates?.[0]?.length || 0} titik simpul terdaftar.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAHAP 4: UNGGAH DOKUMEN PERSYARATAN ────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" /> Tahap 4: Unggah Berkas Persyaratan PKKPR
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Unggah dokumen wajib sesuai birokrasi perizinan pemanfaatan ruang Kabupaten Bogor (format PDF/JPG/PNG, maks 25MB per berkas).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slot 1: KTP */}
            <DocumentUploadCard
              docType="KTP"
              title="KTP Pemohon / Penanggung Jawab"
              subtitle="Kartu Tanda Penduduk yang masih berlaku"
              isRequired={true}
              uploadedDoc={uploadedDocs['KTP']}
              isUploading={uploadingDocType === 'KTP'}
              onUpload={(file) => handleDocumentUpload(file, 'KTP')}
              onRemove={() => handleRemoveDoc('KTP')}
            />

            {/* Slot 2: NIB / AKTA */}
            <DocumentUploadCard
              docType="NIB_AKTA"
              title="NIB / Akta Pendirian Perusahaan"
              subtitle="Legalitas badan usaha atau dokumen berusaha OSS"
              isRequired={formData.applicant_type === 'BADAN_USAHA'}
              uploadedDoc={uploadedDocs['NIB_AKTA']}
              isUploading={uploadingDocType === 'NIB_AKTA'}
              onUpload={(file) => handleDocumentUpload(file, 'NIB_AKTA')}
              onRemove={() => handleRemoveDoc('NIB_AKTA')}
            />

            {/* Slot 3: BUKTI HAK TANAH */}
            <DocumentUploadCard
              docType="BUKTI_HAK_TANAH"
              title="Bukti Hak Atas Tanah (Sertifikat)"
              subtitle="SHM, HGB, Girik/Letter C, atau bukti kepemilikan yang sah"
              isRequired={true}
              uploadedDoc={uploadedDocs['BUKTI_HAK_TANAH']}
              isUploading={uploadingDocType === 'BUKTI_HAK_TANAH'}
              onUpload={(file) => handleDocumentUpload(file, 'BUKTI_HAK_TANAH')}
              onRemove={() => handleRemoveDoc('BUKTI_HAK_TANAH')}
            />

            {/* Slot 4: PROPOSAL TEKNIS */}
            <DocumentUploadCard
              docType="PROPOSAL_TEKNIS"
              title="Proposal Rencana Kegiatan / Uraian Teknis"
              subtitle="Uraian rencana peruntukan, sarana penunjang & estimasi tapak"
              isRequired={false}
              uploadedDoc={uploadedDocs['PROPOSAL_TEKNIS']}
              isUploading={uploadingDocType === 'PROPOSAL_TEKNIS'}
              onUpload={(file) => handleDocumentUpload(file, 'PROPOSAL_TEKNIS')}
              onRemove={() => handleRemoveDoc('PROPOSAL_TEKNIS')}
            />
          </div>
        </div>
      )}

      {/* ─── TAHAP 5: RINGKASAN & KONFIRMASI ───────────────────────────────────── */}
      {currentStep === 5 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Tahap 5: Ringkasan & Konfirmasi Pengajuan
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Periksa kembali seluruh ringkasan permohonan sebelum dikirimkan ke sistem antrean dinas.
            </p>
          </div>

          {/* Review Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Card 1: Pemohon */}
            <div className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-2">
              <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b border-gray-200 pb-2">
                <User className="w-4 h-4 text-emerald-600" /> Profil Pemohon
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Tipe Pemohon:</span>
                <span className="font-semibold text-gray-900">{formData.applicant_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Nama Pemohon:</span>
                <span className="font-semibold text-gray-900">{formData.applicant_name}</span>
              </div>
              {formData.applicant_nib && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">NIB:</span>
                  <span className="font-mono text-gray-900">{formData.applicant_nib}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">WhatsApp:</span>
                <span className="font-semibold text-gray-900">{formData.applicant_phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-900">{formData.applicant_email}</span>
              </div>
            </div>

            {/* Card 2: Kegiatan & KBLI */}
            <div className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-2">
              <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b border-gray-200 pb-2">
                <Compass className="w-4 h-4 text-emerald-600" /> Rencana Kegiatan
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Kategori:</span>
                <span className="font-semibold text-emerald-800">{formData.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">KBLI 2020:</span>
                <span className="font-semibold text-gray-900">{formData.kbli_code || '-'}</span>
              </div>
              <div className="py-1">
                <span className="text-gray-500 block mb-0.5">Deskripsi Kegiatan:</span>
                <span className="text-gray-800 font-medium leading-relaxed block bg-white p-2 rounded border border-gray-200">
                  {formData.activity_description}
                </span>
              </div>
            </div>

            {/* Card 3: Lokasi & Hak Tanah */}
            <div className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-2">
              <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b border-gray-200 pb-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> Lokasi & Hak Atas Tanah
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Wilayah:</span>
                <span className="font-semibold text-gray-900 text-right">
                  Desa {formData.location_village}, Kec. {formData.location_district}, {formData.location_city}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Alamat Lengkap:</span>
                <span className="text-gray-800 text-right max-w-xs">{formData.location_address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Status Hak:</span>
                <span className="font-semibold text-emerald-800">{formData.land_ownership_status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">No. Sertifikat:</span>
                <span className="font-semibold text-gray-900">{formData.certificate_number}</span>
              </div>
            </div>

            {/* Card 4: Dokumen & Spasial */}
            <div className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-2">
              <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b border-gray-200 pb-2">
                <FileCheck className="w-4 h-4 text-emerald-600" /> Luas & Berkas Terlampir
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Luas Dimohonkan:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formData.proposed_land_area_m2.toLocaleString('id-ID')} m²
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Titik Koordinat Poligon:</span>
                <span className="font-semibold text-gray-900">
                  {formData.geometry?.coordinates?.[0]?.length || 0} Titik
                </span>
              </div>
              <div className="py-1">
                <span className="text-gray-500 block mb-1">Dokumen Diunggah:</span>
                <div className="space-y-1.5">
                  {Object.values(uploadedDocs).map((doc) => (
                    <div key={doc.file_type} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="font-medium text-emerald-950 truncate">[{doc.file_type}] {doc.file_name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-gray-400">{(doc.file_size / 1024).toFixed(0)} KB</span>
                        <a
                          href={getFileUrl(doc.file_path, doc.file_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          title="Buka / lihat berkas di tab baru"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pernyataan Integritas Tata Ruang */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="integrity_agreement"
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 mt-1 cursor-pointer"
              />
              <label htmlFor="integrity_agreement" className="text-xs text-emerald-950 leading-relaxed cursor-pointer select-none">
                <strong>Pernyataan Kebenaran Data & Integritas Tata Ruang (Perbup Bogor No. 4/2025):</strong>
                <br />
                Saya menyatakan dengan sesungguhnya bahwa seluruh data pemohon, nomor sertifikat, batas poligon spasial, dan berkas persyaratan yang diunggah adalah sah dan benar secara hukum. Saya memahami bahwa Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) ini mengikat secara hukum dan menjadi batas legalitas yang tidak boleh dilanggar dalam pengajuan Site Plan selanjutnya.
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Navigation Buttons */}
      <div className="flex justify-between items-center pt-2">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setCurrentStep((prev) => prev - 1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            Lanjutkan <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting || !agreementChecked}
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mendaftarkan Permohonan ke Dinas...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Kirim Pengajuan PKKPR Resmi</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── SUB-KOMPONEN: KARTU UNGGAH DOKUMEN PERSYARATAN ────────────────────────────

interface DocumentUploadCardProps {
  docType: string;
  title: string;
  subtitle: string;
  isRequired: boolean;
  uploadedDoc?: UploadedDocState;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  title,
  subtitle,
  isRequired,
  uploadedDoc,
  isUploading,
  onUpload,
  onRemove
}) => {
  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        uploadedDoc
          ? 'border-emerald-300 bg-emerald-50/30'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <span>{title}</span>
            {isRequired && <span className="text-rose-600 text-[10px] font-bold">*Wajib</span>}
          </div>
          <div className="text-[11px] text-gray-500">{subtitle}</div>
        </div>

        {uploadedDoc && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terunggah
          </span>
        )}
      </div>

      {uploadedDoc ? (
        <div className="mt-3 p-2.5 bg-white border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="truncate">
              <a
                href={getFileUrl(uploadedDoc.file_path, uploadedDoc.file_url)}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gray-800 hover:text-emerald-700 hover:underline truncate block"
                title="Buka berkas di tab baru"
              >
                {uploadedDoc.file_name}
              </a>
              <div className="text-[10px] text-gray-400">
                {(uploadedDoc.file_size / 1024).toFixed(1)} KB • {uploadedDoc.mime_type}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={getFileUrl(uploadedDoc.file_path, uploadedDoc.file_url)}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
              title="Buka berkas di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-gray-400 hover:text-rose-600 rounded transition-colors"
              title="Hapus berkas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <label className="cursor-pointer block border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-lg p-4 text-center transition-all bg-gray-50/50 hover:bg-emerald-50/20">
            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengunggah berkas ke server...</span>
              </div>
            ) : (
              <div className="space-y-1">
                <UploadCloud className="w-6 h-6 text-gray-400 mx-auto" />
                <div className="text-xs font-semibold text-gray-700">
                  Klik untuk memilih file
                </div>
                <div className="text-[10px] text-gray-400">PDF, JPG, PNG (Maks 25MB)</div>
              </div>
            )}
            <input
              type="file"
              disabled={isUploading}
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default PKKPRCreateWizard;
