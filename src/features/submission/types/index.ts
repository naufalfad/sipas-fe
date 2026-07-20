/**
 * ============================================================================
 * GEOSIPAS SYSTEM CONTRACTS — [src/features/submission/types/index.ts] (REVISED v5.5)
 * ============================================================================
 * Peran: Kontrak tipe data (Single Source of Truth) untuk permohonan site plan.
 *        Diperbarui penuh untuk mendukung perbandingan metrik tiga sisi,
 *        dynamic checklist evaluasi dinas, metadata verifikasi KKPR, peran baru,
 *        riwayat silsilah permohonan (Revisi) baik di tingkat root objek (GET) 
 *        maupun tingkat skema biner (POST), snapshot dokumen Telaah Staf, 
 *        serta draf Surat Keputusan (SK) resmi berbasis dimensi fisik absolut (m²).
 * 
 * Pembaruan v5.5: Pemisahan tipe data FieldInspectionLog (Darat) dan
 *                AerialInspectionLog (Drone) untuk kepatuhan GRASP.
 * ============================================================================
 */

export type SubmissionStatus =
  | 'Draft'
  | 'Pengajuan Dokumen'
  | 'Verifikasi Administrasi'
  | 'Verifikasi Teknis'
  | 'Menunggu Rekomendasi'   // Tambahan (Fase 3: Tahap Peninjauan & Veto Kabid)
  | 'Menunggu Persetujuan'
  | 'Proses TTE'
  | 'Disetujui'
  | 'Ditolak'
  | 'Tidak Berlaku';

export type KKPRVerdict =
  | 'Sesuai'
  | 'Sesuai Bersyarat'
  | 'Perlu Perbaikan / Revisi'
  | 'Tidak Sesuai / Ditolak';

export type ChecklistStatus =
  | 'Sesuai'
  | 'Sesuai Bersyarat'
  | 'Tidak Sesuai'
  | 'Pending';

export interface StatusHistory {
  date: string;
  status: SubmissionStatus;
  notes: string;
  actor: string;
}

export interface ProjectLocation {
  lat: number;
  lng: number;
  address: string;
  polygon?: [number, number][]; // Poligon batas luar bidang tanah site plan
  // --- SUB-POLIGON CAD DETAIL SITE PLAN (SLIDE 6) ---
  kavlingPolygons?: [number, number][][]; // Blok kavling-kavling unit rumah (Slate)
  rthPolygons?: [number, number][][];     // Area Ruang Terbuka Hijau (Emerald/Hijau)
  psuPolygons?: [number, number][][];     // Area Utilitas/Fasum (Teal)
  roadPolygons?: [number, number][][];    // Area Jaringan Jalan & Saluran (Slate Terang)
}

export interface ApplicantDetails {
  type: 'PERORANGAN' | 'BADAN_USAHA';
  name: string;
  nik?: string;
  nib?: string;
  npwp: string;
  directorName?: string;
  phone: string;
  email: string;
  address: string;
}

export interface SubmissionDetails {
  submissionType: 'BARU' | 'REVISI' | 'PERPANJANGAN';
  activityName: string;
  category: 'PERUMAHAN' | 'NON_PERUMAHAN' | 'FASUM' | 'INDUSTRI';
}

export interface LocationDetails {
  locationName: string;
  village: string;
  district: string;
  city: string;
  province: string;
  fullAddress: string;
  landArea: number;
  ownershipStatus: 'SHM' | 'HGB' | 'HAK_PAKAI' | 'LAINNYA';
  certificateNumber: string;
  certificateOwner: string;
}

export interface SpatialDetails {
  kkprNumber: string;
  landUse: string;
  greenArea: number;
}

export interface TechnicalDetails {
  // Perumahan
  lotCount?: number;
  housingType?: 'SUBSIDI' | 'NON_SUBSIDI' | 'CAMPURAN';
  cemeteryArea?: number;
  roadRowMain?: string;
  roadRowLocal?: string;
  waterSystem?: string;
  waterSource?: string;

  // Non-Perumahan
  buildingBlocks?: number;
  kdb?: number;
  klb?: number;
  kdh?: number;
  parkingCapacity?: number;
  maxFloors?: number;
  totalFloorArea?: number;

  // Fasum
  facilityType?: string;
  capacity?: number;
  disabledAccess?: string;
  specialParking?: string;
  fireProtection?: string;

  // Industri
  warehouseCount?: number;
  roadLoadMst?: string;
  electricityPower?: string;
  ipalCapacity?: string;
  greenBufferArea?: number;
  tpsB3Provision?: string;

  // Mock compatibility
  unitArea?: number;
  roadPlan?: string;
  drainagePlan?: string;

  // --- REVISI: METRIK PROPOSED DETAIL JALUR MANDIRI PEMOHON ---
  applicantBuildingArea?: number; // Luas bangunan dalam satuan m2
  applicantGsb?: number;          // GSB dalam satuan meter
  applicantRthArea?: number;      // Luas RTH rencana dalam satuan m2
}

export interface ConsultantDetails {
  consultantName: string;
  companyName: string;
  picName: string;
}

export interface PhotoDetails {
  photoNorth?: string;
  photoSouth?: string;
  photoEast?: string;
  photoWest?: string;
  photoAccess?: string;
}

export interface CoordinateDetails {
  polygon?: [number, number][];
  cadFileName?: string;
  cadParamA?: number;
  cadParamB?: number;
  cadParamTx?: number;
  cadParamTy?: number;
  cadScale?: number;
  cadRotation?: number;
}

export interface StatementDetails {
  agreed: boolean;
}

export interface EvaluationChecklistItem {
  aspekCode: string;                 // e.g., 'REQ_ZONING', 'REQ_LEGAL', 'REQ_KDB'
  aspekLabel: string;                // e.g., "Kesesuaian dengan RTRW/RDTR"
  statusKelayakan: ChecklistStatus;   // 'Sesuai' | 'Sesuai Bersyarat' | 'Tidak Sesuai' | 'Pending'
  catatanVerifikator?: string;       // Justifikasi penolakan atau instruksi bersyarat
  attachmentUrl?: string;            // PDF coretan/bukti kalkulasi dinas dari AutoCAD

  // ─── AMANDEMEN: REVISI TRACEABILITY AUDIT ───
  verifiedById?: number;             // FK ke ID user pengisi evaluasi
  verifiedAt?: string;               // ISO 8601 Timestamp pengisian evaluasi
}

// ─── TAHAP 1: VALUE OBJECT INTERFACES UNTUK DRAF SK ───────────────────────────

export interface SkSignerInfo {
  name: string;
  nip: string;
  office_title?: string;
  signed_at?: string | null;
  signature_base64?: string | null;
}

export interface SkDiktumHunian {
  tipe_rumah: string;
  jumlah_unit: number;
  luas_m2: number;
}

export interface SkDiktumPsu {
  total_psu_area_m2: number;
  allocation_details: string;
  cemetery_scheme: string;
  road_row_min: number;
  road_row_max: number;
  drainage_type?: string;
}

export interface SkDiktumIntensity {
  kdb_max: number;
  klb_max: number;
  kdh_min: number;
}

export interface SkConsiderations {
  menimbang: string[];
  mengingat: string[];
  memperhatikan: string[];
}

export interface SkDraftPayload {
  id_sk: string;
  id_permohonan: string;
  sk_number: string;
  sequence_no: number;
  classification_code: string;
  office_code: string;
  created_at: string;
  verdict: string;
  custom_notes?: string | null;
  is_overridden: boolean;
  override_reason?: string | null;
  signer?: SkSignerInfo | null;
  considerations?: SkConsiderations | null;
  diktum_hunian: SkDiktumHunian[];
  diktum_psu?: SkDiktumPsu | null;
  diktum_intensity?: SkDiktumIntensity | null;
}

export interface SkDraft {
  idSk: string;
  skNumber: string;
  verdict: string;
  isOverridden: boolean;
  overrideReason?: string | null;
  createdAt: string;
  payload: SkDraftPayload;
}

// ─── UPDATE FASE 5 (REVISI): DETAIL METADATA FISIK/LEGACY SK LAMA ────────────
export interface LegacyMetadata {
  replaced_sk_number: string;
  replaced_sk_date: string; // Format ISO: YYYY-MM-DD
  replaced_sk_doc_url: string;
}

// ─── PEMBARUAN v5.5: ONTOLOGY INTERFACES INSPEKSI FISIK LAPANGAN ──────────────

export interface FieldInspectionLog {
  id: number;
  idPermohonan: string;
  inspectorName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number | null;
  isVerified: boolean;
  photoUrl: string;
  notes?: string | null;
}

export interface AerialInspectionLog {
  id: number;
  idPermohonan: string;
  pilotName: string;
  timestamp: string;
  droneVideoUrl: string;
  flightMetadata?: Record<string, any> | null;
  notes?: string | null;
}

// ─── UTAMA: INTERFACE PERMOHONAN SINKRON (SOT) ───────────────────────────────

export interface Submission {
  id: string;
  submissionNo: string;
  housingName: string;
  developerName: string;
  landArea: number; // Dalam satuan meter persegi (m²)
  submissionDate: string;
  status: SubmissionStatus;
  base_sla_days?: number;
  remaining_sla_days?: number;
  signatureHash?: string;
  signedPdfUrl?: string;
  kabidSignature?: string;
  kadisSignature?: string;
  skNumber?: string | null;
  adminLockId?: number | null;
  adminLockName?: string | null;
  teknisiLockId?: number | null;
  teknisiLockName?: string | null;

  // Penambahan parameter hasil hitung sistem lama (Baku Backwards-compatibility)
  kdbPercent?: number;
  klbValue?: number;
  kdhPercent?: number;
  rthArea?: number;
  psuArea?: number;
  roadArea?: number;

  documents: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
    key?: string;
  }[];
  history: StatusHistory[];
  location: ProjectLocation;

  // Full form details
  applicant?: ApplicantDetails;
  submissionDetails?: SubmissionDetails;
  locationDetails?: LocationDetails;
  coordinate?: CoordinateDetails;
  spatial?: SpatialDetails;
  technical?: TechnicalDetails;
  consultant?: ConsultantDetails;
  photos?: PhotoDetails;
  statement?: StatementDetails;

  // ─── Proposed Metrics (Deklarasi Mandiri Pemohon) ───
  applicantBuildingArea?: number; // Luas bangunan total (KDB m2)
  applicantGsb?: number;          // GSB usulan (m)
  applicantRthArea?: number;      // Luas RTH usulan (m2)

  // ─── Bylaw Metrics (Batas RDTR Dinamis dari System) ───
  bylawMaxKdb?: number;
  bylawMaxKlb?: number;
  bylawMinKdh?: number;
  bylawMinGsb?: number;
  bylawMinRthArea?: number;

  // ─── Verified Fallbacks & Ratios (Hasil Evaluasi Diterima) ───
  verifiedKdb?: number;
  verifiedKlb?: number;
  verifiedKdh?: number;
  verifiedGsb?: number;
  verifiedRthArea?: number;

  // ─── BARU: RAW DIMENSION METRICS TERVERIFIKASI TIM TEKNIS (m² / meter) ───
  verifiedLandArea?: number;         // Luas Lahan Terverifikasi Fisik (m²)
  verifiedBuildingArea?: number;     // Luas Tapak/Dasar Bangunan Terverifikasi (m²)
  verifiedTotalFloorArea?: number;   // Luas Total Lantai Terverifikasi (m²)

  // ─── BARU: SPATIAL ERROR / GALAT SPASIAL DARI BACKEND (m² & %) ───
  landAreaErrorSqm?: number;
  landAreaErrorPercent?: number;
  buildingAreaErrorSqm?: number;
  buildingAreaErrorPercent?: number;
  totalFloorAreaErrorSqm?: number;
  totalFloorAreaErrorPercent?: number;
  rthAreaErrorSqm?: number;
  rthAreaErrorPercent?: number;

  // ─── BARU: AUTOMATED BYLAWS AUDIT (COMPLIANCE FLAGS) ───
  isKdbCompliant?: boolean | null;
  isKlbCompliant?: boolean | null;
  isKdhCompliant?: boolean | null;
  isGsbCompliant?: boolean | null;
  isRthAreaCompliant?: boolean | null;

  // ─── REVISI: METADATA HASIL EVALUASI KKPR AKHIR ───
  kkprVerdict?: KKPRVerdict;       // Sesuai | Sesuai Bersyarat | Perlu Perbaikan / Revisi | Tidak Sesuai / Ditolak
  kkprVerifiedAt?: string;         // ISO 8601 Timestamp verifikasi
  kkprVerifierName?: string;       // Nama lengkap verifikator

  // ─── REVISI: DYNAMIC CHECKLIST EVALUASI MANDIRI DINAS ───
  evaluationChecklist?: EvaluationChecklistItem[];

  // ─── SNAPSHOT METADATA DOKUMEN TELAAH STAF (Fase 2) ───
  telaahStaf?: {
    idTelaah: string;
    verdict: string;
    isOverridden: boolean;
    overrideReason?: string | null;
    createdAt: string;
    payload: any;
  };

  // ─── SNAPSHOT METADATA KEPUTUSAN DRAF SK (TAHAP 5 INTEGRASI) ───
  skDraft?: SkDraft | null;

  // ─── SILSILAH PERMOHONAN SELF-REFERENTIAL ───
  baseline_source?: 'DIGITAL' | 'LEGACY' | null;
  parent_id_permohonan?: string | null;
  legacy_metadata?: LegacyMetadata | null;

  // SINKRONISASI ROOT LEVEL PROPERTIES UNTUK DETAIL QUERY REVISI (GET HOOK)
  replaced_sk_number?: string | null;
  replaced_sk_date?: string | null;
  replaced_sk_doc_url?: string | null;

  // ─── DETAIL TPU & KOMPENSASI DEKLARASI MANDIRI ───
  tpu?: {
    method: 'MANDIRI' | 'EKSISTING' | 'KERJASAMA' | 'KOMPENSASI_UANG' | 'INTEGRASI_WARGA';
    area?: number;
    namaTpu?: string;
    pengurusTpu?: string;
    noPks?: string;
    nominalKompensasi?: number;
    alamat?: string;
    koordinat?: string;
    buktiDokumenUrl?: string;   // URL bukti dokumen PKS/setoran retribusi TPU
    statusVerifikasi?: 'PENDING' | 'APPROVED' | 'REJECTED';
    catatanVerifikasi?: string;
    diverifikasiOleh?: string;
    diverifikasiPada?: string;
  };
  compensations?: {
    id: string;
    type: 'LAHAN_SAWAH' | 'LAHAN_MAKAM_FISIK' | 'LAHAN_MAKAM_UANG' | 'PSU_FISIK_TAMBAHAN';
    requiredAreaM2: number;
    fulfillmentMethod: 'PENYEDIAAN_FISIK_OFFSITE' | 'KOMPENSASI_UANG' | 'KERJASAMA_PIHAK_KETIGA';
    locationAddress?: string;
    nominalAmount?: number;
    documentUrl?: string;
    status: 'BELUM_TERPENUHI' | 'PROSES_VERIFIKASI' | 'TERPENUHI';
  }[];

  // ─── PEMBARUAN v5.5: PEMETAAN RELASI SPASIAL INSPEKSI ───
  inspection_logs?: FieldInspectionLog[];
  aerial_inspection?: AerialInspectionLog | null;
}