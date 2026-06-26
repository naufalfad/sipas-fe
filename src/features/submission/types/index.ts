
export type SubmissionStatus =
  | 'Draft'
  | 'Menunggu Verifikasi'
  | 'Verifikasi Administrasi'
  | 'Verifikasi Teknis'
  | 'Menunggu Persetujuan'
  | 'Disetujui'
  | 'Ditolak';

export interface StatusHistory {
  date: string;
  status: SubmissionStatus;
  notes: string;
  actor: string;
}

export interface ProjectLocation {
  lat: number;
  lng: number;
  address: string;
  polygon?: [number, number][]; // Poligon batas luar bidang tanah site plan
  // --- SUB-POLIGON CAD DETAIL SITE PLAN (SLIDE 6) ---
  kavlingPolygons?: [number, number][][]; // Blok kavling-kavling unit rumah (Slate)
  rthPolygons?: [number, number][][];     // Area Ruang Terbuka Hijau (Emerald/Hijau)
  psuPolygons?: [number, number][][];     // Area Utilitas/Fasum (Teal)
  roadPolygons?: [number, number][][];    // Area Jaringan Jalan & Saluran (Slate Terang)
}

export interface Submission {
  id: string;
  submissionNo: string;
  housingName: string;
  developerName: string;
  landArea: number; // Dalam satuan meter persegi (m²)
  submissionDate: string;
  status: SubmissionStatus;
  // Penambahan parameter hasil hitung sistem (Slide 6)
  kdbPercent?: number;  
  klbValue ?: number;   
  kdhPercent ?: number; 
  rthArea ?: number;    
  psuArea ?: number;     
  roadArea ?: number;   
  documents: {
    id: string;
    name: string;
    type: 'pdf' | 'cad' | 'image';
    url: string;
    uploadedAt: string;
  } [];
  history: StatusHistory[];
  location: ProjectLocation;
}