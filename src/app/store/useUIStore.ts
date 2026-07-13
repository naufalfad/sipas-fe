import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { API_BASE_URL } from '@/config';

// ─── DEFINISI TIPE & ANTARMUKA MODULAR ──────────────────────────────────────────

export type UserRole =
  | 'Pemohon'
  | 'Admin SIPAS'
  | 'Tim Teknis'
  | 'Kepala Bidang'
  | 'Kadis'          // Peran Baru: Otoritas Utama Penandatangan Elektronik (TTE) SK Resmi
  | 'Super Admin';

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
  | 'SUBMIT_UNIFIED_FORM'          // Pengajuan Dokumen
  | 'VERIFY_ADMIN_APPROVED'        // Verifikasi Administrasi (Lolos)
  | 'VERIFY_ADMIN_REJECTED'        // Verifikasi Administrasi (Ditolak)
  | 'VERIFY_TECHNICAL_APPROVED'    // Verifikasi Teknis (Lolos/Kirim draf)
  | 'VERIFY_TECHNICAL_REJECTED'    // Verifikasi Teknis (Ditolak/Revisi)
  | 'REGISTER_DISPENSASI'          // Pendaftaran jaminan kompensasi oleh petugas
  | 'KABID_ENDORSE_APPROVE'        // Draft SK Persetujuan Siteplan (Disetujui Kabid)
  | 'KABID_OVERRIDE_VETO'          // Draft SK Persetujuan Siteplan (Override Veto Kabid)
  | 'APPROVE_KADIS_TTE'            // Permohonan Disetujui (SK Terbit oleh Kadis via BSrE)
  | 'FORCE_BYPASS_WARNING'         // Jejak audit jika petugas menimpa peringatan sistem
  | 'UNKNOWN';
  statusBefore: string;
  statusAfter: string;
  notes: string;                   // Justifikasi/pesan audit
  ipAddress: string;               // Keamanan alamat jaringan
  digitalSignatureHash?: string;   // Enkripsi hash resmi hasil respons BSrE API
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
  setAuditLogs: (entries: AuditTrailEntry[]) => void;
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
  'Kadis': {
    name: 'Drs. H. Mulyana, M.Si. (Kadis)',
    email: 'mulyana.kadis@sipas.go.id',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=faces',
  },
  'Super Admin': {
    name: 'Admin Utama (Super Admin)',
    email: 'superadmin@sipas.go.id',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
  },
};

// Helper to get initial UI state from sessionStorage to keep it synced on refresh
const getInitialUIState = (): { activeRole: UserRole; userProfile: UserProfile } => {
  try {
    const savedUserStr = sessionStorage.getItem('user');
    if (savedUserStr) {
      const user = JSON.parse(savedUserStr);
      const r = user.role.toUpperCase().trim();
      let activeRole: UserRole = 'Super Admin';
      if (r === 'PEMOHON') activeRole = 'Pemohon';
      else if (r === 'ADMIN' || r === 'ADMIN SIPAS' || r === 'ADMIN_SIPAS') activeRole = 'Admin SIPAS';
      else if (r === 'TIM_TEKNIS' || r === 'TIM TEKNIS') activeRole = 'Tim Teknis';
      else if (r === 'KABID_PUPR' || r === 'KEPALA BIDANG' || r === 'KABID') activeRole = 'Kepala Bidang';
      else if (r === 'KADIS' || r === 'KEPALA DINAS') activeRole = 'Kadis';
      else if (r === 'SUPER_ADMIN' || r === 'SUPER ADMIN') activeRole = 'Super Admin';

      const defaultProfile = roleProfiles[activeRole] || roleProfiles['Super Admin'];
      const userProfile: UserProfile = {
        name: user.full_name || defaultProfile.name,
        email: user.email || defaultProfile.email,
        avatar: user.role === 'PEMOHON'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
          : defaultProfile.avatar
      };
      return { activeRole, userProfile };
    }
  } catch (e) {
    console.error("Failed to parse user from session storage for UI initial state", e);
  }
  return {
    activeRole: 'Super Admin',
    userProfile: roleProfiles['Super Admin']
  };
};

const initialUI = getInitialUIState();

// ─── IMPLEMENTASI DETIL STORE ──────────────────────────────────────────────────

export const useUIStore = create<UIState>((set) => ({
  // ── State Awal ───────────────────────────────────────────────────────────
  sidebarOpen: true,
  activeRole: initialUI.activeRole,
  userProfile: initialUI.userProfile,

  auditTrailLogs: [
    // Data dummy riwayat log awal untuk melengkapi fungsionalitas visual tabel audit
    {
      id: 'audit-log-101',
      submissionId: 'sub-4',
      timestamp: '2026-06-14T09:30:00Z',
      actorName: 'Drs. H. Mulyana, M.Si. (Kadis)',
      role: 'Kadis',
      action: 'APPROVE_KADIS_TTE',
      statusBefore: 'Proses TTE',
      statusAfter: 'Disetujui',
      notes: 'SK Site Plan resmi disahkan & diterbitkan oleh Kepala Dinas. Kode TTE tersemat legal.',
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
      notes: 'Rencana jalan komplek melanggar garis sempadan sungai Cipakancilan sejauh 5 meter. Berkas dikembalikan.',
      ipAddress: '10.252.120.89'
    }
  ],

  // ── Implementasi Actions: Kontrol Sidebar & Akun ─────────────────────────

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setActiveRole: async (role) => {
    let username = 'kabid@geocitra.com';
    if (role === 'Pemohon') username = 'pemohon@geocitra.com';
    else if (role === 'Admin SIPAS') username = 'admin@geocitra.com';
    else if (role === 'Tim Teknis') username = 'tim_teknis@geocitra.com';
    else if (role === 'Kepala Bidang') username = 'kabid@geocitra.com';
    else if (role === 'Kadis') username = 'kadis@geocitra.com'; // Sinkronisasi ke kredensial KADIS di seeder
    else if (role === 'Super Admin') username = 'superadmin@geocitra.com';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username,
          password: 'password123'
        })
      });
      if (response.ok) {
        const data = await response.json();
        // Update useAuthStore secara transaksional
        useAuthStore.getState().login(data.access_token, data.user);
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

  // ── Actions: Audit Trail Logging [Bogor 7] ────────────────────────────────

  addAuditLog: (entry) => set((state) => {
    // Generate mock properties untuk kelengkapan audit
    const generatedId = `audit-log-${Date.now()}`;
    const currentIsoTimestamp = new Date().toISOString();

    // Simulasi penentuan IP Address statis dinas vs pemohon untuk keamanan audit log
    const mockIp = entry.role === 'Pemohon' ? '180.252.14.120' : '10.252.120.103';

    // Generate tanda tangan enkripsi hash tiruan jika merupakan tindakan persetujuan TTE BSrE [Bogor 7]
    const isSigningAction = ['APPROVE_KADIS_TTE'].includes(entry.action);
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

  // Replace/merge audit logs dari server ke lokal store secara idempotent
  setAuditLogs: (entries) => set((state) => {
    const existingByKey = new Map(state.auditTrailLogs.map(l => [l.id, l]));
    entries.forEach((e) => {
      existingByKey.set(e.id, e);
    });
    // Menjaga urutan waktu menurun (descending order / terbaru di atas)
    const merged = Array.from(existingByKey.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { auditTrailLogs: merged };
  }),

  clearAuditLogs: () => set({ auditTrailLogs: [] })
}));