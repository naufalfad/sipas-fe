/**
 * ============================================================================
 * GIS MAP CONTAINER — Leaflet Wrapper
 * ============================================================================
 * Komponen pembungkus peta generik berbasis Leaflet.
 * Digunakan oleh form pengajuan dan komponen lain yang membutuhkan
 * peta embedding ringan (bukan GISPage utama).
 * ============================================================================
 */

import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
    return (
        <div className={className} style={{ width: '100%', height: '100%' }}>
            <MapContainer
                center={center}
                zoom={zoom}
                minZoom={4}
                maxZoom={22}
                zoomControl={false}
                style={{ width: '100%', height: '100%' }}
                maxBounds={[[-15, 90], [15, 150]]}
                maxBoundsViscosity={1.0}
            >
                <TileLayer
                    url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                    maxZoom={18}
                />
                {children}
            </MapContainer>
        </div>
    );
}
