import type { Submission, SubmissionStatus } from '../types';
import type { FullSubmissionFormValues } from '../schemas/submissionFormSchema';

const API_BASE_URL = 'http://localhost:8000/api/v1/submissions';

const getAuthHeaders = (extraHeaders?: Record<string, string>) => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extraHeaders
  };
};

export const SubmissionService = {
  getAll: async (): Promise<Submission[]> => {
    const response = await fetch(API_BASE_URL, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Gagal memuat daftar permohonan (HTTP ${response.status})`);
    }
    return await response.json();
  },

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

  create: async (data: FullSubmissionFormValues, isDraft = false): Promise<Submission> => {
    // Generasikan id_permohonan client-side jika belum ada (misal draf baru)
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

  updateStatus: async (id: string, status: SubmissionStatus, actor: string, notes: string, passphrase?: string): Promise<Submission | undefined> => {
    // Parsing data aktor dan role untuk integrasi /verify
    const nameMatch = actor.match(/^([^(]+)/);
    const roleMatch = actor.match(/\(([^)]+)\)/);
    const actor_name = nameMatch ? nameMatch[1].trim() : actor;
    const rawRole = roleMatch ? roleMatch[1].trim() : 'Pemohon';

    // Map role FE → BE (sesuai enum UserModel.role di database)
    let role = 'ADMIN';
    if (rawRole.toUpperCase().includes('KABID') || rawRole.toUpperCase().includes('BIDANG')) {
      role = 'KABID_PUPR';
    } else if (rawRole.toUpperCase().includes('TEKNIS')) {
      role = 'TIM_TEKNIS';
    } else if (rawRole.toUpperCase().includes('PEMOHON')) {
      role = 'PEMOHON';
    }

    // Tentukan action_type berdasarkan status target
    const action_type = status === 'Ditolak' ? 'REJECT' : 'APPROVE';

    // ── FASE 1: Kirim keputusan verifikasi ke API Backend ──────────────────
    const verifyResponse = await fetch(`${API_BASE_URL}/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        actor_name,
        role,
        nip: role === 'KABID_PUPR' ? '198402122010011003' : undefined,
        passphrase: passphrase || undefined,
        action_type,
        notes,
        is_spatially_compliant: true
      })
    });

    // Jika API mengembalikan error (4xx/5xx), ekstrak pesan dan throw — jangan fallback ke mock
    if (!verifyResponse.ok) {
      let errMsg = `Gagal memverifikasi permohonan (HTTP ${verifyResponse.status})`;
      try {
        const errData = await verifyResponse.json();
        errMsg = errData.detail || errMsg;
      } catch { /* biarkan pesan default jika response bukan JSON */ }
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
  }
};


