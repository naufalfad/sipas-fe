/**
 * ============================================================================
 * GIS DRAWING MAP — Alat Gambar Poligon Interaktif (Leaflet + Geoman)
 * ============================================================================
 * Engine   : @geoman-io/leaflet-geoman-free
 * Container: Komponen ini HARUS dirender sebagai children dari
 *            <MapContainer> (GISMapContainer atau komponen lain).
 *
 * Output Koordinat:
 *   Format GeoJSON standar: [longitude, latitude]
 *   Sesuai dengan Leaflet conventions setelah konversi [lat,lng] → [lng,lat].
 * ============================================================================
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// ─── Tipe ──────────────────────────────────────────────────────────────────────

/**
 * Koordinat output dalam format GeoJSON standar: [longitude, latitude]
 * Setiap elemen array luar adalah satu poligon; setiap elemen dalam adalah ring.
 */
export type DrawnPolygonCoords = [number, number][][];

interface GISDrawingMapProps {
    /**
     * Callback dipanggil setiap kali gambar dibuat, diedit, atau dihapus.
     * Koordinat dalam format GeoJSON: [longitude, latitude]
     */
    onShapeChange: (coordinates: DrawnPolygonCoords) => void;

    /**
     * Nilai awal dalam format GeoJSON [longitude, latitude][].
     * Jika berasal dari data Leaflet [lat,lng], konversi dulu dengan leafletRingToGeoJSON.
     */
    initialValue?: DrawnPolygonCoords;

    /** Izinkan menggambar lebih dari satu poligon sekaligus. Default: false */
    allowMultiple?: boolean;

    /** GeoJSON dari file eksternal (SHP/GeoJSON) */
    initialGeoJson?: any;
}

// ─── KOMPONEN ──────────────────────────────────────────────────────────────────

export default function GISDrawingMap({
    onShapeChange,
    initialValue,
    allowMultiple = false,
    initialGeoJson,
}: GISDrawingMapProps) {
    const map = useMap();
    const layerGroupRef = useRef<L.LayerGroup | null>(null);
    const onShapeChangeRef = useRef(onShapeChange);
    useEffect(() => { onShapeChangeRef.current = onShapeChange; }, [onShapeChange]);

    /**
     * Kumpulkan semua koordinat dari layer group,
     * konversi dari format Leaflet [lat,lng] ke GeoJSON [lng,lat],
     * lalu kirim ke callback parent.
     */
    const collectAndEmit = useCallback(() => {
        if (!layerGroupRef.current) return;
        try {
            const allCoords: DrawnPolygonCoords = [];
            layerGroupRef.current.eachLayer((layer) => {
                if (layer instanceof L.Polygon) {
                    const latlngs = layer.getLatLngs()[0] as L.LatLng[];
                    const ring: [number, number][] = latlngs.map(
                        (ll) => [ll.lng, ll.lat]
                    );
                    allCoords.push(ring);
                }
            });
            onShapeChangeRef.current(allCoords);
        } catch (err) {
            console.error('[GISDrawingMap] Gagal mengumpulkan koordinat:', err);
        }
    }, []);

    // ── Setup Geoman saat map siap ─────────────────────────────────────────────
    useEffect(() => {
        if (!map) return;

        // Buat layer group untuk menampung semua drawn shapes
        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;

        // Konfigurasi geoman
        map.pm.addControls({
            position: 'topright',
            drawCircle: false,
            drawCircleMarker: false,
            drawPolyline: false,
            drawRectangle: false,
            drawMarker: false,
            drawText: false,
            editMode: true,
            dragMode: false,
            cutPolygon: false,
            removalMode: true,
            rotateMode: false,
        });

        // Styling geoman
        map.pm.setGlobalOptions({
            pathOptions: {
                color: '#0d9488',
                fillColor: '#14b8a6',
                fillOpacity: 0.2,
                weight: 2,
            },
            templineStyle: { color: '#0d9488', weight: 2 },
            hintlineStyle: { color: '#0d9488', weight: 2, dashArray: '5, 5' },
        });

        // Load nilai awal
        if (initialValue && initialValue.length > 0) {
            try {
                initialValue.forEach((ring) => {
                    const latlngs = ring.map(([lng, lat]) => L.latLng(lat, lng));
                    const polygon = L.polygon(latlngs, {
                        color: '#0d9488',
                        fillColor: '#14b8a6',
                        fillOpacity: 0.2,
                        weight: 2,
                    });
                    polygon.addTo(layerGroup);
                    (polygon as any).pm?.enable?.();
                });
            } catch (err) {
                console.warn('[GISDrawingMap] Gagal memuat nilai awal:', err);
            }
        }

        // Event handlers
        const handleCreate = (e: any) => {
            const layer = e.layer;
            if (!allowMultiple) {
                // Hapus semua layer lama kecuali yang baru saja digambar
                const toRemove: L.Layer[] = [];
                layerGroup.eachLayer((l) => {
                    if (l !== layer) toRemove.push(l);
                });
                toRemove.forEach((l) => layerGroup.removeLayer(l));
            }
            layer.addTo(layerGroup);
            collectAndEmit();
        };

        const handleEdit = () => collectAndEmit();
        const handleRemove = () => collectAndEmit();

        map.on('pm:create', handleCreate);
        map.on('pm:edit', handleEdit);
        map.on('pm:remove', handleRemove);

        return () => {
            map.off('pm:create', handleCreate);
            map.off('pm:edit', handleEdit);
            map.off('pm:remove', handleRemove);
            try {
                map.pm.removeControls();
                layerGroup.clearLayers();
                layerGroup.remove();
            } catch {
                // ignore cleanup errors
            }
            layerGroupRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, allowMultiple, collectAndEmit]);

    // ── Load GeoJSON baru saat initialGeoJson berubah ─────────────────────────
    useEffect(() => {
        if (!map || !layerGroupRef.current || !initialGeoJson) return;
        try {
            layerGroupRef.current.clearLayers();
            const geoLayer = L.geoJSON(initialGeoJson, {
                style: { color: '#0d9488', fillColor: '#14b8a6', fillOpacity: 0.2, weight: 2 },
            });
            geoLayer.eachLayer((l) => {
                if (l instanceof L.Polygon) {
                    l.addTo(layerGroupRef.current!);
                }
            });
            collectAndEmit();

            // Fit bounds
            try {
                const bounds = geoLayer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], animate: true });
                }
            } catch {
                // ignore bounds error
            }
        } catch (err) {
            console.warn('[GISDrawingMap] Gagal memuat GeoJSON dari prop:', err);
        }
    }, [map, initialGeoJson, collectAndEmit]);

    // Komponen ini hanya mengatur logika imperatif, tidak merender elemen HTML
    return null;
}