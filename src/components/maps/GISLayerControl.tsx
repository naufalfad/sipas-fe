/**
 * ============================================================================
 * GIS LAYER CONTROL — Stub Kosong (MapLibre Migration)
 * ============================================================================
 * File ini dipertahankan untuk kompatibilitas import tetapi fungsionalitasnya
 * kini diintegrasikan langsung ke SipasMap.tsx via Zustand state (activeBaseMap)
 * dan panel BasemapPanel.tsx.
 *
 * Komponen ini tidak perlu dirender — basemap switching dilakukan di store.
 * ============================================================================
 */

export default function GISLayerControl() {
    // Kontrol layer kini dikelola oleh useGisUIStore (activeBaseMap, activeLayers)
    // dan dirender via BasemapPanel + LayerPanel di PanelOrchestrator.
    return null;
}
