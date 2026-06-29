import * as z from 'zod';

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

export const submissionDataSchema = z.object({
  submissionType: z.enum(['BARU', 'REVISI', 'PERPANJANGAN']),
  activityName: z.string().min(5, 'Nama kegiatan/pembangunan wajib diisi'),
  category: z.enum(['PERUMAHAN', 'NON_PERUMAHAN', 'FASUM', 'INDUSTRI']),
});

export const locationSchema = z.object({
  locationName: z.string().min(3, 'Nama lokasi wajib diisi'),
  village: z.string().min(3, 'Desa/Kelurahan wajib diisi'),
  district: z.string().min(3, 'Kecamatan wajib diisi'),
  city: z.string().min(3, 'Kabupaten/Kota wajib diisi'),
  province: z.string().min(3, 'Provinsi wajib diisi'),
  fullAddress: z.string().min(10, 'Alamat lengkap wajib diisi'),
  landArea: z.number().positive('Luas lahan harus lebih besar dari 0'),
  ownershipStatus: z.enum(['SHM', 'HGB', 'HAK_PAKAI', 'LAINNYA']),
  certificateNumber: z.string().min(3, 'Nomor sertifikat wajib diisi'),
  certificateOwner: z.string().min(3, 'Nama pemilik sertifikat wajib diisi'),
});

export const coordinateSchema = z.object({
  polygon: z.any().optional(), // Untuk menyimpan koordinat poligon georeferenced bumi nyata
  coordinatesText: z.string().optional(), // Untuk menyimpan penulisan manual teks GeoJSON koordinat

  // ─── PARAMETER TRANSFORMASI CAD HELMERT 2D (SINKRONISASI SPASIAL) [Jakarta 5] ───
  cadFileName: z.string().optional(),       // Nama file CAD (.dwg / .dxf) asal
  cadParamA: z.number().optional(),         // Nilai parameter A = s * cos(theta)
  cadParamB: z.number().optional(),         // Nilai parameter B = s * sin(theta)
  cadParamTx: z.number().optional(),        // Nilai pergeseran sumbu X (Translasi X)
  cadParamTy: z.number().optional(),        // Nilai pergeseran sumbu Y (Translasi Y)
  cadScale: z.number().optional(),          // Faktor skala spasial (s) hasil kalibrasi
  cadRotation: z.number().optional(),       // Sudut rotasi spasial (theta) dalam satuan radian
});

export const spatialSchema = z.object({
  kkprNumber: z.string().min(3, 'Nomor KKPR wajib diisi'),
  landUse: z.string().min(3, 'Peruntukan lahan wajib diisi'),
  greenArea: z.number().min(0, 'Luas PSU/RTH tidak boleh negatif'),
});

export const technicalSchema = z.object({
  // --- KATEGORI 1: PERUMAHAN ---
  lotCount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Jumlah kaveling harus berupa angka positif').optional()
  ),
  housingType: z.enum(['SUBSIDI', 'NON_SUBSIDI', 'CAMPURAN']).optional(),
  cemeteryArea: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Luas makam tidak boleh negatif').optional()
  ),
  roadRowMain: z.string().optional(),      // Lebar ROW Jalan Utama
  roadRowLocal: z.string().optional(),     // Lebar ROW Jalan Lingkungan
  waterSystem: z.string().optional(),      // Sistem Penyediaan Air Bersih

  // --- KATEGORI 2: NON_PERUMAHAN ---
  buildingBlocks: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Jumlah blok harus positif').optional()
  ),
  kdb: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).max(100, 'KDB maksimal 100%').optional()
  ),
  klb: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('KLB harus berupa angka positif').optional()
  ),
  kdh: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).max(100, 'KDH maksimal 100%').optional()
  ),
  parkingCapacity: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Kapasitas parkir harus positif').optional()
  ),
  maxFloors: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Jumlah lantai harus positif').optional()
  ),
  totalFloorArea: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Total luas lantai harus positif').optional()
  ),

  // --- KATEGORI 3: FASUM ---
  facilityType: z.string().optional(),     // Jenis Layanan (Kesehatan, Pendidikan, dll)
  capacity: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Daya tampung harus positif').optional()
  ),
  disabledAccess: z.string().optional(),   // Deskripsi Aksesibilitas Difabel
  specialParking: z.string().optional(),   // Sarana Parkir Khusus (Ambulans/Bus)
  fireProtection: z.string().optional(),   // Sistem Proteksi Kebakaran

  // --- KATEGORI 4: INDUSTRI ---
  warehouseCount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Jumlah unit gudang harus positif').optional()
  ),
  roadLoadMst: z.string().optional(),      // Muatan Sumbu Terberat (MST - Ton)
  electricityPower: z.string().optional(), // Daya Listrik Terpasang
  ipalCapacity: z.string().optional(),     // Kapasitas IPAL/WWTP
  greenBufferArea: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Luas penyangga hijau tidak boleh negatif').optional()
  ),
  tpsB3Provision: z.string().optional(),   // Deskripsi Penyediaan TPS B3

  // --- MOCK COMPATIBILITY ---
  unitArea: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Luas unit rata-rata minimal 1').optional()
  ),
  roadPlan: z.string().optional(),
  drainagePlan: z.string().optional(),
});

export const consultantSchema = z.object({
  consultantName: z.string().min(3, 'Nama konsultan wajib diisi'),
  companyName: z.string().min(3, 'Nama perusahaan wajib diisi'),
  picName: z.string().min(3, 'Nama penanggung jawab wajib diisi'),
});

export const documentSchema = z.object({
  legalDoc: z.any().optional(),
  technicalDoc: z.any().optional(),
  supportDoc: z.any().optional(),
});

export const photoSchema = z.object({
  photoNorth: z.any().optional(),
  photoSouth: z.any().optional(),
  photoEast: z.any().optional(),
  photoWest: z.any().optional(),
  photoAccess: z.any().optional(),
});

export const statementSchema = z.object({
  agreed: z.boolean().refine(val => val === true, {
    message: 'Anda harus mencentang pernyataan ini untuk melanjutkan'
  })
});

export const fullSubmissionSchema = z.object({
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
});

export type FullSubmissionFormValues = z.infer<typeof fullSubmissionSchema>;