/**
 * ============================================================================
 * SIPAS FRONTEND API SERVICE — PKKPR Module [pkkprApi.ts]
 * ============================================================================
 * Menghubungkan antarmuka UI dengan REST API `/api/pkkpr` di backend.
 * ============================================================================
 */

import { API_BASE_URL as BASE_URL } from '@/config';
import type {
  PKKPRListItem,
  PKKPRDetail,
  SubmitPKKPRPayload,
  EvaluateSpatialPayload,
  RecordFPRPayload,
  DraftSKPayload
} from '../types/pkkpr.types';

const PKKPR_BASE = `${BASE_URL}/api/pkkpr`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const pkkprApi = {
  /** Pemohon mengajukan berkas permohonan PKKPR baru */
  async submit(payload: SubmitPKKPRPayload): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal mengajukan permohonan PKKPR.');
    }
    return res.json();
  },

  /** Mengambil daftar antrean permohonan sesuai role pengguna */
  async list(statusFilter?: string): Promise<PKKPRListItem[]> {
    const url = statusFilter
      ? `${PKKPR_BASE}/list?status_filter=${encodeURIComponent(statusFilter)}`
      : `${PKKPR_BASE}/list`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal memuat daftar permohonan PKKPR.');
    }
    return res.json();
  },

  /** Mengambil SK PKKPR yang berstatus DISETUJUI milik pemohon */
  async getMyApprovedSK(): Promise<PKKPRListItem[]> {
    const res = await fetch(`${PKKPR_BASE}/my-approved-sk`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal memuat SK PKKPR aktif.');
    }
    return res.json();
  },

  /** Mengambil detail lengkap permohonan PKKPR */
  async getDetail(id: string): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Gagal memuat detail permohonan ${id}.`);
    }
    return res.json();
  },

  /** Admin mengunci berkas verifikasi administrasi */
  async claimAdmin(id: string): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}/claim-admin`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal mengunci berkas administrasi.');
    }
    return res.json();
  },

  /** Admin melepaskan kunci berkas */
  async releaseAdmin(id: string): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}/release-admin`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal melepaskan kunci berkas.');
    }
    return res.json();
  },

  /** Admin memverifikasi formal dokumen berkas */
  async verifyAdmin(id: string, action: 'APPROVE' | 'REJECT', notes?: string): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}/verify-admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal memverifikasi dokumen.');
    }
    return res.json();
  },

  /** Tim Teknis mengunci berkas kajian spasial */
  async claimTechnical(id: string): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}/claim-technical`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal mengunci berkas teknis.');
    }
    return res.json();
  },

  /** Tim Teknis melepaskan kunci berkas */
  async releaseTechnical(id: string): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}/release-technical`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal melepaskan kunci teknis.');
    }
    return res.json();
  },

  /** Tim Teknis menetapkan parameter hasil analisis spasial dinas */
  async evaluateSpatial(id: string, payload: EvaluateSpatialPayload): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}/evaluate-spatial`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal menyimpan hasil kajian spasial.');
    }
    return res.json();
  },

  /** Mencatat notula & rekomendasi sidang komite FPR */
  async recordFPR(id: string, payload: RecordFPRPayload): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}/record-fpr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal mencatat notula sidang FPR.');
    }
    return res.json();
  },

  /** Kabid merumuskan dan memaraf draf SK */
  async draftSK(id: string, payload: DraftSKPayload): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}/draft-sk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal merumuskan draf SK.');
    }
    return res.json();
  },

  /** Kepala Dinas menandatangani SK resmi via TTE */
  async signKadisTTE(id: string, final_sk_number: string, passphrase_pin: string): Promise<PKKPRDetail> {
    const res = await fetch(`${PKKPR_BASE}/${id}/sign-tte`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ final_sk_number, passphrase_pin })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal menandatangani TTE SK.');
    }
    return res.json();
  },

  /** Validasi apakah poligon Site Plan berada 100% di dalam SK PKKPR */
  async validateContainment(pkkpr_id: string, siteplan_geometry: any): Promise<{
    is_covered: boolean;
    area_outside_m2: number;
    message: string;
  }> {
    const res = await fetch(`${PKKPR_BASE}/validate-siteplan-containment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pkkpr_id, siteplan_geometry })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal memvalidasi kepatuhan spasial.');
    }
    return res.json();
  },

  /** Mengambil ringkasan kuota pemanfaatan lahan bertahap berdasarkan SK PKKPR */
  async getQuotaSummary(pkkpr_id: string): Promise<import('../types/pkkpr.types').PKKPRQuotaSummary> {
    const res = await fetch(`${PKKPR_BASE}/${pkkpr_id}/quota-summary`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal memuat ringkasan kuota PKKPR.');
    }
    return res.json();
  },

  /** Validasi pre-flight pengajuan Site Plan bertahap (kuota, batas, dan overlap) */
  async validatePhasedSitePlan(
    payload: import('../types/pkkpr.types').ValidatePhasedSitePlanPayload
  ): Promise<import('../types/pkkpr.types').ValidatePhasedSitePlanResponse> {
    const res = await fetch(`${PKKPR_BASE}/${payload.pkkpr_id}/validate-phased-siteplan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal melakukan validasi site plan bertahap.');
    }
    return res.json();
  }
};
