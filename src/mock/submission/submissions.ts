import type { Submission } from '@/features/submission/types';

export const mockSubmissions: Submission[] = [
  {
    id: 'sub-1',
    submissionNo: 'SIPAS-2026-001',
    housingName: 'Grand Cibinong mixed-use',
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
      lat: -6.485,
      lng: 106.840,
      address: 'Kawasan Pemda, Tengah, Kec. Cibinong, Kabupaten Bogor, Jawa Barat',
      polygon: [
        [-6.483, 106.838],
        [-6.483, 106.842],
        [-6.487, 106.842],
        [-6.487, 106.840],
        [-6.485, 106.840],
        [-6.485, 106.838],
      ],
      roadPolygons: [
        [
          [-6.484, 106.8385],
          [-6.484, 106.8415],
          [-6.4842, 106.8415],
          [-6.4842, 106.8385],
        ],
        [
          [-6.484, 106.8413],
          [-6.484, 106.8417],
          [-6.4865, 106.8417],
          [-6.4865, 106.8413],
        ]
      ],
      rthPolygons: [
        [
          [-6.4831, 106.8385],
          [-6.4831, 106.840],
          [-6.4838, 106.840],
          [-6.4838, 106.8385],
        ]
      ],
      psuPolygons: [
        [
          [-6.4831, 106.8402],
          [-6.4831, 106.8418],
          [-6.4838, 106.8418],
          [-6.4838, 106.8402],
        ]
      ],
      kavlingPolygons: [
        [
          [-6.4843, 106.8385],
          [-6.4843, 106.8398],
          [-6.4848, 106.8398],
          [-6.4848, 106.8385],
        ],
        [
          [-6.4843, 106.840],
          [-6.4843, 106.8412],
          [-6.4848, 106.8412],
          [-6.4848, 106.840],
        ],
        [
          [-6.4845, 106.8402],
          [-6.4845, 106.8412],
          [-6.4865, 106.8412],
          [-6.4865, 106.8402],
        ]
      ]
    },
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
      activityName: 'Grand Cibinong mixed-use',
      category: 'PERUMAHAN'
    },
    locationDetails: {
      locationName: 'Lahan Cibinong Pemda',
      village: 'Tengah',
      district: 'Cibinong',
      city: 'Kabupaten Bogor',
      province: 'Jawa Barat',
      fullAddress: 'Kawasan Pemda, Tengah, Kec. Cibinong, Kabupaten Bogor, Jawa Barat',
      landArea: 25000,
      ownershipStatus: 'SHM',
      certificateNumber: 'SHM No. 10293/Cibinong',
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
      waterSystem: 'PDAM Tirta Kahuripan'
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
        [-6.5710, 106.8720],
        [-6.5705, 106.8750],
        [-6.5720, 106.8770],
        [-6.5740, 106.8760],
        [-6.5745, 106.8730],
        [-6.5730, 106.8715],
      ],
      roadPolygons: [
        [
          [-6.5715, 106.8722],
          [-6.5712, 106.8748],
          [-6.5725, 106.8765],
          [-6.5727, 106.8763],
          [-6.5714, 106.8746],
          [-6.5717, 106.8722]
        ]
      ],
      rthPolygons: [
        [
          [-6.5730, 106.8720],
          [-6.5725, 106.8740],
          [-6.5738, 106.8745],
          [-6.5740, 106.8725],
        ]
      ],
      psuPolygons: [
        [
          [-6.5710, 106.8752],
          [-6.5718, 106.8762],
          [-6.5722, 106.8758],
          [-6.5714, 106.8748]
        ]
      ],
      kavlingPolygons: [
        [
          [-6.5728, 106.8748],
          [-6.5726, 106.8754],
          [-6.5732, 106.8752],
          [-6.5734, 106.8746],
        ],
        [
          [-6.5734, 106.8750],
          [-6.5732, 106.8758],
          [-6.5738, 106.8755],
          [-6.5740, 106.8747],
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
    housingName: 'Ciawi Hotel & Resort Area',
    developerName: 'PT Graha Kencana',
    landArea: 8000,
    submissionDate: '2026-06-15',
    status: 'Verifikasi Teknis',
    kdbPercent: 58.6,
    klbValue: 5.5,
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
      lat: -6.655,
      lng: 106.865,
      address: 'Jl. Raya Puncak - Gadog No.45, Bendungan, Kec. Ciawi, Kabupaten Bogor, Jawa Barat',
      polygon: [
        [-6.653, 106.863],
        [-6.653, 106.867],
        [-6.657, 106.867],
        [-6.657, 106.865],
        [-6.655, 106.865],
        [-6.655, 106.863],
      ],
      roadPolygons: [
        [
          [-6.654, 106.8635],
          [-6.654, 106.8665],
          [-6.6545, 106.8665],
          [-6.6545, 106.8635],
        ]
      ],
      rthPolygons: [
        [
          [-6.6531, 106.8635],
          [-6.6531, 106.8645],
          [-6.6538, 106.8645],
          [-6.6538, 106.8635],
        ]
      ],
      psuPolygons: [
        [
          [-6.6531, 106.8650],
          [-6.6531, 106.8665],
          [-6.6538, 106.8665],
          [-6.6538, 106.8650],
        ]
      ],
      kavlingPolygons: [
        [
          [-6.6548, 106.8635],
          [-6.6548, 106.8645],
          [-6.6558, 106.8645],
          [-6.6558, 106.8635],
        ],
        [
          [-6.6550, 106.8655],
          [-6.6550, 106.8665],
          [-6.6568, 106.8665],
          [-6.6568, 106.8655],
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
      activityName: 'Ciawi Hotel & Resort Area',
      category: 'NON_PERUMAHAN'
    },
    locationDetails: {
      locationName: 'Lahan Pakuan Heights',
      village: 'Bendungan',
      district: 'Ciawi',
      city: 'Kabupaten Bogor',
      province: 'Jawa Barat',
      fullAddress: 'Jl. Raya Puncak - Gadog No.45, Bendungan, Kec. Ciawi, Kabupaten Bogor, Jawa Barat',
      landArea: 8000,
      ownershipStatus: 'SHM',
      certificateNumber: 'SHM No. 892/Bendungan',
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
      klb: 5.5,
      kdh: 11.2,
      parkingCapacity: 150,
      maxFloors: 10,
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
    housingName: 'Gunung Putri Industrial Park',
    developerName: 'PT Bangun Bumi Persada',
    landArea: 32000,
    submissionDate: '2026-06-10',
    status: 'Disetujui',
    kdbPercent: 54.8,
    klbValue: 3.5,
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
      lat: -6.425,
      lng: 106.905,
      address: 'Kawasan Industri Wanaherang, Kec. Gunung Putri, Kabupaten Bogor, Jawa Barat',
      polygon: [
        [-6.422, 106.902],
        [-6.422, 106.908],
        [-6.426, 106.908],
        [-6.426, 106.904],
        [-6.424, 106.902],
      ],
      roadPolygons: [
        [
          [-6.423, 106.9025],
          [-6.423, 106.9075],
          [-6.4233, 106.9075],
          [-6.4233, 106.9025],
        ]
      ],
      rthPolygons: [
        [
          [-6.4221, 106.9025],
          [-6.4221, 106.9075],
          [-6.4228, 106.9075],
          [-6.4228, 106.9025],
        ]
      ],
      psuPolygons: [
        [
          [-6.4235, 106.9025],
          [-6.4235, 106.9040],
          [-6.4245, 106.9040],
          [-6.4245, 106.9025],
        ]
      ],
      kavlingPolygons: [
        [
          [-6.4235, 106.9045],
          [-6.4235, 106.9075],
          [-6.4255, 106.9075],
          [-6.4255, 106.9045],
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
      activityName: 'Gunung Putri Industrial Park',
      category: 'PERUMAHAN'
    },
    locationDetails: {
      locationName: 'Lahan Gunung Putri Wanaherang',
      village: 'Wanaherang',
      district: 'Gunung Putri',
      city: 'Kabupaten Bogor',
      province: 'Jawa Barat',
      fullAddress: 'Kawasan Industri Wanaherang, Kec. Gunung Putri, Kabupaten Bogor, Jawa Barat',
      landArea: 32000,
      ownershipStatus: 'SHM',
      certificateNumber: 'SHM No. 441/Wanaherang',
      certificateOwner: 'PT Bangun Bumi Persada'
    },
    spatial: {
      kkprNumber: '503/KKPR/PUPR/2026/020',
      landUse: 'Zona Industri / Pergudangan',
      greenArea: 4544
    },
    technical: {
      lotCount: 180,
      housingType: 'NON_SUBSIDI',
      cemeteryArea: 640,
      roadRowMain: '14 Meter',
      roadRowLocal: '8 Meter',
      waterSystem: 'Sumur Bor Terpusat'
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
    housingName: 'Puncak Mountain Villa Resort',
    developerName: 'PT Jaya Real Estate',
    landArea: 12000,
    submissionDate: '2026-06-08',
    status: 'Ditolak',
    kdbPercent: 60.5,
    klbValue: 2.2,
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
      lat: -6.695,
      lng: 106.935,
      address: 'Jl. Raya Puncak Km. 82, Cisarua, Kec. Cisarua, Kabupaten Bogor, Jawa Barat',
      polygon: [
        [-6.693, 106.932],
        [-6.693, 106.937],
        [-6.696, 106.938],
        [-6.698, 106.935],
        [-6.696, 106.932],
      ],
      roadPolygons: [
        [
          [-6.694, 106.9325],
          [-6.694, 106.9375],
          [-6.6943, 106.9375],
          [-6.6943, 106.9325],
        ]
      ],
      rthPolygons: [
        [
          [-6.6931, 106.9325],
          [-6.6931, 106.9375],
          [-6.6938, 106.9375],
          [-6.6938, 106.9325],
        ]
      ],
      psuPolygons: [
        [
          [-6.6945, 106.9325],
          [-6.6945, 106.9345],
          [-6.6955, 106.9345],
          [-6.6955, 106.9325],
        ]
      ],
      kavlingPolygons: [
        [
          [-6.6945, 106.9350],
          [-6.6945, 106.9358],
          [-6.6952, 106.9358],
          [-6.6952, 106.9350],
        ],
        [
          [-6.6945, 106.9362],
          [-6.6945, 106.9370],
          [-6.6952, 106.9370],
          [-6.6952, 106.9362],
        ],
        [
          [-6.6958, 106.9350],
          [-6.6958, 106.9358],
          [-6.6965, 106.9358],
          [-6.6965, 106.9350],
        ],
        [
          [-6.6958, 106.9362],
          [-6.6958, 106.9370],
          [-6.6965, 106.9370],
          [-6.6965, 106.9362],
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
      activityName: 'Puncak Mountain Villa Resort',
      category: 'NON_PERUMAHAN'
    },
    locationDetails: {
      locationName: 'Lahan Batu Tulis Puncak',
      village: 'Cisarua',
      district: 'Cisarua',
      city: 'Kabupaten Bogor',
      province: 'Jawa Barat',
      fullAddress: 'Jl. Raya Puncak Km. 82, Cisarua, Kec. Cisarua, Kabupaten Bogor, Jawa Barat',
      landArea: 12000,
      ownershipStatus: 'SHM',
      certificateNumber: 'SHM No. 673/Cisarua',
      certificateOwner: 'Ir. Heru Prasetyo'
    },
    spatial: {
      kkprNumber: '503/KKPR/PUPR/2026/304',
      landUse: 'Zona Pariwisata / Villa',
      greenArea: 1452
    },
    technical: {
      buildingBlocks: 2,
      kdb: 60.5,
      klb: 2.2,
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