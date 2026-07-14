/**
 * ============================================================================
 * GEOSIPAS SUBMISSION SERVICE — [src/features/submission/services/submission.service.ts] (REVISED v5.1)
 * ============================================================================
 * Peran: Menangani seluruh komunikasi HTTP REST API dengan server backend.
 *        Diperbarui penuh untuk mendukung pengiriman silsilah permohonan lama (Revisi),
 *        payload metrik usulan pemohon (proposed), serta pengiriman hasil audit
 *        dinas beserta data verifikator per aspek (verified_by_id, verified_at).
 * ============================================================================
 */

import type { Submission, SubmissionStatus, EvaluationChecklistItem } from '../types';
import type { FullSubmissionFormValues } from '../schemas/submissionFormSchema';
import { API_BASE_URL as API_BASE_URL_CONFIG } from '@/config';

export const API_BASE_URL = `${API_BASE_URL_CONFIG}/api/v1/submissions`;

const getAuthHeaders = (extraHeaders?: Record<string, string>) => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extraHeaders
  };
};

export interface SubmissionListParams {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSubmissions {
  data: Submission[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const SubmissionService = {
  /**
   * Mengambil daftar permohonan aktif dengan pencarian, penapisan, dan paginasi.
   */
  getAll: async (params: SubmissionListParams = {}): Promise<PaginatedSubmissions> => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'Semua') query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const url = query.toString() ? `${API_BASE_URL}?${query.toString()}` : API_BASE_URL;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Gagal memuat daftar permohonan (HTTP ${response.status})`);
    }
    return await response.json();
  },

  /**
   * Mengambil SEMUA permohonan tanpa paginasi (untuk GIS, dashboard, dan verifikasi).
   * Mengembalikan array Submission[] langsung.
   */
  getAllList: async (): Promise<Submission[]> => {
    const query = new URLSearchParams({ limit: '1000', page: '1' });
    const response = await fetch(`${API_BASE_URL}?${query.toString()}`, { headers: getAuthHeaders() });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Gagal memuat daftar permohonan (HTTP ${response.status})`);
    }
    const result = await response.json();
    // Jika endpoint mengembalikan envelope terpaginasi, ekstrak .data
    return Array.isArray(result) ? result : (result.data ?? []);
  },

  /**
   * Mengambil satu data permohonan spesifik berdasarkan ID Permohonan.
   */
  getById: async (id: string): Promise<Submission> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Permohonan dengan ID ${id} tidak ditemukan (HTTP ${response.status})`);
    }
    return await response.json();
  },

  /**
   * Membuat atau memperbarui draf/berkas pengajuan site plan (Proposed Metrics & Revisi Silsilah).
   * Properti baseline_source, parent_id_permohonan, dan legacy_metadata otomatis disalurkan murni.
   */
  create: async (data: FullSubmissionFormValues, isDraft = false): Promise<Submission> => {
    const id_permohonan = data.id_permohonan || `sub-${Date.now()}`;
    const payload = {
      id_permohonan,
      is_draft: isDraft,
      ...data
    };

    try {
      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Gagal menyimpan permohonan ke API backend');
      }

      const result = await response.json();
      const createdId = result?.data?.id_permohonan || id_permohonan;
      return await SubmissionService.getById(createdId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan permohonan ke API backend';
      throw new Error(errorMessage);
    }
  },

  /**
   * ─── REVISI: UPDATE STATUS & KIRIM HASIL AUDIT TEKNIS SPASIAL MANUAL ───
   * Mengirimkan keputusan verifikasi, angka hitung ulang dinas (KDB/GSB),
   * serta dynamic checklist ke API `/verify` di backend dengan audit verifikator lengkap.
   */
  updateStatus: async (
    id: string,
    status: SubmissionStatus,
    actor: string,
    notes: string,
    passphrase?: string,
    signatureBase64?: string,
    // Override jenis keputusan pengembalian berkas internal
    actionTypeOverride?: 'APPROVE' | 'REJECT' | 'REVERT_TO_TECHNICAL' | 'REVERT_TO_ADMINISTRATIVE' | 'OVERRIDE_VERDICT' | 'SAVE_TECHNICAL_MATRIX',

    // Parameter Teknis Verifikasi Lapisan Dinas (Verified)
    kkpr_verdict?: string,
    verified_kdb?: number,
    verified_klb?: number,
    verified_kdh?: number,
    verified_gsb?: number,
    verified_rth_area?: number,
    checklist_items?: EvaluationChecklistItem[]
  ): Promise<Submission | undefined> => {

    // 1. Ekstrak data aktor dan peran
    const nameMatch = actor.match(/^([^(]+)/);
    const roleMatch = actor.match(/\(([^)]+)\)/);
    const actor_name = nameMatch ? nameMatch[1].trim() : actor;
    const rawRole = roleMatch ? roleMatch[1].trim() : 'Pemohon';

    // Map role FE ke model string enum di database backend secara presisi (SoD Alignment)
    let role = 'ADMIN';
    if (rawRole.toUpperCase().includes('KABID') || rawRole.toUpperCase().includes('BIDANG')) {
      role = 'KABID_PUPR';
    } else if (rawRole.toUpperCase().includes('KADIS') || rawRole.toUpperCase().includes('DINAS')) {
      role = 'KADIS'; // Pemetaan Otoritas TTE Kepala Dinas
    } else if (rawRole.toUpperCase().includes('TEKNIS')) {
      role = 'TIM_TEKNIS';
    } else if (rawRole.toUpperCase().includes('PEMOHON')) {
      role = 'PEMOHON';
    }

    // Tentukan action_type: utamakan override eksplisit (misal untuk revert internal)
    const action_type: string = actionTypeOverride ?? (status === 'Ditolak' ? 'REJECT' : 'APPROVE');

    // 2. Transformasikan key checklist FE (camelCase) ke BE (snake_case)
    // Serta menambatkan data audit (verified_by_id, verified_at) secara langsung
    const formattedChecklist = checklist_items?.map((item) => ({
      aspek_code: item.aspekCode,
      aspek_label: item.aspekLabel,
      status_kelayakan: item.statusKelayakan,
      catatan_verifikator: item.catatanVerifikator || null,
      attachment_url: item.attachmentUrl || null,
      verified_by_id: item.verifiedById || null,
      verified_at: item.verifiedAt || null
    })) || [];

    // Mengaitkan NIP Pejabat Penandatangan / Pengesah secara default
    const resolvedNip = role === 'KADIS' ? '197503112000031001' : (role === 'KABID_PUPR' ? '198402122010011003' : undefined);

    const payload = {
      actor_name,
      role,
      nip: resolvedNip,
      passphrase: passphrase || undefined,
      signature_base64: signatureBase64 || undefined,
      action_type,
      notes,
      is_spatially_compliant: true,

      // Injeksi parameter komparasi teknis revisi
      kkpr_verdict: kkpr_verdict || undefined,
      verified_kdb: verified_kdb ?? undefined,
      verified_klb: verified_klb ?? undefined,
      verified_kdh: verified_kdh ?? undefined,
      verified_gsb: verified_gsb ?? undefined,
      verified_rth_area: verified_rth_area ?? undefined,
      checklist_items: formattedChecklist.length > 0 ? formattedChecklist : undefined
    };

    // ── FASE 1: Kirim keputusan verifikasi ke API Backend ──────────────────
    const verifyResponse = await fetch(`${API_BASE_URL}/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!verifyResponse.ok) {
      let errMsg = `Gagal memverifikasi permohonan (HTTP ${verifyResponse.status})`;
      try {
        const errData = await verifyResponse.json();
        errMsg = errData.detail || errMsg;
      } catch { /* ignore */ }
      throw new Error(errMsg);
    }

    // ── FASE 2: Ambil data terbaru dari server untuk memperbarui UI ────────
    const refreshResponse = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });

    if (!refreshResponse.ok) {
      const errText = await refreshResponse.text();
      throw new Error(errText || `Gagal memuat ulang permohonan setelah verifikasi (HTTP ${refreshResponse.status})`);
    }

    return await refreshResponse.json();
  },

  /**
   * Mengambil seluruh detail geometri spasial internal kaveling, RTH, dan jalan.
   */
  getGeometries: async (id_permohonan: string): Promise<{
    roadPolygons?: number[][][];
    rthPolygons?: number[][][];
    psuPolygons?: number[][][];
  } | undefined> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id_permohonan}/geometries`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('API error during fetching geometries');
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn(`[SubmissionService] Gagal memuat detail geometri spasial ID ${id_permohonan} dari API backend:`, err);
      return undefined;
    }
  },
  /**
   * Mengambil statistik laporan eksekutif berdasarkan rentang bulan/tahun awal hingga bulan/tahun akhir.
   */
  getReportStats: async (startMonth: number, startYear: number, endMonth: number, endYear: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/reports/stats?start_month=${startMonth}&start_year=${startYear}&end_month=${endMonth}&end_year=${endYear}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Gagal memuat statistik laporan (HTTP ${response.status})`);
    }
    return await response.json();
  }
};