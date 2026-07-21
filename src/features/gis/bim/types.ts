/**
 * ============================================================================
 * DOMAIN TYPES & INTERFACES - ENTERPRISE 3D BIM REVIEWER (SIPAS-FE)
 * ============================================================================
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox3D {
  min: Vector3D;
  max: Vector3D;
}

/** Representasi Jangkar Koordinat RTC (Relative To Center) */
export interface RtcAnchorPoint {
  longitude: number;
  latitude: number;
  altitude: number;
  localCenter: Vector3D;
}

/** Metadata Spesifikasi Elemen Konstruksi BIM / IFC */
export interface BimElementMetadata {
  elementGuid: string;
  globalId: string;
  ifcClass: string; // e.g., 'IfcColumn', 'IfcBeam', 'IfcSlab', 'IfcWall', 'IfcPipeSegment'
  elementName: string;
  structuralCategory: 'Struktur Utama' | 'Arsitektural' | 'MEP & Utilitas' | 'Infrastruktur / K3';
  dimensions: {
    lengthMeters?: number;
    widthMeters?: number;
    heightMeters?: number;
    volumeM3?: number;
    areaM2?: number;
  };
  materialSpecs: {
    materialName: string;
    concreteGrade?: string; // e.g., 'K-350', 'K-400'
    steelGrade?: string;    // e.g., 'U-50', 'BJTS 420B'
    densityKgM3?: number;
  };
  attributes: Record<string, string | number | boolean>;
  complianceStatus: 'SESUAI_SPESIFIKASI' | 'PERLU_INSPEKSI' | 'PERINGATAN_SEMPADAN';
}

/** Spesifikasi Set Data 3D Tiles (OGC Standard) */
export interface TileSet3DSpec {
  id: string;
  name: string;
  rootTilesetUrl: string;
  b3dmCount: number;
  geometricError: number;
  boundingBox: BoundingBox3D;
  rtcAnchor: RtcAnchorPoint;
  isLoaded: boolean;
  fileSizeMb?: number;
}

/** Konfigurasi Simulasi Posisi Matahari & Bayangan */
export interface SunSimulationConfig {
  enabled: boolean;
  hourOfDay: number; // 0 - 24
  monthOfYear: number; // 1 - 12
  latitude: number;
  longitude: number;
  shadowQuality: 'low' | 'medium' | 'high';
}

/** Layer Simulasi Lingkungan Spasial */
export interface EnvironmentalSimLayers {
  riversActive: boolean;
  drainageActive: boolean;
  airQualityHeatmapActive: boolean;
  floodRiskBufferActive: boolean;
  gssSempadanActive: boolean;
}

/** Event Map untuk BimEventBus (Low Coupling WebGL -> Store) */
export type BimEngineEventMap = {
  'BIM_ELEMENT_SELECTED': { elementGuid: string; metadata: BimElementMetadata };
  'BIM_SELECTION_CLEARED': undefined;
  'TILES_PROGRESS': { tilesetId: string; percentLoaded: number };
  'RTC_ANCHOR_UPDATED': RtcAnchorPoint;
  'ENGINE_ERROR': { code: string; message: string };
};
