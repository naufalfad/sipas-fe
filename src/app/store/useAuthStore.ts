import { create } from 'zustand';

export interface UserAuthProfile {
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

export const useAuthStore = create<AuthState>((set) => ({
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
  }
}));
