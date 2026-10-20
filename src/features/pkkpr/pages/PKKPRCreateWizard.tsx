import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pkkprApi } from '../api/pkkprApi';
import type { SubmitPKKPRPayload, PKKPRCategory } from '../types/pkkpr.types';

export const PKKPRCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<SubmitPKKPRPayload>({
    applicant_type: 'BADAN_USAHA',
    applicant_name: '',
    applicant_nik: '',
    applicant_nib: '',
    applicant_npwp: '',
    applicant_phone: '',
    applicant_email: '',
    category: 'BERUSAHA_PENILAIAN',
    activity_description: '',
    kbli_code: '41011',
    location_address: '',
    location_village: 'Cibinong',
    location_district: 'Cibinong',
    location_city: 'Kabupaten Bogor',
    proposed_land_area_m2: 10000,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [106.840, -6.480],
          [106.845, -6.480],
          [106.845, -6.485],
          [106.840, -6.485],
          [106.840, -6.480]
        ]
      ]
    }
  });

  const [rawGeoJsonInput, setRawGeoJsonInput] = useState(
    JSON.stringify(formData.geometry, null, 2)
  );

  const handleInputChange = (field: keyof SubmitPKKPRPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGeoJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawGeoJsonInput(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      if (parsed.type && parsed.coordinates) {
        setFormData((prev) => ({ ...prev, geometry: parsed }));
        setErrorMessage(null);
      }
    } catch {
      // Tunggu hingga JSON valid
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Validasi dasar
      if (!formData.applicant_name) {
        throw new Error('Nama pemohon / badan usaha wajib diisi.');
      }
      if (!formData.activity_description) {
        throw new Error('Deskripsi kegiatan pemanfaatan ruang wajib diisi.');
      }
      if (formData.proposed_land_area_m2 <= 0) {
        throw new Error('Luas lahan yang dimohonkan harus lebih besar dari 0 m².');
      }

      const res = await pkkprApi.submit(formData);
      navigate(`/pkkpr/${res.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirimkan permohonan PKKPR.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/pkkpr')}
          className="text-xs font-semibold text-gray-500 hover:text-emerald-700 flex items-center gap-1 mb-2"
        >
          ← Kembali ke Daftar PKKPR
        </button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Formulir Pengajuan Permohonan PKKPR
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang — Pemerintah Kabupaten Bogor
        </p>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        {[
          { step: 1, label: 'Data Pemohon' },
          { step: 2, label: 'Kegiatan Ruang' },
          { step: 3, label: 'Lokasi & Batas Poligon' },
          { step: 4, label: 'Konfirmasi' }
        ].map((item) => (
          <div key={item.step} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === item.step
                  ? 'bg-emerald-600 text-white shadow-md'
                  : currentStep > item.step
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {currentStep > item.step ? '✓' : item.step}
            </span>
            <span
              className={`text-xs font-medium ${
                currentStep === item.step ? 'text-gray-900 font-semibold' : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          <strong>Perhatian: </strong> {errorMessage}
        </div>
      )}

      {/* STEP 1: DATA PEMOHON */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b pb-2">
            Tahap 1: Data Identitas Pemohon
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kategori Permohonan</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as PKKPRCategory)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="BERUSAHA_PENILAIAN">Berusaha (Pelaku Usaha / Developer Properti)</option>
                <option value="NON_BERUSAHA">Non-Berusaha (Rumah Tinggal Pribadi / Fasos / Yayasan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipe Pemohon</label>
              <select
                value={formData.applicant_type}
                onChange={(e) => handleInputChange('applicant_type', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="BADAN_USAHA">Badan Usaha (PT / CV / Yayasan / Koperasi)</option>
                <option value="PERORANGAN">Perorangan</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nama Lengkap Pemohon / Nama Perusahaan *
              </label>
              <input
                type="text"
                value={formData.applicant_name}
                onChange={(e) => handleInputChange('applicant_name', e.target.value)}
                placeholder="Contoh: PT. Graha Selaras Properti / Bpk. Hendra Gunawan"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nomor Induk Berusaha (NIB)</label>
              <input
                type="text"
                value={formData.applicant_nib || ''}
                onChange={(e) => handleInputChange('applicant_nib', e.target.value)}
                placeholder="13 digit NIB (jika berusaha)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">NIK Pemohon / Penanggung Jawab</label>
              <input
                type="text"
                value={formData.applicant_nik || ''}
                onChange={(e) => handleInputChange('applicant_nik', e.target.value)}
                placeholder="16 digit NIK KTP"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nomor WhatsApp / HP Aktif</label>
              <input
                type="text"
                value={formData.applicant_phone || ''}
                onChange={(e) => handleInputChange('applicant_phone', e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alamat Email Resmi</label>
              <input
                type="email"
                value={formData.applicant_email || ''}
                onChange={(e) => handleInputChange('applicant_email', e.target.value)}
                placeholder="email@perusahaan.com"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: RENCANA KEGIATAN */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b pb-2">
            Tahap 2: Rencana Kegiatan Pemanfaatan Ruang
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Kode KBLI (Klasifikasi Baku Lapangan Usaha Indonesia)
              </label>
              <input
                type="text"
                value={formData.kbli_code || ''}
                onChange={(e) => handleInputChange('kbli_code', e.target.value)}
                placeholder="Contoh: 41011 (Konstruksi Gedung Hunian)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rincian & Deskripsi Kegiatan Pemanfaatan Ruang *
              </label>
              <textarea
                rows={4}
                value={formData.activity_description}
                onChange={(e) => handleInputChange('activity_description', e.target.value)}
                placeholder="Jelaskan secara spesifik kegiatan yang akan dilakukan, misalnya: Pembangunan kawasan perumahan tapak bersubsidi dan komersial dengan total 150 unit rumah beserta fasilitas jalan, drainase, dan RTH..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alamat Lengkap Lokasi Kegiatan *
              </label>
              <textarea
                rows={2}
                value={formData.location_address}
                onChange={(e) => handleInputChange('location_address', e.target.value)}
                placeholder="Jl. Raya Pemda No. 45, RT 02/RW 04..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: LOKASI & POLIGON SPASIAL */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b pb-2">
            Tahap 3: Lokasi Administratif & Koordinat Poligon Lahan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kecamatan *</label>
              <input
                type="text"
                value={formData.location_district}
                onChange={(e) => handleInputChange('location_district', e.target.value)}
                placeholder="Cibinong / Babakan Madang..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Desa / Kelurahan *</label>
              <input
                type="text"
                value={formData.location_village}
                onChange={(e) => handleInputChange('location_village', e.target.value)}
                placeholder="Tengah / Pakansari..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Luas Lahan Dimohonkan (m²) *
              </label>
              <input
                type="number"
                value={formData.proposed_land_area_m2}
                onChange={(e) => handleInputChange('proposed_land_area_m2', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-semibold"
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">
                Koordinat Poligon Batas Luar Bidang Tanah (GeoJSON Polygon WGS84) *
              </label>
              <span className="text-xs text-gray-400">SRID: EPSG:4326</span>
            </div>
            <textarea
              rows={6}
              value={rawGeoJsonInput}
              onChange={handleGeoJsonChange}
              placeholder="Paste GeoJSON Polygon coordinates..."
              className="w-full p-3 border rounded-lg font-mono text-xs bg-gray-50 focus:bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Format standar GeoJSON Polygon dengan pasangan koordinat [Longitude, Latitude].
            </p>
          </div>
        </div>
      )}

      {/* STEP 4: KONFIRMASI */}
      {currentStep === 4 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b pb-2">
            Tahap 4: Ringkasan Pengajuan & Pernyataan Kepatuhan
          </h2>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Nama Pemohon:</span>
              <span className="font-semibold text-gray-900">{formData.applicant_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Kategori:</span>
              <span className="font-semibold text-gray-900">{formData.category}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Lokasi Lahan:</span>
              <span className="font-semibold text-gray-900">
                {formData.location_village}, {formData.location_district}, {formData.location_city}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Luas Lahan Dimohon:</span>
              <span className="font-semibold text-emerald-700">
                {formData.proposed_land_area_m2.toLocaleString('id-ID')} m²
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Uraian Kegiatan:</span>
              <span className="text-gray-800 text-right max-w-md">{formData.activity_description}</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <span>📜</span> Pernyataan Integritas Tata Ruang:
            </p>
            <p>
              Dengan mengirimkan formulir ini, saya menyatakan bahwa seluruh data yang diisikan adalah benar
              dan tanah yang dimohonkan tidak sedang dalam sengketa hukum. Saya memahami bahwa SK PKKPR ini
              nantinya akan menjadi batas sah yang wajib dipatuhi dalam pengajuan Site Plan selanjutnya.
            </p>
          </div>
        </div>
      )}

      {/* Navigasi Stepper Button */}
      <div className="flex justify-between items-center pt-4">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            ← Kembali
          </button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => {
              if (currentStep === 1 && !formData.applicant_name) {
                setErrorMessage('Mohon lengkapi nama pemohon terlebih dahulu.');
                return;
              }
              if (currentStep === 2 && !formData.activity_description) {
                setErrorMessage('Mohon lengkapi deskripsi kegiatan pemanfaatan ruang.');
                return;
              }
              setErrorMessage(null);
              setCurrentStep((prev) => prev + 1);
            }}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm"
          >
            Lanjutkan →
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold text-sm rounded-lg shadow-md flex items-center gap-2"
          >
            {isSubmitting ? 'Mengirim Berkas...' : 'Kirim Pengajuan PKKPR Resmi ✓'}
          </button>
        )}
      </div>
    </div>
  );
};
