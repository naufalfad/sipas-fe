import { create } from 'zustand';
import type {
  BimElementMetadata,
  EnvironmentalSimLayers,
  RtcAnchorPoint,
  SunSimulationConfig,
  TileSet3DSpec,
} from '@/features/gis/bim/types';

export type BimTabType = 'persil-context' | 'bim-spec' | 'env-simulation' | 'compliance-check';

interface BimState {
  // ── Active Parcel & 3D Tiles ──────────────────────────────────────────────
  activeParcelId: string;
  activeParcelName: string;
  activeParcelNop: string;
  activeParcelAreaM2: number;
  activeParcelZone: string;
  uploadedCadFileName: string;
  activeTileset: TileSet3DSpec | null;
  rtcAnchor: RtcAnchorPoint | null;
  isLoadingTileset: boolean;

  // ── Raycasting & Selection Metadata ─────────────────────────────────────
  selectedGuid: string | null;
  selectedElementMetadata: BimElementMetadata | null;
  isSidePanelOpen: boolean;
  activeTab: BimTabType;

  // ── Navigation & Viewport Mode ──────────────────────────────────────────
  viewerMode: 'orbit' | 'fly' | 'first-person';
  cameraZoomLevel: number;

  // ── Environmental Simulation State ──────────────────────────────────────
  sunConfig: SunSimulationConfig;
  envLayers: EnvironmentalSimLayers;

  // ── Actions ─────────────────────────────────────────────────────────────
  setActiveParcel: (parcel: { id: string; name: string; nop: string; areaM2: number; zone: string; cadFileName?: string }) => void;
  setActiveTileset: (tileset: TileSet3DSpec | null) => void;
  setRtcAnchor: (anchor: RtcAnchorPoint | null) => void;
  setIsLoadingTileset: (isLoading: boolean) => void;

  setSelectedElement: (metadata: BimElementMetadata | null) => void;
  clearSelection: () => void;
  setSidePanelOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: BimTabType) => void;

  setViewerMode: (mode: 'orbit' | 'fly' | 'first-person') => void;
  setSunConfig: (config: Partial<SunSimulationConfig>) => void;
  setEnvLayers: (layers: Partial<EnvironmentalSimLayers>) => void;
  resetBimState: () => void;
}

const initialSunConfig: SunSimulationConfig = {
  enabled: true,
  hourOfDay: 11, // 11:00 AM WIB
  monthOfYear: 6, // Juni
  latitude: -6.5944,
  longitude: 106.7892,
  shadowQuality: 'medium',
};

const initialEnvLayers: EnvironmentalSimLayers = {
  riversActive: true,
  drainageActive: true,
  airQualityHeatmapActive: false,
  floodRiskBufferActive: false,
  gssSempadanActive: true,
};

export const useBimStore = create<BimState>((set) => ({
  // Defaults (Bogor Spatial Context)
  activeParcelId: 'P-BOGOR-2026-088',
  activeParcelName: 'Persil Lahan Kawasan Terpadu SIPAS Bogor Center',
  activeParcelNop: '32.01.040.005.012-0088.0',
  activeParcelAreaM2: 12500,
  activeParcelZone: 'Kawasan Perdagangan & Jasa (K3)',
  uploadedCadFileName: 'sample_siteplan.dxf',
  activeTileset: null,
  rtcAnchor: null,
  isLoadingTileset: false,

  selectedGuid: null,
  selectedElementMetadata: null,
  isSidePanelOpen: true,
  activeTab: 'bim-spec',

  viewerMode: 'orbit',
  cameraZoomLevel: 14,

  sunConfig: initialSunConfig,
  envLayers: initialEnvLayers,

  setActiveParcel: (parcel) =>
    set({
      activeParcelId: parcel.id,
      activeParcelName: parcel.name,
      activeParcelNop: parcel.nop,
      activeParcelAreaM2: parcel.areaM2,
      activeParcelZone: parcel.zone,
      uploadedCadFileName: parcel.cadFileName || 'peta_siteplan.dxf',
    }),

  setActiveTileset: (activeTileset) => set({ activeTileset }),
  setRtcAnchor: (rtcAnchor) => set({ rtcAnchor }),
  setIsLoadingTileset: (isLoadingTileset) => set({ isLoadingTileset }),

  setSelectedElement: (metadata) =>
    set({
      selectedElementMetadata: metadata,
      selectedGuid: metadata ? metadata.elementGuid : null,
      isSidePanelOpen: metadata ? true : false,
      activeTab: metadata ? 'bim-spec' : 'persil-context',
    }),

  clearSelection: () => set({ selectedElementMetadata: null, selectedGuid: null }),

  setSidePanelOpen: (isSidePanelOpen) => set({ isSidePanelOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),

  setViewerMode: (viewerMode) => set({ viewerMode }),

  setSunConfig: (partialSun) =>
    set((state) => ({
      sunConfig: { ...state.sunConfig, ...partialSun },
    })),

  setEnvLayers: (partialLayers) =>
    set((state) => ({
      envLayers: { ...state.envLayers, ...partialLayers },
    })),

  resetBimState: () =>
    set({
      selectedGuid: null,
      selectedElementMetadata: null,
      sunConfig: initialSunConfig,
      envLayers: initialEnvLayers,
    }),
}));
