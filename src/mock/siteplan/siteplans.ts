import type { SitePlan } from '../../features/siteplan/types';

export const mockSitePlans: SitePlan[] = [
  {
    id: 'sp-1',
    approvalNo: '503/SK-SP/2026/042',
    submissionNo: 'SIPAS-2026-004',
    housingName: 'Pajajaran Regency',
    developerName: 'PT Bangun Bumi Persada',
    landArea: 32000,
    approvedDate: '2026-06-14',
    documentUrl: '#',
    coordinates: {
      lat: -6.601552,
      lng: 106.808776,
      polygon: [
        [-6.6005, 106.8080],
        [-6.6005, 106.8095],
        [-6.6025, 106.8095],
        [-6.6025, 106.8080],
      ]
    }
  },
  {
    id: 'sp-2',
    approvalNo: '503/SK-SP/2026/015',
    submissionNo: 'SIPAS-2026-000',
    housingName: 'Pakuan Green Garden',
    developerName: 'PT Graha Lestari',
    landArea: 42000,
    approvedDate: '2026-04-12',
    documentUrl: '#',
    coordinates: {
      lat: -6.611200,
      lng: 106.799500,
      polygon: [
        [-6.6100, 106.7985],
        [-6.6100, 106.8005],
        [-6.6125, 106.8005],
        [-6.6125, 106.7985],
      ]
    }
  }
];
