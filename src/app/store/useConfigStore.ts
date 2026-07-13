import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_BASE_URL } from '@/config';

export interface SlideBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  opacity?: number;
}

export interface ConfigState {
  sessionDuration: number; // in minutes
  idleTimeout: number; // in minutes
  isMaintenance: boolean;
  maintenanceMessage: string;
  slideBanners: SlideBanner[];
  rotationInterval: number; // in seconds
  
  fetchConfig: () => Promise<void>;
  updateSessionConfig: (duration: number, timeout: number) => void;
  toggleMaintenanceMode: (active: boolean, message: string) => void;
  addSlide: (slide: Omit<SlideBanner, 'id'>) => void;
  deleteSlide: (id: string) => void;
  updateSlide: (id: string, slide: Partial<Omit<SlideBanner, 'id'>>) => void;
  updateRotationInterval: (interval: number) => void;
}

const DEFAULT_SLIDES: SlideBanner[] = [
  {
    id: 'slide-1',
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
    title: 'Selamat Datang di GEOSIPAS',
    subtitle: 'Sistem Informasi Pelayanan Pengesahan Site Plan Digital Kabupaten Bogor Terintegrasi GIS.'
  },
  {
    id: 'slide-2',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    title: 'Akurasi Peta & Spasial Terpadu',
    subtitle: 'Validasi otomatis tumpang tindih tata ruang (KDB, KLB, KDH, GSB) secara presisi.'
  },
  {
    id: 'slide-3',
    imageUrl: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
    title: 'Efisiensi Administrasi Berjenjang',
    subtitle: 'Proses peninjauan dokumen resmi hingga penandatanganan elektronik TTE BSrE secara legal.'
  }
];

const saveToBackend = async () => {
  const state = useConfigStore.getState();
  const token = sessionStorage.getItem('token');
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        sessionDuration: state.sessionDuration,
        idleTimeout: state.idleTimeout,
        isMaintenance: state.isMaintenance,
        maintenanceMessage: state.maintenanceMessage,
        slideBanners: state.slideBanners,
        rotationInterval: state.rotationInterval
      })
    });
  } catch (err) {
    console.warn('Failed to save system config to BE', err);
  }
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      sessionDuration: 120,
      idleTimeout: 15,
      isMaintenance: false,
      maintenanceMessage: 'Sistem sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan coba beberapa saat lagi.',
      slideBanners: DEFAULT_SLIDES,
      rotationInterval: 5,

      fetchConfig: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/auth/config`);
          if (response.ok) {
            const data = await response.json();
            set({
              sessionDuration: data.sessionDuration,
              idleTimeout: data.idleTimeout,
              isMaintenance: data.isMaintenance,
              maintenanceMessage: data.maintenanceMessage,
              slideBanners: data.slideBanners,
              rotationInterval: data.rotationInterval
            });
          }
        } catch (err) {
          console.warn('Failed to fetch system config from BE', err);
        }
      },

      updateSessionConfig: async (duration, timeout) => {
        set({ sessionDuration: duration, idleTimeout: timeout });
        await saveToBackend();
      },
      toggleMaintenanceMode: async (active, message) => {
        set({ isMaintenance: active, maintenanceMessage: message });
        await saveToBackend();
      },
      addSlide: async (slide) => {
        set((state) => ({
          slideBanners: [...state.slideBanners, { ...slide, id: `slide-${Date.now()}` }]
        }));
        await saveToBackend();
      },
      deleteSlide: async (id) => {
        set((state) => ({
          slideBanners: state.slideBanners.filter((s) => s.id !== id)
        }));
        await saveToBackend();
      },
      updateSlide: async (id, updatedSlide) => {
        set((state) => ({
          slideBanners: state.slideBanners.map((s) => s.id === id ? { ...s, ...updatedSlide } : s)
        }));
        await saveToBackend();
      },
      updateRotationInterval: async (interval) => {
        set({ rotationInterval: interval });
        await saveToBackend();
      }
    }),
    {
      name: 'geosipas-system-config',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
