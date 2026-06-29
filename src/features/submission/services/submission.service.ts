import { mockSubmissions } from '@/mock/submission/submissions';
import type { Submission } from '../types';
import type { FullSubmissionFormValues } from '../schemas/submissionFormSchema';

export const SubmissionService = {
  getAll: async (): Promise<Submission[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockSubmissions]), 400);
    });
  },
  getById: async (id: string): Promise<Submission | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSubmissions.find(s => s.id === id || s.submissionNo === id)), 300);
    });
  },
  create: async (data: FullSubmissionFormValues): Promise<Submission> => {
    return new Promise((resolve) => {
      const newSub: Submission = {
        id: `sub-${Date.now()}`,
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
            [-6.5945, 106.8160],
            [-6.5945, 106.8175],
            [-6.5960, 106.8175],
            [-6.5960, 106.8160],
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
  },
  updateStatus: async (id: string, status: string, actor: string, notes: string): Promise<Submission | undefined> => {
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
  }
};

