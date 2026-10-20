/**
 * ============================================================================
 * SIPAS FRONTEND TYPES — PKKPR Module [pkkpr.types.ts]
 * ============================================================================
 * Sinkron 1:1 dengan kontrak Pydantic DTO Backend (pkkpr_schemas.py).
 * ============================================================================
 */

export type PKKPRStatus =
  | 'DRAFT'
  | 'PENGAJUAN_BERKAS'
  | 'VERIFIKASI_ADMINISTRASI'
  | 'KAJIAN_TEKNIS_SPASIAL'
  | 'SIDANG_FPR'
  | 'MENUNGGU_REKOMENDASI_KABID'
  | 'MENUNGGU_TTE_KADIS'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'TIDAK_BERLAKU';

export type PKKPRCategory =
  | 'NON_BERUSAHA'
  | 'BERUSAHA_PENILAIAN'
  | 'BERUSAHA_OTOMATIS';

export type FPRRecommendation =
  | 'DISETUJUI_SELURUHNYA'
  | 'DISETUJUI_SEBAGIAN'
  | 'DITOLAK';

export type PKKPRFileType =
  | 'KTP'
  | 'NIB'
  | 'BUKTI_TANAH'
  | 'PROPOSAL'
  | 'REKOM_TEKNIS'
  | 'NOTULA_FPR'
  | 'PTP_BPN'
  | 'LAINNYA';

export interface GeoJSONPolygon {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: any[];
}

export interface PKKPRFileItem {
  id: number;
  file_type: PKKPRFileType;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface FPRReviewItem {
  id: number;
  meeting_date: string;
  official_report_no: string;
  recommendation: FPRRecommendation;
  ptp_bpn_number?: string | null;
  ptp_bpn_date?: string | null;
  ptp_notes?: string | null;
  zoning_compliance_notes: string;
  infrastructure_notes?: string | null;
  environmental_notes?: string | null;
  minutes_pdf_url?: string | null;
  created_at: string;
}

export interface PKKPRDraftSKItem {
  id: number;
  draft_sk_number: string;
  considerations?: string[];
  legal_bases?: string[];
  dictum_clauses?: Record<string, any>;
  obligations?: string[];
  kabid_notes?: string | null;
  kabid_paraf_hash?: string | null;
  created_at: string;
}

export interface PKKPRListItem {
  id: string;
  submission_no: string;
  applicant_name: string;
  category: PKKPRCategory;
  status: PKKPRStatus;
  proposed_land_area_m2: number;
  location_village: string;
  location_district: string;
  created_at: string;
  elapsed_days: number;
  sla_start_date?: string | null;
  sk_number?: string | null;
  admin_lock_name?: string | null;
  technical_lock_name?: string | null;
}

export interface PKKPRDetail {
  id: string;
  submission_no: string;
  user_id: number;
  applicant_type: 'BADAN_USAHA' | 'PERORANGAN';
  applicant_name: string;
  applicant_nik?: string | null;
  applicant_nib?: string | null;
  applicant_npwp?: string | null;
  applicant_phone?: string | null;
  applicant_email?: string | null;

  category: PKKPRCategory;
  status: PKKPRStatus;
  activity_description: string;
  kbli_code?: string | null;

  location_address: string;
  location_village: string;
  location_district: string;
  location_city: string;

  proposed_land_area_m2: number;
  approved_land_area_m2?: number | null;

  // Parameter Ketetapan Ruang
  approved_kdb_max?: number | null;
  approved_klb_max?: number | null;
  approved_kdh_min?: number | null;
  approved_gsb_min?: number | null;
  approved_max_floors?: number | null;
  spatial_zone_code?: string | null;
  spatial_zone_name?: string | null;

  geometry?: GeoJSONPolygon | null;

  admin_lock_id?: number | null;
  admin_lock_name?: string | null;
  technical_lock_id?: number | null;
  technical_lock_name?: string | null;

  sk_number?: string | null;
  sk_issued_date?: string | null;
  signed_pdf_url?: string | null;
  qr_code_hash?: string | null;

  files: PKKPRFileItem[];
  fpr_reviews: FPRReviewItem[];
  sk_draft?: PKKPRDraftSKItem | null;

  created_at: string;
  updated_at: string;
}

// ─── FORM PAYLOADS ────────────────────────────────────────────────────────────

export interface SubmitPKKPRPayload {
  applicant_type: 'BADAN_USAHA' | 'PERORANGAN';
  applicant_name: string;
  applicant_nik?: string;
  applicant_nib?: string;
  applicant_npwp?: string;
  applicant_phone?: string;
  applicant_email?: string;
  category: PKKPRCategory;
  activity_description: string;
  kbli_code?: string;
  location_address: string;
  location_village: string;
  location_district: string;
  location_city: string;
  proposed_land_area_m2: number;
  geometry: GeoJSONPolygon;
}

export interface EvaluateSpatialPayload {
  approved_land_area_m2: number;
  approved_kdb_max: number;
  approved_klb_max: number;
  approved_kdh_min: number;
  approved_gsb_min: number;
  approved_max_floors?: number;
  spatial_zone_code: string;
  spatial_zone_name: string;
  technical_notes?: string;
}

export interface RecordFPRPayload {
  meeting_date: string;
  official_report_no: string;
  recommendation: FPRRecommendation;
  ptp_bpn_number?: string;
  ptp_bpn_date?: string;
  ptp_notes?: string;
  zoning_compliance_notes: string;
  infrastructure_notes?: string;
  environmental_notes?: string;
  minutes_pdf_url?: string;
}

export interface DraftSKPayload {
  draft_sk_number: string;
  considerations?: string[];
  legal_bases?: string[];
  dictum_clauses?: Record<string, any>;
  obligations?: string[];
  kabid_notes?: string;
  kabid_paraf_hash?: string;
}

// ─── PHASED SITE PLAN QUOTA TRACKING TYPES (Perbup Bogor No. 4/2025) ─────────

export interface PKKPRSitePlanItem {
  id_permohonan: string;
  submission_no: string;
  housing_name?: string | null;
  developer_name?: string | null;
  land_area: number;
  status: string;
  submission_date?: string | null;
  sk_number?: string | null;
}

export interface PKKPREnvelope {
  approved_kdb_max?: number | null;
  approved_klb_max?: number | null;
  approved_kdh_min?: number | null;
  approved_gsb_min?: number | null;
  approved_max_floors?: number | null;
  spatial_zone_code?: string | null;
  spatial_zone_name?: string | null;
}

export interface PKKPRQuotaSummary {
  pkkpr_id: string;
  submission_no: string;
  applicant_name: string;
  status: string;
  sk_number?: string | null;
  sk_issued_date?: string | null;
  total_approved_area_m2: number;
  used_area_m2: number;
  remaining_area_m2: number;
  utilization_percent: number;
  siteplans_count: number;
  siteplans: PKKPRSitePlanItem[];
  envelope?: PKKPREnvelope | null;
}

export interface ValidatePhasedSitePlanPayload {
  pkkpr_id: string;
  new_area_m2: number;
  siteplan_geometry?: any;
  exclude_permohonan_id?: string;
}

export interface ValidatePhasedSitePlanResponse {
  is_valid: boolean;
  error?: string | null;
  details?: {
    error_type?: string;
    total_approved_area_m2?: number;
    current_used_area_m2?: number;
    remaining_quota_m2?: number;
    requested_area_m2?: number;
    area_outside_m2?: number;
    conflicting_submission_no?: string;
    overlap_area_m2?: number;
    [key: string]: any;
  };
}

