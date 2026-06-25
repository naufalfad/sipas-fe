/**
 * ============================================================================
 * GIS MARKER LAYER — MapLibre Wrapper
 * ============================================================================
 * Migrasi dari: react-leaflet Marker + Popup
 * Migrasi ke  : react-map-gl/maplibre Marker + Popup
 *
 * Komponen generik untuk merender sekumpulan marker di atas peta.
 * HARUS dirender sebagai children dari <Map> (GISMapContainer atau SipasMap).
 * ============================================================================
 */

import { Marker, Popup } from 'react-map-gl/maplibre';
import { useState } from 'react';

export interface GISMarkerData {
    id: string;
    /** Format [latitude, longitude] — konsisten dengan data historis */
    position: [number, number];
    housingName: string;
    developerName: string;
    address: string;
}

interface GISMarkerLayerProps {
    data: GISMarkerData[];
    markerColor?: string;
}

export default function GISMarkerLayer({ data, markerColor = '#14b8a6' }: GISMarkerLayerProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    return (
        <>
            {data.map((marker) => {
                const [lat, lng] = marker.position; // Konversi dari format [lat,lng] ke MapLibre
                return (
                    <Marker
                        key={marker.id}
                        longitude={lng}
                        latitude={lat}
                        anchor="bottom"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            setActiveId(marker.id === activeId ? null : marker.id);
                        }}
                    >
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                background: markerColor,
                                border: '3px solid #fff',
                                borderRadius: '50% 50% 50% 0',
                                transform: 'rotate(-45deg)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                cursor: 'pointer',
                            }}
                        />
                    </Marker>
                );
            })}

            {activeId && (() => {
                const m = data.find(d => d.id === activeId);
                if (!m) return null;
                const [lat, lng] = m.position;
                return (
                    <Popup
                        longitude={lng}
                        latitude={lat}
                        anchor="bottom"
                        offset={[0, -28]}
                        onClose={() => setActiveId(null)}
                        closeButton={true}
                    >
                        <div className="p-1 space-y-1 text-xs min-w-[160px]">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight">{m.housingName}</h4>
                            <p className="text-slate-500 font-medium">{m.developerName}</p>
                            <p className="text-slate-400 leading-relaxed mt-1 max-w-[180px]">{m.address}</p>
                        </div>
                    </Popup>
                );
            })()}
        </>
    );
}
