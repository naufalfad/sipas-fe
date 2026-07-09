/**
 * ============================================================================
 * GIS MARKER LAYER — Leaflet Wrapper
 * ============================================================================
 * Komponen generik untuk merender sekumpulan marker di atas peta Leaflet.
 * HARUS dirender sebagai children dari <MapContainer> atau GISMapContainer.
 * ============================================================================
 */

import { Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import L from 'leaflet';

export interface GISMarkerData {
    id: string;
    /** Format [latitude, longitude] */
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
                const [lat, lng] = marker.position;
                const icon = L.divIcon({
                    className: '',
                    iconSize: [24, 24],
                    iconAnchor: [12, 24],
                    html: `<div style="
                        width:24px;height:24px;
                        background:${markerColor};
                        border:3px solid #fff;
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        box-shadow:0 2px 8px rgba(0,0,0,0.3);
                        cursor:pointer;
                    "></div>`,
                });

                return (
                    <Marker
                        key={marker.id}
                        position={[lat, lng]}
                        icon={icon}
                        eventHandlers={{
                            click: () => setActiveId(marker.id === activeId ? null : marker.id),
                        }}
                    >
                        {activeId === marker.id && (
                            <Popup onClose={() => setActiveId(null)}>
                                <div className="p-1 space-y-1 text-xs min-w-[160px]">
                                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{marker.housingName}</h4>
                                    <p className="text-slate-500 font-medium">{marker.developerName}</p>
                                    <p className="text-slate-400 leading-relaxed mt-1 max-w-[180px]">{marker.address}</p>
                                </div>
                            </Popup>
                        )}
                    </Marker>
                );
            })}
        </>
    );
}
