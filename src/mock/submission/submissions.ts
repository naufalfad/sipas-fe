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
    },
    // Detailed form fields
    applicant: {
      type: 'BADAN_USAHA',
      name: 'PT Maju Jaya Sentosa',
      nib: '9120301938192',
      npwp: '01.234.567.8-901.000',
      directorName: 'Ahmad Fauzi',
      phone: '081234567890',
      email: 'ahmad.fauzi@majujaya.co.id',
      address: 'Gedung Sentosa Lt. 4, Jl. Jend. Sudirman No. 10, Jakarta Pusat'
    },
    submissionDetails: {
      submissionType: 'BARU',
      activityName: 'Grand Bogor Residence',
      category: 'PERUMAHAN'
    },
    locationDetails: {
      locationName: 'Lahan Baranangsiang',
      village: 'Baranangsiang',
      district: 'Bogor Timur',
      city: 'Kota Bogor',
      province: 'Jawa Barat',
      fullAddress: 'Jl. Raya Pajajaran No.21, Baranangsiang, Kec. Bogor Timur, Kota Bogor, Jawa Barat',
      landArea: 25000,
      ownershipStatus: 'SHM',
      certificateNumber: 'SHM No. 10293/Baranangsiang',
      certificateOwner: 'PT Maju Jaya Sentosa'
    },
    spatial: {
      kkprNumber: '503/KKPR/PUPR/2026/089',
      landUse: 'Zona Perumahan Kepadatan Sedang',
      greenArea: 3850
    },
    technical: {
      lotCount: 120,
      housingType: 'NON_SUBSIDI',
      cemeteryArea: 500,
      roadRowMain: '12 Meter',
      roadRowLocal: '8 Meter',
      waterSystem: 'PDAM Tirta Pakuan'
    },
    consultant: {
      consultantName: 'Ir. Hermawan Pratama',
      companyName: 'CV Rencana Semesta',
      picName: 'Hermawan Pratama'
    },
    photos: {
      photoNorth: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
      photoSouth: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=400&q=80',
      photoEast: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      photoWest: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
      photoAccess: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'
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
    },
    applicant: {
      type: 'BADAN_USAHA',
      name: 'PT Properti Indah Raya',
      nib: '8120309923123',
      npwp: '02.444.555.6-777.000',
      directorName: 'Bambang Triyono',
      phone: '081399887766',
      email: 'bambang.t@propertiindah.com',
      address: 'Wisma Properti Lt. 8, Jl. TB Simatupang No. 45, Jakarta Selatan'
    },
    submissionDetails: {
      submissionType: 'BARU',
      activityName: 'Sentul Green Valley',
      category: 'PERUMAHAN'
    },
    locationDetails: {
      locationName: 'Sentul Valley Hills',
      village: 'Citaringgul',
      district: 'Babakan Madang',
      city: 'Kabupaten Bogor',
      province: 'Jawa Barat',
      fullAddress: 'Kawasan Sentul City, Kec. Babakan Madang, Kabupaten Bogor, Jawa Barat',
      landArea: 120000,
      ownershipStatus: 'HGB',
      certificateNumber: 'HGB No. 556/Citaringgul',
      certificateOwner: 'PT Properti Indah Raya'
    },
    spatial: {
      kkprNumber: '503/KKPR/PUPR/2026/042',
      landUse: 'Perumahan Kepadatan Rendah / Villa',
      greenArea: 8736
    },
    technical: {
      lotCount: 450,
      housingType: 'CAMPURAN',
      cemeteryArea: 2400,
      roadRowMain: '16 Meter',
      roadRowLocal: '9 Meter',
      waterSystem: 'WTP Mandiri / PDAM'
    },
    consultant: {
      consultantName: 'Amir Hamzah, M.T.',
      companyName: 'PT Cipta Karya Persada',
      picName: 'Amir Hamzah'
    },
    photos: {
      photoNorth: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
      photoSouth: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=400&q=80',
      photoEast: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      photoWest: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
      photoAccess: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'
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
    },
    applicant: {
      type: 'BADAN_USAHA',
      name: 'PT Graha Kencana',
      nib: '9120401827361',
      npwp: '01.555.666.7-888.000',
      directorName: 'Hendra Setiawan',
      phone: '081122334455',
      email: 'hendra.s@grahakencana.co.id',
      address: 'Pakuwon Tower Lt. 15, Jl. Casablanca Raya, Jakarta Selatan'
    },
    submissionDetails: {
      submissionType: 'BARU',
      activityName: 'Pakuan Executive Heights',
      category: 'NON_PERUMAHAN'
    },
    locationDetails: {
      locationName: 'Lahan Pakuan Heights',
      village: 'Muarasari',
      district: 'Bogor Selatan',
      city: 'Kota Bogor',
      province: 'Jawa Barat',
      fullAddress: 'Jl. Pakuan No.3, Kec. Bogor Selatan, Kota Bogor, Jawa Barat',
      landArea: 8000,
      ownershipStatus: 'SHM',
      certificateNumber: 'SHM No. 892/Muarasari',
      certificateOwner: 'PT Graha Kencana'
    },
    spatial: {
      kkprNumber: '503/KKPR/PUPR/2026/112',
      landUse: 'Zona Perdagangan dan Jasa (Komersial)',
      greenArea: 2072
    },
    technical: {
      buildingBlocks: 3,
      kdb: 58.6,
      klb: 3.1,
      kdh: 11.2,
      parkingCapacity: 150,
      maxFloors: 5,
      totalFloorArea: 24000
    },
    consultant: {
      consultantName: 'Dian Sastro, M.Arch',
      companyName: 'PT Dinamika Arsitek Nusantara',
      picName: 'Dian Sastro'
    },
    photos: {
      photoNorth: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
      photoSouth: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=400&q=80',
      photoEast: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      photoWest: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
      photoAccess: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'
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
    },
    applicant: {
      type: 'BADAN_USAHA',
      name: 'PT Bangun Bumi Persada',
      nib: '8120301928374',
      npwp: '01.999.888.7-666.000',
      directorName: 'H. Suryadi',
      phone: '081288889999',
      email: 'suryadi@bangunbumi.co.id',
      address: 'Komp. Ruko Pajajaran No. 5, Jl. Pajajaran, Kota Bogor'
    },
    submissionDetails: {
      submissionType: 'BARU',
      activityName: 'Pajajaran Regency',
      category: 'PERUMAHAN'
    },
    locationDetails: {
      locationName: 'Lahan Pajajaran Tengah',
      village: 'Babakan',
      district: 'Bogor Tengah',
      city: 'Kota Bogor',
      province: 'Jawa Barat',
      fullAddress: 'Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat',
      landArea: 32000,
      ownershipStatus: 'SHM',
      certificateNumber: 'SHM No. 441/Babakan',
      certificateOwner: 'PT Bangun Bumi Persada'
    },
    spatial: {
      kkprNumber: '503/KKPR/PUPR/2026/020',
      landUse: 'Zona Pemukiman Kepadatan Tinggi',
      greenArea: 4544
    },
    technical: {
      lotCount: 180,
      housingType: 'NON_SUBSIDI',
      cemeteryArea: 640,
      roadRowMain: '14 Meter',
      roadRowLocal: '8 Meter',
      waterSystem: 'PDAM / Sumur Bor Terpusat'
    },
    consultant: {
      consultantName: 'Ir. Rudi Hartono',
      companyName: 'PT Rancang Bangun Bogor',
      picName: 'Rudi Hartono'
    },
    photos: {
      photoNorth: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
      photoSouth: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=400&q=80',
      photoEast: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      photoWest: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
      photoAccess: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'
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
    },
    applicant: {
      type: 'BADAN_USAHA',
      name: 'PT Jaya Real Estate',
      nib: '8120304918273',
      npwp: '01.333.444.5-666.000',
      directorName: 'Ir. Heru Prasetyo',
      phone: '081255556666',
      email: 'heru.p@jayarealestate.com',
      address: 'Jaya Tower Lt. 12, Jl. MH Thamrin No. 8, Jakarta Pusat'
    },
    submissionDetails: {
      submissionType: 'BARU',
      activityName: 'Batu Tulis Residence',
      category: 'NON_PERUMAHAN'
    },
    locationDetails: {
      locationName: 'Lahan Batu Tulis',
      village: 'Batutulis',
      district: 'Bogor Selatan',
      city: 'Kota Bogor',
      province: 'Jawa Barat',
      fullAddress: 'Batu Tulis, Kec. Bogor Selatan, Kota Bogor, Jawa Barat',
      landArea: 12000,
      ownershipStatus: 'SHM',
      certificateNumber: 'SHM No. 673/Batutulis',
      certificateOwner: 'Ir. Heru Prasetyo'
    },
    spatial: {
      kkprNumber: '503/KKPR/PUPR/2026/304',
      landUse: 'Zona Cagar Budaya & Resapan Air',
      greenArea: 1452
    },
    technical: {
      buildingBlocks: 2,
      kdb: 60.5,
      klb: 3.2,
      kdh: 12.1,
      parkingCapacity: 40,
      maxFloors: 3,
      totalFloorArea: 9000
    },
    consultant: {
      consultantName: 'Ir. Wahyu Hidayat',
      companyName: 'PT Wahyu Konsultan Teknik',
      picName: 'Wahyu Hidayat'
    },
    photos: {
      photoNorth: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
      photoSouth: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=400&q=80',
      photoEast: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      photoWest: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
      photoAccess: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'
    }
  }
];