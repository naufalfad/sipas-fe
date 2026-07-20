import { create } from 'zustand';

// ─── DEFINISI TIPE & ANTARMUKA MODULAR ──────────────────────────────────────────

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
    | 'sensor-management'
    | 'compensation-manager'  // Tambahan modul manajemen kompensasi
    | 'conflict-inspector';   // Tambahan modul inspeksi konflik lapangan

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

/** Representasi Data Konflik Spasial hasil Sidak Lapangan & Drone Mapping [Bogor 8] */
export interface SpatialConflict {
    id: string;
    submissionId: string;
    category: 'Sempadan Sungai' | 'Sempadan SUTET' | 'Sempadan Rel' | 'Bangunan Eksisting' | 'Hambatan Fisik';
    coordinates: [number, number]; // Format standard GeoJSON: [longitude, latitude]
    description: string;
    photoUrl?: string;
}

/** Representasi Data Lahan Kompensasi Pengganti yang Terstruktur [Purworejo 8] */
export interface LahanKompensasi {
    idKompensasi: string;
    idPermohonan: string;
    tipeKompensasi: 'LAHAN_SAWAH' | 'LAHAN_MAKAM_FISIK' | 'LAHAN_MAKAM_UANG' | 'PSU_FISIK_TAMBAHAN';
    luasKompensasiM2: number;
    nilaiNominal?: number;
    polygon: [number, number][]; // Koordinat spasial poligon [latitude, longitude][]
    statusPemenuhan: 'BELUM_TERPENUHI' | 'PROSES_VERIFIKASI' | 'TERPENUHI';
    buktiLegalitasUrl?: string;
}

// ─── SPESIFIKASI ANTARMUKA STATE (ZUSTAND STORE) ───────────────────────────────

interface GisUIState {
    // ── Layer & Basemap ──────────────────────────────────────────────────────
    activeLayers: string[];
    mapOpacity: number;
    maskOpacity: number;
    activeBaseMap: string;
    isTerrainActive: boolean;

    // ── Layer Drone (Orthophoto) & Deteksi Konflik ───────────────────────────
    isDroneLayerActive: boolean;
    droneLayerOpacity: number;
    clashGeoJson: any | null; // Buffer area hasil kalkulasi Turf.js

    // ── Selection & Data ─────────────────────────────────────────────────────
    selectedCompanyId: string | null;
    activeKompensasi: LahanKompensasi | null;

    // ── SPASIAL TEMBOLOK (ACTIVE GEOMETRIES CACHE) ───────────────────────────
    activeSubmissionGeoJson: any | null; // Menyimpan data GeoJSON FeatureCollection aktif [Fase 3]
    visibleSubLayers: string[];          // Kontrol visibilitas sub-layer dinas (KDB, Jalan, RTH, Makam)

    // ── Kamera Peta ──────────────────────────────────────────────────────────
    mapZoom: number;
    /** Format [latitude, longitude] — tetap dipertahankan untuk kompatibilitas komponen lain */
    mapCenter: [number, number];

    /** Posisi kursor mouse aktif di peta (koordinat 2D, elevation selalu null di Leaflet) */
    cursorCoords: { lat: number; lng: number; elevation: number | null } | null;

    // ── Panel Orchestrator ───────────────────────────────────────────────────
    activePanels: GisPanel[];

    /**
     * FlyTo target yang diobservasi SipasMap.
     * Setelah SipasMap mengeksekusi fly, nilainya di-reset ke null.
     */
    flyToTarget: FlyToTarget | null;

    // ── Anotasi Konflik Spasial Lapangan (Mobile GIS Survey) [Bogor 8] ───────
    spatialConflicts: SpatialConflict[];

    // ── Actions: Layer, Basemap & Drone ──────────────────────────────────────
    toggleLayer: (layerId: string) => void;
    setMapOpacity: (opacity: number) => void;
    setMaskOpacity: (opacity: number) => void;
    setActiveBaseMap: (baseMap: string) => void;
    toggleDroneLayer: () => void;
    setDroneLayerOpacity: (opacity: number) => void;
    setClashGeoJson: (geoJson: any | null) => void;
    toggleTerrain: () => void;

    // ── Actions: Selection & Kompensasi ──────────────────────────────────────
    setSelectedCompanyId: (id: string | null) => void;
    setActiveKompensasi: (kompensasi: LahanKompensasi | null) => void;
    updateKompensasiStatus: (idKompensasi: string, status: LahanKompensasi['statusPemenuhan']) => void;

    // ── Actions: Spasial Tembolok & Sub-layer ────────────────────────────────
    setActiveSubmissionGeoJson: (geoJson: any | null) => void;
    toggleSubLayer: (subLayerName: string) => void;
    clearSpatialCache: () => void; // Aksi pembersih spasial terpadu saat berpindah halaman [Fase 3]

    // ── Actions: Kamera ──────────────────────────────────────────────────────
    setMapZoom: (zoom: number) => void;
    setMapCenter: (center: [number, number]) => void;
    pitch: number;
    bearing: number;
    setPitch: (pitch: number) => void;
    setBearing: (bearing: number) => void;
    /** Perintahkan SipasMap untuk terbang ke koordinat tertentu */
    flyTo: (target: FlyToTarget) => void;
    /** Dipanggil oleh SipasMap setelah flyTo dieksekusi */
    clearFlyTo: () => void;
    /** Update posisi kursor mouse di peta */
    setCursorCoords: (coords: { lat: number; lng: number; elevation: number | null } | null) => void;

    // ── Actions: Panel ───────────────────────────────────────────────────────
    openPanel: (type: GisPanelType, title: string, payload?: any) => void;
    closePanel: (id: string) => void;
    closePanelsToTheRight: (index: number) => void;

    // ── Actions: Konflik Spasial Lapangan [Bogor 8] ──────────────────────────
    addSpatialConflict: (conflict: SpatialConflict) => void;
    removeSpatialConflict: (id: string) => void;
    clearSpatialConflicts: () => void;
}

// ─── IMPLEMENTASI DETIL STORE (IMMUTABLE UPDATE PATTERNS) ──────────────────────

export const useGisUIStore = create<GisUIState>((set) => ({
    // ── State Awal ───────────────────────────────────────────────────────────
    activeLayers: ['layer-masterplan', 'layer-siteplan', 'layer-gs'],
    mapOpacity: 80,
    maskOpacity: 30,
    isDroneLayerActive: false,
    droneLayerOpacity: 70,
    clashGeoJson: null,
    selectedCompanyId: null,
    activeKompensasi: null,
    isTerrainActive: true,

    // Spasial Tembolok & Sub-layer Default
    activeSubmissionGeoJson: null,
    visibleSubLayers: ['PTSP_KDB', 'PTSP_PSU_JALAN', 'PTSP_KDH', 'PTSP_PSU_MAKAM'],

    mapZoom: 11,
    mapCenter: [-6.4816, 106.8560],   // [lat, lng] — format Leaflet
    pitch: 0,
    bearing: 0,
    cursorCoords: null,
    activeBaseMap: 'voyager',
    activePanels: [],
    flyToTarget: null,
    spatialConflicts: [
        // Dummy data awal konflik spasial untuk keperluan prototipe interaktif
        {
            id: 'conflict-1',
            submissionId: 'sub-5',
            category: 'Sempadan Sungai',
            coordinates: [106.8115, -6.6215],
            description: 'Fondasi utama kaveling melanggar sempadan sungai Cipakancilan sejauh 5 meter.',
            photoUrl: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'
        }
    ],

    // ── Implementasi Actions: Layer, Basemap & Drone ─────────────────────────

    toggleLayer: (layerId) => set((state) => ({
        activeLayers: state.activeLayers.includes(layerId)
            ? state.activeLayers.filter((id) => id !== layerId)
            : [...state.activeLayers, layerId]
    })),

    setMapOpacity: (mapOpacity) => set({ mapOpacity }),
    setMaskOpacity: (maskOpacity) => set({ maskOpacity }),
    setActiveBaseMap: (activeBaseMap) => set({ activeBaseMap }),

    toggleDroneLayer: () => set((state) => ({
        isDroneLayerActive: !state.isDroneLayerActive
    })),

    setDroneLayerOpacity: (droneLayerOpacity) => set({ droneLayerOpacity }),
    setClashGeoJson: (clashGeoJson) => set({ clashGeoJson }),
    toggleTerrain: () => set((state) => ({ isTerrainActive: !state.isTerrainActive })),

    // ── Implementasi Actions: Selection & Kompensasi ─────────────────────────

    setSelectedCompanyId: (selectedCompanyId) => set({ selectedCompanyId }),

    setActiveKompensasi: (activeKompensasi) => set({ activeKompensasi }),

    updateKompensasiStatus: (idKompensasi, status) => set((state) => ({
        activeKompensasi: state.activeKompensasi?.idKompensasi === idKompensasi
            ? { ...state.activeKompensasi, statusPemenuhan: status }
            : state.activeKompensasi
    })),

    // ── Implementasi Actions: Spasial Tembolok & Sub-layer ───────────────────

    setActiveSubmissionGeoJson: (activeSubmissionGeoJson) => set({ activeSubmissionGeoJson }),

    toggleSubLayer: (subLayerName) => set((state) => ({
        visibleSubLayers: state.visibleSubLayers.includes(subLayerName)
            ? state.visibleSubLayers.filter((name) => name !== subLayerName)
            : [...state.visibleSubLayers, subLayerName]
    })),

    clearSpatialCache: () => set({
        activeSubmissionGeoJson: null,
        selectedCompanyId: null,
        activeKompensasi: null,
        clashGeoJson: null,
        visibleSubLayers: ['PTSP_KDB', 'PTSP_PSU_JALAN', 'PTSP_KDH', 'PTSP_PSU_MAKAM']
    }),

    // ── Implementasi Actions: Kamera ─────────────────────────────────────────

    setMapZoom: (mapZoom) => set({ mapZoom }),
    setMapCenter: (mapCenter) => set({ mapCenter }),
    setPitch: (pitch) => set({ pitch }),
    setBearing: (bearing) => set({ bearing }),

    flyTo: (flyToTarget) => set({ flyToTarget }),

    clearFlyTo: () => set({ flyToTarget: null }),

    setCursorCoords: (cursorCoords) => set({ cursorCoords }),

    // ── Implementasi Actions: Panel Orchestrator ──────────────────────────────

    openPanel: (type, title, payload) => set((state) => {
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

    // ── Implementasi Actions: Konflik Spasial Lapangan [Bogor 8] ──────────────

    addSpatialConflict: (conflict) => set((state) => ({
        spatialConflicts: [...state.spatialConflicts, conflict]
    })),

    removeSpatialConflict: (id) => set((state) => ({
        spatialConflicts: state.spatialConflicts.filter((c) => c.id !== id)
    })),

    clearSpatialConflicts: () => set({ spatialConflicts: [] })
}));