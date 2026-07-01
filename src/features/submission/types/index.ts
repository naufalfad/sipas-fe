
export type SubmissionStatus =
  | 'Draft'
  | 'Menunggu Verifikasi'
  | 'Verifikasi Administrasi'
  | 'Verifikasi Teknis'
  | 'Menunggu Persetujuan'
  | 'Proses TTE'
  | 'Disetujui'
  | 'Ditolak';

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
  // Penambahan parameter hasil hitung sistem (Slide 6)
  kdbPercent?: number;
  klbValue?: number;
  kdhPercent?: number;
  rthArea?: number;
  psuArea?: number;
  roadArea?: number;
  documents: {
    id: string;
    name: string;
    type: 'pdf' | 'cad' | 'image';
    url: string;
    uploadedAt: string;
  }[];
  history: StatusHistory[];
  location: ProjectLocation;

  // Full form details
  applicant?: ApplicantDetails;
  submissionDetails?: SubmissionDetails;
  locationDetails?: LocationDetails;
  spatial?: SpatialDetails;
  technical?: TechnicalDetails;
  consultant?: ConsultantDetails;
  photos?: PhotoDetails;
}
