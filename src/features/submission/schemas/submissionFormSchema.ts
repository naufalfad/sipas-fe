/**
 * ============================================================================
 * SIPAS DOMAIN SCHEMAS — Submission Form Schema [submissionFormSchema.ts] (REVISED v5.1)
 * ============================================================================
 * Peran: Skema penegakan validasi formulir terpadu (10-tahap) menggunakan Zod.
 *        Menjamin tipe data dan kelengkapan berkas legalitas aman sebelum
 *        dikirimkan ke lapisan REST API backend, serta mematikan alur
 *        revisi non-draf tanpa rujukan SK yang valid secara kondisional.
 * ============================================================================
 */

import * as z from 'zod';

// ─── PURE FABRICATION: HELPER PREPROSES DATA NUMERIK ────────────────────────
const numericPreprocess = (val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined;
  return Number(val);
};

// ─── TAHAP 1: DATA PEMOHON (APPLICANT) ──────────────────────────────────────
export const applicantSchema = z.object({
  type: z.enum(['PERORANGAN', 'BADAN_USAHA']),
  name: z.string().min(3, 'Nama wajib diisi'),
  nik: z.string().optional(),
  nib: z.string().optional(),
  npwp: z.string().min(5, 'NPWP wajib diisi'),
  directorName: z.string().optional(),
  phone: z.string().min(9, 'Nomor Telepon wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  address: z.string().min(10, 'Alamat lengkap wajib diisi'),
});

// ─── TAHAP 2: DATA PENGAJUAN (SUBMISSION DETAILS) ───────────────────────────
export const submissionDataSchema = z.object({
  submissionType: z.enum(['BARU', 'REVISI', 'PERPANJANGAN']),
  activityName: z.string().min(5, 'Nama kegiatan/pembangunan wajib diisi'),
  category: z.enum(['PERUMAHAN', 'NON_PERUMAHAN', 'FASUM', 'INDUSTRI']),
});

// ─── TAHAP 3: DATA LOKASI ADMINISTRATIF & TANAH (LOCATION) ──────────────────
export const locationSchema = z.object({
  locationName: z.string().min(3, 'Nama lokasi wajib diisi'),
  village: z.string().min(3, 'Desa/Kelurahan wajib diisi'),
  district: z.string().min(3, 'Kecamatan wajib diisi'),
  city: z.string().min(3, 'Kabupaten/Kota wajib diisi'),
  province: z.string().min(3, 'Provinsi wajib diisi'),
  fullAddress: z.string().min(10, 'Alamat lengkap wajib diisi'),
  landArea: z.preprocess(
    numericPreprocess,
    z.number().positive('Luas lahan harus lebih besar dari 0')
  ),
  ownershipStatus: z.enum(['SHM', 'HGB', 'HAK_PAKAI', 'LAINNYA']),
  certificateNumber: z.string().min(3, 'Nomor sertifikat wajib diisi'),
  certificateOwner: z.string().min(3, 'Nama pemilik sertifikat wajib diisi'),
});

// ─── TAHAP 4: DATA KOORDINAT BATAS LUAR (OUTER BOUNDARY GEOM) ───────────────
export const coordinateSchema = z.object({
  polygon: z.any().optional(), // Menyimpan koordinat poligon georeferenced bumi nyata
  coordinatesText: z.string().optional(), // Menyimpan penulisan manual teks GeoJSON koordinat

  // Parameter Kalibrasi Helmert 2D terhitung
  cadFileName: z.string().optional(),       // Nama file CAD (.dwg / .dxf) asal
  cadParamA: z.number().optional(),         // Nilai parameter A = s * cos(theta)
  cadParamB: z.number().optional(),         // Nilai parameter B = s * sin(theta)
  cadParamTx: z.number().optional(),        // Nilai pergeseran sumbu X (Translasi X)
  cadParamTy: z.number().optional(),        // Nilai pergeseran sumbu Y (Translasi Y)
  cadScale: z.number().optional(),          // Faktor skala spasial (s) hasil kalibrasi
  cadRotation: z.number().optional(),       // Sudut rotasi spasial (theta) dalam satuan radian
});

// ─── TAHAP 5: DATA INFORMASI TATA RUANG (SPATIAL INFO) ──────────────────────
export const spatialSchema = z.object({
  kkprNumber: z.string().min(3, 'Nomor KKPR wajib diisi'),
  landUse: z.string().min(3, 'Peruntukan lahan wajib diisi'),
  greenArea: z.preprocess(
    numericPreprocess,
    z.number().min(0, 'Luas PSU/RTH tidak boleh negatif')
  ),
});

// ─── TAHAP 6: PARAMETER TEKNIS BERSYARAT (TECHNICAL DETAILS) ───────────────
export const technicalSchema = z.object({
  // A. Kategori Perumahan
  lotCount: z.preprocess(
    numericPreprocess,
    z.number().positive('Jumlah kaveling harus berupa angka positif').optional()
  ),
  housingType: z.enum(['SUBSIDI', 'NON_SUBSIDI', 'CAMPURAN']).optional(),
  cemeteryArea: z.preprocess(
    numericPreprocess,
    z.number().min(0, 'Luas makam tidak boleh negatif').optional()
  ),
  roadRowMain: z.string().optional(),      // Lebar ROW Jalan Utama
  roadRowLocal: z.string().optional(),     // Lebar ROW Jalan Lingkungan
  waterSystem: z.string().optional(),      // Sistem Penyediaan Air Bersih
  waterSource: z.string().optional(),      // Sumber Air Bersih

  // B. Kategori Non-Perumahan (Gedung/Komersial)
  buildingBlocks: z.preprocess(
    numericPreprocess,
    z.number().positive('Jumlah blok harus positif').optional()
  ),
  kdb: z.preprocess(
    numericPreprocess,
    z.number().min(0).max(100, 'KDB maksimal 100%').optional()
  ),
  klb: z.preprocess(
    numericPreprocess,
    z.number().positive('KLB harus berupa angka positif').optional()
  ),
  kdh: z.preprocess(
    numericPreprocess,
    z.number().min(0).max(100, 'KDH maksimal 100%').optional()
  ),
  parkingCapacity: z.preprocess(
    numericPreprocess,
    z.number().positive('Kapasitas parkir harus positif').optional()
  ),
  maxFloors: z.preprocess(
    numericPreprocess,
    z.number().positive('Jumlah lantai harus positif').optional()
  ),
  totalFloorArea: z.preprocess(
    numericPreprocess,
    z.number().positive('Total luas lantai harus positif').optional()
  ),

  // C. Kategori Fasilitas Umum (Fasum)
  facilityType: z.string().optional(),     // Jenis Layanan (Kesehatan, Pendidikan, dll)
  capacity: z.preprocess(
    numericPreprocess,
    z.number().positive('Daya tampung harus positif').optional()
  ),
  disabledAccess: z.string().optional(),   // Deskripsi Aksesibilitas Difabel
  specialParking: z.string().optional(),   // Sarana Parkir Khusus (Ambulans/Bus)
  fireProtection: z.string().optional(),   // Sistem Proteksi Kebakaran

  // D. Kategori Industri
  warehouseCount: z.preprocess(
    numericPreprocess,
    z.number().positive('Jumlah unit gudang harus positif').optional()
  ),
  roadLoadMst: z.string().optional(),      // Muatan Sumbu Terberat (MST - Ton)
  electricityPower: z.string().optional(), // Daya Listrik Terpasang
  ipalCapacity: z.string().optional(),     // Kapasitas IPAL/WWTP
  greenBufferArea: z.preprocess(
    numericPreprocess,
    z.number().min(0, 'Luas penyangga hijau tidak boleh negatif').optional()
  ),
  tpsB3Provision: z.string().optional(),   // Deskripsi Penyediaan TPS B3

  // --- MOCK COMPATIBILITY ---
  unitArea: z.preprocess(
    numericPreprocess,
    z.number().positive('Luas unit rata-rata minimal 1').optional()
  ),
  roadPlan: z.string().optional(),
  drainagePlan: z.string().optional(),

  // Metrik Proposed Pengembang (Proposed)
  applicantBuildingArea: z.preprocess(
    numericPreprocess,
    z.number().positive("Luas bangunan wajib diisi")
  ),
  applicantGsb: z.preprocess(
    numericPreprocess,
    z.number().min(0, "GSB tidak boleh negatif")
  ),
  applicantRthArea: z.preprocess(
    numericPreprocess,
    z.number().min(0, "Luas RTH tidak boleh negatif")
  )
});

// ─── TAHAP 7: DATA KONSULTAN PERENCANA (CONSULTANT) ─────────────────────────
export const consultantSchema = z.object({
  consultantName: z.string().min(3, 'Nama konsultan wajib diisi'),
  companyName: z.string().min(3, 'Nama perusahaan wajib diisi'),
  picName: z.string().min(3, 'Nama penanggung jawab wajib diisi'),
});

// ─── TAHAP 8 & 9: BERKAS DOKUMEN & FOTO LAMPIRAN (DOCUMENT & PHOTO) ──────────
export const documentSchema = z.object({
  legalDoc: z.union([z.string().min(1, 'Dokumen wajib dilampirkan'), z.any()]).optional(),
  technicalDoc: z.union([z.string().min(1, 'Dokumen wajib dilampirkan'), z.any()]).optional(),
  supportDoc: z.union([z.string(), z.any()]).optional(),
  supportDoc2: z.union([z.string(), z.any()]).optional(),
  skaDoc: z.union([z.string(), z.any()]).optional(),
  cadDoc: z.union([z.string(), z.any()]).optional(),
  ktpDoc: z.union([z.string(), z.any()]).optional(),
  nibDoc: z.union([z.string(), z.any()]).optional(),
});

export const photoSchema = z.object({
  photoNorth: z.union([z.string(), z.any()]).optional(),
  photoSouth: z.union([z.string(), z.any()]).optional(),
  photoEast: z.union([z.string(), z.any()]).optional(),
  photoWest: z.union([z.string(), z.any()]).optional(),
  photoAccess: z.union([z.string(), z.any()]).optional(),
});

// ─── TAHAP 10: PERNYATAAN KOMITMEN HUKUM (STATEMENT) ────────────────────────
export const statementSchema = z.object({
  agreed: z.boolean().refine(val => val === true, {
    message: 'Anda harus mencentang pernyataan ini untuk melanjutkan'
  })
});

// ─── TPU & KOMPENSASI MANDIRI (SELF-DECLARATION DETAILS) ─────────────────────
export const tpuSchema = z.object({
  method: z.enum(['MANDIRI', 'EKSISTING', 'KERJASAMA', 'KOMPENSASI_UANG', 'INTEGRASI_WARGA']).optional(),
  area: z.preprocess(numericPreprocess, z.number().min(0).optional()),
  namaTpu: z.string().optional(),
  pengurusTpu: z.string().optional(),
  noPks: z.string().optional(),
  nominalKompensasi: z.preprocess(numericPreprocess, z.number().min(0).optional()),
  alamat: z.string().optional(),
  koordinat: z.string().refine(
    val => !val || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(val),
    { message: 'Format koordinat harus berupa "latitude, longitude" (contoh: -6.485542, 106.824125)' }
  ).optional(),
  buktiDokumenUrl: z.union([z.string(), z.any()]).optional(),
}).optional();

export const compensationItemSchema = z.object({
  type: z.enum(['LAHAN_SAWAH', 'LAHAN_MAKAM_FISIK', 'LAHAN_MAKAM_UANG', 'PSU_FISIK_TAMBAHAN']),
  requiredAreaM2: z.preprocess(numericPreprocess, z.number().min(0)),
  fulfillmentMethod: z.enum(['PENYEDIAAN_FISIK_OFFSITE', 'KOMPENSASI_UANG', 'KERJASAMA_PIHAK_KETIGA']),
  locationAddress: z.string().optional(),
  nominalAmount: z.preprocess(numericPreprocess, z.number().min(0).optional()),
  documentUrl: z.union([z.string(), z.any()]).optional(),
});

// ─── UPDATE FASE 5 (REVISI): SKEMA VALIDASI METADATA SK FISIK LAMA ───────────
export const legacyMetadataSchema = z.object({
  replaced_sk_number: z.string().min(3, 'Nomor SK lama wajib diisi'),
  replaced_sk_date: z.string().min(10, 'Tanggal SK lama wajib diisi'),
  replaced_sk_doc_url: z.string().min(1, 'Scan PDF SK lama wajib diunggah')
});

// ─── KONTRAK UTAMA FORM INTEGRASI UNIFIED FORM (SOT) ──────────────────────────
export const fullSubmissionSchema = z.object({
  id_permohonan: z.string().optional(),
  is_draft: z.boolean().optional(),

  // ─── UPDATE FASE 5 (REVISI): SILSILAH RUJUKAN SK LAMA SECARA KONDISIONAL ───
  baseline_source: z.enum(['DIGITAL', 'LEGACY']).optional(),
  parent_id_permohonan: z.string().optional(),
  legacy_metadata: legacyMetadataSchema.optional(),

  applicant: applicantSchema,
  submission: submissionDataSchema,
  location: locationSchema,
  coordinate: coordinateSchema,
  spatial: spatialSchema,
  technical: technicalSchema,
  consultant: consultantSchema,
  document: documentSchema,
  photo: photoSchema,
  statement: statementSchema,
  tpu: tpuSchema,
  compensations: z.array(compensationItemSchema).optional(),
}).refine((data) => {
  // PENEGAKAN HUKUM: Jika bukan draf (IS_DRAFT == FALSE) dan tipenya REVISI
  const isRevision = data.submission?.submissionType === 'REVISI';
  if (isRevision && !data.is_draft) {
    if (!data.baseline_source) return false;

    if (data.baseline_source === 'DIGITAL' && !data.parent_id_permohonan) {
      return false;
    }
    if (data.baseline_source === 'LEGACY' && !data.legacy_metadata) {
      return false;
    }
  }
  return true;
}, {
  message: "Proses revisi dibatalkan. Bukti dan data rujukan SK lama mutlak diperlukan.",
  path: ["baseline_source"]
});

export type FullSubmissionFormValues = z.infer<typeof fullSubmissionSchema>;