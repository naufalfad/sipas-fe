
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
    kdbPercent: 55.2,
    klbValue: 2.1,
    kdhPercent: 15.4,
    rthArea: 3850,
    psuArea: 1200,
    roadArea: 1500,
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
      ],
      // --- SUB-POLYGONS DETAIL SITE PLAN (CAD DRAWING LAYOUT) ---
      roadPolygons: [
        [
          [-6.5952, 106.8160],
          [-6.5952, 106.8175],
          [-6.5953, 106.8175],
          [-6.5953, 106.8160],
        ]
      ],
      rthPolygons: [
        [
          [-6.5945, 106.8160],
          [-6.5945, 106.8165],
          [-6.5950, 106.8165],
          [-6.5950, 106.8160],
        ]
      ],
      psuPolygons: [
        [
          [-6.5945, 106.8170],
          [-6.5945, 106.8175],
          [-6.5950, 106.8175],
          [-6.5950, 106.8170],
        ]
      ],
      kavlingPolygons: [
        [
          [-6.5954, 106.8160],
          [-6.5954, 106.8167],
          [-6.5959, 106.8167],
          [-6.5959, 106.8160],
        ],
        [
          [-6.5954, 106.8168],
          [-6.5954, 106.8175],
          [-6.5959, 106.8175],
          [-6.5959, 106.8168],
        ]
      ]
    }
  },
  {
    id: 'sub-2',
    submissionNo: 'SIPAS-2026-002',
    housingName: 'Sentul Green Valley',
    developerName: 'PT Properti Indah Raya',
    landArea: 120000,
    submissionDate: '2026-06-18',
    status: 'Verifikasi Administrasi',
    kdbPercent: 52.4,
    klbValue: 2.8,
    kdhPercent: 18.2,
    rthArea: 8736,
    psuArea: 2500,
    roadArea: 3200,
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
      ],
      roadPolygons: [
        [
          [-6.5720, 106.8730],
          [-6.5720, 106.8755],
          [-6.5722, 106.8755],
          [-6.5722, 106.8730],
        ]
      ],
      rthPolygons: [
        [
          [-6.5710, 106.8730],
          [-6.5710, 106.8738],
          [-6.5718, 106.8738],
          [-6.5718, 106.8730],
        ]
      ],
      psuPolygons: [
        [
          [-6.5710, 106.8745],
          [-6.5710, 106.8755],
          [-6.5718, 106.8755],
          [-6.5718, 106.8745],
        ]
      ],
      kavlingPolygons: [
        [
          [-6.5723, 106.8730],
          [-6.5723, 106.8742],
          [-6.5733, 106.8742],
          [-6.5733, 106.8730],
        ],
        [
          [-6.5723, 106.8743],
          [-6.5723, 106.8755],
          [-6.5733, 106.8755],
          [-6.5733, 106.8743],
        ]
      ]
    }
  },
  {
    id: 'sub-3',
    submissionNo: 'SIPAS-2026-003',
    housingName: 'Pakuan Executive Heights',
    developerName: 'PT Graha Kencana',
    landArea: 8000,
    submissionDate: '2026-06-15',
    status: 'Verifikasi Teknis',
    kdbPercent: 58.6,
    klbValue: 3.1,
    kdhPercent: 11.2,
    rthArea: 2072,
    psuArea: 850,
    roadArea: 1200,
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
      ],
      roadPolygons: [
        [
          [-6.6190, 106.8015],
          [-6.6190, 106.8030],
          [-6.6192, 106.8030],
          [-6.6192, 106.8015],
        ]
      ],
      rthPolygons: [
        [
          [-6.6180, 106.8015],
          [-6.6180, 106.8022],
          [-6.6188, 106.8022],
          [-6.6188, 106.8015],
        ]
      ],
      psuPolygons: [
        [
          [-6.6180, 106.8025],
          [-6.6180, 106.8030],
          [-6.6188, 106.8030],
          [-6.6188, 106.8025],
        ]
      ],
      kavlingPolygons: [
        [
          [-6.6193, 106.8015],
          [-6.6193, 106.8030],
          [-6.6199, 106.8030],
          [-6.6199, 106.8015],
        ]
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
    kdbPercent: 54.8,
    klbValue: 2.5,
    kdhPercent: 14.2,
    rthArea: 4544,
    psuArea: 1800,
    roadArea: 2100,
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
      ],
      roadPolygons: [
        [
          [-6.6012, 106.8080],
          [-6.6012, 106.8095],
          [-6.6014, 106.8095],
          [-6.6014, 106.8080],
        ]
      ],
      rthPolygons: [
        [
          [-6.6005, 106.8080],
          [-6.6005, 106.8087],
          [-6.6010, 106.8087],
          [-6.6010, 106.8080],
        ]
      ],
      psuPolygons: [
        [
          [-6.6005, 106.8089],
          [-6.6005, 106.8095],
          [-6.6010, 106.8095],
          [-6.6010, 106.8089],
        ]
      ],
      kavlingPolygons: [
        [
          [-6.6015, 106.8080],
          [-6.6015, 106.8095],
          [-6.6024, 106.8095],
          [-6.6024, 106.8080],
        ]
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
    kdbPercent: 60.5,
    klbValue: 3.2,
    kdhPercent: 12.1,
    rthArea: 1452,
    psuArea: 500,
    roadArea: 250,
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
      ],
      roadPolygons: [
        [
          [-6.6210, 106.8105],
          [-6.6210, 106.8120],
          [-6.6212, 106.8120],
          [-6.6212, 106.8105],
        ]
      ],
      rthPolygons: [
        [
          [-6.6205, 106.8105],
          [-6.6205, 106.8112],
          [-6.6209, 106.8112],
          [-6.6209, 106.8105],
        ]
      ],
      psuPolygons: [
        [
          [-6.6205, 106.8113],
          [-6.6205, 106.8120],
          [-6.6209, 106.8120],
          [-6.6209, 106.8113],
        ]
      ],
      kavlingPolygons: [
        [
          [-6.6213, 106.8105],
          [-6.6213, 106.8120],
          [-6.6219, 106.8120],
          [-6.6219, 106.8105],
        ]
      ]
    }
  }
];