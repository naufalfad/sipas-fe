import type { Submission } from '@/features/submission/types';

export const mockSubmissions: Submission[] = [
  {
    id: 'sub-1',
    submissionNo: 'SIPAS-2026-001',
    housingName: 'Grand Bogor Residence',
    developerName: 'PT Maju Jaya Sentosa',
    landArea: 25000,
    submissionDate: '2026-06-20',
    status: 'Menunggu Verifikasi',
    documents: [
      { id: 'doc-1-1', name: 'Surat Permohonan.pdf', type: 'pdf', url: '#', uploadedAt: '2026-06-20' },
      { id: 'doc-1-2', name: 'Sertifikat Tanah Hak Milik.pdf', type: 'pdf', url: '#', uploadedAt: '2026-06-20' },
      { id: 'doc-1-3', name: 'File CAD SitePlan Rencana.dwg', type: 'cad', url: '#', uploadedAt: '2026-06-20' },
    ],
    history: [
      { date: '2026-06-20 09:00', status: 'Draft', notes: 'Pengajuan dibuat oleh pemohon', actor: 'Ahmad Fauzi (Developer)' },
      { date: '2026-06-20 10:30', status: 'Menunggu Verifikasi', notes: 'Berkas berhasil dikirim dan menunggu pemeriksaan berkas', actor: 'Ahmad Fauzi (Developer)' }
    ],
    location: {
      lat: -6.595189,
      lng: 106.816629,
      address: 'Jl. Raya Pajajaran No.21, Baranangsiang, Kec. Bogor Timur, Kota Bogor, Jawa Barat',
      polygon: [
        [-6.5945, 106.8160],
        [-6.5945, 106.8175],
        [-6.5960, 106.8175],
        [-6.5960, 106.8160],
      ]
    }
  },
  {
    id: 'sub-2',
    submissionNo: 'SIPAS-2026-002',
    housingName: 'Sentul Green Valley',
    developerName: 'PT Properti Indah Raya',
    landArea: 48000,
    submissionDate: '2026-06-18',
    status: 'Verifikasi Administrasi',
    documents: [
      { id: 'doc-2-1', name: 'Surat Pengantar Dinas.pdf', type: 'pdf', url: '#', uploadedAt: '2026-06-18' },
      { id: 'doc-2-2', name: 'Sertifikat Peta Bidang BPN.pdf', type: 'pdf', url: '#', uploadedAt: '2026-06-18' },
      { id: 'doc-2-3', name: 'Layout Rencana Spasial.dwg', type: 'cad', url: '#', uploadedAt: '2026-06-18' },
    ],
    history: [
      { date: '2026-06-18 14:00', status: 'Draft', notes: 'Drafting data oleh developer', actor: 'PT Properti Indah Raya' },
      { date: '2026-06-18 16:15', status: 'Menunggu Verifikasi', notes: 'Diajukan secara online', actor: 'PT Properti Indah Raya' },
      { date: '2026-06-19 09:00', status: 'Verifikasi Administrasi', notes: 'Pemeriksaan berkas administrasi (KTP, Sertifikat Tanah)', actor: 'Siti Rahma (Admin SIPAS)' }
    ],
    location: {
      lat: -6.572412,
      lng: 106.874251,
      address: 'Kawasan Sentul City, Kec. Babakan Madang, Kabupaten Bogor, Jawa Barat',
      polygon: [
        [-6.5710, 106.8730],
        [-6.5710, 106.8755],
        [-6.5735, 106.8755],
        [-6.5735, 106.8730],
      ]
    }
  },
  {
    id: 'sub-3',
    submissionNo: 'SIPAS-2026-003',
    housingName: 'Pakuan Executive Heights',
    developerName: 'PT Graha Kencana',
    landArea: 18500,
    submissionDate: '2026-06-15',
    status: 'Verifikasi Teknis',
    documents: [
      { id: 'doc-3-1', name: 'Dokumen Kesesuaian Tata Ruang.pdf', type: 'pdf', url: '#', uploadedAt: '2026-06-15' },
      { id: 'doc-3-2', name: 'SitePlan CAD Spasial Final.dwg', type: 'cad', url: '#', uploadedAt: '2026-06-15' },
    ],
    history: [
      { date: '2026-06-15 11:00', status: 'Menunggu Verifikasi', notes: 'Pengajuan dikirim', actor: 'PT Graha Kencana' },
      { date: '2026-06-16 10:00', status: 'Verifikasi Administrasi', notes: 'Berkas lengkap secara administrasi', actor: 'Siti Rahma (Admin)' },
      { date: '2026-06-17 13:00', status: 'Verifikasi Teknis', notes: 'Pemeriksaan kesesuaian ruang, GSB, RTH, dan jalan oleh Tim Teknis', actor: 'Ir. Budi Santoso (Tim Teknis)' }
    ],
    location: {
      lat: -6.619042,
      lng: 106.802315,
      address: 'Jl. Pakuan No.3, Kec. Bogor Selatan, Kota Bogor, Jawa Barat',
      polygon: [
        [-6.6180, 106.8015],
        [-6.6180, 106.8030],
        [-6.6200, 106.8030],
        [-6.6200, 106.8015],
      ]
    }
  },
  {
    id: 'sub-4',
    submissionNo: 'SIPAS-2026-004',
    housingName: 'Pajajaran Regency',
    developerName: 'PT Bangun Bumi Persada',
    landArea: 32000,
    submissionDate: '2026-06-10',
    status: 'Disetujui',
    documents: [
      { id: 'doc-4-1', name: 'SK Pengesahan Site Plan.pdf', type: 'pdf', url: '#', uploadedAt: '2026-06-14' },
      { id: 'doc-4-2', name: 'Site Plan Disahkan.pdf', type: 'pdf', url: '#', uploadedAt: '2026-06-14' },
    ],
    history: [
      { date: '2026-06-10 08:30', status: 'Menunggu Verifikasi', notes: 'Daftar pengajuan masuk', actor: 'PT Bangun Bumi' },
      { date: '2026-06-11 11:00', status: 'Verifikasi Administrasi', notes: 'Administrasi OK', actor: 'Siti Rahma (Admin)' },
      { date: '2026-06-12 14:00', status: 'Verifikasi Teknis', notes: 'Teknis GIS dan CAD disetujui', actor: 'Ir. Budi Santoso (Tim Teknis)' },
      { date: '2026-06-13 10:00', status: 'Menunggu Persetujuan', notes: 'Rekomendasi persetujuan dikirim ke Kabid', actor: 'Ir. Budi Santoso' },
      { date: '2026-06-14 09:30', status: 'Disetujui', notes: 'Site plan disahkan oleh Kepala Bidang. SK telah terbit.', actor: 'Dr. Hendra Wijaya (Kabid)' }
    ],
    location: {
      lat: -6.601552,
      lng: 106.808776,
      address: 'Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat',
      polygon: [
        [-6.6005, 106.8080],
        [-6.6005, 106.8095],
        [-6.6025, 106.8095],
        [-6.6025, 106.8080],
      ]
    }
  },
  {
    id: 'sub-5',
    submissionNo: 'SIPAS-2026-005',
    housingName: 'Batu Tulis Residence',
    developerName: 'PT Jaya Real Estate',
    landArea: 12000,
    submissionDate: '2026-06-08',
    status: 'Ditolak',
    documents: [
      { id: 'doc-5-1', name: 'Layout Gambar Rencana.dwg', type: 'cad', url: '#', uploadedAt: '2026-06-08' },
    ],
    history: [
      { date: '2026-06-08 10:00', status: 'Menunggu Verifikasi', notes: 'Dikirim', actor: 'PT Jaya Real Estate' },
      { date: '2026-06-09 13:00', status: 'Verifikasi Administrasi', notes: 'Administrasi lolos', actor: 'Siti Rahma' },
      { date: '2026-06-10 16:00', status: 'Verifikasi Teknis', notes: 'Ditolak karena letak rencana jalan menabrak area sempadan sungai yang dilindungi.', actor: 'Ir. Budi Santoso (Tim Teknis)' },
      { date: '2026-06-11 11:00', status: 'Ditolak', notes: 'Ditolak secara resmi oleh sistem dengan alasan teknis sempadan sungai.', actor: 'Ir. Budi Santoso (Tim Teknis)' }
    ],
    location: {
      lat: -6.621234,
      lng: 106.811234,
      address: 'Batu Tulis, Kec. Bogor Selatan, Kota Bogor, Jawa Barat',
      polygon: [
        [-6.6205, 106.8105],
        [-6.6205, 106.8120],
        [-6.6220, 106.8120],
        [-6.6220, 106.8105],
      ]
    }
  }
];
