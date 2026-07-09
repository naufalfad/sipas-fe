/**
 * ============================================================================
 * GEO UTILS — Utilitas Konversi Koordinat & Kalkulasi Spasial Terpusat
 * ============================================================================
 * PRINSIP DRY: Semua konversi format koordinat harus melalui fungsi ini.
 *
 * Konvensi Format:
 *   - "Leaflet"  → [lat, lng]  (format lama, format input mock data)
 *   - "GeoJSON"  → [lng, lat]  (standar GIS/MapLibre/Turf.js)
 * ============================================================================
 */

import type { Submission } from '@/features/submission/types';

// ─── Type Aliases ─────────────────────────────────────────────────────────────

/** Koordinat Leaflet: [latitude, longitude] */
export type LeafletCoord = [number, number];

/** Koordinat GeoJSON standar: [longitude, latitude] */
export type GeoJSONCoord = [number, number];

// ─── Konversi Koordinat Tunggal ────────────────────────────────────────────────

/**
 * Konversi satu titik dari format Leaflet [lat, lng] → GeoJSON [lng, lat].
 */
export function leafletToGeoJSON(coord: LeafletCoord): GeoJSONCoord {
    const [a, b] = coord;
    // Deteksi jika koordinat dalam format Leaflet [lat, lng] (lat sekitar -6.5, lng sekitar 106.8 untuk Bogor)
    if (a >= -15 && a <= 10 && b >= 90 && b <= 145) {
        return [b, a]; // Ubah ke [lng, lat]
    }
    // Jika sudah berupa [lng, lat] (GeoJSON standar), biarkan tetap
    return [a, b];
}

/**
 * Konversi satu titik dari format GeoJSON [lng, lat] → Leaflet [lat, lng].
 */
export function geoJSONToLeaflet(coord: GeoJSONCoord): LeafletCoord {
    const [a, b] = coord;
    // Deteksi jika koordinat dalam format GeoJSON [lng, lat]
    if (a >= 90 && a <= 145 && b >= -15 && b <= 10) {
        return [b, a]; // Ubah ke [lat, lng]
    }
    // Jika sudah berupa [lat, lng] (Leaflet standar), biarkan tetap
    return [a, b];
}

// ─── Konversi Ring Poligon ─────────────────────────────────────────────────────

/**
 * Konversi sebuah ring poligon dari format Leaflet ke GeoJSON.
 * Juga memastikan poligon tertutup (titik pertama = titik terakhir).
 */
export function leafletRingToGeoJSON(ring: LeafletCoord[]): GeoJSONCoord[] {
    if (ring.length === 0) return [];
    const converted = ring.map(leafletToGeoJSON);
    // Pastikan ring tertutup (GeoJSON requirement)
    const first = converted[0];
    const last = converted[converted.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        converted.push([first[0], first[1]]);
    }
    return converted;
}

/**
 * Hitung centroid untuk ring poligon Leaflet [lat,lng].
 * Menggunakan formula centroid poligon sesuai area (shoelace).
 * Mengembalikan null jika poligon tidak valid atau area nol.
 */
export function polygonCentroid(ring: LeafletCoord[]): LeafletCoord | null {
    if (ring.length < 3) return null;

    const points = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, ring.length - 1)
        : ring;

    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < points.length; i += 1) {
        const [lat1, lng1] = points[i];
        const [lat2, lng2] = points[(i + 1) % points.length];

        const x1 = lng1;
        const y1 = lat1;
        const x2 = lng2;
        const y2 = lat2;
        const cross = x1 * y2 - x2 * y1;

        area += cross;
        centroidX += (x1 + x2) * cross;
        centroidY += (y1 + y2) * cross;
    }

    area *= 0.5;
    if (Math.abs(area) < Number.EPSILON) return null;

    const factor = 1 / (6 * area);
    const centroidLng = centroidX * factor;
    const centroidLat = centroidY * factor;

    return [centroidLat, centroidLng];
}

/**
 * Konversi sebuah ring poligon dari format GeoJSON ke Leaflet.
 */
export function geoJSONRingToLeaflet(ring: GeoJSONCoord[]): LeafletCoord[] {
    return ring.map(geoJSONToLeaflet);
}

// ─── Konversi Multi-Ring (Polygon with holes) ──────────────────────────────────

/**
 * Konversi array of rings dari Leaflet ke GeoJSON.
 * Input: [[lat,lng][], ...] → Output: [[lng,lat][], ...]
 */
export function leafletPolygonToGeoJSON(rings: LeafletCoord[][]): GeoJSONCoord[][] {
    return rings.map(leafletRingToGeoJSON);
}

// ─── Kalkulasi Ketinggian Bangunan ─────────────────────────────────────────────

const DEFAULT_HEIGHT_METERS = 30;
const FLOOR_HEIGHT_METERS = 8;

/**
 * Hitung tinggi bangunan fill-extrusion dalam meter berdasarkan KLB.
 * Keputusan Arsitektur: Tinggi = KLB * 8m. Fallback = 30m.
 *
 * @param submission - Data pengajuan site plan
 * @returns Tinggi bangunan dalam meter
 */
export function calcExtrusionHeight(submission: Submission): number {
    if (submission.klbValue && submission.klbValue > 0) {
        return Math.max(FLOOR_HEIGHT_METERS, submission.klbValue * FLOOR_HEIGHT_METERS);
    }
    return DEFAULT_HEIGHT_METERS;
}

// ─── Status → Warna Marker ─────────────────────────────────────────────────────

/**
 * Resolusi warna heksadesimal berdasarkan status pengajuan.
 * Fungsi terpusat agar konsisten antara layer peta, marker, dan panel.
 */
export function resolveStatusColor(status: Submission['status']): string {
    switch (status) {
        case 'Disetujui': return '#10b981'; // emerald-500
        case 'Ditolak': return '#ef4444'; // red-500
        case 'Verifikasi Teknis': return '#6366f1'; // indigo-500
        case 'Verifikasi Administrasi': return '#3b82f6'; // blue-500
        case 'Menunggu Verifikasi': return '#f59e0b'; // amber-500
        case 'Menunggu Persetujuan': return '#8b5cf6'; // violet-500
        case 'Proses TTE': return '#db2777'; // pink-600
        default: return '#64748b'; // slate-500
    }
}

/**
 * Resolusi kategori layer berdasarkan luas lahan.
 */
export function resolveLayerCategory(landArea: number): string {
    if (landArea > 100000) return 'layer-masterplan';
    if (landArea >= 10000) return 'layer-siteplan';
    return 'layer-gs';
}
