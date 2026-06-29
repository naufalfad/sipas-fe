/**
 * ============================================================================
 * GIS MAP CONTAINER — MapLibre GL JS Wrapper
 * ============================================================================
 * Migrasi dari: react-leaflet MapContainer
 * Migrasi ke  : react-map-gl/maplibre Map
 *
 * Komponen pembungkus peta generik. Digunakan oleh form pengajuan dan
 * komponen lain yang membutuhkan peta embedding ringan (bukan GISPage utama).
 * ============================================================================
 */

import React, { useRef, useEffect } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        'osm': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 18,
        },
    },
    layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }],
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
} as StyleSpecification;

const REGIONAL_BOUNDS: [[number, number], [number, number]] = [
    [90.0, -15.0], // Southwest: [lng, lat]
    [150.0, 15.0], // Northeast: [lng, lat]
];

interface GISMapContainerProps {
    /** Pusat awal peta dalam format [latitude, longitude] */
    center?: [number, number];
    zoom?: number;
    children?: React.ReactNode;
    className?: string;
}

export default function GISMapContainer({
    center = [-6.595189, 106.816629],
    zoom = 13,
    children,
    className = 'w-full h-full rounded-xl shadow-inner border border-slate-200',
}: GISMapContainerProps) {
    const mapRef = useRef<MapRef>(null);

    // ── WebGL Context Cleanup ──
    // Memanggil map.remove() secara eksplisit saat unmount untuk membebaskan WebGL context secara instan.
    useEffect(() => {
        return () => {
            try {
                mapRef.current?.getMap()?.remove();
            } catch {
                // Abaikan jika map sudah dihancurkan oleh React
            }
        };
    }, []);

    return (
        <div className={className} style={{ width: '100%', height: '100%' }}>
            <Map
                ref={mapRef}
                id="gis-map-container"
                mapLib={import('maplibre-gl')}
                mapStyle={DEFAULT_STYLE}
                initialViewState={{
                    longitude: center[1], // GeoJSON format: [lng, lat]
                    latitude: center[0],
                    zoom,
                }}
                style={{ width: '100%', height: '100%' }}
                maxZoom={22}
                pitchWithRotate={false}
                renderWorldCopies={false}
                maxBounds={REGIONAL_BOUNDS}
            >
                {children}
            </Map>
        </div>
    );
}
