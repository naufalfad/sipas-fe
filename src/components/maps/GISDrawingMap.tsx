/**
 * ============================================================================
 * GIS DRAWING MAP — Alat Gambar Poligon Interaktif
 * ============================================================================
 * Engine   : @mapbox/mapbox-gl-draw (100% compatible dengan MapLibre GL JS)
 * Container: Komponen ini HARUS dirender sebagai children dari <Map> react-map-gl
 *
 * Migrasi dari: @geoman-io/leaflet-geoman-free + react-leaflet
 * Migrasi ke  : @mapbox/mapbox-gl-draw + react-map-gl/maplibre
 *
 * Output Koordinat:
 *   @mapbox/mapbox-gl-draw mengeluarkan koordinat dalam format GeoJSON
 *   standar: [longitude, latitude].
 *   Prop `onShapeChange` menerima format yang sama.
 *   Jika konsumen (form) masih menggunakan format Leaflet [lat,lng],
 *   gunakan `geoJSONRingToLeaflet` dari geoUtils.
 * ============================================================================
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

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

// ─── Kustomisasi Tema Draw ──────────────────────────────────────────────────────
// Sesuaikan warna dengan desain sistem GEOSIPAS (teal/slate palette)

const DRAW_STYLES = [
    // Polygon fill saat menggambar (active)
    {
        id: 'gl-draw-polygon-fill-inactive',
        type: 'fill',
        filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        paint: { 'fill-color': '#14b8a6', 'fill-outline-color': '#14b8a6', 'fill-opacity': 0.15 },
    },
    {
        id: 'gl-draw-polygon-fill-active',
        type: 'fill',
        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
        paint: { 'fill-color': '#0d9488', 'fill-outline-color': '#0d9488', 'fill-opacity': 0.25 },
    },
    // Polygon outline
    {
        id: 'gl-draw-polygon-stroke-inactive',
        type: 'line',
        filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#14b8a6', 'line-width': 2 },
    },
    {
        id: 'gl-draw-polygon-stroke-active',
        type: 'line',
        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#0d9488', 'line-width': 2.5, 'line-dasharray': [0.2, 2] },
    },
    // Midpoint vertex
    {
        id: 'gl-draw-polygon-midpoint',
        type: 'circle',
        filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
        paint: { 'circle-radius': 4, 'circle-color': '#0d9488' },
    },
    // Vertex points
    {
        id: 'gl-draw-polygon-and-line-vertex-inactive',
        type: 'circle',
        filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
        paint: { 'circle-radius': 5, 'circle-color': '#fff', 'circle-stroke-color': '#14b8a6', 'circle-stroke-width': 2 },
    },
    {
        id: 'gl-draw-polygon-and-line-vertex-active',
        type: 'circle',
        filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['==', 'active', 'true']],
        paint: { 'circle-radius': 6, 'circle-color': '#fff', 'circle-stroke-color': '#0d9488', 'circle-stroke-width': 2.5 },
    },
    // Line guide saat menggambar
    {
        id: 'gl-draw-line',
        type: 'line',
        filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#0d9488', 'line-dasharray': [0.2, 2], 'line-width': 2 },
    },
] as any[];

// ─── KOMPONEN ──────────────────────────────────────────────────────────────────

export default function GISDrawingMap({
    onShapeChange,
    initialValue,
    allowMultiple = false,
    initialGeoJson,
}: GISDrawingMapProps) {
    const { current: map } = useMap();
    const drawRef = useRef<MapboxDraw | null>(null);
    // Simpan reference ke callback agar event listener tidak perlu di-rebind
    const onShapeChangeRef = useRef(onShapeChange);
    useEffect(() => { onShapeChangeRef.current = onShapeChange; }, [onShapeChange]);

    /**
     * Kumpulkan semua koordinat dari semua fitur yang sedang digambar,
     * lalu kirim ke callback parent.
     */
    const collectAndEmit = useCallback(() => {
        if (!drawRef.current) return;
        try {
            const data = drawRef.current.getAll();
            const allCoords: DrawnPolygonCoords = data.features
                .filter((f) => f.geometry.type === 'Polygon')
                .map((f) => (f.geometry as GeoJSON.Polygon).coordinates[0] as [number, number][]);
            onShapeChangeRef.current(allCoords);
        } catch (err) {
            console.error('[GISDrawingMap] Gagal mengumpulkan koordinat:', err);
        }
    }, []);

    // ── Setup MapboxDraw saat map siap ─────────────────────────────────────────
    useEffect(() => {
        if (!map) return;

        const mapInstance = map.getMap(); // Ambil instance MapLibre native

        const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon:   true,
                trash:     true,
            },
            styles: DRAW_STYLES,
            // Batasi ke satu poligon jika allowMultiple = false
            // (diimplementasikan via event handler di bawah)
        });

        try {
            mapInstance.addControl(draw as any, 'top-left');
            drawRef.current = draw;
        } catch (err) {
            console.error('[GISDrawingMap] Gagal menambahkan kontrol gambar:', err);
            return;
        }

        // ── Handler Event Draw ─────────────────────────────────────────────────

        const handleCreate = () => {
            // Jika tidak boleh multi-polygon, hapus yang lama sebelum menambah yang baru
            if (!allowMultiple) {
                const all = draw.getAll();
                if (all.features.length > 1) {
                    // Hapus semua kecuali yang terakhir ditambahkan
                    const toDelete = all.features.slice(0, -1).map((f) => f.id as string);
                    draw.delete(toDelete);
                }
            }
            collectAndEmit();
        };

        const handleUpdate = () => collectAndEmit();
        const handleDelete = () => collectAndEmit();

        mapInstance.on('draw.create', handleCreate);
        mapInstance.on('draw.update', handleUpdate);
        mapInstance.on('draw.delete', handleDelete);

        // ── Load nilai awal jika ada ───────────────────────────────────────────
        if (initialValue && initialValue.length > 0) {
            try {
                const features: GeoJSON.Feature<GeoJSON.Polygon>[] = initialValue.map((ring, i) => ({
                    id: `init-${i}`,
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [ring] },
                    properties: {},
                }));
                draw.set({ type: 'FeatureCollection', features });
            } catch (err) {
                console.warn('[GISDrawingMap] Gagal memuat nilai awal:', err);
            }
        }

        // ── Cleanup saat unmount ───────────────────────────────────────────────
        return () => {
            try {
                mapInstance.off('draw.create', handleCreate);
                mapInstance.off('draw.update', handleUpdate);
                mapInstance.off('draw.delete', handleDelete);
                mapInstance.removeControl(draw as any);
            } catch {
                // Map mungkin sudah di-destroy, abaikan error cleanup
            }
            drawRef.current = null;
        };
    }, [map, allowMultiple, collectAndEmit]);
    // CATATAN: `initialValue` sengaja dikecualikan dari deps array.
    // Nilai awal hanya dimuat sekali saat mount, bukan setiap kali prop berubah.

    // ── Load GeoJSON baru saat initialGeoJson berubah ────────────────────────
    useEffect(() => {
        if (!map || !drawRef.current || !initialGeoJson) return;
        try {
            drawRef.current.set(initialGeoJson);
            // Kumpulkan koordinat dan emit
            const all = drawRef.current.getAll();
            const allCoords: DrawnPolygonCoords = all.features
                .filter((f) => f.geometry.type === 'Polygon')
                .map((f) => (f.geometry as GeoJSON.Polygon).coordinates[0] as [number, number][]);
            onShapeChangeRef.current(allCoords);

            // Fit bounds ke peta
            if (all.features.length > 0) {
                const firstFeature = all.features[0];
                if (firstFeature.geometry.type === 'Polygon') {
                    const coords = firstFeature.geometry.coordinates[0];
                    const lngs = coords.map(c => c[0]);
                    const lats = coords.map(c => c[1]);
                    const bounds: [number, number, number, number] = [
                        Math.min(...lngs),
                        Math.min(...lats),
                        Math.max(...lngs),
                        Math.max(...lats)
                    ];
                    map.getMap().fitBounds(bounds, { padding: 50, duration: 1000 });
                }
            }
        } catch (err) {
            console.warn('[GISDrawingMap] Gagal memuat GeoJSON dari prop:', err);
        }
    }, [map, initialGeoJson]);

    // Komponen ini hanya mengatur logika imperatif, tidak merender elemen HTML
    return null;
}