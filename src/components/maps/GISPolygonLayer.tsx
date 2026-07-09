/**
 * ============================================================================
 * GIS POLYGON LAYER — Leaflet Wrapper
 * ============================================================================
 * Komponen generik untuk merender sekumpulan poligon di atas peta Leaflet.
 * HARUS dirender sebagai children dari <MapContainer> atau GISMapContainer.
 * ============================================================================
 */

import { GeoJSON, Popup } from 'react-leaflet';
import { useState, useMemo } from 'react';
import { leafletRingToGeoJSON } from '@/lib/geoUtils';

export interface GISPolygonData {
    id: string;
    /** Koordinat dalam format Leaflet: [lat, lng][] */
    positions: [number, number][];
    housingName: string;
    developerName: string;
    landArea: number;
    status: string;
    color?: string;
}

interface GISPolygonLayerProps {
    data: GISPolygonData[];
}

export default function GISPolygonLayer({ data }: GISPolygonLayerProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const geojson = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: data
            .filter((p) => p.positions.length >= 3)
            .map((p) => {
                try {
                    return {
                        type: 'Feature' as const,
                        geometry: {
                            type: 'Polygon' as const,
                            coordinates: [leafletRingToGeoJSON(p.positions)],
                        },
                        properties: {
                            id: p.id,
                            color: p.color || '#0d9488',
                            housingName: p.housingName,
                            developerName: p.developerName,
                            landArea: p.landArea,
                            status: p.status,
                        },
                    };
                } catch {
                    return null;
                }
            })
            .filter(Boolean),
    }), [data]);

    // Centroid kasar untuk popup (rata-rata koordinat pertama)
    const activePolygon = data.find(d => d.id === activeId);
    const centroid = useMemo(() => {
        if (!activePolygon || !activePolygon.positions.length) return null;
        const lats = activePolygon.positions.map(([lat]) => lat);
        const lngs = activePolygon.positions.map(([, lng]) => lng);
        return {
            lat: lats.reduce((a, b) => a + b, 0) / lats.length,
            lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        };
    }, [activePolygon]);

    return (
        <>
            <GeoJSON
                key={JSON.stringify(data.map(d => d.id))}
                data={geojson as any}
                style={(feature) => ({
                    color: feature?.properties?.color || '#0d9488',
                    fillColor: feature?.properties?.color || '#0d9488',
                    fillOpacity: 0.25,
                    weight: 2.5,
                    opacity: 1,
                })}
                onEachFeature={(feature, layer) => {
                    layer.on('click', () => {
                        setActiveId(
                            feature.properties?.id === activeId ? null : feature.properties?.id
                        );
                    });
                }}
            />

            {activePolygon && centroid && (
                <Popup
                    position={[centroid.lat, centroid.lng]}
                    onClose={() => setActiveId(null)}
                >
                    <div className="p-1 space-y-1.5 text-xs min-w-[160px]">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">
                            {activePolygon.housingName}
                        </h4>
                        <p className="text-slate-500 font-medium">{activePolygon.developerName}</p>
                        <div className="pt-1.5 border-t border-slate-100 flex justify-between gap-4">
                            <span>Luas:</span>
                            <span className="font-semibold text-slate-700">
                                {activePolygon.landArea.toLocaleString('id-ID')} m²
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Status:</span>
                            <span className="font-bold text-teal-600">{activePolygon.status}</span>
                        </div>
                    </div>
                </Popup>
            )}
        </>
    );
}
