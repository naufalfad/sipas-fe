import { mockSubmissions } from '@/mock/submission/submissions';
import type { Submission } from '../types';

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
  create: async (submission: { housingName: string; landArea: number; address: string; developerName: string }): Promise<Submission> => {
    return new Promise((resolve) => {
      const newSub: Submission = {
        id: `sub-${Date.now()}`,
        submissionNo: `SIPAS-2026-0${mockSubmissions.length + 1}`,
        housingName: submission.housingName,
        developerName: submission.developerName,
        landArea: submission.landArea,
        submissionDate: new Date().toISOString().split('T')[0],
        status: 'Menunggu Verifikasi',
        documents: [
          { id: `doc-${Date.now()}-1`, name: 'Surat Permohonan.pdf', type: 'pdf', url: '#', uploadedAt: new Date().toISOString().split('T')[0] }
        ],
        history: [
          { date: new Date().toISOString().replace('T', ' ').slice(0, 16), status: 'Menunggu Verifikasi', notes: 'Berkas berhasil dikirim dan menunggu pemeriksaan berkas', actor: submission.developerName }
        ],
        location: {
          lat: -6.595189 + (Math.random() - 0.5) * 0.05,
          lng: 106.816629 + (Math.random() - 0.5) * 0.05,
          address: submission.address,
          polygon: [
            [-6.5945, 106.8160],
            [-6.5945, 106.8175],
            [-6.5960, 106.8175],
            [-6.5960, 106.8160],
          ]
        }
      };
      mockSubmissions.unshift(newSub);
      setTimeout(() => resolve(newSub), 500);
    });
  }
};
