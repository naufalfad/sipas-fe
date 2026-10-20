/**
 * ============================================================================
 * SIPAS MOCK SITE CONSTANTS — Konfigurasi Koordinat Uji Sinkron
 * ============================================================================
 * Menyediakan definisi spasial resmi yang sinkron dengan mock_site_config.py:
 * Titik Sudut Lahan DMS:
 *   1. 6°34'18.12"S, 106°42'00.81"E  (BL - Barat Laut)
 *   2. 6°34'18.22"S, 106°42'04.84"E  (TL - Timur Laut)
 *   3. 6°34'22.08"S, 106°42'04.76"E  (TG - Tenggara)
 *   4. 6°34'22.08"S, 106°42'00.62"E  (BD - Barat Daya)
 * ============================================================================
 */

export const MOCK_SITE_BOUNDS = {
  center: [-6.57225, 106.70075] as [number, number], // [lat, lng]
  zoom: 18,
  // Poligon GeoJSON [lng, lat]
  polygonLngLat: [
    [106.700225, -6.571700],
    [106.7013444, -6.5717278],
    [106.7013222, -6.572800],
    [106.7001722, -6.572800],
    [106.700225, -6.571700]
  ] as [number, number][],
  // Poligon Leaflet [lat, lng]
  polygonLatLng: [
    [-6.571700, 106.700225],
    [-6.5717278, 106.7013444],
    [-6.572800, 106.7013222],
    [-6.572800, 106.7001722],
    [-6.571700, 106.700225]
  ] as [number, number][]
};

export interface ControlPointConfig {
  anchor_cad_1: [number, number]; // [x, y]
  anchor_cad_2: [number, number]; // [x, y]
  anchor_map_1: [number, number]; // [lng, lat]
  anchor_map_2: [number, number]; // [lng, lat]
  scale: number;
  rotation: number;
  Tx: number;
  Ty: number;
  polygon: [number, number][]; // [lng, lat][]
}

export const MOCK_SITEPLAN_CONTROL_POINTS: Record<string, ControlPointConfig> = {
  'sample_siteplan.dxf': {
    anchor_cad_1: [6.6587, 122.5104],
    anchor_cad_2: [127.594, 0.4464],
    anchor_map_1: [106.700225, -6.5717],
    anchor_map_2: [106.7013222, -6.5728],
    scale: 1.0,
    rotation: 0.0,
    Tx: 687978,
    Ty: 9273156,
    polygon: [
      [106.700225, -6.571700],
      [106.7013444, -6.5717278],
      [106.7013222, -6.572800],
      [106.7001722, -6.572800],
      [106.700225, -6.571700]
    ]
  },
  'mock_large_siteplan.dxf': {
    anchor_cad_1: [6.6587, 122.5104],
    anchor_cad_2: [127.594, 0.4464],
    anchor_map_1: [106.700225, -6.5717],
    anchor_map_2: [106.7013222, -6.5728],
    scale: 1.0,
    rotation: 0.0,
    Tx: 687978,
    Ty: 9273156,
    polygon: [
      [106.700225, -6.571700],
      [106.7013444, -6.5717278],
      [106.7013222, -6.572800],
      [106.7001722, -6.572800],
      [106.700225, -6.571700]
    ]
  },
  'mock_small_siteplan_1.dxf': {
    anchor_cad_1: [6.6587, 122.5104],
    anchor_cad_2: [65.4316, 0.6577],
    anchor_map_1: [106.700225, -6.5717],
    anchor_map_2: [106.7007602, -6.5728],
    scale: 1.0,
    rotation: 0.0,
    Tx: 687978,
    Ty: 9273156,
    polygon: [
      [106.700225, -6.571700],
      [106.7007602, -6.571714],
      [106.7007602, -6.572800],
      [106.7001722, -6.572800],
      [106.700225, -6.571700]
    ]
  },
  'mock_small_siteplan_2.dxf': {
    anchor_cad_1: [65.4316, 120.8522],
    anchor_cad_2: [127.594, 0.4464],
    anchor_map_1: [106.7007565, -6.571713],
    anchor_map_2: [106.7013222, -6.5728],
    scale: 1.0,
    rotation: 0.0,
    Tx: 687978,
    Ty: 9273156,
    polygon: [
      [106.7007565, -6.571713],
      [106.7013444, -6.5717278],
      [106.7013222, -6.572800],
      [106.7007602, -6.572800],
      [106.7007565, -6.571713]
    ]
  }
};
