import { mockSubmissions } from '@/mock/submission/submissions';
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
    try {
      const response = await fetch(API_BASE_URL, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('[SubmissionService] Gagal memuat dari API backend, menggunakan data mock lokal:', err);
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockSubmissions]), 400);
      });
    }
  },

  getById: async (id: string): Promise<Submission | undefined> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn(`[SubmissionService] Gagal memuat ID ${id} dari API backend, menggunakan data mock lokal:`, err);
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockSubmissions.find(s => s.id === id || s.submissionNo === id)), 300);
      });
    }
  },

  create: async (data: FullSubmissionFormValues): Promise<Submission> => {
    // Generasikan id_permohonan client-side agar berkas tidak yatim piatu (Logical Fallacy #3)
    const id_permohonan = `sub-${Date.now()}`;
    const payload = {
      id_permohonan,
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
      
      // Jika sukses, kita panggil getById untuk mendapatkan model kaya dari server
      const result = await response.json();
      const serverSub = await fetch(`${API_BASE_URL}/${id_permohonan}`, {
        headers: getAuthHeaders()
      }).then(res => res.json()).catch(() => null);
      if (serverSub) return serverSub;

      // Fallback object jika detail endpoint bermasalah
      return {
        id: id_permohonan,
        submissionNo: `SIPAS-2026-0${mockSubmissions.length + 1}`,
        housingName: data.submission.activityName,
        developerName: data.applicant.name,
        landArea: data.location.landArea,
        submissionDate: new Date().toISOString().split('T')[0],
        status: 'Menunggu Verifikasi',
        location: {
          lat: -6.595189,
          lng: 106.816629,
          address: data.location.fullAddress,
          polygon: data.coordinate.polygon || []
        }
      } as any;

    } catch (err) {
      console.warn('[SubmissionService] Gagal menyimpan ke API backend, menyimpan ke data mock lokal:', err);
      return new Promise((resolve) => {
        const newSub: Submission = {
          id: id_permohonan,
          submissionNo: `SIPAS-2026-0${mockSubmissions.length + 1}`,
          housingName: data.submission.activityName,
          developerName: data.applicant.name,
          landArea: data.location.landArea,
          submissionDate: new Date().toISOString().split('T')[0],
          status: 'Menunggu Verifikasi',
          documents: [
            { id: `doc-${Date.now()}-1`, name: 'Surat Permohonan.pdf', type: 'pdf', url: '#', uploadedAt: new Date().toISOString().split('T')[0] },
            { id: `doc-${Date.now()}-2`, name: 'Surat Pengantar Dinas.pdf', type: 'pdf', url: '#', uploadedAt: new Date().toISOString().split('T')[0] }
          ],
          history: [
            { date: new Date().toISOString().replace('T', ' ').slice(0, 16), status: 'Menunggu Verifikasi', notes: 'Berkas berhasil dikirim dan menunggu pemeriksaan berkas', actor: data.applicant.name }
          ],
          location: {
            lat: -6.595189 + (Math.random() - 0.5) * 0.05,
            lng: 106.816629 + (Math.random() - 0.5) * 0.05,
            address: data.location.fullAddress,
            polygon: data.coordinate.polygon || [
              [106.8160, -6.5945],
              [106.8175, -6.5945],
              [106.8175, -6.5960],
              [106.8160, -6.5960],
              [106.8160, -6.5945]
            ]
          },
          applicant: {
            type: data.applicant.type,
            name: data.applicant.name,
            nik: data.applicant.nik,
            nib: data.applicant.nib,
            npwp: data.applicant.npwp,
            directorName: data.applicant.directorName,
            phone: data.applicant.phone,
            email: data.applicant.email,
            address: data.applicant.address
          },
          submissionDetails: {
            submissionType: data.submission.submissionType,
            activityName: data.submission.activityName,
            category: data.submission.category
          },
          locationDetails: {
            locationName: data.location.locationName,
            village: data.location.village,
            district: data.location.district,
            city: data.location.city,
            province: data.location.province,
            fullAddress: data.location.fullAddress,
            landArea: data.location.landArea,
            ownershipStatus: data.location.ownershipStatus,
            certificateNumber: data.location.certificateNumber,
            certificateOwner: data.location.certificateOwner
          },
          spatial: {
            kkprNumber: data.spatial.kkprNumber,
            landUse: data.spatial.landUse,
            greenArea: data.spatial.greenArea
          },
          technical: {
            ...data.technical
          },
          consultant: {
            consultantName: data.consultant.consultantName,
            companyName: data.consultant.companyName,
            picName: data.consultant.picName
          },
          photos: {
            photoNorth: data.photo?.photoNorth instanceof File ? URL.createObjectURL(data.photo.photoNorth) : 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
            photoSouth: data.photo?.photoSouth instanceof File ? URL.createObjectURL(data.photo.photoSouth) : 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=400&q=80',
            photoEast: data.photo?.photoEast instanceof File ? URL.createObjectURL(data.photo.photoEast) : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
            photoWest: data.photo?.photoWest instanceof File ? URL.createObjectURL(data.photo.photoWest) : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
            photoAccess: data.photo?.photoAccess instanceof File ? URL.createObjectURL(data.photo.photoAccess) : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
          }
        };
        mockSubmissions.unshift(newSub);
        setTimeout(() => resolve(newSub), 500);
      });
    }
  },

  updateStatus: async (id: string, status: SubmissionStatus, actor: string, notes: string): Promise<Submission | undefined> => {
    // Parsing data aktor dan role untuk integrasi /verify
    const nameMatch = actor.match(/^([^(]+)/);
    const roleMatch = actor.match(/\(([^)]+)\)/);
    const actor_name = nameMatch ? nameMatch[1].trim() : actor;
    const role = roleMatch ? roleMatch[1].trim() : 'Pemohon';
    
    // Tentukan action_type
    const action_type = status === 'Ditolak' ? 'REJECT' : 'APPROVE';

    try {
      const response = await fetch(`${API_BASE_URL}/${id}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          actor_name,
          role,
          nip: role === 'KABID_PUPR' ? '198402122010011003' : undefined,
          action_type,
          notes,
          is_spatially_compliant: true
        })
      });
      if (!response.ok) throw new Error('API error during verify');
      
      const serverSub = await fetch(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders()
      }).then(res => res.json()).catch(() => null);
      if (serverSub) return serverSub;
    } catch (err) {
      console.warn(`[SubmissionService] Gagal verifikasi ID ${id} di API backend, mengupdate data mock lokal:`, err);
    }

    // Local update fallback
    return new Promise((resolve) => {
      const sub = mockSubmissions.find(s => s.id === id || s.submissionNo === id);
      if (sub) {
        sub.status = status;
        sub.history.push({
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status,
          notes,
          actor,
        });
      }
      setTimeout(() => resolve(sub), 500);
    });
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


