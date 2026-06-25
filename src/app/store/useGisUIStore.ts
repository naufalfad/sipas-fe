import { create } from 'zustand';

export type GisPanelType =
    | 'layer-kewajiban'
    | 'basemap-gallery'
    | 'katalog-perusahaan'
    | 'detil-perusahaan'
    | 'telemetri-lingkungan'
    | 'tugas-patroli'
    | 'detail-tugas'
    | 'armada-tracking'
    | 'hasil-pencarian'
    | 'tentang'
    | 'ai-copilot'
    | 'sensor-management';

export interface GisPanel {
    id: string;
    type: GisPanelType;
    title: string;
    payload?: any;
}

interface GisUIState {
    activeLayers: string[];
    mapOpacity: number;
    maskOpacity: number;
    selectedCompanyId: string | null;
    mapZoom: number;
    mapCenter: [number, number];
    activeBaseMap: string;
    activePanels: GisPanel[];

    toggleLayer: (layerId: string) => void;
    setMapOpacity: (opacity: number) => void;
    setMaskOpacity: (opacity: number) => void;
    setSelectedCompanyId: (id: string | null) => void;
    setMapZoom: (zoom: number) => void;
    setMapCenter: (center: [number, number]) => void;
    setActiveBaseMap: (baseMap: string) => void;
    openPanel: (type: GisPanelType, title: string, payload?: any) => void;
    closePanel: (id: string) => void;
    closePanelsToTheRight: (index: number) => void;
}

export const useGisUIStore = create<GisUIState>((set) => ({
    activeLayers: ['layer-masterplan', 'layer-siteplan', 'layer-gs'],
    mapOpacity: 80,
    maskOpacity: 30,
    selectedCompanyId: null,
    mapZoom: 11,
    mapCenter: [-6.4816, 106.8560],
    activeBaseMap: 'voyager',
    activePanels: [],

    toggleLayer: (layerId) => set((state) => ({
        activeLayers: state.activeLayers.includes(layerId)
            ? state.activeLayers.filter((id) => id !== layerId)
            : [...state.activeLayers, layerId]
    })),

    setMapOpacity: (mapOpacity) => set({ mapOpacity }),

    setMaskOpacity: (maskOpacity) => set({ maskOpacity }),

    setSelectedCompanyId: (selectedCompanyId) => set({ selectedCompanyId }),

    setMapZoom: (mapZoom) => set({ mapZoom }),

    setMapCenter: (mapCenter) => set({ mapCenter }),

    setActiveBaseMap: (activeBaseMap) => set({ activeBaseMap }),

    openPanel: (type, title, payload) => set((state) => {
        // Prevent duplicate panels of the same type
        const exists = state.activePanels.find(p => p.type === type);
        if (exists) {
            return {
                activePanels: state.activePanels.map(p => p.type === type ? { ...p, title, payload } : p)
            };
        }
        const newPanel = {
            id: `${type}-${Date.now()}`,
            type,
            title,
            payload
        };
        return {
            activePanels: [...state.activePanels, newPanel]
        };
    }),

    closePanel: (id) => set((state) => ({
        activePanels: state.activePanels.filter((p) => p.id !== id && p.type !== id)
    })),

    closePanelsToTheRight: (index) => set((state) => ({
        activePanels: state.activePanels.slice(0, index + 1)
    }))
}));