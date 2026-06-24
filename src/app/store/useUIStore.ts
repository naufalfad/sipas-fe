import { create } from 'zustand';

export type UserRole = 'Pemohon' | 'Admin SIPAS' | 'Tim Teknis' | 'Kepala Bidang' | 'Super Admin';

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

interface UIState {
  sidebarOpen: boolean;
  activeRole: UserRole;
  userProfile: UserProfile;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveRole: (role: UserRole) => void;
  setUserProfile: (profile: UserProfile) => void;
}

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

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeRole: 'Super Admin',
  userProfile: roleProfiles['Super Admin'],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveRole: (role) => set({ 
    activeRole: role, 
    userProfile: roleProfiles[role] 
  }),
  setUserProfile: (profile) => set({ userProfile: profile }),
}));
