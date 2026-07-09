// --- FILE: src/app/store/useAuthStore.ts ---
import { create } from 'zustand';

// ─── SECTION 1: GLOBAL APP PERMISSIONS CONSTANTS (Erasable Syntax Compatible) ─────

export const AppPermission = {
  CAN_CREATE_SUBMISSION: 'CAN_CREATE_SUBMISSION',
  CAN_VERIFY_ADMIN: 'CAN_VERIFY_ADMIN',
  CAN_VERIFY_TECHNICAL: 'CAN_VERIFY_TECHNICAL',
  CAN_ENDORSE_KABID: 'CAN_ENDORSE_KABID',
  CAN_SIGN_KADIS: 'CAN_SIGN_KADIS',
} as const;

export type AppPermission = (typeof AppPermission)[keyof typeof AppPermission];

// ─── SECTION 2: CORE ROLE-PERMISSION POLICY MAPPING (Protected Variations) ───
// Centralized Source of Truth untuk memisahkan nama jabatan (Role) dari tindakan (Permission)

const ROLE_PERMISSIONS: Record<string, AppPermission[]> = {
  'PEMOHON': [
    AppPermission.CAN_CREATE_SUBMISSION
  ],
  'ADMIN': [
    AppPermission.CAN_VERIFY_ADMIN
  ],
  'TIM_TEKNIS': [
    AppPermission.CAN_VERIFY_TECHNICAL
  ],
  'KABID_PUPR': [
    AppPermission.CAN_ENDORSE_KABID
  ],
  'KADIS': [
    AppPermission.CAN_SIGN_KADIS
  ],
  'SUPER_ADMIN': [
    AppPermission.CAN_CREATE_SUBMISSION,
    AppPermission.CAN_VERIFY_ADMIN,
    AppPermission.CAN_VERIFY_TECHNICAL,
    AppPermission.CAN_ENDORSE_KABID,
    AppPermission.CAN_SIGN_KADIS,
  ],
};

// ─── SECTION 3: SYSTEM ROLE RESOLVER (Type Safety & Defensiveness) ────────────
// Menormalisasi format input string peran (DB UPPER_SNAKE vs FE Display) secara aman.

const normalizeRoleForCheck = (role: string): string => {
  const r = role.toUpperCase().trim();
  if (r === 'PEMOHON') return 'PEMOHON';
  if (r === 'ADMIN' || r === 'ADMIN SIPAS' || r === 'ADMIN_SIPAS') return 'ADMIN';
  if (r === 'TIM_TEKNIS' || r === 'TIM TEKNIS') return 'TIM_TEKNIS';
  if (r === 'KABID_PUPR' || r === 'KEPALA BIDANG' || r === 'KABID') return 'KABID_PUPR';
  if (r === 'KADIS' || r === 'KEPALA DINAS') return 'KADIS';
  if (r === 'SUPER_ADMIN' || r === 'SUPER ADMIN') return 'SUPER_ADMIN';
  return r;
};

// ─── SECTION 4: STATE STORE ANTARMUKA & IMPLEMENTASI ─────────────────────────

export interface UserAuthProfile {
  id?: number; // Tambahan (Fase 1): Penjajakan ID unik pengguna dari database backend
  username: string;
  email: string;
  full_name: string;
  role: string;
  nip?: string | null;
  company?: string | null;
  phone?: string | null;
  status: string;
}

interface AuthState {
  token: string | null;
  user: UserAuthProfile | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserAuthProfile) => void;
  logout: () => void;
  updateUser: (user: Partial<UserAuthProfile>) => void;
  /** Evaluator hak akses operasional pendaftaran / verifikasi terdesentralisasi */
  hasPermission: (permission: AppPermission) => boolean;
}

// Helper to safely parse user from localStorage
const getSavedUser = (): UserAuthProfile | null => {
  try {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: getSavedUser(),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return {};
      const newUser = { ...state.user, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  hasPermission: (permission: AppPermission): boolean => {
    const user = get().user;
    if (!user) return false;

    const resolvedRole = normalizeRoleForCheck(user.role);
    const permissions = ROLE_PERMISSIONS[resolvedRole] || [];
    return permissions.includes(permission);
  }
}));