export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Aktif' | 'Nonaktif';
}

export const mockUsers: MockUser[] = [
  { id: 'usr-1', name: 'Ahmad Fauzi', email: 'fauzi@ptmajusentosa.com', role: 'Pemohon', status: 'Aktif' },
  { id: 'usr-2', name: 'Siti Rahma', email: 'siti.rahma@sipas.go.id', role: 'Admin SIPAS', status: 'Aktif' },
  { id: 'usr-3', name: 'Ir. Budi Santoso', email: 'budi.teknis@sipas.go.id', role: 'Tim Teknis', status: 'Aktif' },
  { id: 'usr-4', name: 'Dr. Hendra Wijaya', email: 'hendra.kabid@sipas.go.id', role: 'Kepala Bidang', status: 'Aktif' },
  { id: 'usr-5', name: 'Super Administrator', email: 'superadmin@sipas.go.id', role: 'Super Admin', status: 'Aktif' },
];
