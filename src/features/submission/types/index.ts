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
  polygon?: [number, number][]; // Coordinates for GIS site plan layout
}

export interface Submission {
  id: string;
  submissionNo: string;
  housingName: string;
  developerName: string;
  landArea: number; // in square meters
  submissionDate: string;
  status: SubmissionStatus;
  documents: {
    id: string;
    name: string;
    type: 'pdf' | 'cad' | 'image';
    url: string;
    uploadedAt: string;
  }[];
  history: StatusHistory[];
  location: ProjectLocation;
}
