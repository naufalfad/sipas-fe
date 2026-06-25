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

/** Target flyTo yang diobservasi oleh SipasMap via useEffect */
export interface FlyToTarget {
    longitude: number;
    latitude: number;
    zoom?: number;
    pitch?: number;
    bearing?: number;
}

interface GisUIState {
    // ── Layer & Basemap ──────────────────────────────────────────────────────
    activeLayers: string[];
    mapOpacity: number;
    maskOpacity: number;
    activeBaseMap: string;

    // ── Selection ────────────────────────────────────────────────────────────
    selectedCompanyId: string | null;

    // ── Kamera Peta ──────────────────────────────────────────────────────────
    mapZoom: number;
    /** Format [latitude, longitude] — tetap dipertahankan untuk kompatibilitas komponen lain */
    mapCenter: [number, number];
    mapPitch: number;
    mapBearing: number;
    is3DMode: boolean;

    // ── Panel Orchestrator ───────────────────────────────────────────────────
    activePanels: GisPanel[];

    /**
     * FlyTo target yang diobservasi SipasMap.
     * Setelah SipasMap mengeksekusi fly, nilainya di-reset ke null.
     * Ini menggantikan pola window.dispatchEvent('map-fly-to-coords').
     */
    flyToTarget: FlyToTarget | null;

    // ── Actions: Layer & Basemap ─────────────────────────────────────────────
    toggleLayer: (layerId: string) => void;
    setMapOpacity: (opacity: number) => void;
    setMaskOpacity: (opacity: number) => void;
    setActiveBaseMap: (baseMap: string) => void;

    // ── Actions: Selection ───────────────────────────────────────────────────
    setSelectedCompanyId: (id: string | null) => void;

    // ── Actions: Kamera ──────────────────────────────────────────────────────
    setMapZoom: (zoom: number) => void;
    setMapCenter: (center: [number, number]) => void;
    setMapPitch: (pitch: number) => void;
    setMapBearing: (bearing: number) => void;
    /** Toggle antara mode 3D (pitch=45) dan flat (pitch=0) */
    toggle3DMode: () => void;
    /** Perintahkan SipasMap untuk terbang ke koordinat tertentu */
    flyTo: (target: FlyToTarget) => void;
    /** Dipanggil oleh SipasMap setelah flyTo dieksekusi */
    clearFlyTo: () => void;

    // ── Actions: Panel ───────────────────────────────────────────────────────
    openPanel: (type: GisPanelType, title: string, payload?: any) => void;
    closePanel: (id: string) => void;
    closePanelsToTheRight: (index: number) => void;
}

export const useGisUIStore = create<GisUIState>((set) => ({
    // ── State Awal ───────────────────────────────────────────────────────────
    activeLayers: ['layer-masterplan', 'layer-siteplan', 'layer-gs'],
    mapOpacity: 80,
    maskOpacity: 30,
    selectedCompanyId: null,
    mapZoom: 11,
    mapCenter: [-6.4816, 106.8560],   // [lat, lng] — format Leaflet historis
    mapPitch: 45,                      // Default 3D immersive view
    mapBearing: -10,                   // Sedikit rotasi kompas untuk estetika
    is3DMode: true,
    activeBaseMap: 'voyager',
    activePanels: [],
    flyToTarget: null,

    // ── Implementasi Actions ─────────────────────────────────────────────────

    toggleLayer: (layerId) => set((state) => ({
        activeLayers: state.activeLayers.includes(layerId)
            ? state.activeLayers.filter((id) => id !== layerId)
            : [...state.activeLayers, layerId]
    })),

    setMapOpacity: (mapOpacity) => set({ mapOpacity }),
    setMaskOpacity: (maskOpacity) => set({ maskOpacity }),
    setActiveBaseMap: (activeBaseMap) => set({ activeBaseMap }),
    setSelectedCompanyId: (selectedCompanyId) => set({ selectedCompanyId }),
    setMapZoom: (mapZoom) => set({ mapZoom }),
    setMapCenter: (mapCenter) => set({ mapCenter }),
    setMapPitch: (mapPitch) => set({ mapPitch }),
    setMapBearing: (mapBearing) => set({ mapBearing }),

    toggle3DMode: () => set((state) => {
        const newIs3D = !state.is3DMode;
        return {
            is3DMode: newIs3D,
            mapPitch: newIs3D ? 45 : 0,
        };
    }),

    flyTo: (flyToTarget) => set({ flyToTarget }),

    clearFlyTo: () => set({ flyToTarget: null }),

    openPanel: (type, title, payload) => set((state) => {
        // Cegah duplikasi panel tipe yang sama; update payload jika sudah ada
        const exists = state.activePanels.find(p => p.type === type);
        if (exists) {
            return {
                activePanels: state.activePanels.map(p =>
                    p.type === type ? { ...p, title, payload } : p
                )
            };
        }
        const newPanel: GisPanel = {
            id: `${type}-${Date.now()}`,
            type,
            title,
            payload
        };
        return { activePanels: [...state.activePanels, newPanel] };
    }),

    closePanel: (id) => set((state) => ({
        activePanels: state.activePanels.filter((p) => p.id !== id && p.type !== id)
    })),

    closePanelsToTheRight: (index) => set((state) => ({
        activePanels: state.activePanels.slice(0, index + 1)
    })),
}));