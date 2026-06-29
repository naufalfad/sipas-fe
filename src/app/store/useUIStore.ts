import { create } from 'zustand';

// ─── DEFINISI TIPE & ANTARMUKA MODULAR ──────────────────────────────────────────

export type UserRole = 'Pemohon' | 'Admin SIPAS' | 'Tim Teknis' | 'Kepala Bidang' | 'Super Admin';

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

/** Entitas Audit Trail Log untuk Jaminan Akuntabilitas Regulasi [Bogor 7] */
export interface AuditTrailEntry {
  id: string;
  submissionId: string;
  timestamp: string;               // ISO 8601 Timestamp
  actorName: string;
  role: UserRole;
  action:
  | 'SUBMIT_UNIFIED_FORM'        // Submit permohonan gabungan awal
  | 'VERIFY_ADMIN_APPROVED'      // Lolos verifikasi berkas legalitas
  | 'VERIFY_ADMIN_REJECTED'      // Dikembalikan karena cacat administrasi
  | 'VERIFY_TECHNICAL_APPROVED'  // Lolos audit spasial live Turf.js
  | 'VERIFY_TECHNICAL_REJECTED'  // Dikembalikan karena melanggar sempadan/KDB
  | 'REGISTER_DISPENSASI'        // Pendaftaran jaminan kompensasi oleh petugas
  | 'APPROVE_KABID_TTE'          // Pembubuhan TTE dinas resmi oleh KABID
  | 'SIGN_BUPATI_TTE'            // TTE khusus sekala besar (Master Plan)
  | 'FORCE_BYPASS_WARNING';      // Jejak audit jika petugas menimpa peringatan sistem
  statusBefore: string;
  statusAfter: string;
  notes: string;                   // Justifikasi/pesan audit
  ipAddress: string;               // Simulasi keamanan alamat jaringan
  digitalSignatureHash?: string;   // Simulasi enkripsi hash dari BSrE API
}

interface UIState {
  // ── State UI & Otoritas Peran ─────────────────────────────────────────────
  sidebarOpen: boolean;
  activeRole: UserRole;
  userProfile: UserProfile;

  // ── State Audit Trail Logger [Bogor 7] ────────────────────────────────────
  auditTrailLogs: AuditTrailEntry[];

  // ── Actions: Kontrol Sidebar & Akun ───────────────────────────────────────
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveRole: (role: UserRole) => void | Promise<void>;
  setUserProfile: (profile: UserProfile) => void;

  // ── Actions: Audit Trail Logging [Bogor 7] ────────────────────────────────
  addAuditLog: (entry: Omit<AuditTrailEntry, 'id' | 'timestamp' | 'ipAddress' | 'digitalSignatureHash'>) => void;
  clearAuditLogs: () => void;
}

// ─── PROFIL SIMULASI AKUN PENGGUNA (DEMO WIDGET) ──────────────────────────────

const roleProfiles: Record<UserRole, UserProfile> = {
  'Pemohon': {
    name: 'Ahmad Fauzi (Developer)',
    email: 'fauzi@ptmajusentosa.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  },
  'Admin SIPAS': {
    name: 'Siti Rahma (Admin SIPAS)',
    email: 'siti.rahma@sipas.go.id',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  },
  'Tim Teknis': {
    name: 'Ir. Budi Santoso (Tim Teknis)',
    email: 'budi.teknis@sipas.go.id',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  },
  'Kepala Bidang': {
    name: 'Dr. Hendra Wijaya (Kabid)',
    email: 'hendra.kabid@sipas.go.id',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
  },
  'Super Admin': {
    name: 'Admin Utama (Super Admin)',
    email: 'superadmin@sipas.go.id',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
  },
};

// ─── IMPLEMENTASI DETIL STORE ──────────────────────────────────────────────────

export const useUIStore = create<UIState>((set) => ({
  // ── State Awal ───────────────────────────────────────────────────────────
  sidebarOpen: true,
  activeRole: 'Super Admin',
  userProfile: roleProfiles['Super Admin'],

  auditTrailLogs: [
    // Data dummy riwayat log awal untuk melengkapi fungsionalitas visual tabel audit
    {
      id: 'audit-log-101',
      submissionId: 'sub-4',
      timestamp: '2026-06-14T09:30:00Z',
      actorName: 'Dr. Hendra Wijaya (Kabid)',
      role: 'Kepala Bidang',
      action: 'APPROVE_KABID_TTE',
      statusBefore: 'Menunggu Persetujuan',
      statusAfter: 'Disetujui',
      notes: 'Dokumen site plan dinilai lengkap secara teknis dan legalitas. TTE Dinas resmi terbit.',
      ipAddress: '10.252.120.45',
      digitalSignatureHash: 'sha256-8f3e5b12a9c148dfa5070032111690a1dd7228f2d...'
    },
    {
      id: 'audit-log-102',
      submissionId: 'sub-5',
      timestamp: '2026-06-11T11:00:00Z',
      actorName: 'Ir. Budi Santoso (Tim Teknis)',
      role: 'Tim Teknis',
      action: 'VERIFY_TECHNICAL_REJECTED',
      statusBefore: 'Verifikasi Teknis',
      statusAfter: 'Ditolak',
      notes: 'Rencana jalan komplek melanggar garis sempadan sungai Cipakancilan sejauh 5 meter. Berkas ditolak.',
      ipAddress: '10.252.120.89'
    }
  ],

  // ── Implementasi Actions: Kontrol Sidebar & Akun ─────────────────────────

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setActiveRole: async (role) => {
    let username = 'hendra_wijaya';
    if (role === 'Pemohon') username = 'ahmad_fauzi';
    else if (role === 'Admin SIPAS') username = 'siti_rahma';
    else if (role === 'Tim Teknis') username = 'budi_santoso';
    else if (role === 'Kepala Bidang') username = 'hendra_wijaya';

    try {
      const response = await fetch('http://localhost:8000/api/v1/submissions/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username,
          password: 'password123'
        })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        console.log(`[useUIStore] Berhasil sinkronisasi login JWT untuk role: ${role}`);
      }
    } catch (err) {
      console.warn(`[useUIStore] Gagal sinkronisasi token dengan BE untuk role: ${role}`, err);
    }

    set({
      activeRole: role,
      userProfile: roleProfiles[role]
    });
  },

  setUserProfile: (profile) => set({ userProfile: profile }),

  // ── Implementasi Actions: Audit Trail Logging [Bogor 7] ──────────────────

  addAuditLog: (entry) => set((state) => {
    // Generate mock properties untuk kelengkapan audit
    const generatedId = `audit-log-${Date.now()}`;
    const currentIsoTimestamp = new Date().toISOString();

    // Simulasi penentuan IP Address statis dinas vs pemohon untuk keamanan audit log
    const mockIp = entry.role === 'Pemohon' ? '180.252.14.120' : '10.252.120.103';

    // Generate tanda tangan enkripsi hash tiruan jika merupakan tindakan persetujuan TTE BSrE [Bogor 7]
    const isSigningAction = ['APPROVE_KABID_TTE', 'SIGN_BUPATI_TTE'].includes(entry.action);
    const mockHash = isSigningAction
      ? `sha256-tte-bsre-mock-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      : undefined;

    const newLogEntry: AuditTrailEntry = {
      ...entry,
      id: generatedId,
      timestamp: currentIsoTimestamp,
      ipAddress: mockIp,
      digitalSignatureHash: mockHash
    };

    return {
      // Tempatkan entri log audit terbaru di bagian teratas array (descending order)
      auditTrailLogs: [newLogEntry, ...state.auditTrailLogs]
    };
  }),

  clearAuditLogs: () => set({ auditTrailLogs: [] })
}));